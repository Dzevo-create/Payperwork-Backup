/**
 * Slides Panel - Display Generated Presentation Slides
 *
 * Shows all slides vertically (untereinander) for scrolling.
 *
 * Features:
 * - All slides displayed vertically
 * - Scroll through slides
 * - Download options (PDF, PPTX)
 * - Empty state when no slides
 *
 * @author Payperwork Team
 * @date 2025-10-20
 * @phase Phase 2: Manus Mirroring - Slides Display (Vertical Scroll)
 */

"use client";

import React from "react";
import { Slide, PresentationFormat, PresentationTheme } from "@/types/slides";
import { FileText, Download, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface SlidesPanelProps {
  slides: Slide[];
  format: PresentationFormat;
  theme: PresentationTheme;
  isGenerating?: boolean;
}

// Aspect ratio mappings
const aspectRatios: Record<string, string> = {
  "16:9": "aspect-[16/9]",
  "4:3": "aspect-[4/3]",
  A4: "aspect-[1/1.414]",
};

export function SlidesPanel({ slides, format, theme, isGenerating = false }: SlidesPanelProps) {
  const aspectRatio = aspectRatios[format] || aspectRatios["16:9"];

  // Handle download
  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    logger.info("Download PDF");
  };

  const handleDownloadPPTX = () => {
    // TODO: Implement PPTX download
    logger.info("Download PPTX");
  };

  return (
    <div className="border-pw-black/10 flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
      {/* Header */}
      <div className="border-pw-black/10 from-pw-black/5 border-b bg-gradient-to-r to-transparent px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Presentation className="h-5 w-5 text-pw-accent" />
            <h2 className="text-lg font-semibold text-pw-black">Slides</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-pw-black/60 text-xs">
              {slides.length} {slides.length === 1 ? "Slide" : "Slides"}
            </div>
            {slides.length > 0 && (
              <div className="flex gap-1">
                <button
                  onClick={handleDownloadPDF}
                  className="bg-pw-black/5 hover:bg-pw-black/10 flex items-center gap-1 rounded-md px-2 py-1 text-xs text-pw-black transition-colors"
                  title="Als PDF herunterladen"
                >
                  <Download className="h-3 w-3" />
                  PDF
                </button>
                <button
                  onClick={handleDownloadPPTX}
                  className="hover:bg-pw-accent/90 flex items-center gap-1 rounded-md bg-pw-accent px-2 py-1 text-xs text-pw-black transition-colors"
                  title="Als PPTX herunterladen"
                >
                  <Download className="h-3 w-3" />
                  PPTX
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content - All Slides Vertical */}
      <div className="flex-1 overflow-y-auto p-4">
        {slides.length === 0 ? (
          // Empty State
          <div className="flex h-full flex-col items-center justify-center text-center">
            <FileText className="text-pw-black/20 mb-4 h-16 w-16" />
            <h3 className="text-pw-black/60 mb-2 text-sm font-medium">
              {isGenerating ? "Slides werden generiert..." : "Noch keine Slides"}
            </h3>
            <p className="text-pw-black/40 max-w-xs text-xs">
              {isGenerating
                ? "Die AI erstellt gerade deine Präsentation. Das dauert einen Moment."
                : "Erstelle eine Präsentation mit dem Prompt-Input."}
            </p>
          </div>
        ) : (
          // All Slides Vertical
          <div className="space-y-6">
            {slides.map((slide, index) => (
              <div key={index} className="space-y-2">
                {/* Slide Number */}
                <div className="flex items-center gap-2">
                  <div className="bg-pw-accent/10 rounded-md px-2 py-1 text-xs font-semibold text-pw-accent">
                    Slide {slide.order || index + 1}
                  </div>
                  <div className="text-pw-black/40 text-xs">{slide.title}</div>
                </div>

                {/* Slide Preview */}
                <div
                  className={cn(
                    "border-pw-black/10 w-full overflow-hidden rounded-lg border bg-gradient-to-br from-white to-gray-50 shadow-sm",
                    aspectRatio
                  )}
                >
                  <div className="flex h-full flex-col p-6">
                    {/* Slide Title */}
                    <h2 className="mb-4 text-2xl font-bold text-pw-black">{slide.title}</h2>

                    {/* Slide Content */}
                    <div className="flex-1 overflow-auto">
                      <div className="prose prose-sm max-w-none">
                        {slide.content.split("\n").map((line, i) => (
                          <p key={i} className="text-pw-black/80 mb-2">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Slide Footer */}
                    <div className="text-pw-black/40 mt-4 flex items-center justify-between text-xs">
                      <span>Layout: {slide.layout || "title_content"}</span>
                      <span>
                        {format} • {theme}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
