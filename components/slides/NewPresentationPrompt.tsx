"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FORMAT_OPTIONS, THEME_OPTIONS } from "@/constants/slides";
import {
  PresentationFormat,
  PresentationTheme,
} from "@/types/slides";
import { Loader2, Sparkles } from "lucide-react";

interface NewPresentationPromptProps {
  onSubmit: (data: {
    prompt: string;
    format: PresentationFormat;
    theme: PresentationTheme;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function NewPresentationPrompt({
  onSubmit,
  onCancel,
  isLoading = false,
}: NewPresentationPromptProps) {
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState<PresentationFormat>("16:9");
  const [theme, setTheme] = useState<PresentationTheme>("default");

  const handleSubmit = () => {
    if (!prompt.trim() || prompt.length < 10) {
      return;
    }

    onSubmit({ prompt, format, theme });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-muted/30">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>New Presentation</CardTitle>
              <CardDescription>
                Describe your presentation topic and let AI generate professional slides
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-base">
              Topic / Prompt
              <span className="text-muted-foreground text-sm ml-2 font-normal">
                ({prompt.length}/1000)
              </span>
            </Label>
            <Textarea
              id="prompt"
              placeholder="e.g., Create a presentation about the benefits of remote work with statistics and best practices..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              maxLength={1000}
              disabled={isLoading}
              className="resize-none text-base"
            />
            {prompt.length > 0 && prompt.length < 10 && (
              <p className="text-sm text-destructive">
                Please provide at least 10 characters
              </p>
            )}
          </div>

          {/* Format Selector */}
          <div className="space-y-2">
            <Label htmlFor="format" className="text-base">
              Format (Aspect Ratio)
            </Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as PresentationFormat)}
              disabled={isLoading}
            >
              <SelectTrigger id="format" className="h-auto py-3">
                <SelectValue placeholder="Choose a format" />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value} className="py-3">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {option.description} • {option.dimensions}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Theme Selector */}
          <div className="space-y-2">
            <Label htmlFor="theme" className="text-base">
              Theme (Color Scheme)
            </Label>
            <Select
              value={theme}
              onValueChange={(value) => setTheme(value as PresentationTheme)}
              disabled={isLoading}
            >
              <SelectTrigger id="theme" className="h-auto py-3">
                <SelectValue placeholder="Choose a theme" />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full border-2"
                        style={{ backgroundColor: option.color }}
                      />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {option.useCase}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !prompt.trim() || prompt.length < 10}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Generating..." : "Generate Presentation"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
