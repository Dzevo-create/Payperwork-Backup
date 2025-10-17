/**
 * Supabase Insert Helper
 *
 * Provides type-safe insert operations that automatically include user_id
 * to ensure data integrity and prevent orphaned records.
 *
 * @module lib/supabase/insert-helper
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

// Initialize Supabase client
const supabase = createClientComponentClient<Database>();

/**
 * Get the current user ID from the Supabase session
 * @throws Error if no user is authenticated
 */
export async function getUserId(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Failed to get session: ${error.message}`);
  }

  if (!session?.user?.id) {
    throw new Error('No authenticated user found. Please log in.');
  }

  return session.user.id;
}

/**
 * Get the current user ID synchronously (from cached session)
 * Note: This may not work if the session hasn't been loaded yet
 * @throws Error if no user is authenticated
 */
export function getUserIdSync(): string {
  // Try to get from local storage (Supabase stores session there)
  if (typeof window === 'undefined') {
    throw new Error('getUserIdSync can only be used on the client side');
  }

  // Get from Supabase's stored session
  const sessionKey = Object.keys(localStorage).find((key) =>
    key.startsWith('sb-') && key.endsWith('-auth-token')
  );

  if (!sessionKey) {
    throw new Error('No authenticated user found. Please log in.');
  }

  try {
    const sessionData = JSON.parse(localStorage.getItem(sessionKey) || '{}');
    const userId = sessionData?.user?.id;

    if (!userId) {
      throw new Error('No authenticated user found. Please log in.');
    }

    return userId;
  } catch (error) {
    throw new Error('Failed to parse session data. Please log in again.');
  }
}

/**
 * Insert a record with automatic user_id
 *
 * @param table - The table name
 * @param data - The data to insert (without user_id)
 * @returns The inserted record
 *
 * @example
 * ```typescript
 * const item = await insertWithUserId('library_items', {
 *   name: 'My Image',
 *   type: 'image',
 *   url: 'https://example.com/image.jpg',
 * });
 * // user_id is automatically added
 * ```
 */
export async function insertWithUserId<T extends { user_id?: string }>(
  table: string,
  data: Omit<T, 'user_id' | 'id' | 'created_at' | 'updated_at'>
): Promise<T> {
  const userId = await getUserId();

  const { data: result, error } = await supabase
    .from(table)
    .insert({
      ...data,
      user_id: userId,
    } as any)
    .select()
    .single();

  if (error) {
    console.error(`[insertWithUserId] Error inserting into ${table}:`, error);
    throw error;
  }

  return result as T;
}

/**
 * Insert multiple records with automatic user_id
 *
 * @param table - The table name
 * @param dataArray - Array of data to insert (without user_id)
 * @returns Array of inserted records
 *
 * @example
 * ```typescript
 * const items = await insertManyWithUserId('library_items', [
 *   { name: 'Image 1', type: 'image', url: 'https://...' },
 *   { name: 'Image 2', type: 'image', url: 'https://...' },
 * ]);
 * ```
 */
export async function insertManyWithUserId<T extends { user_id?: string }>(
  table: string,
  dataArray: Omit<T, 'user_id' | 'id' | 'created_at' | 'updated_at'>[]
): Promise<T[]> {
  const userId = await getUserId();

  const dataWithUserId = dataArray.map((data) => ({
    ...data,
    user_id: userId,
  }));

  const { data: result, error } = await supabase
    .from(table)
    .insert(dataWithUserId as any)
    .select();

  if (error) {
    console.error(`[insertManyWithUserId] Error inserting into ${table}:`, error);
    throw error;
  }

  return result as T[];
}

/**
 * Type-safe insert helpers for specific tables
 */

type LibraryItem = Database['public']['Tables']['library_items']['Row'];
type SketchToRender = Database['public']['Tables']['sketch_to_render']['Row'];
type Branding = Database['public']['Tables']['branding']['Row'];
type Conversation = Database['public']['Tables']['conversations']['Row'];

/**
 * Insert a library item with automatic user_id
 *
 * @example
 * ```typescript
 * const item = await insertLibraryItem({
 *   name: 'My Image',
 *   type: 'image',
 *   url: 'https://example.com/image.jpg',
 *   workflow_type: 'sketch-to-render',
 * });
 * ```
 */
export async function insertLibraryItem(
  data: Omit<LibraryItem, 'user_id' | 'id' | 'created_at'>
): Promise<LibraryItem> {
  return insertWithUserId<LibraryItem>('library_items', data);
}

/**
 * Insert a sketch-to-render item with automatic user_id
 *
 * @example
 * ```typescript
 * const render = await insertSketchToRender({
 *   name: 'My Render',
 *   type: 'render',
 *   url: 'https://example.com/render.jpg',
 *   model: 'flux-1.1-pro',
 *   prompt: 'A beautiful landscape',
 *   settings: { style: 'modern' },
 * });
 * ```
 */
export async function insertSketchToRender(
  data: Omit<SketchToRender, 'user_id' | 'id' | 'created_at' | 'updated_at'>
): Promise<SketchToRender> {
  return insertWithUserId<SketchToRender>('sketch_to_render', data);
}

/**
 * Insert a branding item with automatic user_id
 *
 * @example
 * ```typescript
 * const brand = await insertBranding({
 *   name: 'Logo Design',
 *   type: 'logo',
 *   url: 'https://example.com/logo.jpg',
 *   model: 'dall-e-3',
 * });
 * ```
 */
export async function insertBranding(
  data: Omit<Branding, 'user_id' | 'id' | 'created_at' | 'updated_at'>
): Promise<Branding> {
  return insertWithUserId<Branding>('branding', data);
}

/**
 * Insert a conversation with automatic user_id
 *
 * @example
 * ```typescript
 * const conversation = await insertConversation({
 *   title: 'New Chat',
 * });
 * ```
 */
export async function insertConversation(
  data: Omit<Conversation, 'user_id' | 'id' | 'created_at' | 'updated_at'>
): Promise<Conversation> {
  return insertWithUserId<Conversation>('conversations', data);
}
