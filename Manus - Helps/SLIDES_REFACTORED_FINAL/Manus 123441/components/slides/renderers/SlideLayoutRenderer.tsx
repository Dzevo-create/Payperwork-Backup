/**
 * Slide Layout Renderer
 * 
 * Renders different slide layouts (Title, Content, Two-Column, Quote, Image).
 * Extracted from SlideCanvas for better maintainability.
 * 
 * @author Payperwork Team
 * @date 2025-10-20
 */

'use client';

import React from 'react';
import { Slide } from '@/types/slides';
import { Separator } from '@/components/ui/separator';
import ReactMarkdown from 'react-markdown';
import { Quote, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlideLayoutRendererProps {
  slide: Slide;
  colors: {
    primary: string;
    bg: string;
    accent: string;
    text: string;
  };
}

export function SlideLayoutRenderer({ slide, colors }: SlideLayoutRendererProps) {
  // ============================================
  // LAYOUT: Title Slide
  // ============================================
  const renderTitleSlide = () => (
    <div className={cn('h-full flex flex-col items-center justify-center text-center p-12', colors.bg)}>
      <h1 className={cn('text-5xl font-bold mb-6', colors.text)}>
        {slide.title}
      </h1>
      {slide.content && (
        <div className="text-2xl text-muted-foreground max-w-3xl">
          <ReactMarkdown>{slide.content}</ReactMarkdown>
        </div>
      )}
      <div className={cn('w-24 h-1 mt-8', colors.primary)} />
    </div>
  );

  // ============================================
  // LAYOUT: Content
  // ============================================
  const renderContent = () => (
    <div className={cn('h-full flex flex-col p-12', colors.bg)}>
      <div className="mb-8">
        <h2 className={cn('text-4xl font-bold mb-2', colors.text)}>
          {slide.title}
        </h2>
        <div className={cn('w-16 h-1', colors.primary)} />
      </div>
      <div className="flex-1 overflow-auto">
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown
            components={{
              ul: ({ children }) => <ul className="space-y-4 text-xl">{children}</ul>,
              li: ({ children }) => (
                <li className="flex items-start gap-3">
                  <span className={cn('w-2 h-2 rounded-full mt-3 flex-shrink-0', colors.primary)} />
                  <span>{children}</span>
                </li>
              ),
              p: ({ children }) => <p className="text-xl text-muted-foreground mb-4">{children}</p>,
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
    const parts = slide.content.split('---');
    const leftContent = parts[0] || '';
    const rightContent = parts[1] || parts[0] || '';

    return (
      <div className={cn('h-full flex flex-col p-12', colors.bg)}>
        <div className="mb-8">
          <h2 className={cn('text-4xl font-bold mb-2', colors.text)}>
            {slide.title}
          </h2>
          <div className={cn('w-16 h-1', colors.primary)} />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-8 overflow-auto">
          <div className="prose prose-lg">
            <ReactMarkdown>{leftContent}</ReactMarkdown>
          </div>
          <Separator orientation="vertical" className="absolute left-1/2 top-24 bottom-12" />
          <div className="prose prose-lg">
            <ReactMarkdown>{rightContent}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // LAYOUT: Quote
  // ============================================
  const renderQuote = () => (
    <div className={cn('h-full flex flex-col items-center justify-center text-center p-16', colors.bg)}>
      <Quote className={cn('w-16 h-16 mb-8 opacity-20', colors.text)} />
      <blockquote className={cn('text-4xl font-serif italic mb-8 max-w-4xl', colors.text)}>
        "{slide.content}"
      </blockquote>
      {slide.title && (
        <div className="flex items-center gap-3">
          <div className={cn('w-12 h-0.5', colors.primary)} />
          <p className="text-xl text-muted-foreground font-medium">{slide.title}</p>
          <div className={cn('w-12 h-0.5', colors.primary)} />
        </div>
      )}
    </div>
  );

  // ============================================
  // LAYOUT: Image
  // ============================================
  const renderImage = () => (
    <div className={cn('h-full flex flex-col p-12', colors.bg)}>
      <div className="mb-6">
        <h2 className={cn('text-4xl font-bold mb-2', colors.text)}>
          {slide.title}
        </h2>
        <div className={cn('w-16 h-1', colors.primary)} />
      </div>
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
            <p className="text-sm text-gray-400 mt-2 max-w-md">{slide.content}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ============================================
  // Render Based on Layout Type
  // ============================================
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
      return renderContent();
  }
}

