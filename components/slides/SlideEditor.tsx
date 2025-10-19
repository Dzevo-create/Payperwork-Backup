"use client";

import { useState, useRef } from "react";
import { Presentation, Slide, SlideEditorProps } from "@/types/slides";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useExport } from "@/hooks/slides/useExport";
import SlideCanvas from "./SlideCanvas";
import SlideList from "./SlideList";
import SlideSettings from "./SlideSettings";

export default function SlideEditor({
  presentation,
  slides,
  onSlideUpdate,
  onSlideDelete,
  onExport,
}: SlideEditorProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const currentSlide = slides[currentSlideIndex];

  // Export hook and refs
  const { exportPresentation, isExporting } = useExport();
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handleSlideSelect = (index: number) => {
    setCurrentSlideIndex(index);
  };

  const handleExport = async (format: "pdf" | "pptx") => {
    if (format === "pdf") {
      // Get all slide elements
      const slideElements = slideRefs.current.filter(
        (el) => el !== null
      ) as HTMLDivElement[];

      await exportPresentation(format, presentation, slides, slideElements);
    } else {
      await exportPresentation(format, presentation, slides);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Left Sidebar - Slide List */}
      <div className="w-64 border-r bg-muted/10 overflow-y-auto">
        <div className="p-4">
          <h3 className="font-semibold mb-4">Slides ({slides.length})</h3>
          <SlideList
            slides={slides}
            currentSlideIndex={currentSlideIndex}
            onSlideSelect={handleSlideSelect}
          />
        </div>
      </div>

      {/* Center - Slide Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevSlide}
              disabled={currentSlideIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentSlideIndex + 1} / {slides.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextSlide}
              disabled={currentSlideIndex === slides.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pptx")}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              PPTX
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-muted/5">
          {currentSlide && (
            <SlideCanvas
              ref={(el) => (slideRefs.current[currentSlideIndex] = el)}
              slide={currentSlide}
              theme={presentation.theme}
              format={presentation.format}
              isEditable={true}
              onUpdate={(data) => onSlideUpdate(currentSlide.id, data)}
            />
          )}
        </div>
      </div>

      {/* Right Sidebar - Settings */}
      <div className="w-80 border-l bg-muted/10 overflow-y-auto">
        <div className="p-4">
          <SlideSettings
            presentation={presentation}
            currentSlide={currentSlide}
            onSlideUpdate={(data) => onSlideUpdate(currentSlide.id, data)}
          />
        </div>
      </div>
    </div>
  );
}
