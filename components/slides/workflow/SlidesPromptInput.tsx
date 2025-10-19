/**
 * Slides Prompt Input
 *
 * Input for presentation topic/prompt.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Frontend Components
 */

'use client';

import React, { useState } from 'react';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { PresentationFormat, PresentationTheme } from '@/types/slides';
import { FORMAT_OPTIONS, THEME_OPTIONS } from '@/constants/slides';
import { Sparkles } from 'lucide-react';

export function SlidesPromptInput() {
  const [prompt, setPrompt] = useState('');
  const [format, setFormat] = useState<PresentationFormat>('16:9');
  const [theme, setTheme] = useState<PresentationTheme>('default');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generationStatus = useSlidesStore((state) => state.generationStatus);
  const resetWorkflow = useSlidesStore((state) => state.resetWorkflow);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/slides/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, format, theme }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Presentation generation started:', data.data.presentation_id);
      } else {
        console.error('Failed to start generation:', data.error);
      }
    } catch (error) {
      console.error('Error starting generation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGenerating = generationStatus === 'thinking' || generationStatus === 'generating';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Create Presentation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">What should your presentation be about?</Label>
          <Textarea
            id="prompt"
            placeholder="e.g., Create a presentation about the history of Apple Inc."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            disabled={isGenerating}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isSubmitting || isGenerating}
            className="flex-1"
          >
            {isSubmitting ? 'Starting...' : 'Generate Presentation'}
          </Button>

          {isGenerating && (
            <Button variant="outline" onClick={resetWorkflow}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
