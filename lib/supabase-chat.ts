import { supabase } from './supabase';
import { Message, Conversation } from '@/types/chat';

// Get user ID from localStorage or generate new one
const getUserId = () => {
  if (typeof window === 'undefined') return 'anonymous';

  let userId = localStorage.getItem('payperwork_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('payperwork_user_id', userId);
  }
  return userId;
};

// Conversations
export async function fetchConversations(): Promise<Conversation[]> {
  const userId = getUserId();

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  // Fetch messages for each conversation
  const conversationsWithMessages = await Promise.all(
    (data || []).map(async (conv) => {
      const messages = await fetchMessages(conv.id);
      return {
        id: conv.id,
        title: conv.title,
        messages,
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
        isPinned: conv.is_pinned,
      };
    })
  );

  return conversationsWithMessages;
}

export async function createConversation(conversation: Conversation): Promise<Conversation | null> {
  const userId = getUserId();

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      id: conversation.id,
      title: conversation.title,
      user_id: userId,
      is_pinned: conversation.isPinned || false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', {
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
  };
}

export async function updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
  const updateData: any = {};

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.isPinned !== undefined) updateData.is_pinned = updates.isPinned;

  const { error } = await supabase
    .from('conversations')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating conversation:', error);
  }
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting conversation:', error);
  }
}

// Messages
export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return (data || []).map((msg) => ({
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
  }));
}

export async function createMessage(conversationId: string, message: Message): Promise<Message | null> {
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
    console.error('Error creating message:', error);
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
  const updateData: any = {};

  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.attachments !== undefined) updateData.attachments = updates.attachments;
  if (updates.videoTask !== undefined) updateData.video_task = updates.videoTask;
  if (updates.wasGeneratedWithC1 !== undefined) updateData.was_generated_with_c1 = updates.wasGeneratedWithC1;
  if (updates.generationType !== undefined) updateData.generation_type = updates.generationType;
  if (updates.generationAttempt !== undefined) updateData.generation_attempt = updates.generationAttempt;
  if (updates.generationMaxAttempts !== undefined) updateData.generation_max_attempts = updates.generationMaxAttempts;
  if (updates.isC1Streaming !== undefined) updateData.is_c1_streaming = updates.isC1Streaming;
  if (updates.replyTo !== undefined) updateData.reply_to = updates.replyTo;

  const { error } = await supabase
    .from('messages')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating message:', error);
  }
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting message:', error);
  }
}
