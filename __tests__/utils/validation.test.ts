/**
 * Validation Tests
 * Tests input validation functions for forms and API requests
 */

import { describe, it, expect } from '@jest/globals';

// Mock validation functions
const validation = {
  isEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isImageUrl: (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some((ext) => lowerUrl.includes(ext));
  },

  isBase64Image: (data: string): boolean => {
    const base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
    return base64Regex.test(data);
  },

  isValidPrompt: (prompt: string, minLength: number = 3, maxLength: number = 1000): boolean => {
    const trimmed = prompt.trim();
    return trimmed.length >= minLength && trimmed.length <= maxLength;
  },

  isValidImageDimensions: (
    width: number,
    height: number,
    minSize: number = 256,
    maxSize: number = 4096
  ): boolean => {
    return (
      width >= minSize && width <= maxSize && height >= minSize && height <= maxSize
    );
  },

  isValidFileSize: (sizeInBytes: number, maxSizeInMB: number = 10): boolean => {
    const maxBytes = maxSizeInMB * 1024 * 1024;
    return sizeInBytes > 0 && sizeInBytes <= maxBytes;
  },

  isValidMimeType: (mimeType: string, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(mimeType);
  },

  sanitizeFilename: (filename: string): string => {
    return filename
      .replace(/[^a-z0-9.\-_]/gi, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  },

  validateSettings: (settings: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (settings.style && typeof settings.style !== 'string') {
      errors.push('Style must be a string');
    }

    if (settings.quality && (settings.quality < 1 || settings.quality > 100)) {
      errors.push('Quality must be between 1 and 100');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

describe('validation', () => {
  describe('isEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@company.io',
        'email@subdomain.example.com',
      ];

      validEmails.forEach((email) => {
        expect(validation.isEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        '',
      ];

      invalidEmails.forEach((email) => {
        expect(validation.isEmail(email)).toBe(false);
      });
    });
  });

  describe('isUrl', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://example.com/path',
        'https://example.com/path?query=value',
        'https://subdomain.example.com',
      ];

      validUrls.forEach((url) => {
        expect(validation.isUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'example.com',
        'htp://example.com',
        '',
        'javascript:alert(1)',
      ];

      invalidUrls.forEach((url) => {
        expect(validation.isUrl(url)).toBe(false);
      });
    });
  });

  describe('isImageUrl', () => {
    it('should identify image URLs', () => {
      const imageUrls = [
        'https://example.com/photo.jpg',
        'https://example.com/image.png',
        'https://example.com/graphic.gif',
        'https://example.com/picture.webp',
      ];

      imageUrls.forEach((url) => {
        expect(validation.isImageUrl(url)).toBe(true);
      });
    });

    it('should reject non-image URLs', () => {
      const nonImageUrls = [
        'https://example.com/document.pdf',
        'https://example.com/video.mp4',
        'https://example.com/',
      ];

      nonImageUrls.forEach((url) => {
        expect(validation.isImageUrl(url)).toBe(false);
      });
    });

    it('should be case insensitive', () => {
      expect(validation.isImageUrl('https://example.com/Photo.JPG')).toBe(true);
      expect(validation.isImageUrl('https://example.com/IMAGE.PNG')).toBe(true);
    });
  });

  describe('isBase64Image', () => {
    it('should validate base64 image data', () => {
      const validBase64 = [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg',
        'data:image/jpeg;base64,/9j/4AAQSkZJRg',
        'data:image/jpg;base64,/9j/4AAQSkZJRg',
        'data:image/gif;base64,R0lGODlhAQABAIAA',
        'data:image/webp;base64,UklGRiQAAABXRUJQ',
      ];

      validBase64.forEach((data) => {
        expect(validation.isBase64Image(data)).toBe(true);
      });
    });

    it('should reject invalid base64 data', () => {
      const invalidBase64 = [
        'not-base64-data',
        'data:text/plain;base64,test',
        'image/png;base64,test',
        '',
      ];

      invalidBase64.forEach((data) => {
        expect(validation.isBase64Image(data)).toBe(false);
      });
    });
  });

  describe('isValidPrompt', () => {
    it('should validate prompts within length limits', () => {
      expect(validation.isValidPrompt('Valid prompt')).toBe(true);
      expect(validation.isValidPrompt('A'.repeat(500))).toBe(true);
    });

    it('should reject too short prompts', () => {
      expect(validation.isValidPrompt('AB')).toBe(false);
      expect(validation.isValidPrompt('')).toBe(false);
      expect(validation.isValidPrompt('  ')).toBe(false);
    });

    it('should reject too long prompts', () => {
      expect(validation.isValidPrompt('A'.repeat(1001))).toBe(false);
    });

    it('should trim whitespace before checking', () => {
      expect(validation.isValidPrompt('  Valid  ')).toBe(true);
      expect(validation.isValidPrompt('   A   ')).toBe(false);
    });

    it('should respect custom length limits', () => {
      expect(validation.isValidPrompt('Short', 5, 10)).toBe(true);
      expect(validation.isValidPrompt('AB', 5, 10)).toBe(false);
      expect(validation.isValidPrompt('TooLongPrompt', 5, 10)).toBe(false);
    });
  });

  describe('isValidImageDimensions', () => {
    it('should validate dimensions within limits', () => {
      expect(validation.isValidImageDimensions(1024, 768)).toBe(true);
      expect(validation.isValidImageDimensions(256, 256)).toBe(true);
      expect(validation.isValidImageDimensions(4096, 4096)).toBe(true);
    });

    it('should reject dimensions too small', () => {
      expect(validation.isValidImageDimensions(100, 100)).toBe(false);
      expect(validation.isValidImageDimensions(255, 256)).toBe(false);
    });

    it('should reject dimensions too large', () => {
      expect(validation.isValidImageDimensions(5000, 4000)).toBe(false);
      expect(validation.isValidImageDimensions(4096, 4097)).toBe(false);
    });

    it('should respect custom dimension limits', () => {
      expect(validation.isValidImageDimensions(500, 500, 100, 1000)).toBe(true);
      expect(validation.isValidImageDimensions(50, 50, 100, 1000)).toBe(false);
      expect(validation.isValidImageDimensions(1500, 1500, 100, 1000)).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    it('should validate file sizes within limit', () => {
      expect(validation.isValidFileSize(1024 * 1024)).toBe(true); // 1MB
      expect(validation.isValidFileSize(5 * 1024 * 1024)).toBe(true); // 5MB
      expect(validation.isValidFileSize(10 * 1024 * 1024)).toBe(true); // 10MB
    });

    it('should reject file sizes exceeding limit', () => {
      expect(validation.isValidFileSize(11 * 1024 * 1024)).toBe(false); // 11MB
      expect(validation.isValidFileSize(100 * 1024 * 1024)).toBe(false); // 100MB
    });

    it('should reject zero or negative sizes', () => {
      expect(validation.isValidFileSize(0)).toBe(false);
      expect(validation.isValidFileSize(-1024)).toBe(false);
    });

    it('should respect custom size limit', () => {
      expect(validation.isValidFileSize(3 * 1024 * 1024, 5)).toBe(true); // 3MB < 5MB
      expect(validation.isValidFileSize(6 * 1024 * 1024, 5)).toBe(false); // 6MB > 5MB
    });
  });

  describe('isValidMimeType', () => {
    it('should validate allowed mime types', () => {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];

      expect(validation.isValidMimeType('image/png', allowedTypes)).toBe(true);
      expect(validation.isValidMimeType('image/jpeg', allowedTypes)).toBe(true);
    });

    it('should reject disallowed mime types', () => {
      const allowedTypes = ['image/png', 'image/jpeg'];

      expect(validation.isValidMimeType('image/gif', allowedTypes)).toBe(false);
      expect(validation.isValidMimeType('text/plain', allowedTypes)).toBe(false);
      expect(validation.isValidMimeType('application/pdf', allowedTypes)).toBe(false);
    });

    it('should handle empty allowed types list', () => {
      expect(validation.isValidMimeType('image/png', [])).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize filenames', () => {
      expect(validation.sanitizeFilename('My File.jpg')).toBe('my_file.jpg');
      expect(validation.sanitizeFilename('file@#$%name.png')).toBe('file_name.png');
    });

    it('should handle special characters', () => {
      expect(validation.sanitizeFilename('file (1).jpg')).toBe('file__1_.jpg');
      expect(validation.sanitizeFilename('my/file\\name.png')).toBe('my_file_name.png');
    });

    it('should preserve valid characters', () => {
      expect(validation.sanitizeFilename('file-name_123.jpg')).toBe('file-name_123.jpg');
      expect(validation.sanitizeFilename('image.v2.png')).toBe('image.v2.png');
    });

    it('should replace multiple underscores with single', () => {
      expect(validation.sanitizeFilename('file___name.jpg')).toBe('file_name.jpg');
    });

    it('should convert to lowercase', () => {
      expect(validation.sanitizeFilename('MyFile.JPG')).toBe('myfile.jpg');
    });
  });

  describe('validateSettings', () => {
    it('should validate correct settings', () => {
      const settings = {
        style: 'modern',
        quality: 80,
      };

      const result = validation.validateSettings(settings);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid style type', () => {
      const settings = {
        style: 123,
      };

      const result = validation.validateSettings(settings);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Style must be a string');
    });

    it('should detect invalid quality range', () => {
      const settingsLow = { quality: 0 };
      const settingsHigh = { quality: 101 };

      const resultLow = validation.validateSettings(settingsLow);
      const resultHigh = validation.validateSettings(settingsHigh);

      expect(resultLow.valid).toBe(false);
      expect(resultHigh.valid).toBe(false);
      expect(resultLow.errors).toContain('Quality must be between 1 and 100');
    });

    it('should collect multiple errors', () => {
      const settings = {
        style: 123,
        quality: 150,
      };

      const result = validation.validateSettings(settings);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should handle empty settings', () => {
      const result = validation.validateSettings({});
      expect(result.valid).toBe(true);
    });
  });
});
