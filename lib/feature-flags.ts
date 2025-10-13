/**
 * Feature Flags System
 *
 * Saubere Trennung von experimentellen Features.
 * Bei Nicht-Gefallen einfach Flag auf false setzen.
 */

export const FEATURE_FLAGS = {
  /**
   * C1 Generative UI (Super Chat)
   *
   * false = Standard Chat (OpenAI Text-basiert)
   * true = Super Chat (C1 Dynamische UI-Komponenten) ✅
   *
   * Standard: true (Super Chat aktiv)
   */
  USE_C1_CHAT: false, // Standard Chat (C1 nur via Toggle aktivieren)

  /**
   * Show both variants for A/B testing
   *
   * true = Zeigt Toggle-Button im Chat-Header
   * false = Nur aktive Variante wird angezeigt
   */
  SHOW_C1_TOGGLE: true, // ✅ Show C1 toggle in UI
} as const;

/**
 * Helper function to check if C1 is enabled
 */
export function isC1Enabled(): boolean {
  return FEATURE_FLAGS.USE_C1_CHAT;
}

/**
 * Helper function to check if toggle should be shown
 */
export function shouldShowC1Toggle(): boolean {
  return FEATURE_FLAGS.SHOW_C1_TOGGLE;
}

/**
 * Get the correct API endpoint based on feature flag
 */
export function getChatEndpoint(): string {
  return isC1Enabled() ? '/api/chat-c1' : '/api/chat';
}
