import { supabase, setSupabaseUserContext } from './supabase';
import { LibraryItem } from '@/types/library';
import { libraryLogger } from './logger';
import { getUserId } from './supabase/auth';
import { initUserContext, extractStorageFilePath, executeVoidQueryWithUserContext } from './utils/supabaseHelpers';

// Upload file to Supabase Storage
export async function uploadFile(
  file: File | Blob,
  fileName: string,
  type: 'image' | 'video'
): Promise<string | null> {
  const bucket = type === 'image' ? 'images' : 'videos';
  const userId = getUserId();
  const filePath = `${userId}/${Date.now()}_${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    libraryLogger.error('Failed to upload file to storage', error, { bucket, fileName });
    return null;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}

// Upload base64 image to Supabase Storage
export async function uploadBase64Image(base64: string, fileName: string): Promise<string | null> {
  try {
    // Convert base64 to blob
    const response = await fetch(base64);
    const blob = await response.blob();

    return await uploadFile(blob, fileName, 'image');
  } catch (error) {
    libraryLogger.error('Failed to convert base64 to blob', error as Error, { fileName });
    return null;
  }
}

// Fetch library items with pagination
export async function fetchLibraryItems(offset: number = 0, limit: number = 50): Promise<LibraryItem[]> {
  const userId = getUserId();

  // Set user context for RLS
  await setSupabaseUserContext(userId);

  const { data, error } = await supabase
    .from('library_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    libraryLogger.error('Failed to fetch library items', error, { userId });
    return [];
  }

  return (data || []).map((item) => ({
    id: item.id,
    type: item.type,
    url: item.url,
    name: item.name,
    prompt: item.prompt,
    model: item.model,
    messageId: item.message_id,
    conversationId: item.conversation_id,
    createdAt: item.created_at,
    seen: item.seen,
    isFavorite: item.is_favorite || false,
    thumbnailUrl: item.thumbnail_url,
    metadata: item.metadata,
  }));
}

// Add item to library
export async function addLibraryItem(item: Omit<LibraryItem, 'id' | 'createdAt' | 'seen'>): Promise<LibraryItem | null> {
  try {
    const userId = getUserId();
    libraryLogger.debug('Adding library item', { userId, itemType: item.type, itemName: item.name });

    // Set user context for RLS
    await setSupabaseUserContext(userId);

    // If URL is base64, upload it first
    let finalUrl = item.url;
    if (item.type === 'image' && item.url.startsWith('data:image')) {
      libraryLogger.debug('Uploading base64 image to storage');
      const uploadedUrl = await uploadBase64Image(item.url, item.name);
      if (!uploadedUrl) {
        libraryLogger.error('Failed to upload base64 image');
        return null;
      }
      libraryLogger.debug('Image uploaded to storage successfully');
      finalUrl = uploadedUrl;
    }

    libraryLogger.debug('Inserting library item into database', {
      type: item.type,
      name: item.name,
      model: item.model,
      userId,
      urlLength: finalUrl?.length,
      hasPrompt: !!item.prompt,
      hasMessageId: !!item.messageId,
      hasConversationId: !!item.conversationId
    });

    const { data, error } = await supabase
      .from('library_items')
      .insert({
        type: item.type,
        url: finalUrl,
        name: item.name,
        prompt: item.prompt || null,
        model: item.model || null,
        message_id: item.messageId || null,
        conversation_id: item.conversationId || null,
        metadata: item.metadata || {},
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      libraryLogger.error('Failed to add library item to database', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        itemName: item.name,
        itemType: item.type,
        userId
      });
      return null;
    }

    if (!data) {
      libraryLogger.error('No data returned from Supabase insert', { itemName: item.name });
      return null;
    }

    libraryLogger.info('Library item added successfully', { itemId: data.id, itemType: item.type });

    return {
      id: data.id,
      type: data.type,
      url: data.url,
      name: data.name,
      prompt: data.prompt,
      model: data.model,
      messageId: data.message_id,
      conversationId: data.conversation_id,
      createdAt: data.created_at,
      seen: data.seen,
      isFavorite: data.is_favorite || false,
      metadata: data.metadata,
    };
  } catch (error) {
    libraryLogger.error('Unexpected error in addLibraryItem', error as Error, { itemName: item.name });
    return null;
  }
}

// Rename library item
export async function renameLibraryItem(id: string, newName: string): Promise<void> {
  await executeVoidQueryWithUserContext('renameLibraryItem', async () => {
    return await supabase
      .from('library_items')
      .update({ name: newName })
      .eq('id', id);
  });
}

// Toggle favorite status
export async function toggleFavoriteItem(id: string, isFavorite: boolean): Promise<void> {
  await executeVoidQueryWithUserContext('toggleFavoriteItem', async () => {
    return await supabase
      .from('library_items')
      .update({ is_favorite: isFavorite })
      .eq('id', id);
  });
}

// Mark item as seen
export async function markItemAsSeen(id: string): Promise<void> {
  await executeVoidQueryWithUserContext('markItemAsSeen', async () => {
    return await supabase
      .from('library_items')
      .update({ seen: true })
      .eq('id', id);
  });
}

// Delete library item
export async function deleteLibraryItem(id: string): Promise<void> {
  const userId = await initUserContext();

  // First get the item to find the file URL
  const { data: item } = await supabase
    .from('library_items')
    .select('url, type')
    .eq('id', id)
    .single();

  if (item && item.url) {
    // Extract file path from URL and delete from storage
    const bucket = item.type === 'image' ? 'images' : 'videos';
    const filePath = extractStorageFilePath(item.url, bucket);

    if (filePath) {
      await supabase.storage.from(bucket).remove([filePath]);
    }
  }

  // Delete from database
  const { error } = await supabase
    .from('library_items')
    .delete()
    .eq('id', id);

  if (error) {
    libraryLogger.error('Failed to delete library item', error, { itemId: id });
  }
}

// Clear all items for user
export async function clearLibrary(): Promise<void> {
  const userId = await initUserContext();

  // Get all items to delete files
  const { data: items } = await supabase
    .from('library_items')
    .select('url, type')
    .eq('user_id', userId);

  // Delete all files from storage
  if (items) {
    for (const item of items) {
      if (item.url) {
        const bucket = item.type === 'image' ? 'images' : 'videos';
        const filePath = extractStorageFilePath(item.url, bucket);

        if (filePath) {
          await supabase.storage.from(bucket).remove([filePath]);
        }
      }
    }
  }

  // Delete all items from database
  const { error } = await supabase
    .from('library_items')
    .delete()
    .eq('user_id', userId);

  if (error) {
    libraryLogger.error('Failed to clear library', error, { userId });
  }
}
