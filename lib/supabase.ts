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
 * Set user context in Supabase session for RLS policies
 * MUST be called before any query that uses RLS
 */
export async function setSupabaseUserContext(userId?: string): Promise<void> {
  const userIdToSet = userId || getSupabaseUserId();

  try {
    // Call the set_user_id function in Supabase
    // This sets the session variable that RLS policies use
    const { error } = await supabase.rpc('set_user_id', { user_id: userIdToSet });

    if (error) {
      logger.warn('Failed to set user context for RLS', { error, userId: userIdToSet });
    } else {
      logger.debug('User context set for RLS', { userId: userIdToSet });
    }
  } catch (error) {
    logger.error('Error setting user context', error as Error, { userId: userIdToSet });
  }
}

/**
 * Create a Supabase client with RLS context (user_id set)
 * Use this for all queries to ensure RLS policies work correctly
 *
 * IMPORTANT: This returns a promise! Use with await.
 * Example: const client = await getSupabaseClientWithRLS();
 */
export async function getSupabaseClientWithRLS(): Promise<SupabaseClient> {
  const userId = getSupabaseUserId();

  // Set user context in session for RLS
  await setSupabaseUserContext(userId);

  return supabase;
}
