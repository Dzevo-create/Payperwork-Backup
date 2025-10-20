/**
 * Improved Slide Canvas with Professional Layouts
 * 
 * Features:
 * - Strict Aspect Ratio Enforcement (16:9, 4:3, A4)
 * - 5 Professional Layouts
 * - Shadcn UI Components
 * - Responsive Design
 * - Theme Support
 * 
 * @author Payperwork Team
 * @date 2025-10-20
 */

'use client';

import { forwardRef } from 'react';
import { Slide, PresentationTheme, PresentationFormat } from '@/types/slides';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Quote, Image as ImageIcon } from 'lucide-react';

interface SlideCanvasProps {
  slide: Slide;
  theme: PresentationTheme;
  format: PresentationFormat;
  isEditable?: boolean;
  onUpdate?: (slide: Slide) => void;
  className?: string;
}

// Aspect Ratio Mappings (Tailwind Classes)
const ASPECT_RATIOS: Record<PresentationFormat, string> = {
  '16:9': 'aspect-[16/9]',
  '4:3': 'aspect-[4/3]',
  'A4': 'aspect-[1/1.414]', // 210mm x 297mm
};

// Theme Color Mappings (Shadcn UI Colors)
const THEME_COLORS: Record<PresentationTheme, { 
  primary: string; 
  bg: string; 
  accent: string;
  text: string;
}> = {
  default: { 
    primary: 'bg-slate-600', 
    bg: 'bg-slate-50', 
    accent: 'bg-slate-500',
    text: 'text-slate-900'
  },
  red: { 
    primary: 'bg-red-600', 
    bg: 'bg-red-50', 
    accent: 'bg-red-500',
    text: 'text-red-900'
  },
  rose: { 
    primary: 'bg-rose-600', 
    bg: 'bg-rose-50', 
    accent: 'bg-rose-500',
    text: 'text-rose-900'
  },
  orange: { 
    primary: 'bg-orange-600', 
    bg: 'bg-orange-50', 
    accent: 'bg-orange-500',
    text: 'text-orange-900'
  },
  green: { 
    primary: 'bg-green-600', 
    bg: 'bg-green-50', 
    accent: 'bg-green-500',
    text: 'text-green-900'
  },
  blue: { 
    primary: 'bg-blue-600', 
    bg: 'bg-blue-50', 
    accent: 'bg-blue-500',
    text: 'text-blue-900'
  },
  yellow: { 
    primary: 'bg-yellow-600', 
    bg: 'bg-yellow-50', 
    accent: 'bg-yellow-500',
    text: 'text-yellow-900'
  },
  violet: { 
    primary: 'bg-violet-600', 
    bg: 'bg-violet-50', 
    accent: 'bg-violet-500',
    text: 'text-violet-900'
  },
};

