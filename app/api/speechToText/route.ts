import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const base64Audio = body.audio;
    
    // Convert base64 to Buffer
    const audioBuffer = Buffer.from(base64Audio, "base64");
    
    // Create a Blob with the audio data
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm;codecs=opus' });
    
    // Convert Blob to File
    const file = new File([audioBlob], 'audio.webm', { type: 'audio/webm;codecs=opus' });

    try {
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
        language: "en"
      });

      return NextResponse.json({ text: transcription.text });
    } catch (error: any) {
      console.error("OpenAI API Error:", error.response?.data || error.message);
      return new NextResponse(
        "Error processing audio: " + (error.response?.data?.error?.message || error.message),
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Error processing audio:", error);
    return new NextResponse(
      "Error processing audio" + (error instanceof Error ? `: ${error.message}` : ""), 
      { status: 500 }
    );
  }
}
