/**
 * Slide Preview Container
 * 
 * Container that enforces aspect ratio and scales slides to fit.
 * Extracted from LiveSlidePreview for better maintainability.
 * 
 * @author Payperwork Team
 * @date 2025-10-20
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PresentationFormat } from '@/types/slides';
import { getAspectRatioValue } from '../config/slideThemes';

interface SlidePreviewContainerProps {
  format: PresentationFormat;
  children: React.ReactNode;
  className?: string;
}

export function SlidePreviewContainer({ format, children, className }: SlidePreviewContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const aspectRatio = getAspectRatioValue(format);

  // ============================================
  // Calculate Container Size
  // ============================================
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // ============================================
  // Calculate Slide Size (fit to container)
  // ============================================
  const getSlideSize = () => {
    const { width: containerWidth, height: containerHeight } = containerSize;

    if (!containerWidth || !containerHeight) {
      return { width: 800, height: 450 }; // Default 16:9
    }

    const containerAspect = containerWidth / containerHeight;

    if (containerAspect > aspectRatio) {
      // Container is wider - fit to height
      const height = containerHeight;
      const width = height * aspectRatio;
      return { width, height };
    } else {
      // Container is taller - fit to width
      const width = containerWidth;
      const height = width / aspectRatio;
      return { width, height };
    }
  };

  const slideSize = getSlideSize();

  return (
    <div 
      ref={containerRef}
      className={`flex items-center justify-center ${className || ''}`}
    >
      <div
        style={{
          width: `${slideSize.width}px`,
          height: `${slideSize.height}px`,
          maxWidth: '100%',
          maxHeight: '100%',
        }}
        className="relative transition-all duration-300"
      >
        {children}
      </div>
    </div>
  );
}

