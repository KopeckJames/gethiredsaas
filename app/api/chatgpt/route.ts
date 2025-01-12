import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, resume, jobDescription } = body;

    if (!text) {
      return new NextResponse("Text is required", { status: 400 });
    }

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      {
        role: "system",
        content: "You are a helpful assistant responding to transcribed speech."
      },
      {
        role: "user",
        content: text
      }
    ];

    if (resume) {
      messages.unshift({
        role: "system",
        content: `The user has provided a resume: ${resume}`
      });
    }

    if (jobDescription) {
      messages.unshift({
        role: "system",
        content: `The user is applying for a job with the following description: ${jobDescription}`
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
    });

    return NextResponse.json({ 
      response: response.choices[0].message.content 
    });
    
  } catch (error) {
    console.error('[CHATGPT_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
