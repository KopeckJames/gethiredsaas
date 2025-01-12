import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return new NextResponse("Text is required", { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant responding to transcribed speech."
        },
        {
          role: "user",
          content: text
        }
      ],
    });

    return NextResponse.json({ 
      response: response.choices[0].message.content 
    });
    
  } catch (error) {
    console.error('[CHATGPT_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
