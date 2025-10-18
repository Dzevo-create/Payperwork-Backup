"use client";

import { Mic, Sparkles, Send } from "lucide-react";
import { useRef } from "react";

interface PromptSectionProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onEnhancePrompt?: () => void;
  onVoiceInput?: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
}

/**
 * PromptSection Component
 *
 * Contains:
 * - Textarea for prompt description
 * - Mic button (voice input - placeholder for future)
 * - Prompt Generator button (enhancer - placeholder for future)
 * - Generate button
 */
export function PromptSection({
  prompt,
  onPromptChange,
  onGenerate,
  onEnhancePrompt,
  onVoiceInput,
  isGenerating = false,
  disabled = false,
}: PromptSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
    onPromptChange(target.value);
  };

  const handleGenerate = () => {
    if (!disabled && !isGenerating && prompt.trim()) {
      onGenerate();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Section Label */}
      <label className="text-xs font-medium text-pw-black/70">
        Beschreibung (optional)
      </label>

      {/* Textarea + Actions Container */}
      <div className="relative">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={handleInput}
          placeholder="Beschreibe das gewünschte Rendering (z.B. 'Modernes Wohnzimmer mit großen Fenstern, natürliches Tageslicht')"
          className="w-full min-h-[80px] max-h-[200px] p-3 pr-28 text-sm text-pw-black bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-xl border border-pw-black/10 focus:border-pw-accent/50 focus:outline-none focus:ring-2 focus:ring-pw-accent/20 resize-none transition-all"
          disabled={disabled || isGenerating}
        />

        {/* Action Buttons (positioned absolutely in bottom-right of textarea) */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {/* Mic Button - Voice Input (Placeholder) */}
          <button
            onClick={onVoiceInput}
            disabled={disabled || isGenerating}
            className="p-2 text-pw-black/40 hover:text-pw-accent hover:bg-pw-accent/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Spracheingabe (bald verfügbar)"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Prompt Enhancer Button (Placeholder) */}
          <button
            onClick={onEnhancePrompt}
            disabled={disabled || isGenerating || !prompt.trim()}
            className="p-2 text-pw-black/40 hover:text-pw-accent hover:bg-pw-accent/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Prompt verbessern (bald verfügbar)"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={disabled || isGenerating}
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
          disabled || isGenerating
            ? "bg-pw-black/10 text-pw-black/40 cursor-not-allowed"
            : "bg-gradient-to-r from-pw-accent to-pw-accent/90 text-white hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
        }`}
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Rendering wird generiert...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Rendering generieren
          </>
        )}
      </button>

      {/* Helper Text */}
      <p className="text-xs text-pw-black/50">
        Tipp: Je detaillierter die Beschreibung, desto besser das Ergebnis
      </p>
    </div>
  );
}
