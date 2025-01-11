import { NextResponse } from "next/server";
import { Configuration, OpenAIApi } from "openai";
import { getSession } from "@/lib/auth";
import { checkSubscription } from "@/lib/subscription";
import { incrementApiLimit, checkApiLimit } from "@/lib/api-limit";

export const dynamic = 'force-dynamic';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const analyzeResume = async (resumeText: string, jobDescription: string) => {
  const prompt = `
    You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume against the provided job description.
    
    Job Description:
    ${jobDescription}
    
    Resume:
    ${resumeText}
    
    Please provide:
    1. A score from 0-100 indicating how well the resume matches the job requirements
    2. A list of specific recommendations to improve the resume's ATS compatibility
    3. An optimized version of the resume content that would score better in ATS systems
    
    Format your response as a JSON object with the following structure:
    {
      "score": number,
      "recommendations": string[],
      "optimizedContent": string
    }
  `;

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
  return JSON.parse(content);
};

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
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

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && !isPro) {
      return new NextResponse("Free trial has expired. Please upgrade to pro.", { status: 403 });
    }

    // Read the resume file content
    const resumeText = await resume.text();
    
    try {
      // Analyze the resume
      const analysis = await analyzeResume(resumeText, jobDescription);

      if (!isPro) {
        await incrementApiLimit();
      }

      return NextResponse.json(analysis);
    } catch (error) {
      console.error('[ANALYSIS_ERROR]', error);
      return new NextResponse("Failed to analyze resume. Please try again.", { status: 500 });
    }
  } catch (error) {
    console.log('[ANALYSIS_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
