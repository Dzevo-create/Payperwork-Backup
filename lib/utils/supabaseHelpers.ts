import { supabase, setSupabaseUserContext } from '@/lib/supabase';
import { getUserId } from '@/lib/supabase/auth';
import { logger } from '@/lib/logger';

/**
 * Shared Supabase helper utilities
 * Eliminates repetitive patterns across database operations
 */

/**
 * Initialize user context for RLS-protected operations
 * Returns the user ID for use in queries
 */
export async function initUserContext(): Promise<string> {
  const userId = getUserId();
  await setSupabaseUserContext(userId);
  return userId;
}

/**
 * Execute a Supabase query with automatic user context initialization
 * Handles RLS setup and error logging
 */
export async function executeWithUserContext<T>(
  operation: string,
  queryFn: (userId: string) => Promise<{ data: T | null; error: any }>
): Promise<T | null> {
  try {
    const userId = await initUserContext();
    const { data, error } = await queryFn(userId);

    if (error) {
      logger.error(`Error in ${operation}:`, error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error(`Unexpected error in ${operation}:`, error);
    return null;
  }
}

/**
 * Execute a Supabase query that returns an array with automatic user context
 */
export async function executeArrayQueryWithUserContext<T>(
  operation: string,
  queryFn: (userId: string) => Promise<{ data: T[] | null; error: any }>
): Promise<T[]> {
  try {
    const userId = await initUserContext();
    const { data, error } = await queryFn(userId);

    if (error) {
      logger.error(`Error in ${operation}:`, error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error(`Unexpected error in ${operation}:`, error);
    return [];
  }
}

/**
 * Execute a void Supabase operation (update, delete) with automatic user context
 */
export async function executeVoidQueryWithUserContext(
  operation: string,
  queryFn: (userId: string) => Promise<{ error: any }>
): Promise<boolean> {
  try {
    const userId = await initUserContext();
    const { error } = await queryFn(userId);

    if (error) {
      logger.error(`Error in ${operation}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error(`Unexpected error in ${operation}:`, error);
    return false;
  }
}

/**
 * Build update object from partial updates
 * Filters out undefined values to avoid unnecessary database updates
 */
export function buildUpdateObject<T extends Record<string, any>>(
  updates: Partial<T>,
  fieldMap?: Record<keyof T, string>
): Record<string, any> {
  const updateData: Record<string, any> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      const dbField = fieldMap?.[key as keyof T] || key;
      updateData[dbField] = value;
    }
  }

  return updateData;
}

/**
 * Extract file path from Supabase storage URL
 */
export function extractStorageFilePath(url: string, bucket: string): string | null {
  const urlParts = url.split(`/storage/v1/object/public/${bucket}/`);
  return urlParts.length > 1 ? urlParts[1] : null;
}
