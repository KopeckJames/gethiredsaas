"use client";

import { useRecordVoice } from "@/hooks/useRecordVoice";
import { IconMicrophone } from "./IconMicrophone";

const Microphone = () => {
  const { startRecording, stopRecording } = useRecordVoice();

  return (
    <button
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      className="border-none bg-transparent w-10"
    >
      <IconMicrophone />
    </button>
  );
};

export { Microphone };
