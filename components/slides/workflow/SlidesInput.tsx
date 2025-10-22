/**
 * Slides Input Component (2-Row Layout)
 *
 * Two-row input design:
 * - Row 1 (top): Prompt textarea
 * - Row 2 (bottom): Buttons - Upload, Mic, Type (T), Design, Aspect Ratio, Monitor, Send
 *
 * @author Payperwork Team
 * @date 2025-10-20
 */

"use client";

import React, { useRef, useEffect, useState } from "react";
import { Mic, Send, Square, Monitor, Loader2, Type, Palette, Maximize2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FORMAT_OPTIONS, THEME_OPTIONS } from "@/constants/slides";
import { PresentationFormat, PresentationTheme } from "@/types/slides";
import { logger } from "@/lib/logger";

interface SlidesInputProps {
  currentPrompt: string;
  setCurrentPrompt: (prompt: string) => void;
  onSend: () => void;
  onStopGeneration?: () => void;
  isGenerating: boolean;
  format: PresentationFormat;
  setFormat: (format: PresentationFormat) => void;
  theme: PresentationTheme;
  setTheme: (theme: PresentationTheme) => void;
  showComputerPanel: boolean;
  toggleComputerPanel: () => void;
  toolHistory: any[];
}

export function SlidesInput({
  currentPrompt,
  setCurrentPrompt,
  onSend,
  onStopGeneration,
  isGenerating,
  format,
  setFormat,
  theme,
  setTheme,
  showComputerPanel,
  toggleComputerPanel,
  toolHistory,
}: SlidesInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const designDropdownRef = useRef<HTMLDivElement>(null);
  const formatDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showDesignDropdown, setShowDesignDropdown] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const isDisabled = !currentPrompt.trim() || isGenerating;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [currentPrompt]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (designDropdownRef.current && !designDropdownRef.current.contains(event.target as Node)) {
        setShowDesignDropdown(false);
      }
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target as Node)) {
        setShowFormatDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isDisabled) {
        onSend();
      }
    }
  };

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    logger.info("Files uploaded:", { files });
    // TODO: Handle file upload (images, PDFs)
  };

  const handleEnhancePrompt = async () => {
    if (!currentPrompt.trim() || isEnhancing) return;

    setIsEnhancing(true);

    try {
      // Call API to enhance prompt with format, theme, and CI analysis
      const response = await fetch("/api/slides/workflow/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentPrompt,
          format,
          theme,
        }),
      });

      const data = await response.json();

      if (data.success && data.enhancedPrompt) {
        setCurrentPrompt(data.enhancedPrompt);
        textareaRef.current?.focus();
      } else {
        console.error("Failed to enhance prompt:", data.error);
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <>
      {/* Input Container (2 Rows) */}
      <div className="bg-transparent px-3 py-4 sm:px-4 md:px-6">
        <div className={showComputerPanel ? "w-full" : "mx-auto max-w-3xl"}>
          <div className="border-pw-black/10 focus-within:ring-pw-accent/50 space-y-3 rounded-2xl border bg-gradient-to-br from-white/80 to-white/70 p-3 shadow-sm backdrop-blur-lg transition-all focus-within:ring-2">
            {/* Row 1: Prompt Textarea */}
            <textarea
              ref={textareaRef}
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Was soll deine Präsentation beinhalten?"
              className="placeholder:text-pw-black/40 max-h-[150px] min-h-[20px] w-full resize-none bg-transparent text-sm text-pw-black outline-none"
              rows={1}
              disabled={isGenerating}
            />

            {/* Row 2: Buttons */}
            <div className="flex items-center gap-2">
              {/* Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={handleUploadClick}
                disabled={isGenerating}
                className="hover:bg-pw-black/5 flex-shrink-0 rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Datei hochladen"
                title="Datei hochladen"
              >
                <Plus className="text-pw-black/60 h-4 w-4" />
              </button>

              {/* Mic Button */}
              <button
                onClick={handleMicClick}
                disabled={isGenerating}
                className={`flex-shrink-0 rounded-lg p-2 transition-all ${
                  isRecording ? "animate-pulse bg-red-500 hover:bg-red-600" : "hover:bg-pw-black/5"
                }`}
                aria-label={isRecording ? "Aufnahme stoppen" : "Spracheingabe"}
              >
                <Mic className={`h-4 w-4 ${isRecording ? "text-white" : "text-pw-black/60"}`} />
              </button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Prompt Enhancer Button (T) */}
              <button
                onClick={handleEnhancePrompt}
                disabled={!currentPrompt.trim() || isEnhancing}
                className="hover:bg-pw-black/5 flex-shrink-0 rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Prompt verbessern"
                title="Prompt verbessern"
              >
                {isEnhancing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-pw-accent" />
                ) : (
                  <Type className="text-pw-black/60 h-4 w-4" />
                )}
              </button>

              {/* Design/Theme Button */}
              <div className="relative" ref={designDropdownRef}>
                <button
                  onClick={() => setShowDesignDropdown(!showDesignDropdown)}
                  disabled={isGenerating}
                  className="hover:bg-pw-black/5 flex-shrink-0 rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Design"
                  title="Design"
                >
                  <Palette className="text-pw-black/60 h-4 w-4" />
                </button>

                {/* Design Dropdown */}
                {showDesignDropdown && (
                  <div className="border-pw-black/10 absolute bottom-full right-0 z-50 mb-2 w-48 rounded-lg border bg-white py-2 shadow-lg">
                    <div className="border-pw-black/10 border-b px-3 py-2">
                      <h4 className="text-xs font-semibold text-pw-black">Design</h4>
                    </div>
                    <div className="px-3 py-2">
                      <Select
                        value={theme}
                        onValueChange={(v) => {
                          setTheme(v as PresentationTheme);
                          setShowDesignDropdown(false);
                        }}
                        disabled={isGenerating}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {THEME_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-xs">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Aspect Ratio Button */}
              <div className="relative" ref={formatDropdownRef}>
                <button
                  onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                  disabled={isGenerating}
                  className="hover:bg-pw-black/5 flex-shrink-0 rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Aspect Ratio"
                  title="Aspect Ratio"
                >
                  <Maximize2 className="text-pw-black/60 h-4 w-4" />
                </button>

                {/* Aspect Ratio Dropdown */}
                {showFormatDropdown && (
                  <div className="border-pw-black/10 absolute bottom-full right-0 z-50 mb-2 w-48 rounded-lg border bg-white py-2 shadow-lg">
                    <div className="border-pw-black/10 border-b px-3 py-2">
                      <h4 className="text-xs font-semibold text-pw-black">Aspect Ratio</h4>
                    </div>
                    <div className="px-3 py-2">
                      <Select
                        value={format}
                        onValueChange={(v) => {
                          setFormat(v as PresentationFormat);
                          setShowFormatDropdown(false);
                        }}
                        disabled={isGenerating}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FORMAT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-xs">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Computer Button (Payperwork) */}
              <button
                onClick={toggleComputerPanel}
                className={`flex-shrink-0 rounded-lg p-2 transition-all ${
                  showComputerPanel
                    ? "bg-pw-accent text-pw-black"
                    : "hover:bg-pw-black/5 text-pw-black/60"
                }`}
                aria-label="Payperwork"
                title={showComputerPanel ? "Payperwork schließen" : "Payperwork öffnen"}
              >
                <Monitor className="h-4 w-4" />
                {toolHistory.length > 0 && (
                  <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-pw-accent"></span>
                )}
              </button>

              {/* Send/Stop Button */}
              {isGenerating ? (
                <button
                  onClick={onStopGeneration}
                  className="flex-shrink-0 rounded-lg bg-red-500 p-2 transition-all hover:scale-105 hover:bg-red-600"
                  aria-label="Generierung stoppen"
                  title="Generierung stoppen"
                >
                  <Square className="h-4 w-4 fill-white text-white" />
                </button>
              ) : (
                <button
                  onClick={onSend}
                  disabled={isDisabled}
                  className="hover:bg-pw-accent/90 disabled:bg-pw-black/10 flex-shrink-0 rounded-lg bg-pw-accent p-2 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
                  aria-label="Senden"
                >
                  <Send className="h-4 w-4 text-pw-black" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
