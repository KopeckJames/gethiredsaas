import { NextResponse } from "next/server";
import { Configuration, OpenAIApi } from "openai";
import { AxiosError } from "axios";
import { getUser } from "@/lib/auth";

import { incrementApiLimit, checkApiLimit } from "@/lib/api-limit";

export const dynamic = 'force-dynamic';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Exponential backoff retry logic
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const analyzeResumeWithRetry = async (resumeText: string, jobDescription: string, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await analyzeResume(resumeText, jobDescription);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 429) {
        // If this was our last attempt, throw the error
        if (attempt === maxRetries - 1) throw error;
        
        // Otherwise wait with exponential backoff
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await wait(waitTime);
        continue;
      }
      throw error; // For non-rate-limit errors, throw immediately
    }
  }
  throw new Error('Max retries exceeded');
};

const analyzeResume = async (resumeText: string, jobDescription: string) => {
  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Your task is to analyze a resume against a job description and return ONLY a JSON object with no additional text or explanation.

Resume to analyze:
${resumeText}

Job Description:
${jobDescription}

Return ONLY a JSON object with this exact structure:
{
  "score": <number between 0-100>,
  "recommendations": [<array of string recommendations>],
  "optimizedContent": "<optimized resume content as a string>"
}

Remember:
1. Return ONLY the JSON object, no other text
2. Ensure the score is a number between 0-100
3. Recommendations should be an array of strings
4. Optimized content should be a string
5. Use proper JSON formatting with double quotes`;

  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are an expert ATS system analyzer that helps optimize resumes."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
  });

  const content = response.data.choices[0].message?.content || "";
  
  try {
    // Remove any potential non-JSON text before/after the JSON object
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in response");
    }
    
    const jsonStr = jsonMatch[0];
    const parsed = JSON.parse(jsonStr);
    
    // Validate the response structure
    if (typeof parsed.score !== 'number' || 
        !Array.isArray(parsed.recommendations) ||
        typeof parsed.optimizedContent !== 'string') {
      throw new Error("Invalid response structure");
    }
    
    return parsed;
  } catch (error) {
    console.error('[JSON_PARSE_ERROR]', error, 'Content:', content);
    throw new Error("Failed to parse analysis results. Please try again.");
  }
};

export async function POST(req: Request) {
  try {
    const user = await getUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!configuration.apiKey) {
      return new NextResponse("OpenAI API Key not configured.", { status: 500 });
    }

    const formData = await req.formData();
    const resume = formData.get("resume") as File;
    const jobDescription = formData.get("jobDescription") as string;

    if (!resume) {
      return new NextResponse("Resume file is required", { status: 400 });
    }

    if (!jobDescription) {
      return new NextResponse("Job description is required", { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['.txt', '.doc', '.docx'];
    const fileExtension = resume.name.toLowerCase().slice(resume.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      return new NextResponse(
        "Invalid file type. Please upload a .txt, .doc, or .docx file only.", 
        { status: 400 }
      );
    }

    const freeTrial = await checkApiLimit();
    

   
    // Read the resume file content
    let resumeText: string;
    try {
      resumeText = await resume.text();
    } catch (error) {
      console.error('[FILE_READ_ERROR]', error);
      return new NextResponse(
        "Unable to read file content. Please ensure the file is a valid text document.", 
        { status: 400 }
      );
    }

    // Basic validation of text content
    if (!resumeText.trim()) {
      return new NextResponse(
        "The resume file appears to be empty. Please upload a file with content.", 
        { status: 400 }
      );
    }
    
    try {
      // Analyze the resume with retry logic
      const analysis = await analyzeResumeWithRetry(resumeText, jobDescription);

      
      return NextResponse.json(analysis);
    } catch (error) {
      console.error('[ANALYSIS_ERROR]', error);
      
      if (error instanceof AxiosError) {
        if (error.response?.status === 429) {
          return new NextResponse(
            "Our AI system is currently experiencing high demand. Please try again in a few moments.", 
            { status: 429 }
          );
        }
        
        // Handle other OpenAI API errors
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.error?.message || "Failed to analyze resume. Please try again.";
        return new NextResponse(errorMessage, { status: statusCode });
      }
      
      return new NextResponse("An unexpected error occurred. Please try again.", { status: 500 });
    }
  } catch (error) {
    console.log('[ANALYSIS_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
