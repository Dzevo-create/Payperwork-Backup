/**
 * Slide Theme Configuration
 * 
 * Theme colors and aspect ratios for slides.
 * Extracted for better maintainability and reusability.
 * 
 * @author Payperwork Team
 * @date 2025-10-20
 */

import { PresentationTheme, PresentationFormat } from '@/types/slides';

// ============================================
// Aspect Ratio Mappings
// ============================================

export const ASPECT_RATIOS: Record<PresentationFormat, string> = {
  '16:9': 'aspect-[16/9]',
  '4:3': 'aspect-[4/3]',
  'A4': 'aspect-[1/1.414]',
};

export const ASPECT_RATIO_VALUES: Record<PresentationFormat, number> = {
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  'A4': 210 / 297,
};

export const ASPECT_RATIO_DIMENSIONS: Record<PresentationFormat, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '4:3': { width: 1024, height: 768 },
  'A4': { width: 2100, height: 2970 },
};

// ============================================
// Theme Color Mappings
// ============================================

export interface ThemeColors {
  primary: string;
  bg: string;
  accent: string;
  text: string;
}

export const THEME_COLORS: Record<PresentationTheme, ThemeColors> = {
  default: {
    primary: 'bg-slate-600',
    bg: 'bg-slate-50',
    accent: 'bg-slate-500',
    text: 'text-slate-900',
  },
  red: {
    primary: 'bg-red-600',
    bg: 'bg-red-50',
    accent: 'bg-red-500',
    text: 'text-red-900',
  },
  rose: {
    primary: 'bg-rose-600',
    bg: 'bg-rose-50',
    accent: 'bg-rose-500',
    text: 'text-rose-900',
  },
  orange: {
    primary: 'bg-orange-600',
    bg: 'bg-orange-50',
    accent: 'bg-orange-500',
    text: 'text-orange-900',
  },
  green: {
    primary: 'bg-green-600',
    bg: 'bg-green-50',
    accent: 'bg-green-500',
    text: 'text-green-900',
  },
  blue: {
    primary: 'bg-blue-600',
    bg: 'bg-blue-50',
    accent: 'bg-blue-500',
    text: 'text-blue-900',
  },
  yellow: {
    primary: 'bg-yellow-600',
    bg: 'bg-yellow-50',
    accent: 'bg-yellow-500',
    text: 'text-yellow-900',
  },
  violet: {
    primary: 'bg-violet-600',
    bg: 'bg-violet-50',
    accent: 'bg-violet-500',
    text: 'text-violet-900',
  },
};

// ============================================
// Helper Functions
// ============================================

export function getThemeColors(theme: PresentationTheme): ThemeColors {
  return THEME_COLORS[theme] || THEME_COLORS.default;
}

export function getAspectRatioClass(format: PresentationFormat): string {
  return ASPECT_RATIOS[format] || ASPECT_RATIOS['16:9'];
}

export function getAspectRatioValue(format: PresentationFormat): number {
  return ASPECT_RATIO_VALUES[format] || ASPECT_RATIO_VALUES['16:9'];
}

export function getAspectRatioDimensions(format: PresentationFormat): { width: number; height: number } {
  return ASPECT_RATIO_DIMENSIONS[format] || ASPECT_RATIO_DIMENSIONS['16:9'];
}

