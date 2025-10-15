"use client";

interface MessageMetadataProps {
  timestamp: Date | number;
  isUserMessage: boolean;
}

export function MessageMetadata({ timestamp, isUserMessage }: MessageMetadataProps) {
  const timeString = new Date(timestamp || Date.now()).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`text-[10px] text-pw-black/40 mb-1 px-1 ${
        isUserMessage ? "text-right" : "text-left"
      }`}
    >
      {timeString}
    </div>
  );
}
