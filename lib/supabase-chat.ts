import { supabase } from './supabase';
import { Message, Conversation } from '@/types/chat';
import { getUserIdSync } from './supabase/insert-helper';
import { logger } from '@/lib/logger';

// Conversations
export async function fetchConversations(): Promise<Conversation[]> {
  const userId = getUserIdSync();

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    logger.error('Error fetching conversations:', error);
    return [];
  }

  // Return conversations WITHOUT messages (lazy loading)
  // Messages will be loaded on-demand when conversation is opened
  return (data || []).map((conv) => ({
    id: conv.id,
    title: conv.title,
    messages: [], // Empty - messages loaded lazily
    createdAt: new Date(conv.created_at),
    updatedAt: new Date(conv.updated_at),
    isPinned: conv.is_pinned,
    isSuperChatEnabled: conv.is_superchat_enabled,
  }));
}

// NEW: Load messages for a specific conversation (lazy loading)
export async function fetchConversationMessages(conversationId: string): Promise<Message[]> {
  return fetchMessages(conversationId);
}

export async function createConversation(conversation: Conversation): Promise<Conversation | null> {
  const userId = getUserIdSync();

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      id: conversation.id,
      title: conversation.title,
      user_id: userId,
      is_pinned: conversation.isPinned || false,
      is_superchat_enabled: conversation.isSuperChatEnabled || false,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating conversation:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      full: error,
    });
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    messages: [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    isPinned: data.is_pinned,
    isSuperChatEnabled: data.is_superchat_enabled,
  };
}

export async function updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
  // getUserIdSync() is called for future use (e.g., RLS policies)
  void getUserIdSync();

  const updateData: Record<string, any> = {};

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.isPinned !== undefined) updateData.is_pinned = updates.isPinned;
  if (updates.isSuperChatEnabled !== undefined) updateData.is_superchat_enabled = updates.isSuperChatEnabled;

  const { error } = await supabase
    .from('conversations')
    .update(updateData)
    .eq('id', id);

  if (error) {
    logger.error('Error updating conversation:', error);
  }
}

export async function deleteConversation(id: string): Promise<void> {
  // getUserIdSync() is called for future use (e.g., RLS policies)
  void getUserIdSync();

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Error deleting conversation:', error);
  }
}

// Messages
export async function fetchMessages(conversationId: string): Promise<Message[]> {
  // getUserIdSync() is called for future use (e.g., RLS policies)
  void getUserIdSync();

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true });

  if (error) {
    logger.error('Error fetching messages:', error);
    return [];
  }

  return (data || []).map((msg) => {
    const mappedMessage = {
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      attachments: msg.attachments || [],
      videoTask: msg.video_task,
      wasGeneratedWithC1: msg.was_generated_with_c1,
      generationType: msg.generation_type,
      generationAttempt: msg.generation_attempt,
      generationMaxAttempts: msg.generation_max_attempts,
      isC1Streaming: msg.is_c1_streaming,
      replyTo: msg.reply_to,
    };

    // Debug log for C1 messages loaded from Supabase
    if (msg.was_generated_with_c1 && msg.role === 'assistant') {
      logger.info('Loading C1 message from Supabase:', {
        id: msg.id,
        was_generated_with_c1: msg.was_generated_with_c1,
        wasGeneratedWithC1: mappedMessage.wasGeneratedWithC1,
        contentPreview: msg.content.substring(0, 100),
      });
    }

    return mappedMessage;
  });
}

export async function createMessage(conversationId: string, message: Message): Promise<Message | null> {
  void getUserIdSync();

  // Debug log for C1 message creation
  if (message.wasGeneratedWithC1 && message.role === 'assistant') {
    logger.debug('Creating C1 message in Supabase:', {
      id: message.id,
      wasGeneratedWithC1: message.wasGeneratedWithC1,
      isC1Streaming: message.isC1Streaming,
      will_save_as: message.wasGeneratedWithC1 || false,
      contentPreview: message.content.substring(0, 100),
    });
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      id: message.id,
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      attachments: message.attachments || [],
      video_task: message.videoTask,
      was_generated_with_c1: message.wasGeneratedWithC1 || false,
      generation_type: message.generationType || 'text',
      generation_attempt: message.generationAttempt,
      generation_max_attempts: message.generationMaxAttempts,
      is_c1_streaming: message.isC1Streaming || false,
      reply_to: message.replyTo,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating message:', error);
    return null;
  }

  return {
    id: data.id,
    role: data.role,
    content: data.content,
    timestamp: new Date(data.timestamp),
    attachments: data.attachments || [],
    videoTask: data.video_task,
    wasGeneratedWithC1: data.was_generated_with_c1,
    generationType: data.generation_type,
    generationAttempt: data.generation_attempt,
    generationMaxAttempts: data.generation_max_attempts,
    isC1Streaming: data.is_c1_streaming,
    replyTo: data.reply_to,
  };
}

export async function updateMessage(id: string, updates: Partial<Message>): Promise<void> {
  // getUserIdSync() is called for future use (e.g., RLS policies)
  void getUserIdSync();

  const updateData: Record<string, any> = {};

  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.attachments !== undefined) updateData.attachments = updates.attachments;
  if (updates.videoTask !== undefined) updateData.video_task = updates.videoTask;
  if (updates.wasGeneratedWithC1 !== undefined) updateData.was_generated_with_c1 = updates.wasGeneratedWithC1;
  if (updates.generationType !== undefined) updateData.generation_type = updates.generationType;
  if (updates.generationAttempt !== undefined) updateData.generation_attempt = updates.generationAttempt;
  if (updates.generationMaxAttempts !== undefined) updateData.generation_max_attempts = updates.generationMaxAttempts;
  if (updates.isC1Streaming !== undefined) updateData.is_c1_streaming = updates.isC1Streaming;
  if (updates.replyTo !== undefined) updateData.reply_to = updates.replyTo;
  if (updates.timestamp !== undefined) updateData.timestamp = updates.timestamp;

  // Debug log for C1 message updates (only if content is being updated with <content> tags)
  if (updateData.content && updateData.content.includes('<content>')) {
    logger.debug('Updating C1 message in Supabase:', {
      id,
      updateData,
      hasWasGeneratedWithC1Field: 'was_generated_with_c1' in updateData,
      contentPreview: updateData.content.substring(0, 100),
    });
  }

  const { error } = await supabase
    .from('messages')
    .update(updateData)
    .eq('id', id);

  if (error) {
    logger.error('Error updating message:', error);
  }
}

export async function deleteMessage(id: string): Promise<void> {
  // getUserIdSync() is called for future use (e.g., RLS policies)
  void getUserIdSync();

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Error deleting message:', error);
  }
}
