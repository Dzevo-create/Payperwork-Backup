"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  NewPresentationModalProps,
} from "@/types/slides";
import { Loader2 } from "lucide-react";

export default function NewPresentationModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: NewPresentationModalProps) {
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState<PresentationFormat>("16:9");
  const [theme, setTheme] = useState<PresentationTheme>("default");

  const handleSubmit = () => {
    if (!prompt.trim() || prompt.length < 10) {
      return;
    }

    onSubmit({ prompt, format, theme });
  };

  const handleClose = () => {
    if (!isLoading) {
      setPrompt("");
      setFormat("16:9");
      setTheme("default");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Neue Präsentation erstellen</DialogTitle>
          <DialogDescription>
            Beschreibe dein Thema und wähle Format und Theme. Die AI generiert
            automatisch professionelle Slides für dich.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Prompt */}
          <div className="grid gap-2">
            <Label htmlFor="prompt">
              Thema / Prompt
              <span className="text-muted-foreground text-sm ml-2">
                ({prompt.length}/1000)
              </span>
            </Label>
            <Textarea
              id="prompt"
              placeholder="z.B. Erstelle eine Präsentation über die Vorteile von Remote-Arbeit..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              maxLength={1000}
              disabled={isLoading}
              className="resize-none"
            />
            {prompt.length > 0 && prompt.length < 10 && (
              <p className="text-sm text-destructive">
                Mindestens 10 Zeichen erforderlich
              </p>
            )}
          </div>

          {/* Format */}
          <div className="grid gap-2">
            <Label htmlFor="format">Format (Seitenverhältnis)</Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as PresentationFormat)}
              disabled={isLoading}
            >
              <SelectTrigger id="format">
                <SelectValue placeholder="Wähle ein Format" />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
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

          {/* Theme */}
          <div className="grid gap-2">
            <Label htmlFor="theme">Theme (Farbschema)</Label>
            <Select
              value={theme}
              onValueChange={(value) => setTheme(value as PresentationTheme)}
              disabled={isLoading}
            >
              <SelectTrigger id="theme">
                <SelectValue placeholder="Wähle ein Theme" />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border"
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim() || prompt.length < 10}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Wird erstellt..." : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
