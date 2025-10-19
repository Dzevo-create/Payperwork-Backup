"use client";

import { Presentation, Slide, SlideSettingsProps } from "@/types/slides";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LAYOUT_OPTIONS } from "@/constants/slides";

export default function SlideSettings({
  presentation,
  currentSlide,
  onSlideUpdate,
}: SlideSettingsProps) {
  if (!currentSlide) {
    return (
      <div className="text-sm text-muted-foreground">
        No slide selected
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Slide Einstellungen</h3>

        {/* Title */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="slide-title">Titel</Label>
          <Input
            id="slide-title"
            value={currentSlide.title}
            onChange={(e) => onSlideUpdate({ title: e.target.value })}
            placeholder="Slide Titel"
          />
        </div>

        {/* Layout */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="slide-layout">Layout</Label>
          <Select
            value={currentSlide.layout}
            onValueChange={(value) => onSlideUpdate({ layout: value as any })}
          >
            <SelectTrigger id="slide-layout">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LAYOUT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="slide-content">Inhalt</Label>
          <Textarea
            id="slide-content"
            value={currentSlide.content}
            onChange={(e) => onSlideUpdate({ content: e.target.value })}
            rows={6}
            placeholder="Slide Inhalt (Markdown unterstützt)"
          />
        </div>

        {/* Speaker Notes */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="speaker-notes">Notizen</Label>
          <Textarea
            id="speaker-notes"
            value={currentSlide.speaker_notes || ""}
            onChange={(e) =>
              onSlideUpdate({ speaker_notes: e.target.value })
            }
            rows={3}
            placeholder="Notizen für den Vortragenden"
          />
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-4">Präsentation</h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Format:</span>
            <span className="font-medium">{presentation.format}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Theme:</span>
            <span className="font-medium capitalize">
              {presentation.theme}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium capitalize">
              {presentation.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
