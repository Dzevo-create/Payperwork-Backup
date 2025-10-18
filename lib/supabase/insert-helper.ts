/**
 * Supabase Insert Helper
 *
 * Provides type-safe insert operations that automatically include user_id
 * to ensure data integrity and prevent orphaned records.
 *
 * @module lib/supabase/insert-helper
 */

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { logger } from '@/lib/logger';

const USER_ID_KEY = 'payperwork_user_id';

/**
 * Get the current user ID from localStorage
 * This uses the project's localStorage-based user ID system
 * @throws Error if no user ID is found
 */
export async function getUserId(): Promise<string> {
  return getUserIdSync();
}

/**
 * Get the current user ID synchronously from localStorage
 * This uses the project's localStorage-based user ID system
 * @returns User ID string
 */
export function getUserIdSync(): string {
  // Server-side: cannot access localStorage
  if (typeof window === 'undefined') {
    return 'anonymous';
  }

  // Client-side: Check localStorage
  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
    // Generate new ID if not found
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }

  return userId;
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
    logger.error(`Error inserting into ${table}`, error, { table, userId, component: 'insertWithUserId' });
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
    logger.error(`Error inserting multiple records into ${table}`, error, { table, userId, count: dataArray.length, component: 'insertManyWithUserId' });
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
