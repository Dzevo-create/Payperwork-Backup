"use client";

import { Slide, SlideListProps } from "@/types/slides";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function SlideList({
  slides,
  currentSlideIndex,
  onSlideSelect,
}: SlideListProps) {
  return (
    <div className="space-y-2">
      {slides.map((slide, index) => (
        <Button
          key={slide.id}
          variant="ghost"
          className={cn(
            "w-full justify-start h-auto p-3 hover:bg-muted",
            currentSlideIndex === index && "bg-muted"
          )}
          onClick={() => onSlideSelect(index)}
        >
          <div className="flex items-start gap-3 w-full">
            <div className="flex-shrink-0 w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-medium">
              {index + 1}
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <div className="font-medium text-sm line-clamp-1">
                {slide.title}
              </div>
              <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {slide.content.substring(0, 60)}...
              </div>
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}
