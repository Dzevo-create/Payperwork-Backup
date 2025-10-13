-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Conversations Table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'Neue Konversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT NOT NULL DEFAULT 'anonymous', -- Simple user identification
  is_pinned BOOLEAN DEFAULT FALSE
);

-- Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attachments JSONB DEFAULT '[]'::jsonb,
  video_task JSONB,
  was_generated_with_c1 BOOLEAN DEFAULT FALSE,
  generation_type TEXT DEFAULT 'text' CHECK (generation_type IN ('image', 'video', 'text')),
  generation_attempt INTEGER,
  generation_max_attempts INTEGER,
  is_c1_streaming BOOLEAN DEFAULT FALSE,
  reply_to JSONB
);

-- Library Items Table
CREATE TABLE library_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  prompt TEXT,
  model TEXT,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seen BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id TEXT NOT NULL DEFAULT 'anonymous'
);

-- Indexes for better performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_messages_was_generated_with_c1 ON messages(was_generated_with_c1);
CREATE INDEX idx_messages_generation_type ON messages(generation_type);
CREATE INDEX idx_library_items_user_id ON library_items(user_id);
CREATE INDEX idx_library_items_created_at ON library_items(created_at DESC);
CREATE INDEX idx_library_items_conversation_id ON library_items(conversation_id);

-- Updated_at trigger for conversations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Simple version without auth
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict later)
CREATE POLICY "Allow all for conversations" ON conversations FOR ALL USING (true);
CREATE POLICY "Allow all for messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all for library_items" ON library_items FOR ALL USING (true);

-- Comments to document the fields
COMMENT ON COLUMN messages.was_generated_with_c1 IS 'True if message was created with Super Chat (C1) enabled';
COMMENT ON COLUMN messages.generation_type IS 'Type of generation: image, video, or text';
COMMENT ON COLUMN messages.generation_attempt IS 'Current attempt number for retries';
COMMENT ON COLUMN messages.generation_max_attempts IS 'Maximum number of retry attempts';
COMMENT ON COLUMN messages.is_c1_streaming IS 'True if C1 response is still being buffered';
COMMENT ON COLUMN messages.reply_to IS 'JSONB object containing messageId and content of the message being replied to';
