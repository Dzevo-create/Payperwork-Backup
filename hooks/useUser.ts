/**
 * Temporary User Hook
 *
 * Returns a demo user ID for development.
 * TODO: Replace with actual Supabase Auth when ready.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

'use client';

export interface User {
  id: string;
  email?: string;
  name?: string;
}

/**
 * Temporary hook that returns a demo user
 *
 * TODO: Replace with real Supabase Auth:
 * ```typescript
 * import { useUser as useSupabaseUser } from '@supabase/auth-helpers-react';
 *
 * export function useUser() {
 *   const user = useSupabaseUser();
 *   return {
 *     user: user ? { id: user.id, email: user.email, name: user.user_metadata?.name } : null,
 *     isLoading: false,
 *   };
 * }
 * ```
 */
export function useUser() {
  // TODO: Replace with real auth
  const demoUser: User = {
    id: 'demo-user-123',
    email: 'demo@payperwork.com',
    name: 'Demo User',
  };

  return {
    user: demoUser,
    isLoading: false,
  };
}
