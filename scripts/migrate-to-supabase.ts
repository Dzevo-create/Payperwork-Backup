/**
 * Migration Script: localStorage → Supabase
 *
 * This script migrates all chat data from localStorage to Supabase.
 * Run this ONCE to migrate existing user data.
 *
 * Usage:
 *   1. Ensure Supabase migration SQL has been run
 *   2. Add this to a page component and call manually
 *   3. Or create an admin endpoint to trigger migration
 */

import {
  createConversation,
  createMessage,
  fetchConversations
} from '@/lib/supabase-chat';
import { Conversation, Message } from '@/types/chat';

export interface MigrationResult {
  success: boolean;
  conversationsMigrated: number;
  messagesMigrated: number;
  errors: string[];
}

export async function migrateLocalStorageToSupabase(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    conversationsMigrated: 0,
    messagesMigrated: 0,
    errors: [],
  };

  try {
    // Check if we're in browser
    if (typeof window === 'undefined') {
      result.errors.push('Migration must run in browser');
      return result;
    }

    // Get localStorage data
    const localStorageKey = 'payperwork-chat-storage';
    const localData = localStorage.getItem(localStorageKey);

    if (!localData) {
      console.log('✅ No localStorage data to migrate');
      result.success = true;
      return result;
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(localData);
    } catch (error) {
      result.errors.push('Failed to parse localStorage data');
      return result;
    }

    const { state } = parsedData;
    if (!state || !state.conversations) {
      result.errors.push('Invalid localStorage structure');
      return result;
    }

    console.log(`🔄 Starting migration of ${state.conversations.length} conversations...`);

    // Check if conversations already exist in Supabase
    const existingConversations = await fetchConversations();
    const existingIds = new Set(existingConversations.map(c => c.id));

    // Migrate each conversation
    for (const conv of state.conversations) {
      try {
        // Skip if already migrated
        if (existingIds.has(conv.id)) {
          console.log(`⏭️  Skipping existing conversation: ${conv.title}`);
          continue;
        }

        // Create conversation in Supabase
        const conversation: Conversation = {
          id: conv.id,
          title: conv.title || 'Untitled Chat',
          messages: [], // We'll add messages separately
          createdAt: conv.createdAt ? new Date(conv.createdAt) : new Date(),
          updatedAt: conv.updatedAt ? new Date(conv.updatedAt) : new Date(),
          isPinned: conv.isPinned || false,
        };

        const createdConv = await createConversation(conversation);

        if (!createdConv) {
          result.errors.push(`Failed to create conversation: ${conv.title}`);
          continue;
        }

        result.conversationsMigrated++;
        console.log(`✅ Created conversation: ${conv.title}`);

        // Migrate messages for this conversation
        if (Array.isArray(conv.messages)) {
          for (const msg of conv.messages) {
            try {
              const message: Message = {
                id: msg.id || `${Date.now()}_${Math.random()}`,
                role: msg.role,
                content: msg.content || '',
                timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
                attachments: msg.attachments || [],
                videoTask: msg.videoTask,
                wasGeneratedWithC1: msg.wasGeneratedWithC1 || false,
                generationType: msg.generationType || 'text',
                generationAttempt: msg.generationAttempt,
                generationMaxAttempts: msg.generationMaxAttempts,
                replyTo: msg.replyTo,
              };

              const createdMsg = await createMessage(conv.id, message);

              if (createdMsg) {
                result.messagesMigrated++;
              } else {
                result.errors.push(`Failed to create message in ${conv.title}`);
              }
            } catch (msgError: any) {
              result.errors.push(`Message error: ${msgError.message}`);
            }
          }
        }

        console.log(`  💬 Migrated ${conv.messages?.length || 0} messages`);
      } catch (convError: any) {
        result.errors.push(`Conversation error: ${convError.message}`);
      }
    }

    // Create backup of localStorage before clearing
    const backupKey = `${localStorageKey}_backup_${Date.now()}`;
    localStorage.setItem(backupKey, localData);
    console.log(`💾 Backup created: ${backupKey}`);

    // Clear old localStorage (commented out for safety - uncomment after verification)
    // localStorage.removeItem(localStorageKey);
    // console.log('🗑️  Cleared old localStorage');

    result.success = result.errors.length === 0;

    console.log('\n📊 Migration Summary:');
    console.log(`  ✅ Conversations migrated: ${result.conversationsMigrated}`);
    console.log(`  💬 Messages migrated: ${result.messagesMigrated}`);
    console.log(`  ❌ Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.errors.forEach(err => console.log(`  - ${err}`));
    }

    return result;
  } catch (error: any) {
    result.errors.push(`Fatal error: ${error.message}`);
    return result;
  }
}

/**
 * Helper: Check if migration is needed
 */
export function needsMigration(): boolean {
  if (typeof window === 'undefined') return false;

  const localData = localStorage.getItem('payperwork-chat-storage');
  return localData !== null;
}

/**
 * Helper: Get migration status
 */
export async function getMigrationStatus() {
  const hasLocalStorage = needsMigration();
  const supabaseConversations = await fetchConversations();

  return {
    hasLocalStorage,
    supabaseConversationCount: supabaseConversations.length,
    recommendMigration: hasLocalStorage && supabaseConversations.length === 0,
  };
}
