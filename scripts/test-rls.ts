/**
 * Test Script: Row Level Security (RLS)
 *
 * This script tests that RLS policies are working correctly by:
 * 1. Creating/signing in as two different users
 * 2. Creating data for each user
 * 3. Verifying each user can only see their own data
 *
 * Usage: npx tsx scripts/test-rls.ts
 */

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", SUPABASE_URL ? "✓" : "✗");
  console.error("   NEXT_PUBLIC_SUPABASE_ANON_KEY:", SUPABASE_ANON_KEY ? "✓" : "✗");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test users
const testUsers = [
  {
    email: "testuser1@payperwork-rls-test.com",
    password: "TestPassword123!",
    name: "Test User 1",
  },
  {
    email: "testuser2@payperwork-rls-test.com",
    password: "TestPassword123!",
    name: "Test User 2",
  },
];

interface TestResult {
  passed: boolean;
  message: string;
}

async function signUpOrSignIn(email: string, password: string): Promise<string | null> {
  // Try to sign in first
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInData?.user) {
    console.log(`   ✓ Signed in as ${email}`);
    return signInData.user.id;
  }

  // If sign in fails, try to sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpData?.user) {
    console.log(`   ✓ Created and signed in as ${email}`);
    return signUpData.user.id;
  }

  console.error(`   ✗ Failed to sign in/up: ${signInError?.message || signUpError?.message}`);
  return null;
}

async function testConversationsTable(): Promise<TestResult> {
  console.log("\n📋 Testing: conversations table");

  // Sign in as User 1
  const user1Id = await signUpOrSignIn(testUsers[0].email, testUsers[0].password);
  if (!user1Id) {
    return { passed: false, message: "Failed to authenticate User 1" };
  }

  // Create conversation for User 1
  const { data: conv1, error: conv1Error } = await supabase
    .from("conversations")
    .insert({ user_id: user1Id, title: "User 1 Conversation" })
    .select()
    .single();

  if (conv1Error) {
    return { passed: false, message: `Failed to create conversation: ${conv1Error.message}` };
  }
  console.log(`   ✓ Created conversation for User 1`);

  // Fetch conversations for User 1
  const { data: user1Convs, error: user1Error } = await supabase.from("conversations").select("*");

  if (user1Error) {
    return {
      passed: false,
      message: `Failed to fetch User 1 conversations: ${user1Error.message}`,
    };
  }

  console.log(`   ✓ User 1 can see ${user1Convs?.length || 0} conversations`);

  // Sign out User 1
  await supabase.auth.signOut();

  // Sign in as User 2
  const user2Id = await signUpOrSignIn(testUsers[1].email, testUsers[1].password);
  if (!user2Id) {
    return { passed: false, message: "Failed to authenticate User 2" };
  }

  // Fetch conversations for User 2
  const { data: user2Convs, error: user2Error } = await supabase.from("conversations").select("*");

  if (user2Error) {
    return {
      passed: false,
      message: `Failed to fetch User 2 conversations: ${user2Error.message}`,
    };
  }

  console.log(`   ✓ User 2 can see ${user2Convs?.length || 0} conversations`);

  // Verify RLS: User 2 should NOT see User 1's conversation
  const user2SeesUser1Conv = user2Convs?.some((conv) => conv.id === conv1.id);

  if (user2SeesUser1Conv) {
    return {
      passed: false,
      message: "❌ RLS FAILED: User 2 can see User 1's conversations!",
    };
  }

  // Clean up - delete test conversation
  await supabase.auth.signOut();
  await signUpOrSignIn(testUsers[0].email, testUsers[0].password);
  await supabase.from("conversations").delete().eq("id", conv1.id);
  await supabase.auth.signOut();

  return {
    passed: true,
    message: "✅ RLS WORKING: Users are properly isolated",
  };
}

async function testLibraryItemsTable(): Promise<TestResult> {
  console.log("\n📚 Testing: library_items table");

  // Sign in as User 1
  const user1Id = await signUpOrSignIn(testUsers[0].email, testUsers[0].password);
  if (!user1Id) {
    return { passed: false, message: "Failed to authenticate User 1" };
  }

  // Create library item for User 1
  const { data: item1, error: item1Error } = await supabase
    .from("library_items")
    .insert({
      user_id: user1Id,
      type: "image",
      title: "User 1 Image",
      url: "https://example.com/image1.jpg",
    })
    .select()
    .single();

  if (item1Error) {
    return { passed: false, message: `Failed to create library item: ${item1Error.message}` };
  }
  console.log(`   ✓ Created library item for User 1`);

  // Fetch library items for User 1
  const { data: user1Items } = await supabase.from("library_items").select("*");
  console.log(`   ✓ User 1 can see ${user1Items?.length || 0} library items`);

  // Sign out User 1
  await supabase.auth.signOut();

  // Sign in as User 2
  const user2Id = await signUpOrSignIn(testUsers[1].email, testUsers[1].password);
  if (!user2Id) {
    return { passed: false, message: "Failed to authenticate User 2" };
  }

  // Fetch library items for User 2
  const { data: user2Items } = await supabase.from("library_items").select("*");
  console.log(`   ✓ User 2 can see ${user2Items?.length || 0} library items`);

  // Verify RLS: User 2 should NOT see User 1's library item
  const user2SeesUser1Item = user2Items?.some((item) => item.id === item1.id);

  if (user2SeesUser1Item) {
    return {
      passed: false,
      message: "❌ RLS FAILED: User 2 can see User 1's library items!",
    };
  }

  // Clean up
  await supabase.auth.signOut();
  await signUpOrSignIn(testUsers[0].email, testUsers[0].password);
  await supabase.from("library_items").delete().eq("id", item1.id);
  await supabase.auth.signOut();

  return {
    passed: true,
    message: "✅ RLS WORKING: Users are properly isolated",
  };
}

async function runTests() {
  console.log("🔐 Starting RLS (Row Level Security) Tests\n");
  console.log("Environment:");
  console.log(`  Supabase URL: ${SUPABASE_URL}`);
  console.log(`  Test Users: ${testUsers.length}\n`);

  const results: TestResult[] = [];

  try {
    // Test 1: Conversations table
    const conversationsResult = await testConversationsTable();
    results.push(conversationsResult);
    console.log(`   ${conversationsResult.message}`);

    // Test 2: Library items table
    const libraryResult = await testLibraryItemsTable();
    results.push(libraryResult);
    console.log(`   ${libraryResult.message}`);

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Test Summary");
    console.log("=".repeat(50));

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed === 0) {
      console.log("\n🎉 All RLS tests passed! Your database is secure.");
      process.exit(0);
    } else {
      console.log("\n⚠️  Some RLS tests failed. Please review the policies.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Test execution failed:", error);
    process.exit(1);
  }
}

// Run tests
runTests();
