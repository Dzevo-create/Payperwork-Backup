// ============================================
// Slides Prompt Generator
// Version: 1.0
// Date: 2025-10-19
// ============================================

import { PresentationFormat, PresentationTheme } from "@/types/slides";

/**
 * Generate enhanced prompt for Manus API
 *
 * Takes user input and adds context about format and theme
 * to help Manus generate better slides.
 *
 * @param userPrompt - Original user prompt
 * @param format - Presentation format (16:9, 4:3, A4)
 * @param theme - Presentation theme
 * @returns Enhanced prompt for Manus
 */
export function generateSlidesPrompt(
  userPrompt: string,
  format: PresentationFormat,
  theme: PresentationTheme
): string {
  // Format context
  const formatContext = getFormatContext(format);

  // Theme context
  const themeContext = getThemeContext(theme);

  // Combine into enhanced prompt
  const enhancedPrompt = `${userPrompt}

**Presentation Settings:**
- Format: ${formatContext}
- Theme: ${themeContext}

Please create slides that work well with this format and theme.`;

  return enhancedPrompt;
}

/**
 * Get context for presentation format
 */
function getFormatContext(format: PresentationFormat): string {
  switch (format) {
    case "16:9":
      return "16:9 (Widescreen) - Optimize for modern displays and projectors";
    case "4:3":
      return "4:3 (Standard) - Classic presentation format";
    case "A4":
      return "A4 (Document) - Optimized for printing and PDF export";
    default:
      return "16:9 (Widescreen)";
  }
}

/**
 * Get context for presentation theme
 */
function getThemeContext(theme: PresentationTheme): string {
  const themeContextMap: Record<PresentationTheme, string> = {
    default: "Professional and neutral (Slate colors)",
    red: "Bold and urgent (Red colors) - Good for sales and important messages",
    rose: "Soft and creative (Rose colors) - Good for creative and feminine topics",
    orange: "Energetic and startup-like (Orange colors) - Good for innovation",
    green: "Natural and trustworthy (Green colors) - Good for finance and nature",
    blue: "Trustworthy and tech-focused (Blue colors) - Good for technology",
    yellow: "Optimistic and educational (Yellow colors) - Good for education",
    violet: "Luxury and premium (Violet colors) - Good for high-end products",
  };

  return themeContextMap[theme] || themeContextMap.default;
}

/**
 * Validate user prompt
 *
 * @param prompt - User prompt
 * @returns Validation result
 */
export function validatePrompt(prompt: string): {
  isValid: boolean;
  error?: string;
} {
  // Check minimum length
  if (prompt.length < 10) {
    return {
      isValid: false,
      error: "Prompt muss mindestens 10 Zeichen lang sein",
    };
  }

  // Check maximum length
  if (prompt.length > 1000) {
    return {
      isValid: false,
      error: "Prompt darf maximal 1000 Zeichen lang sein",
    };
  }

  // Check if prompt is meaningful (not just whitespace)
  if (prompt.trim().length === 0) {
    return {
      isValid: false,
      error: "Prompt darf nicht leer sein",
    };
  }

  return { isValid: true };
}
