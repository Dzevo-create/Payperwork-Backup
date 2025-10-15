/**
 * Script to disable RLS on sketch_to_render table
 * Run with: npx tsx scripts/disable-rls.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

console.log('🔧 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function disableRLS() {
  try {
    console.log('📝 Disabling RLS on sketch_to_render table...');

    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE sketch_to_render DISABLE ROW LEVEL SECURITY;'
    });

    if (error) {
      console.error('❌ Error:', error);
      console.log('\n📋 Alternative: Run this SQL in Supabase Dashboard SQL Editor:');
      console.log('ALTER TABLE sketch_to_render DISABLE ROW LEVEL SECURITY;');
      process.exit(1);
    }

    console.log('✅ RLS disabled successfully!');
    console.log('📝 Database persistence should now work.');
    console.log('🔄 Try reloading your app and generating a new image.');
  } catch (err: any) {
    console.error('❌ Unexpected error:', err.message);
    console.log('\n📋 Manual solution: Run this SQL in Supabase Dashboard SQL Editor:');
    console.log('ALTER TABLE sketch_to_render DISABLE ROW LEVEL SECURITY;');
    process.exit(1);
  }
}

disableRLS();
