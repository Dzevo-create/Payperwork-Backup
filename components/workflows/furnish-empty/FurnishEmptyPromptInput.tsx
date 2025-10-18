// components/workflows/furnish-empty/FurnishEmptyPromptInput.tsx
"use client";

import { Mic, Type, Send, Loader2, Plus, X } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { FurnishEmptySettings } from "./FurnishEmptySettings";
import { FurnishEmptySettingsType } from "@/types/workflows/furnishEmptySettings";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useFurnishEmptyContext } from "@/contexts/FurnishEmptyContext";

interface FurnishEmptyPromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onEnhancePrompt?: () => void;
  isGenerating?: boolean;
  isEnhancing?: boolean;
  disabled?: boolean;
  settings: FurnishEmptySettingsType;
  onSettingsChange: (settings: FurnishEmptySettingsType) => void;
}

export function FurnishEmptyPromptInput({
  prompt,
  onPromptChange,
  onGenerate,
  onEnhancePrompt,
  isGenerating = false,
  isEnhancing = false,
  disabled = false,
  settings,
  onSettingsChange,
}: FurnishEmptyPromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isRecording, isTranscribing, toggleRecording, setOnTranscriptionComplete } = useVoiceRecording();
  const { furnitureImages, setFurnitureImages } = useFurnishEmptyContext();

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

  const handleAddReferenceImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      // Check file size (max 15MB)
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 15) {
        alert(`Datei zu groß (max. 15MB): ${file.name}`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setFurnitureImages((prev) => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFurnitureImage = (index: number) => {
    setFurnitureImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-2.5 h-full">
      {/* Settings bar */}
      <div className="flex items-center justify-end">
        <FurnishEmptySettings
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      </div>

      {/* Input container */}
      <div className="flex flex-col gap-2 px-4 py-2 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-lg border border-pw-black/10 rounded-xl shadow-lg transition-all focus-within:ring-2 focus-within:ring-pw-accent/50 relative">
        {/* Furniture Images Preview */}
        {furnitureImages.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2 border-b border-pw-black/10">
            {furnitureImages.map((imgUrl, index) => (
              <div
                key={index}
                className="relative group w-16 h-16 rounded-lg overflow-hidden border border-pw-black/10"
              >
                <img
                  src={imgUrl}
                  alt={`Möbel ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveFurnitureImage(index)}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-red-500/90 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Bild entfernen"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-3">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Beschreibe zusätzliche Wünsche... (z.B. 'Füge einen großen Esstisch hinzu')"
            className="flex-1 bg-transparent text-sm text-pw-black placeholder:text-pw-black/40 resize-none outline-none min-h-[48px] max-h-[120px] leading-relaxed"
            disabled={disabled || isGenerating}
            rows={2}
          />

          {/* Actions */}
          <>
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Add Furniture Image Button */}
            <button
              onClick={handleAddReferenceImage}
              disabled={disabled || isGenerating}
              className="flex-shrink-0 p-1.5 hover:bg-pw-black/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
              title="Möbelbilder hinzufügen (z.B. Lampe, Sofa, Tisch)"
            >
              <Plus className="w-4 h-4 text-pw-black/60" />
            </button>

            {/* Mic Button */}
            <button
              onClick={toggleRecording}
              disabled={disabled || isGenerating || isTranscribing}
              className={`flex-shrink-0 p-1.5 hover:bg-pw-black/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-0.5 ${
                isRecording ? "bg-red-500/20" : ""
              }`}
              title={isRecording ? "Aufnahme stoppen" : "Spracheingabe"}
            >
              {isTranscribing ? (
                <Loader2 className="w-4 h-4 text-pw-accent animate-spin" />
              ) : (
                <Mic className={`w-4 h-4 ${isRecording ? "text-red-500" : "text-pw-black/60"}`} />
              )}
            </button>

            {/* Enhance Button */}
            <button
              onClick={onEnhancePrompt}
              disabled={disabled || isEnhancing || isGenerating || isRecording}
              className="flex-shrink-0 p-1.5 hover:bg-pw-black/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
              title="Prompt erstellen"
            >
              {isEnhancing ? (
                <Loader2 className="w-4 h-4 text-pw-accent animate-spin" />
              ) : (
                <Type className="w-4 h-4 text-pw-black/60" />
              )}
            </button>

            {/* Generate Button */}
            <button
              onClick={onGenerate}
              disabled={disabled || isGenerating || isRecording}
              className="flex-shrink-0 p-1.5 bg-pw-accent hover:bg-pw-accent/90 disabled:bg-pw-black/10 disabled:cursor-not-allowed rounded-lg transition-all hover:scale-105 disabled:hover:scale-100 mb-0.5"
              aria-label="Raum einrichten"
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
