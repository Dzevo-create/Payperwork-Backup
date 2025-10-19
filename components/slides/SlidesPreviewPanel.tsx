"use client";

import { useState, useEffect } from "react";
import { Presentation, Slide } from "@/types/slides";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { THEME_OPTIONS, FORMAT_OPTIONS } from "@/constants/slides";
import { Settings2, Palette, Maximize2 } from "lucide-react";

interface SlidesPreviewPanelProps {
  presentation: Presentation;
}

export default function SlidesPreviewPanel({
  presentation,
}: SlidesPreviewPanelProps) {
  const [slides, setSlides] = useState<Slide[]>([]);

  // Fetch slides for this presentation
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await fetch(`/api/slides/${presentation.id}`);
        const data = await response.json();
        if (data.success) {
          setSlides(data.data.slides || []);
        }
      } catch (error) {
        console.error("Failed to fetch slides:", error);
      }
    };

    if (presentation) {
      fetchSlides();
    }
  }, [presentation.id]);

  const themeOption = THEME_OPTIONS.find((t) => t.value === presentation.theme);
  const formatOption = FORMAT_OPTIONS.find((f) => f.value === presentation.format);

  return (
    <div className="w-96 border-l bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-1">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold">Presentation Settings</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Customize theme and format
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Theme Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Color Theme</Label>
            </div>

            {themeOption && (
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg border-2 flex-shrink-0"
                    style={{ backgroundColor: themeOption.color }}
                  />
                  <div>
                    <div className="font-medium text-sm">{themeOption.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {themeOption.useCase}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Select value={presentation.theme} disabled>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Theme can be changed after generation
            </p>
          </div>

          <Separator />

          {/* Format Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Slide Format</Label>
            </div>

            {formatOption && (
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <formatOption.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm">{formatOption.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatOption.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatOption.dimensions}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Select value={presentation.format} disabled>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Format is fixed after generation
            </p>
          </div>

          <Separator />

          {/* Stats Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Presentation Stats</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <div className="text-2xl font-bold text-primary">
                  {slides.length}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total Slides
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <div className="text-2xl font-bold text-primary">
                  {presentation.status === "ready" ? "100%" : "0%"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Complete
                </div>
              </div>
            </div>
          </div>

          {/* Prompt Display */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Original Prompt</Label>
            <div className="p-3 rounded-lg border bg-muted/30 text-sm text-muted-foreground">
              {presentation.prompt}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
