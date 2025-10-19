// components/workflows/render-to-cad/RenderToCadPromptInput.tsx
"use client";

import { Mic, Type, Send, Loader2 } from "lucide-react";
import { useRef, useEffect } from "react";
import { RenderToCadSettings } from "./RenderToCadSettings";
import { RenderToCadSettingsType } from "@/types/workflows/renderToCadSettings";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";

interface RenderToCadPromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onEnhancePrompt?: () => void;
  isGenerating?: boolean;
  isEnhancing?: boolean;
  disabled?: boolean;
  settings: RenderToCadSettingsType;
  onSettingsChange: (settings: RenderToCadSettingsType) => void;
}

export function RenderToCadPromptInput({
  prompt,
  onPromptChange,
  onGenerate,
  onEnhancePrompt,
  isGenerating = false,
  isEnhancing = false,
  disabled = false,
  settings,
  onSettingsChange,
}: RenderToCadPromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    isRecording,
    isTranscribing,
    toggleRecording,
    setOnTranscriptionComplete,
  } = useVoiceRecording();

  useEffect(() => {
    setOnTranscriptionComplete((text: string) => {
      const newPrompt = prompt ? `${prompt} ${text}` : text;
      onPromptChange(newPrompt);
    });
  }, [prompt, onPromptChange, setOnTranscriptionComplete]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isGenerating) {
        onGenerate();
      }
    }
  };

  return (
    <div className="flex flex-col gap-2.5 h-full">
      {/* Settings bar */}
      <div className="flex items-center justify-end">
        <RenderToCadSettings
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      </div>

      {/* Input container - ✅ Gleiche Struktur wie StyleTransfer */}
      <div className="flex flex-col gap-2 px-4 py-2 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-lg border border-pw-black/10 rounded-xl shadow-lg transition-all focus-within:ring-2 focus-within:ring-pw-accent/50 relative">
        <div className="flex items-end gap-3">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Optional: Zusätzliche Anforderungen... (CAD wird automatisch aus Bild + Settings generiert)"
            className="flex-1 bg-transparent text-sm text-pw-black placeholder:text-pw-black/40 resize-none outline-none min-h-[48px] max-h-[120px] leading-relaxed"
            disabled={disabled || isGenerating}
            rows={2}
          />

          {/* Actions - All on right side, smaller buttons */}
          <>
            {/* Mic Button */}
            <button
              onClick={toggleRecording}
              disabled={disabled || isGenerating || isTranscribing}
              className={`flex-shrink-0 p-1.5 hover:bg-pw-black/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-0.5 ${
                isRecording ? "bg-red-500/20" : ""
              }`}
              title={isRecording ? "Aufnahme stoppen" : "Spracheingabe"}
              aria-label={isRecording ? "Aufnahme stoppen" : "Spracheingabe"}
            >
              {isTranscribing ? (
                <Loader2 className="w-4 h-4 text-pw-accent animate-spin" />
              ) : (
                <Mic className={`w-4 h-4 ${isRecording ? "text-red-500" : "text-pw-black/60"}`} />
              )}
            </button>

            {/* Prompt Enhancer Button (T-Button) */}
            <button
              onClick={onEnhancePrompt}
              disabled={disabled || isEnhancing || isGenerating || isRecording}
              className="flex-shrink-0 p-1.5 hover:bg-pw-black/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
              title="Prompt erstellen"
              aria-label="Prompt erstellen"
            >
              {isEnhancing ? (
                <Loader2 className="w-4 h-4 text-pw-accent animate-spin" />
              ) : (
                <Type className="w-4 h-4 text-pw-black/60" />
              )}
            </button>

            {/* Send Button - Allow generation without prompt (image-only generation) */}
            <button
              onClick={onGenerate}
              disabled={disabled || isGenerating || isRecording}
              className="flex-shrink-0 p-1.5 bg-pw-accent hover:bg-pw-accent/90 disabled:bg-pw-black/10 disabled:cursor-not-allowed rounded-lg transition-all hover:scale-105 disabled:hover:scale-100 mb-0.5"
              aria-label="Generieren"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 text-pw-black animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-pw-black" />
              )}
            </button>
          </>
        </div>
      </div>
    </div>
  );
}
