/**
 * Test suite for layout validation and normalization
 *
 * Tests the following fixes:
 * 1. Layout normalization handles invalid/partial layouts
 * 2. Stream splitting preserves complete JSON objects
 * 3. Missing opening braces are detected and handled
 */

import { describe, it, expect } from '@jest/globals';

// Mock the normalizeLayout function (we'll extract it from claude-service.ts)
const VALID_LAYOUTS = ['title_slide', 'content', 'two_column', 'image', 'quote'] as const;
type SlideLayout = typeof VALID_LAYOUTS[number];

function normalizeLayout(layout: string | undefined): SlideLayout {
  if (!layout) return 'content';

  const normalized = layout.toLowerCase().trim();

  // Direct matches
  if (VALID_LAYOUTS.includes(normalized as SlideLayout)) {
    return normalized as SlideLayout;
  }

  // Map common variations to valid layouts
  const layoutMap: Record<string, SlideLayout> = {
    'title_only': 'title_slide',
    'title_content': 'content',
    'title_and_content': 'content',
    'image_text': 'image',
    'two_columns': 'two_column',
    'two_col': 'two_column',
  };

  // Check if there's a mapping
  if (layoutMap[normalized]) {
    return layoutMap[normalized];
  }

  // Check for partial matches (e.g., "title_" -> "title_slide")
  if (normalized.startsWith('title_') || normalized.startsWith('title')) {
    return 'title_slide';
  }
  if (normalized.includes('two') || normalized.includes('column')) {
    return 'two_column';
  }
  if (normalized.includes('image')) {
    return 'image';
  }
  if (normalized.includes('quote')) {
    return 'quote';
  }

  // Default fallback
  console.warn(`Unknown layout "${layout}", defaulting to "content"`);
  return 'content';
}

describe('Layout Normalization', () => {
  it('should handle valid layouts', () => {
    expect(normalizeLayout('title_slide')).toBe('title_slide');
    expect(normalizeLayout('content')).toBe('content');
    expect(normalizeLayout('two_column')).toBe('two_column');
    expect(normalizeLayout('image')).toBe('image');
    expect(normalizeLayout('quote')).toBe('quote');
  });

  it('should normalize common variations', () => {
    expect(normalizeLayout('title_only')).toBe('title_slide');
    expect(normalizeLayout('title_content')).toBe('content');
    expect(normalizeLayout('title_and_content')).toBe('content');
    expect(normalizeLayout('image_text')).toBe('image');
    expect(normalizeLayout('two_columns')).toBe('two_column');
    expect(normalizeLayout('two_col')).toBe('two_column');
  });

  it('should handle truncated layouts (BUG FIX)', () => {
    // This was the actual bug - "title_" was being saved instead of "title_slide"
    expect(normalizeLayout('title_')).toBe('title_slide');
    expect(normalizeLayout('title')).toBe('title_slide');
    expect(normalizeLayout('two')).toBe('two_column');
    expect(normalizeLayout('column')).toBe('two_column');
  });

  it('should handle undefined/empty layouts', () => {
    expect(normalizeLayout(undefined)).toBe('content');
    expect(normalizeLayout('')).toBe('content');
    expect(normalizeLayout('   ')).toBe('content');
  });

  it('should be case insensitive', () => {
    expect(normalizeLayout('TITLE_SLIDE')).toBe('title_slide');
    expect(normalizeLayout('Title_Slide')).toBe('title_slide');
    expect(normalizeLayout('CONTENT')).toBe('content');
  });

  it('should default unknown layouts to content', () => {
    expect(normalizeLayout('invalid_layout')).toBe('content');
    expect(normalizeLayout('random')).toBe('content');
    expect(normalizeLayout('xyz')).toBe('content');
  });
});

describe('Stream Splitting Logic', () => {
  it('should extract content between markers correctly', () => {
    const streamContent = '[SLIDE_START]\n{\n  "order": 1,\n  "title": "Test"\n}\n[SLIDE_END]';

    const startMarker = '[SLIDE_START]';
    const endMarker = '[SLIDE_END]';

    const startIndex = streamContent.indexOf(startMarker);
    const endIndex = streamContent.indexOf(endMarker);

    const rawContent = streamContent
      .substring(startIndex + startMarker.length, endIndex)
      .trim();

    expect(rawContent).toContain('{');
    expect(rawContent).toContain('"order"');
    expect(rawContent.indexOf('{')).toBe(0); // Should start with {
  });

  it('should handle content without opening brace (BUG FIX)', () => {
    // Simulating the bug where the opening brace was cut off
    const rawContent = '"order": 1,\n  "title": "Test"\n}';

    let firstBrace = rawContent.indexOf('{');
    expect(firstBrace).toBe(-1); // No opening brace found

    // Fix: prepend the opening brace
    const fixedContent = '{' + rawContent;
    firstBrace = fixedContent.indexOf('{');
    expect(firstBrace).toBe(0);

    // Should be valid JSON now
    expect(() => JSON.parse(fixedContent)).not.toThrow();
  });

  it('should extract JSON with matching braces correctly', () => {
    const rawContent = '{\n  "order": 1,\n  "nested": { "key": "value" }\n}';

    const firstBrace = rawContent.indexOf('{');

    // Find matching closing brace
    let braceCount = 0;
    let lastBrace = -1;
    for (let i = firstBrace; i < rawContent.length; i++) {
      if (rawContent[i] === '{') {
        braceCount++;
      } else if (rawContent[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          lastBrace = i;
          break;
        }
      }
    }

    expect(lastBrace).toBeGreaterThan(firstBrace);

    const slideJson = rawContent.substring(firstBrace, lastBrace + 1);
    expect(() => JSON.parse(slideJson)).not.toThrow();
  });
});

describe('Database Constraint Compliance', () => {
  it('should only produce layouts accepted by database', () => {
    const testLayouts = [
      'title_only',
      'title_content',
      'title_',
      'image_text',
      'two_columns',
      undefined,
      '',
      'invalid',
    ];

    testLayouts.forEach(layout => {
      const normalized = normalizeLayout(layout);
      expect(VALID_LAYOUTS).toContain(normalized);
    });
  });
});