const SlideCanvas = forwardRef<HTMLDivElement, SlideCanvasProps>(
  ({ slide, theme, format, isEditable = false, onUpdate, className }, ref) => {
    const aspectRatio = ASPECT_RATIOS[format];
    const colors = THEME_COLORS[theme];

    // ============================================
    // LAYOUT: Title Slide (Centered)
    // ============================================
    const renderTitleSlide = () => (
      <div className={cn('h-full flex flex-col items-center justify-center text-center p-12', colors.bg)}>
        {/* Title */}
        <h1 className={cn('text-5xl font-bold mb-6', colors.text)}>
          {slide.title}
        </h1>

        {/* Subtitle/Content */}
        {slide.content && (
          <div className="text-2xl text-muted-foreground max-w-3xl">
            <ReactMarkdown>{slide.content}</ReactMarkdown>
          </div>
        )}

        {/* Accent Bar */}
        <div className={cn('w-24 h-1 mt-8', colors.primary)} />
      </div>
    );

    // ============================================
    // LAYOUT: Content (Title + Bullets)
    // ============================================
    const renderContent = () => (
      <div className={cn('h-full flex flex-col p-12', colors.bg)}>
        {/* Header */}
        <div className="mb-8">
          <h2 className={cn('text-4xl font-bold mb-2', colors.text)}>
            {slide.title}
          </h2>
          <div className={cn('w-16 h-1', colors.primary)} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown
              components={{
                ul: ({ children }) => (
                  <ul className="space-y-4 text-xl">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-3">
                    <span className={cn('w-2 h-2 rounded-full mt-3 flex-shrink-0', colors.primary)} />
                    <span>{children}</span>
                  </li>
                ),
                p: ({ children }) => (
                  <p className="text-xl text-muted-foreground mb-4">{children}</p>
                ),
              }}
            >
              {slide.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );

    // ============================================
    // LAYOUT: Two Column
    // ============================================
    const renderTwoColumn = () => {
      // Split content by "---" or take first half
      const parts = slide.content.split('---');
      const leftContent = parts[0] || '';
      const rightContent = parts[1] || parts[0] || '';

      return (
        <div className={cn('h-full flex flex-col p-12', colors.bg)}>
          {/* Header */}
          <div className="mb-8">
            <h2 className={cn('text-4xl font-bold mb-2', colors.text)}>
              {slide.title}
            </h2>
            <div className={cn('w-16 h-1', colors.primary)} />
          </div>

          {/* Two Columns */}
          <div className="flex-1 grid grid-cols-2 gap-8 overflow-auto">
            {/* Left Column */}
            <div className="prose prose-lg">
              <ReactMarkdown>{leftContent}</ReactMarkdown>
            </div>

            {/* Separator */}
            <Separator orientation="vertical" className="absolute left-1/2 top-24 bottom-12" />

            {/* Right Column */}
            <div className="prose prose-lg">
              <ReactMarkdown>{rightContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      );
    };

    // ============================================
    // LAYOUT: Quote (Large Centered Quote)
    // ============================================
    const renderQuote = () => (
      <div className={cn('h-full flex flex-col items-center justify-center text-center p-16', colors.bg)}>
        {/* Quote Icon */}
        <Quote className={cn('w-16 h-16 mb-8 opacity-20', colors.text)} />

        {/* Quote Text */}
        <blockquote className={cn('text-4xl font-serif italic mb-8 max-w-4xl', colors.text)}>
          "{slide.content}"
        </blockquote>

        {/* Author/Source */}
        {slide.title && (
          <div className="flex items-center gap-3">
            <div className={cn('w-12 h-0.5', colors.primary)} />
            <p className="text-xl text-muted-foreground font-medium">
              {slide.title}
            </p>
            <div className={cn('w-12 h-0.5', colors.primary)} />
          </div>
        )}
      </div>
    );

    // ============================================
    // LAYOUT: Image (Title + Large Image)
    // ============================================
    const renderImage = () => (
      <div className={cn('h-full flex flex-col p-12', colors.bg)}>
        {/* Header */}
        <div className="mb-6">
          <h2 className={cn('text-4xl font-bold mb-2', colors.text)}>
            {slide.title}
          </h2>
          <div className={cn('w-16 h-1', colors.primary)} />
        </div>

        {/* Image Placeholder */}
        <div className="flex-1 flex items-center justify-center bg-gray-200 rounded-lg overflow-hidden">
          {slide.background_image ? (
            <img 
              src={slide.background_image} 
              alt={slide.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <ImageIcon className="w-24 h-24 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Image Placeholder</p>
              <p className="text-sm text-gray-400 mt-2 max-w-md">
                {slide.content}
              </p>
            </div>
          )}
        </div>
      </div>
    );

    // ============================================
    // Render Layout Based on Type
    // ============================================
    const renderLayout = () => {
      switch (slide.layout) {
        case 'title_slide':
          return renderTitleSlide();
        case 'content':
          return renderContent();
        case 'two_column':
          return renderTwoColumn();
        case 'quote':
          return renderQuote();
        case 'image':
          return renderImage();
        default:
          return renderContent(); // Default to content layout
      }
    };

    // ============================================
    // Main Render
    // ============================================
    return (
      <Card
        ref={ref}
        className={cn(
          'w-full shadow-lg overflow-hidden relative',
          aspectRatio, // Enforce aspect ratio
          className
        )}
      >
        {/* Slide Content */}
        {renderLayout()}

        {/* Slide Number Badge (Bottom Right) */}
        <Badge 
          variant="secondary" 
          className="absolute bottom-4 right-4 opacity-50"
        >
          {slide.order_index || slide.order || 1}
        </Badge>

        {/* Speaker Notes Indicator (Bottom Left) */}
        {slide.speaker_notes && (
          <Badge 
            variant="outline" 
            className="absolute bottom-4 left-4 opacity-50"
          >
            📝 Notes
          </Badge>
        )}
      </Card>
    );
  }
);

SlideCanvas.displayName = 'SlideCanvas';

export default SlideCanvas;

