"use client";

import { useEffect, useState, useRef } from "react";
// Import other necessary modules

const TranscriptionPage = () => {
  const [transcription, setTranscription] = useState("");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const toggleListening = async () => {
    try {
      if (!listening) {
        // Request permissions before setting listening state
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      setListening((prev) => !prev);
    } catch (err) {
      setError("Please allow microphone access to use this feature.");
      console.error("Microphone permission error:", err);
    }
  };

  useEffect(() => {
    let recordingInterval: NodeJS.Timeout | undefined = undefined;

    const handleAudioInput = async () => {
      try {
        // Clean up any existing streams
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm; codecs=opus',  // Ensure correct format
        });
        
        mediaRecorderRef.current = mediaRecorder;
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          if (audioChunks.length === 0) return;

          try {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm; codecs=opus' });
            console.log("Audio blob size:", audioBlob.size); // Debug log

            if (audioBlob.size === 0) {
              console.error("Empty audio recording");
              return;
            }

            const base64Audio = await blobToBase64(audioBlob);
            console.log("Base64 length:", base64Audio.length); // Debug log

            if (!base64Audio) {
              console.error("Failed to convert audio to base64");
              return;
            }

            const response = await fetch("/api/speechToText", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ audio: base64Audio }),
            });

            if (!response.ok) {
              throw new Error(`Speech to text error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.text) {
              setTranscription((prev) => prev + "\nYou: " + data.text);
              try {
                const chatResponse = await getChatGPTResponse(data.text);
                setTranscription((prev) => prev + "\nAI: " + chatResponse);
              } catch (error) {
                console.error("ChatGPT error:", error);
                setTranscription((prev) => prev + "\nError getting AI response.");
              }
            }
            
            // Clear chunks for next recording
            audioChunks.length = 0;
            
            // Start new recording if still listening
            if (listening && mediaRecorder.state !== "recording") {
              mediaRecorder.start();
            }
          } catch (error) {
            console.error("Error in audio processing:", error);
            setTranscription((prev) => prev + "\nError processing audio.");
          }
        };

        // Start recording
        mediaRecorder.start();
        
        // Configure recording interval
        recordingInterval = setInterval(() => {
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
        }, 5000);

      } catch (error) {
        console.error("Error accessing audio input:", error);
        setError("Error accessing microphone. Please check permissions.");
        setTranscription((prev) => prev + "\nError accessing microphone.");
      }
    };

    if (listening) {
      handleAudioInput();
    } else {
      // Clean up when stopping
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    }

    // Cleanup function
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [listening]); // Add listening to dependency array

  const getChatGPTResponse = async (text: string): Promise<string> => {
    if (!text.trim()) return "";
    
    try {
      const response = await fetch("/api/chatgpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Error getting ChatGPT response:", error);
      return "Error getting response.";
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result?.toString().split(",")[1] || "";
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Real-time Transcription</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <button
        onClick={toggleListening}
        className={`p-2 mb-4 ${listening ? "bg-red-500" : "bg-green-500"} text-white rounded`}
      >
        {listening ? "Stop Listening" : "Start Listening"}
      </button>
      <textarea
        className="w-full h-64 p-2 border border-gray-300 rounded"
        value={transcription}
        readOnly
      />
    </div>
  );
};

export default TranscriptionPage;
