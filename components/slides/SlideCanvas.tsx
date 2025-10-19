"use client";

import { forwardRef } from "react";
import {
  Slide,
  PresentationTheme,
  PresentationFormat,
  SlideCanvasProps,
} from "@/types/slides";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";

const SlideCanvas = forwardRef<HTMLDivElement, SlideCanvasProps>(
  ({ slide, theme, format, isEditable = false, onUpdate }, ref) => {
  // Calculate dimensions based on format
  const getDimensions = () => {
    const baseWidth = 800;
    switch (format) {
      case "16:9":
        return { width: baseWidth, height: baseWidth / (16 / 9) };
      case "4:3":
        return { width: baseWidth, height: baseWidth / (4 / 3) };
      case "A4":
        return { width: baseWidth, height: baseWidth * (297 / 210) };
      default:
        return { width: baseWidth, height: baseWidth / (16 / 9) };
    }
  };

  const { width, height } = getDimensions();

  // Get theme colors
  const getThemeColors = () => {
    const themes: Record<PresentationTheme, { primary: string; bg: string }> =
      {
        default: { primary: "#64748b", bg: "#f8fafc" },
        red: { primary: "#ef4444", bg: "#fef2f2" },
        rose: { primary: "#f43f5e", bg: "#fff1f2" },
        orange: { primary: "#f97316", bg: "#fff7ed" },
        green: { primary: "#22c55e", bg: "#f0fdf4" },
        blue: { primary: "#3b82f6", bg: "#eff6ff" },
        yellow: { primary: "#eab308", bg: "#fefce8" },
        violet: { primary: "#8b5cf6", bg: "#faf5ff" },
      };
    return themes[theme] || themes.default;
  };

  const colors = getThemeColors();

  // Render different layouts
  const renderLayout = () => {
    switch (slide.layout) {
      case "title_slide":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-12">
            <h1
              className="text-5xl font-bold mb-4"
              style={{ color: colors.primary }}
            >
              {slide.title}
            </h1>
            <div className="text-2xl text-muted-foreground max-w-2xl">
              <ReactMarkdown>{slide.content}</ReactMarkdown>
            </div>
          </div>
        );

      case "content":
        return (
          <div className="p-12">
            <h2
              className="text-4xl font-bold mb-8"
              style={{ color: colors.primary }}
            >
              {slide.title}
            </h2>
            <div className="text-xl prose prose-lg max-w-none">
              <ReactMarkdown>{slide.content}</ReactMarkdown>
            </div>
          </div>
        );

      case "two_column":
        const contentParts = slide.content.split("\n\n");
        const leftContent = contentParts.slice(0, Math.ceil(contentParts.length / 2)).join("\n\n");
        const rightContent = contentParts.slice(Math.ceil(contentParts.length / 2)).join("\n\n");

        return (
          <div className="p-12">
            <h2
              className="text-4xl font-bold mb-8"
              style={{ color: colors.primary }}
            >
              {slide.title}
            </h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="prose prose-lg">
                <ReactMarkdown>{leftContent}</ReactMarkdown>
              </div>
              <div className="prose prose-lg">
                <ReactMarkdown>{rightContent}</ReactMarkdown>
              </div>
            </div>
          </div>
        );

      case "quote":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-12">
            <div
              className="text-4xl font-serif italic mb-4"
              style={{ color: colors.primary }}
            >
              &ldquo;{slide.content}&rdquo;
            </div>
            <div className="text-xl text-muted-foreground">
              &mdash; {slide.title}
            </div>
          </div>
        );

      case "image":
        return (
          <div className="p-12">
            <h2
              className="text-4xl font-bold mb-8"
              style={{ color: colors.primary }}
            >
              {slide.title}
            </h2>
            {slide.background_image ? (
              <img
                src={slide.background_image}
                alt={slide.title}
                className="w-full h-auto rounded-lg"
              />
            ) : (
              <div className="prose prose-lg">
                <ReactMarkdown>{slide.content}</ReactMarkdown>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

    return (
      <Card
        ref={ref}
        className="shadow-2xl overflow-hidden"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: slide.background_color || colors.bg,
        }}
      >
        {renderLayout()}
      </Card>
    );
  }
);

SlideCanvas.displayName = "SlideCanvas";

export default SlideCanvas;
