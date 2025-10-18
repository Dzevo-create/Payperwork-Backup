"use client";

import { Mic, Send, Square, Loader2, Type } from "lucide-react";

interface InputActionsProps {
  isRecording: boolean;
  isTranscribing: boolean;
  isEnhancing: boolean;
  isGenerating: boolean;
  message: string;
  hasAttachments: boolean;
  onToggleRecording: () => void;
  onEnhancePrompt: () => void;
  onSend: () => void;
  onStopGeneration?: () => void;
  isSuperChatEnabled?: boolean;
  mode?: "chat" | "image" | "video";
}

export function InputActions({
  isRecording,
  isTranscribing,
  isEnhancing,
  isGenerating,
  message,
  hasAttachments,
  onToggleRecording,
  onEnhancePrompt,
  onSend,
  onStopGeneration,
}: InputActionsProps) {
  return (
    <>
      {/* Mic Button */}
      <button
        onClick={onToggleRecording}
        disabled={isTranscribing}
        className={`flex-shrink-0 p-2 rounded-lg transition-all ${
          isRecording
            ? "bg-red-500 hover:bg-red-600 animate-pulse"
            : isTranscribing
            ? "bg-pw-black/10 cursor-wait"
            : "hover:bg-pw-black/5"
        }`}
        aria-label={isRecording ? "Aufnahme stoppen" : "Spracheingabe"}
      >
        {isRecording ? (
          <Square className="w-4 h-4 text-white" />
        ) : (
          <Mic className={`w-4 h-4 ${isTranscribing ? "text-pw-black/40" : "text-pw-black/60"}`} />
        )}
      </button>

      {/* Prompt Enhancer Button (T) */}
      <button
        onClick={onEnhancePrompt}
        disabled={!message.trim() || isEnhancing}
        className="flex-shrink-0 p-2 hover:bg-pw-black/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Prompt verbessern"
        title="Prompt verbessern"
      >
        {isEnhancing ? (
          <Loader2 className="w-4 h-4 text-pw-accent animate-spin" />
        ) : (
          <Type className="w-4 h-4 text-pw-black/60" />
        )}
      </button>

      {/* Send/Stop Button */}
      {isGenerating ? (
        <button
          onClick={onStopGeneration}
          className="flex-shrink-0 p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-all hover:scale-105"
          aria-label="Stop generation"
        >
          <Square className="w-4 h-4 text-white fill-white" />
        </button>
      ) : (
        <button
          onClick={onSend}
          disabled={!message.trim() && !hasAttachments}
          className="flex-shrink-0 p-2 bg-pw-accent hover:bg-pw-accent/90 disabled:bg-pw-black/10 disabled:cursor-not-allowed rounded-lg transition-all hover:scale-105 disabled:hover:scale-100"
          aria-label="Send message"
        >
          <Send className="w-4 h-4 text-pw-black" />
        </button>
      )}
    </>
  );
}
