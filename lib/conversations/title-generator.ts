import { logger } from '@/lib/logger';

/**
 * Conversation Title Generator
 *
 * Utility functions for generating and formatting conversation titles
 */

/**
 * Generate a concise title from a message
 * Uses local heuristics before falling back to API
 */
export function generateLocalTitle(message: string): string {
  const cleaned = message.trim();

  if (!cleaned) {
    return 'Neuer Chat';
  }

  // Extract first sentence or up to 50 characters
  const firstSentence = cleaned.split(/[.!?]\s/)[0] ?? cleaned;
  const title = firstSentence.length > 50
    ? firstSentence.slice(0, 50).trim() + '...'
    : firstSentence;

  return title || 'Neuer Chat';
}

/**
 * Generate title from message using OpenAI API
 */
export async function generateAITitle(message: string): Promise<string> {
  try {
    const response = await fetch('/api/generate-chat-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: message }),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const { title } = await response.json();
    return title || generateLocalTitle(message);
  } catch (error) {
    logger.error('Failed to generate AI title:', error);
    return generateLocalTitle(message);
  }
}

/**
 * Validate title format
 */
export function validateTitle(title: string): { valid: boolean; error?: string } {
  if (!title || !title.trim()) {
    return { valid: false, error: 'Titel darf nicht leer sein' };
  }

  if (title.length > 100) {
    return { valid: false, error: 'Titel ist zu lang (max. 100 Zeichen)' };
  }

  if (title.trim().length < 3) {
    return { valid: false, error: 'Titel ist zu kurz (min. 3 Zeichen)' };
  }

  return { valid: true };
}

/**
 * Format title for display (truncate if needed)
 */
export function formatTitleForDisplay(title: string, maxLength: number = 40): string {
  if (title.length <= maxLength) {
    return title;
  }

  return title.slice(0, maxLength - 3) + '...';
}

/**
 * Sanitize title (remove special characters, etc.)
 */
export function sanitizeTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s\-äöüÄÖÜß]/g, ''); // Remove special chars except German umlauts
}
