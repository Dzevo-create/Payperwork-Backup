/**
 * Highlight matching text with context
 */
export function highlightText(
  text: string,
  query: string,
  contextChars: number = 50
): string | JSX.Element {
  if (!query.trim()) return text;

  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;

  // Get context around the match
  const start = Math.max(0, index - contextChars);
  const end = Math.min(text.length, index + query.length + contextChars * 3);
  let snippet = text.slice(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  return snippet;
}

/**
 * Get text parts for highlighting (before, match, after)
 */
export function getHighlightParts(
  text: string,
  query: string
): { before: string; match: string; after: string } | null {
  if (!query.trim()) return null;

  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return null;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return { before, match, after };
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
