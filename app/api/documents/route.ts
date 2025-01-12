import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// Initialize OpenAI client with v4 syntax
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define message type for TypeScript
type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function POST(
  req: Request
) {
  try {
    const user = await getUser();
    const body = await req.json();
    const { messages } = body;

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return new NextResponse("OpenAI API Key not configured.", { status: 500 });
    }

    if (!messages) {
      return new NextResponse("Messages are required", { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages as Message[],
    });

    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    console.log('[CONVERSATION_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}