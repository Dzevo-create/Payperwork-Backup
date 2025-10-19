/**
 * Slides Workflow Container (Chat-based, 1:1 wie ChatInput)
 *
 * Main container for slides workflow:
 * - Welcome screen when empty (centered)
 * - Messages area when has messages (scrollable)
 * - ChatInput at bottom (EXACTLY like in chat, with Settings button integrated)
 * - Preview panel on right (conditional, after approval)
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 4: ChatInput Integration (1:1)
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { SlidesWelcome } from './SlidesWelcome';
import { SlidesMessages } from './SlidesMessages';
import { SlidesPreviewPanel } from '../preview/SlidesPreviewPanel';
import { Settings, Paperclip, Mic, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

export function SlidesWorkflowContainer() {
  const messages = useSlidesStore((state) => state.messages);
  const showPreview = useSlidesStore((state) => state.showPreview);
  const currentPrompt = useSlidesStore((state) => state.currentPrompt);
  const setCurrentPrompt = useSlidesStore((state) => state.setCurrentPrompt);
  const generationStatus = useSlidesStore((state) => state.generationStatus);
  const addMessage = useSlidesStore((state) => state.addMessage);
  const setGenerationStatus = useSlidesStore((state) => state.setGenerationStatus);
  const format = useSlidesStore((state) => state.format);
  const setFormat = useSlidesStore((state) => state.setFormat);
  const theme = useSlidesStore((state) => state.theme);
  const setTheme = useSlidesStore((state) => state.setTheme);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentPrompt]);

  const handleSendMessage = async () => {
    if (!currentPrompt.trim()) return;

    const message = currentPrompt.trim();
    setCurrentPrompt('');

    // Add user message
    addMessage({
      id: `msg-user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    // Add thinking message
    addMessage({
      id: `msg-thinking-${Date.now()}`,
      type: 'thinking',
      content: 'Analyzing topic and creating outline...',
      timestamp: new Date().toISOString(),
    });

    setGenerationStatus('thinking');

    // Call API to generate topics
    try {
      const response = await fetch('/api/slides/workflow/generate-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: message, format, theme }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate topics');
      }

      const data = await response.json();

      if (data.success) {
        console.log('Topic generation started');
      }
    } catch (error) {
      console.error('Error generating topics:', error);

      // Add error message
      addMessage({
        id: `msg-error-${Date.now()}`,
        type: 'result',
        content: {
          error: error instanceof Error ? error.message : 'Failed to generate topics',
        },
        timestamp: new Date().toISOString(),
      });

      setGenerationStatus('error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    // TODO: Implement file upload
    console.log('Files selected:', files);
    setTimeout(() => setIsUploading(false), 1000);
  };

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
    console.log('Mic clicked');
  };

  const hasMessages = messages.length > 0;
  const isGenerating =
    generationStatus === 'thinking' || generationStatus === 'generating';
  const isDisabled = !currentPrompt.trim() || isGenerating;

  return (
    <div className="w-full h-full flex gap-6 overflow-hidden">
      {/* Messages Area (left side, flex-1) */}
      <div
        className={`flex flex-col ${showPreview ? 'flex-1' : 'w-full'} overflow-hidden`}
      >
        {/* Welcome or Messages */}
        {!hasMessages ? (
          <SlidesWelcome />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <SlidesMessages />
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* ChatInput (1:1 wie im Chat) */}
        <div className="flex-shrink-0 border-t bg-background p-4">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Settings Button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isGenerating}
                  className="flex-shrink-0"
                  title="Einstellungen"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Präsentations-Einstellungen</h4>
                    <p className="text-xs text-muted-foreground">
                      Format und Theme anpassen
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format">Format</Label>
                    <Select
                      value={format}
                      onValueChange={(v) => setFormat(v as PresentationFormat)}
                      disabled={isGenerating}
                    >
                      <SelectTrigger id="format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMAT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={theme}
                      onValueChange={(v) => setTheme(v as PresentationTheme)}
                      disabled={isGenerating}
                    >
                      <SelectTrigger id="theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {THEME_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Aktuell:</span>
                      <span className="font-medium">
                        {format} · {THEME_OPTIONS.find((t) => t.value === theme)?.label}
                      </span>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Upload Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUploadClick}
              disabled={isUploading || isGenerating}
              className="flex-shrink-0"
              title="Datei hochladen"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Mic Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMicClick}
              disabled={isGenerating}
              className={`flex-shrink-0 ${isRecording ? 'text-red-500' : ''}`}
              title="Spracheingabe"
            >
              <Mic className="h-4 w-4" />
            </Button>

            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              placeholder="Was soll deine Präsentation beinhalten?"
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="flex-1 resize-none min-h-[40px] max-h-[200px]"
              disabled={isGenerating}
            />

            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={isDisabled}
              size="icon"
              className="flex-shrink-0"
              title="Senden"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Panel (right side, conditional) */}
      {showPreview && (
        <div className="w-96 flex-shrink-0">
          <SlidesPreviewPanel />
        </div>
      )}
    </div>
  );
}
