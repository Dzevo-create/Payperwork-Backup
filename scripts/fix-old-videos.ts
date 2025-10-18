/**
 * Migration Script: Fix Old Video Messages
 *
 * This script finds all messages with empty video URLs and attempts to:
 * 1. Find the corresponding video in the library (by messageId)
 * 2. Update the message with the correct video URL
 * 3. Set the videoTask status to "succeed"
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface Message {
  id: string;
  content: string;
  attachments: Array<{ type: string; url: string; name: string }>;
  video_task: any;
}

interface LibraryItem {
  id: string;
  message_id: string;
  url: string;
  type: string;
}

async function fixOldVideos() {
  console.log('🔍 Starting migration: Fix old video messages...\n');

  // 1. Find all messages with video attachments that have empty URLs
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .not('attachments', 'is', null);

  if (messagesError) {
    console.error('❌ Error fetching messages:', messagesError);
    return;
  }

  console.log(`📊 Found ${messages?.length || 0} messages with attachments`);

  // Filter messages with empty video URLs
  const brokenVideoMessages = (messages || []).filter((msg: Message) => {
    const videoAttachments = (msg.attachments || []).filter(
      (att) => att.type === 'video' && (!att.url || att.url === '')
    );
    return videoAttachments.length > 0;
  });

  console.log(`🔧 Found ${brokenVideoMessages.length} messages with empty video URLs\n`);

  if (brokenVideoMessages.length === 0) {
    console.log('✅ No broken videos found. All videos have URLs!');
    return;
  }

  // 2. For each broken message, find the video in the library
  let fixedCount = 0;
  let notFoundCount = 0;

  for (const message of brokenVideoMessages) {
    console.log(`\n📝 Processing message ${message.id}...`);

    // Find video in library by message_id
    const { data: libraryItems, error: libraryError } = await supabase
      .from('library_items')
      .select('*')
      .eq('message_id', message.id)
      .eq('type', 'video')
      .limit(1);

    if (libraryError) {
      console.error(`   ❌ Error fetching library for message ${message.id}:`, libraryError);
      continue;
    }

    if (!libraryItems || libraryItems.length === 0) {
      console.log(`   ⚠️  No video found in library for message ${message.id}`);
      notFoundCount++;
      continue;
    }

    const libraryVideo = libraryItems[0] as LibraryItem;
    console.log(`   ✅ Found video in library: ${libraryVideo.url.substring(0, 50)}...`);

    // 3. Update the message with the correct video URL
    const updatedAttachments = (message.attachments || []).map((att: any) => {
      if (att.type === 'video') {
        return {
          ...att,
          url: libraryVideo.url,
        };
      }
      return att;
    });

    const updatedVideoTask = {
      ...(message.video_task || {}),
      status: 'succeed',
      progress: 100,
    };

    const { error: updateError } = await supabase
      .from('messages')
      .update({
        attachments: updatedAttachments,
        video_task: updatedVideoTask,
      })
      .eq('id', message.id);

    if (updateError) {
      console.error(`   ❌ Error updating message ${message.id}:`, updateError);
      continue;
    }

    console.log(`   ✅ Updated message ${message.id} with video URL`);
    fixedCount++;
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Fixed: ${fixedCount} messages`);
  console.log(`   ⚠️  Not found in library: ${notFoundCount} messages`);
  console.log(`   📝 Total processed: ${brokenVideoMessages.length} messages`);
  console.log('='.repeat(50));
}

// Run the migration
fixOldVideos()
  .then(() => {
    console.log('\n✅ Migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
