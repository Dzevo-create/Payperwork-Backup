/**
 * Style-Transfer Prompt Input Component
 *
 * Combines prompt textarea, settings bar, and action buttons
 */

"use client";

import { Mic, Type, Send, Loader2 } from "lucide-react";
import { useRef, useEffect } from "react";
import { StyleTransferSettings } from "./StyleTransferSettings";
import { StyleTransferSettingsType } from "@/types/workflows/styleTransferSettings";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";

interface StyleTransferPromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onEnhancePrompt?: () => void;
  isGenerating?: boolean;
  isEnhancing?: boolean;
  disabled?: boolean;
  settings: StyleTransferSettingsType;
  onSettingsChange: (settings: StyleTransferSettingsType) => void;
  hasReferenceImage?: boolean; // Ob ein Referenzbild hochgeladen wurde
}

export function StyleTransferPromptInput({
  prompt,
  onPromptChange,
  onGenerate,
  onEnhancePrompt,
  isGenerating = false,
  isEnhancing = false,
  disabled = false,
  settings,
  onSettingsChange,
  hasReferenceImage = false,
}: StyleTransferPromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isRecording, isTranscribing, toggleRecording, setOnTranscriptionComplete } =
    useVoiceRecording();

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
    <div className="flex h-full flex-col gap-2.5">
      {/* Settings bar */}
      <div className="flex items-center justify-end">
        <StyleTransferSettings
          settings={settings}
          onSettingsChange={onSettingsChange}
          hasReferenceImage={hasReferenceImage}
        />
      </div>

      {/* Input container */}
      <div className="border-pw-black/10 focus-within:ring-pw-accent/50 relative flex flex-col gap-2 rounded-xl border bg-gradient-to-br from-white/80 to-white/70 px-4 py-2 shadow-lg backdrop-blur-lg transition-all focus-within:ring-2">
        <div className="flex items-end gap-3">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Beschreibe den gewünschten Stil-Transfer... (z.B. 'Übertrage klassische Elemente mit Marmor-Fassade')"
            className="placeholder:text-pw-black/40 max-h-[120px] min-h-[48px] flex-1 resize-none bg-transparent text-sm leading-relaxed text-pw-black outline-none"
            disabled={disabled || isGenerating}
            rows={2}
          />

          {/* Actions */}
          <>
            {/* Mic Button */}
            <button
              onClick={toggleRecording}
              disabled={disabled || isGenerating || isTranscribing}
              className={`hover:bg-pw-black/5 mb-0.5 flex-shrink-0 rounded-lg p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isRecording ? "bg-red-500/20" : ""
              }`}
              title={isRecording ? "Aufnahme stoppen" : "Spracheingabe"}
            >
              {isTranscribing ? (
                <Loader2 className="h-4 w-4 animate-spin text-pw-accent" />
              ) : (
                <Mic className={`h-4 w-4 ${isRecording ? "text-red-500" : "text-pw-black/60"}`} />
              )}
            </button>

            {/* Enhance Button (T-Button) */}
            {onEnhancePrompt && (
              <button
                onClick={onEnhancePrompt}
                disabled={disabled || isEnhancing || isGenerating || isRecording}
                className="hover:bg-pw-black/5 mb-0.5 flex-shrink-0 rounded-lg p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                title="Prompt erstellen"
              >
                {isEnhancing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-pw-accent" />
                ) : (
                  <Type className="text-pw-black/60 h-4 w-4" />
                )}
              </button>
            )}

            {/* Generate Button */}
            <button
              onClick={onGenerate}
              disabled={disabled || isGenerating || isRecording}
              className="hover:bg-pw-accent/90 disabled:bg-pw-black/10 mb-0.5 flex-shrink-0 rounded-lg bg-pw-accent p-1.5 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label="Generieren"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin text-pw-black" />
              ) : (
                <Send className="h-4 w-4 text-pw-black" />
              )}
            </button>
          </>
        </div>
      </div>
    </div>
  );
}
