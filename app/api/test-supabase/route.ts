import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { apiRateLimiter, getClientId } from "@/lib/rate-limit";
import { validateApiKeys } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";
import { apiLogger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const clientId = getClientId(req);

  try {
    // API Key validation
    const keyValidation = validateApiKeys(['supabase']);
    if (!keyValidation.valid) {
      return keyValidation.errorResponse!;
    }

    // Rate limiting
    const rateLimitResult = apiRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    apiLogger.debug('🧪 Testing Supabase connection...');

    // Test 1: Check tables exist
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('count')
      .limit(1);

    if (convError) {
      return NextResponse.json({
        success: false,
        error: 'Conversations table error',
        details: convError.message,
      }, { status: 500 });
    }

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('count')
      .limit(1);

    if (msgError) {
      return NextResponse.json({
        success: false,
        error: 'Messages table error',
        details: msgError.message,
      }, { status: 500 });
    }

    const { data: library, error: libError } = await supabase
      .from('library_items')
      .select('count')
      .limit(1);

    if (libError) {
      return NextResponse.json({
        success: false,
        error: 'Library_items table error',
        details: libError.message,
      }, { status: 500 });
    }

    // Test 2: Check storage buckets (use admin client)
    const { data: buckets, error: bucketsError } = await supabaseAdmin
      .storage
      .listBuckets();

    if (bucketsError) {
      return NextResponse.json({
        success: false,
        error: 'Storage buckets error',
        details: bucketsError.message,
      }, { status: 500 });
    }

    const imagesBucket = buckets?.find(b => b.name === 'images');
    const videosBucket = buckets?.find(b => b.name === 'videos');

    // Success response
    return NextResponse.json({
      success: true,
      message: '✅ Supabase connection successful!',
      checks: {
        conversations_table: '✅ OK',
        messages_table: '✅ OK',
        library_items_table: '✅ OK',
        images_bucket: imagesBucket ? '✅ OK' : '❌ Missing',
        videos_bucket: videosBucket ? '✅ OK' : '❌ Missing',
      },
      buckets: buckets?.map(b => b.name),
    });

  } catch (error) {
    return handleApiError(error, 'test-supabase-api');
  }
}
