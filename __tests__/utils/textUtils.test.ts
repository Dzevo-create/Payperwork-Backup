/**
 * Text Utilities Tests
 * Tests text processing and formatting functions
 */

import { describe, it, expect } from '@jest/globals';

// Mock text utility functions
const textUtils = {
  truncate: (text: string, maxLength: number, suffix: string = '...'): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length) + suffix;
  },

  capitalize: (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  },

  slugify: (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  countWords: (text: string): number => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  },

  stripHtml: (html: string): string => {
    return html.replace(/<[^>]*>/g, '');
  },

  escapeHtml: (text: string): string => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
  },

  extractUrls: (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  },

  removeExtraSpaces: (text: string): string => {
    return text.replace(/\s+/g, ' ').trim();
  },

  wordCount: (text: string): number => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  },

  charCount: (text: string, excludeSpaces: boolean = false): number => {
    if (excludeSpaces) {
      return text.replace(/\s/g, '').length;
    }
    return text.length;
  },
};

describe('textUtils', () => {
  describe('truncate', () => {
    it('should not truncate text shorter than max length', () => {
      const result = textUtils.truncate('Short text', 20);
      expect(result).toBe('Short text');
    });

    it('should truncate long text with default suffix', () => {
      const result = textUtils.truncate('This is a very long text', 10);
      expect(result).toBe('This is...');
      expect(result.length).toBe(10);
    });

    it('should truncate with custom suffix', () => {
      const result = textUtils.truncate('Long text here', 10, '…');
      expect(result).toBe('Long text…');
      expect(result.length).toBe(10);
    });

    it('should handle empty string', () => {
      const result = textUtils.truncate('', 10);
      expect(result).toBe('');
    });

    it('should handle exact length match', () => {
      const text = '12345';
      const result = textUtils.truncate(text, 5);
      expect(result).toBe('12345');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(textUtils.capitalize('hello')).toBe('Hello');
    });

    it('should not change already capitalized text', () => {
      expect(textUtils.capitalize('Hello')).toBe('Hello');
    });

    it('should handle single character', () => {
      expect(textUtils.capitalize('a')).toBe('A');
    });

    it('should handle empty string', () => {
      expect(textUtils.capitalize('')).toBe('');
    });

    it('should only capitalize first letter', () => {
      expect(textUtils.capitalize('hello world')).toBe('Hello world');
    });
  });

  describe('slugify', () => {
    it('should convert text to slug', () => {
      expect(textUtils.slugify('Hello World')).toBe('hello-world');
    });

    it('should handle special characters', () => {
      expect(textUtils.slugify('Hello! World?')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(textUtils.slugify('Hello   World')).toBe('hello-world');
    });

    it('should trim leading and trailing spaces', () => {
      expect(textUtils.slugify('  Hello World  ')).toBe('hello-world');
    });

    it('should handle underscores and hyphens', () => {
      expect(textUtils.slugify('hello_world-test')).toBe('hello-world-test');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(textUtils.slugify('-hello-world-')).toBe('hello-world');
    });

    it('should handle empty string', () => {
      expect(textUtils.slugify('')).toBe('');
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      expect(textUtils.countWords('Hello world')).toBe(2);
      expect(textUtils.countWords('One two three four')).toBe(4);
    });

    it('should handle multiple spaces', () => {
      expect(textUtils.countWords('Hello   world')).toBe(2);
    });

    it('should handle empty string', () => {
      expect(textUtils.countWords('')).toBe(0);
    });

    it('should handle single word', () => {
      expect(textUtils.countWords('Hello')).toBe(1);
    });

    it('should handle leading and trailing spaces', () => {
      expect(textUtils.countWords('  Hello world  ')).toBe(2);
    });
  });

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      const html = '<p>Hello <strong>world</strong></p>';
      expect(textUtils.stripHtml(html)).toBe('Hello world');
    });

    it('should handle self-closing tags', () => {
      const html = '<p>Line 1<br/>Line 2</p>';
      expect(textUtils.stripHtml(html)).toBe('Line 1Line 2');
    });

    it('should handle nested tags', () => {
      const html = '<div><p><span>Text</span></p></div>';
      expect(textUtils.stripHtml(html)).toBe('Text');
    });

    it('should handle text without tags', () => {
      expect(textUtils.stripHtml('Plain text')).toBe('Plain text');
    });

    it('should handle empty string', () => {
      expect(textUtils.stripHtml('')).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(textUtils.escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape ampersand', () => {
      expect(textUtils.escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      expect(textUtils.escapeHtml('She said "Hello"')).toBe('She said &quot;Hello&quot;');
      expect(textUtils.escapeHtml("It's working")).toBe('It&#x27;s working');
    });

    it('should handle text without special characters', () => {
      expect(textUtils.escapeHtml('Plain text')).toBe('Plain text');
    });

    it('should handle empty string', () => {
      expect(textUtils.escapeHtml('')).toBe('');
    });
  });

  describe('extractUrls', () => {
    it('should extract HTTP URLs', () => {
      const text = 'Visit http://example.com for more info';
      const urls = textUtils.extractUrls(text);
      expect(urls).toEqual(['http://example.com']);
    });

    it('should extract HTTPS URLs', () => {
      const text = 'Check out https://example.com';
      const urls = textUtils.extractUrls(text);
      expect(urls).toEqual(['https://example.com']);
    });

    it('should extract multiple URLs', () => {
      const text = 'Visit https://example.com and http://test.com';
      const urls = textUtils.extractUrls(text);
      expect(urls).toEqual(['https://example.com', 'http://test.com']);
    });

    it('should return empty array when no URLs found', () => {
      const text = 'No URLs here';
      const urls = textUtils.extractUrls(text);
      expect(urls).toEqual([]);
    });

    it('should handle URLs with paths and query strings', () => {
      const text = 'Visit https://example.com/path?query=value';
      const urls = textUtils.extractUrls(text);
      expect(urls).toEqual(['https://example.com/path?query=value']);
    });
  });

  describe('removeExtraSpaces', () => {
    it('should remove extra spaces', () => {
      expect(textUtils.removeExtraSpaces('Hello    world')).toBe('Hello world');
    });

    it('should trim leading and trailing spaces', () => {
      expect(textUtils.removeExtraSpaces('  Hello world  ')).toBe('Hello world');
    });

    it('should handle multiple consecutive spaces', () => {
      expect(textUtils.removeExtraSpaces('A     B     C')).toBe('A B C');
    });

    it('should handle tabs and newlines', () => {
      expect(textUtils.removeExtraSpaces('Hello\t\n  world')).toBe('Hello world');
    });

    it('should handle empty string', () => {
      expect(textUtils.removeExtraSpaces('')).toBe('');
    });
  });

  describe('wordCount', () => {
    it('should count words accurately', () => {
      expect(textUtils.wordCount('The quick brown fox')).toBe(4);
    });

    it('should handle hyphenated words as single words', () => {
      expect(textUtils.wordCount('state-of-the-art technology')).toBe(2);
    });

    it('should handle contractions', () => {
      expect(textUtils.wordCount("don't won't can't")).toBe(3);
    });
  });

  describe('charCount', () => {
    it('should count characters including spaces', () => {
      expect(textUtils.charCount('Hello world')).toBe(11);
    });

    it('should count characters excluding spaces when specified', () => {
      expect(textUtils.charCount('Hello world', true)).toBe(10);
    });

    it('should handle empty string', () => {
      expect(textUtils.charCount('')).toBe(0);
      expect(textUtils.charCount('', true)).toBe(0);
    });

    it('should handle string with only spaces', () => {
      expect(textUtils.charCount('   ')).toBe(3);
      expect(textUtils.charCount('   ', true)).toBe(0);
    });
  });
});
