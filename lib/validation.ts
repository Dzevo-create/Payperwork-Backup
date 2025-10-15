/**
 * Input Validation Utilities
 *
 * Validates user inputs to prevent security issues and ensure data integrity
 */

import { logger } from './logger';

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * File upload validation
 */
export const fileValidation = {
  // Max file sizes
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_PDF_SIZE: 10 * 1024 * 1024, // 10MB

  // Allowed MIME types
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  ALLOWED_PDF_TYPES: ['application/pdf'],

  /**
   * Validate image file
   */
  validateImage(file: File): void {
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new ValidationError(
        `Ungültiger Bildtyp. Erlaubt: JPG, PNG, WebP, GIF`,
        'file'
      );
    }

    if (file.size > this.MAX_IMAGE_SIZE) {
      throw new ValidationError(
        `Bild zu groß. Maximum: ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB`,
        'file'
      );
    }

    // Check for suspicious file names
    if (file.name.includes('..') || file.name.includes('/')) {
      throw new ValidationError('Ungültiger Dateiname', 'file');
    }
  },

  /**
   * Validate video file
   */
  validateVideo(file: File): void {
    if (!this.ALLOWED_VIDEO_TYPES.includes(file.type)) {
      throw new ValidationError(
        `Ungültiger Videotyp. Erlaubt: MP4, WebM, MOV`,
        'file'
      );
    }

    if (file.size > this.MAX_VIDEO_SIZE) {
      throw new ValidationError(
        `Video zu groß. Maximum: ${this.MAX_VIDEO_SIZE / 1024 / 1024}MB`,
        'file'
      );
    }

    if (file.name.includes('..') || file.name.includes('/')) {
      throw new ValidationError('Ungültiger Dateiname', 'file');
    }
  },

  /**
   * Validate PDF file
   */
  validatePDF(file: File): void {
    if (!this.ALLOWED_PDF_TYPES.includes(file.type)) {
      throw new ValidationError('Ungültiger Dateityp. Nur PDF erlaubt', 'file');
    }

    if (file.size > this.MAX_PDF_SIZE) {
      throw new ValidationError(
        `PDF zu groß. Maximum: ${this.MAX_PDF_SIZE / 1024 / 1024}MB`,
        'file'
      );
    }

    if (file.name.includes('..') || file.name.includes('/')) {
      throw new ValidationError('Ungültiger Dateiname', 'file');
    }
  },

  /**
   * Validate base64 image
   */
  validateBase64Image(base64: string): void {
    // Check if it's a valid data URL
    if (!base64.startsWith('data:image/')) {
      throw new ValidationError('Ungültiges Bildformat', 'image');
    }

    // Estimate size (base64 is ~33% larger than binary)
    const estimatedSize = (base64.length * 3) / 4;
    if (estimatedSize > this.MAX_IMAGE_SIZE) {
      throw new ValidationError(
        `Bild zu groß. Maximum: ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB`,
        'image'
      );
    }
  },
};

/**
 * Text input validation
 */
export const textValidation = {
  MAX_MESSAGE_LENGTH: 200000, // 200k characters (Claude API limit)
  MAX_PROMPT_LENGTH: 5000, // 5k characters
  MAX_TITLE_LENGTH: 200,

  /**
   * Validate chat message
   */
  validateMessage(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new ValidationError('Nachricht darf nicht leer sein', 'content');
    }

    if (content.length > this.MAX_MESSAGE_LENGTH) {
      throw new ValidationError(
        `Nachricht zu lang. Maximum: ${this.MAX_MESSAGE_LENGTH} Zeichen`,
        'content'
      );
    }

    // Check for suspicious patterns (SQL injection, XSS attempts)
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // onclick=, onerror=, etc.
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        logger.warn('Suspicious content detected in message', { content });
        throw new ValidationError('Nachricht enthält unerlaubte Zeichen', 'content');
      }
    }
  },

  /**
   * Validate prompt
   */
  validatePrompt(prompt: string): void {
    if (!prompt || prompt.trim().length === 0) {
      throw new ValidationError('Prompt darf nicht leer sein', 'prompt');
    }

    if (prompt.length > this.MAX_PROMPT_LENGTH) {
      throw new ValidationError(
        `Prompt zu lang. Maximum: ${this.MAX_PROMPT_LENGTH} Zeichen`,
        'prompt'
      );
    }
  },

  /**
   * Validate title
   */
  validateTitle(title: string): void {
    if (title && title.length > this.MAX_TITLE_LENGTH) {
      throw new ValidationError(
        `Titel zu lang. Maximum: ${this.MAX_TITLE_LENGTH} Zeichen`,
        'title'
      );
    }
  },
};

/**
 * API request validation
 */
export const apiValidation = {
  /**
   * Validate JSON body
   */
  async validateJsonBody<T>(request: Request): Promise<T> {
    const contentType = request.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      throw new ValidationError('Content-Type muss application/json sein');
    }

    try {
      return (await request.json()) as T;
    } catch (_error) {
      throw new ValidationError('Ungültiges JSON Format');
    }
  },

  /**
   * Validate required fields
   */
  validateRequiredFields<T extends Record<string, unknown>>(
    data: T,
    requiredFields: (keyof T)[]
  ): void {
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        throw new ValidationError(
          `Pflichtfeld fehlt: ${String(field)}`,
          String(field)
        );
      }
    }
  },
};

/**
 * Sanitize user input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
