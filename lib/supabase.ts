import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get user ID from localStorage (client-side only)
 */
export function getSupabaseUserId(): string {
  if (typeof window === 'undefined') return 'anonymous';

  let userId = localStorage.getItem('payperwork_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('payperwork_user_id', userId);
    logger.debug('Created new user ID', { userId });
  }
  return userId;
}

/**
 * Create a Supabase client with RLS context (user_id set)
 * Use this for all queries to ensure RLS policies work correctly
 */
export function getSupabaseClientWithRLS(): SupabaseClient {
  const userId = getSupabaseUserId();

  // Create client with custom headers to set user context
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-user-id': userId,
      },
    },
  });

  return client;
}
