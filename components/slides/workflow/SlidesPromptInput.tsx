/**
 * Slides Prompt Input (Chat-Style)
 *
 * Chat-like input for presentation generation at the bottom of the screen.
 * Similar to ChatInput component with Settings popover.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 4: Chat-based Workflow UI
 */

'use client';

import React, { useState } from 'react';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { PresentationFormat, PresentationTheme } from '@/types/slides';
import { FORMAT_OPTIONS, THEME_OPTIONS } from '@/constants/slides';
import { Settings, Sparkles } from 'lucide-react';

export function SlidesPromptInput() {
  const currentPrompt = useSlidesStore((state) => state.currentPrompt);
  const setCurrentPrompt = useSlidesStore((state) => state.setCurrentPrompt);
  const format = useSlidesStore((state) => state.format);
  const setFormat = useSlidesStore((state) => state.setFormat);
  const theme = useSlidesStore((state) => state.theme);
  const setTheme = useSlidesStore((state) => state.setTheme);
  const generationStatus = useSlidesStore((state) => state.generationStatus);
  const addMessage = useSlidesStore((state) => state.addMessage);
  const setGenerationStatus = useSlidesStore((state) => state.setGenerationStatus);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!currentPrompt.trim()) return;

    setIsSubmitting(true);

    try {
      // Add user message
      const userMessageId = `msg-user-${Date.now()}`;
      addMessage({
        id: userMessageId,
        type: 'user',
        content: currentPrompt,
        timestamp: new Date().toISOString(),
      });

      // Add thinking message
      const thinkingMessageId = `msg-thinking-${Date.now()}`;
      addMessage({
        id: thinkingMessageId,
        type: 'thinking',
        content: 'Analyzing topic and creating outline...',
        timestamp: new Date().toISOString(),
      });

      setGenerationStatus('thinking');

      // Clear input
      setCurrentPrompt('');

      // Call API to generate topics
      const response = await fetch('/api/slides/workflow/generate-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt, format, theme }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate topics');
      }

      const data = await response.json();

      if (data.success) {
        // WebSocket will handle delivering the topics
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isGenerating = generationStatus === 'thinking' || generationStatus === 'generating';
  const isDisabled = !currentPrompt.trim() || isSubmitting || isGenerating;

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* Settings Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3 text-sm">Presentation Settings</h4>
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
                <p className="text-xs text-muted-foreground">
                  Aspect ratio for your slides
                </p>
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
                <p className="text-xs text-muted-foreground">
                  Color scheme for your presentation
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Textarea */}
        <Textarea
          placeholder="What should your presentation be about?"
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="flex-1 resize-none"
          disabled={isGenerating}
        />

        {/* Generate Button */}
        <Button
          onClick={handleSubmit}
          disabled={isDisabled}
          size="icon"
          className="flex-shrink-0"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>

      {/* Helper Text */}
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground max-w-4xl mx-auto px-12">
        <span>Press Enter to submit, Shift+Enter for new line</span>
        <span>{format} · {THEME_OPTIONS.find(t => t.value === theme)?.label}</span>
      </div>
    </div>
  );
}
