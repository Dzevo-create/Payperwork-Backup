/**
 * Slides Input Component (2-Row Layout)
 *
 * Two-row input design:
 * - Row 1 (top): Prompt textarea
 * - Row 2 (bottom): Buttons - Upload, Mic, Send, Settings, Monitor, Prompt Enhancer (T)
 *
 * @author Payperwork Team
 * @date 2025-10-20
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Settings, Mic, Send, Monitor, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FORMAT_OPTIONS, THEME_OPTIONS } from '@/constants/slides';
import { PresentationFormat, PresentationTheme } from '@/types/slides';

interface SlidesInputProps {
  currentPrompt: string;
  setCurrentPrompt: (prompt: string) => void;
  onSend: () => void;
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const isDisabled = !currentPrompt.trim() || isGenerating;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentPrompt]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
    console.log('Files uploaded:', files);
    // TODO: Handle file upload (images, PDFs)
  };

  const handleEnhancePrompt = async () => {
    if (!currentPrompt.trim() || isEnhancing) return;

    setIsEnhancing(true);

    try {
      // Call API to enhance prompt with format, theme, and CI analysis
      const response = await fetch('/api/slides/workflow/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        console.error('Failed to enhance prompt:', data.error);
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <>
      {/* Input Container (2 Rows) */}
      <div className="px-3 sm:px-4 md:px-6 py-4 bg-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-lg border border-pw-black/10 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-pw-accent/50 transition-all p-3 space-y-3">

            {/* Row 1: Prompt Textarea */}
            <textarea
              ref={textareaRef}
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Was soll deine Präsentation beinhalten?"
              className="w-full bg-transparent text-sm text-pw-black placeholder:text-pw-black/40 resize-none outline-none min-h-[20px] max-h-[150px]"
              rows={1}
              disabled={isGenerating}
            />

            {/* Row 2: Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-pw-black/10">
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
                className="flex-shrink-0 p-2 hover:bg-pw-black/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Datei hochladen"
                title="Datei hochladen"
              >
                <span className="text-lg font-bold text-pw-black/60">+</span>
              </button>

              {/* Mic Button */}
              <button
                onClick={handleMicClick}
                disabled={isGenerating}
                className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : "hover:bg-pw-black/5"
                }`}
                aria-label={isRecording ? "Aufnahme stoppen" : "Spracheingabe"}
              >
                <Mic className={`w-4 h-4 ${isRecording ? "text-white" : "text-pw-black/60"}`} />
              </button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Prompt Enhancer Button */}
              <button
                onClick={handleEnhancePrompt}
                disabled={isGenerating || isEnhancing || !currentPrompt.trim()}
                className="flex-shrink-0 px-2.5 py-1.5 hover:bg-pw-accent/10 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Prompt verbessern"
                title="Prompt verbessern"
              >
                {isEnhancing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-pw-accent" />
                ) : (
                  <span className="text-sm font-semibold text-pw-accent">T</span>
                )}
              </button>

              {/* Settings Button */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  disabled={isGenerating}
                  className="flex-shrink-0 p-2 hover:bg-pw-black/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Einstellungen"
                  title="Einstellungen"
                >
                  <Settings className="w-4 h-4 text-pw-black/60" />
                </button>

                {/* Settings Dropdown */}
                {showDropdown && (
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-pw-black/10 py-2 z-50">
                    <div className="px-4 py-2 border-b border-pw-black/10">
                      <h4 className="font-semibold text-sm text-pw-black">Einstellungen</h4>
                    </div>

                    <div className="px-4 py-3 space-y-3">
                      {/* Format */}
                      <div className="space-y-1.5">
                        <Label htmlFor="format" className="text-xs text-pw-black/70">Format</Label>
                        <Select
                          value={format}
                          onValueChange={(v) => {
                            setFormat(v as PresentationFormat);
                            setShowDropdown(false);
                          }}
                          disabled={isGenerating}
                        >
                          <SelectTrigger id="format" className="h-8 text-xs">
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

                      {/* Theme */}
                      <div className="space-y-1.5">
                        <Label htmlFor="theme" className="text-xs text-pw-black/70">Theme</Label>
                        <Select
                          value={theme}
                          onValueChange={(v) => {
                            setTheme(v as PresentationTheme);
                            setShowDropdown(false);
                          }}
                          disabled={isGenerating}
                        >
                          <SelectTrigger id="theme" className="h-8 text-xs">
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
                  </div>
                )}
              </div>

              {/* Monitor Button */}
              <button
                onClick={toggleComputerPanel}
                className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                  showComputerPanel
                    ? "bg-pw-accent text-pw-black"
                    : "hover:bg-pw-black/5 text-pw-black/60"
                }`}
                aria-label="Computer Panel"
                title={showComputerPanel ? "Computer Panel schließen" : "Computer Panel öffnen"}
              >
                <Monitor className="w-4 h-4" />
                {toolHistory.length > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-pw-accent rounded-full"></span>
                )}
              </button>

              {/* Send Button */}
              <button
                onClick={onSend}
                disabled={isDisabled}
                className="flex-shrink-0 p-2 bg-pw-accent hover:bg-pw-accent/90 disabled:bg-pw-black/10 disabled:cursor-not-allowed rounded-lg transition-all hover:scale-105 disabled:hover:scale-100"
                aria-label="Senden"
              >
                <Send className="w-4 h-4 text-pw-black" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
