/**
 * Zentrale User ID Management für Supabase
 * Wird von allen Supabase-Modulen verwendet
 */

const USER_ID_KEY = 'payperwork_user_id';

/**
 * Holt oder generiert eine User ID für Supabase-Operationen
 * @returns User ID (client-side) oder 'anonymous' (server-side)
 */
export function getUserId(): string {
  // Server-side
  if (typeof window === 'undefined') {
    return 'anonymous';
  }

  // Client-side: Check localStorage
  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
    // Generiere neue ID
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }

  return userId;
}

/**
 * Setzt eine spezifische User ID (für Testing/Migration)
 */
export function setUserId(userId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_ID_KEY, userId);
  }
}

/**
 * Löscht die User ID (für Logout)
 */
export function clearUserId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_ID_KEY);
  }
}
