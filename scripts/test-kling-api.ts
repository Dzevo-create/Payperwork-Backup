/**
 * Test script to verify Kling API credentials and connectivity
 * Run with: npx ts-node scripts/test-kling-api.ts
 */

import jwt from "jsonwebtoken";

// Load environment variables
const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY || "AeKgGeHDFEGK949TFne89h3kTaeB4TKF";
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY || "8PffQJLYM43mg3gfgDACDakdg8LfGbFF";
const KLING_API_URL = process.env.KLING_API_URL || "https://api-singapore.klingai.com";

/**
 * Generate JWT Bearer token
 */
function generateBearerToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 1800; // 30 minutes

  const payload = {
    iss: KLING_ACCESS_KEY,
    exp: expiresAt,
    nbf: now - 5,
  };

  const token = jwt.sign(payload, KLING_SECRET_KEY, {
    algorithm: "HS256",
    header: {
      alg: "HS256",
      typ: "JWT",
    },
  });

  return token;
}

/**
 * Test Kling API connection with a simple text2video request
 */
async function testKlingAPI() {
  console.log("🔧 Testing Kling API Connection");
  console.log("================================\n");

  // Step 1: Check credentials
  console.log("📋 Credentials Check:");
  console.log(`   Access Key: ${KLING_ACCESS_KEY ? '✅ Present' : '❌ Missing'}`);
  console.log(`   Secret Key: ${KLING_SECRET_KEY ? '✅ Present' : '❌ Missing'}`);
  console.log(`   API URL: ${KLING_API_URL}\n`);

  if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
    console.error("❌ Missing required credentials. Please check your .env.local file.");
    process.exit(1);
  }

  // Step 2: Generate JWT token
  console.log("🔑 Generating JWT Token...");
  try {
    const token = generateBearerToken();
    console.log(`✅ JWT Token generated successfully (length: ${token.length})`);
    console.log(`   Token preview: ${token.substring(0, 50)}...\n`);
  } catch (error) {
    console.error("❌ JWT Token generation failed:", error);
    process.exit(1);
  }

  // Step 3: Test API endpoint with a minimal request
  console.log("🌐 Testing API Endpoint...");
  console.log(`   Endpoint: ${KLING_API_URL}/v1/videos/text2video\n`);

  const token = generateBearerToken();
  const testPayload = {
    prompt: "A beautiful sunset over the ocean",
    duration: "5",
    aspect_ratio: "16:9",
    mode: "std",
    cfg_scale: 0.5,
  };

  console.log("📤 Sending test request...");
  console.log("   Payload:", JSON.stringify(testPayload, null, 2));

  try {
    const response = await fetch(`${KLING_API_URL}/v1/videos/text2video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(testPayload),
    });

    const data = await response.json();

    console.log("\n📥 Response received:");
    console.log(`   HTTP Status: ${response.status} ${response.statusText}`);
    console.log(`   Response Code: ${data.code}`);
    console.log(`   Response Message: ${data.message || 'N/A'}`);
    console.log(`   Full Response:`, JSON.stringify(data, null, 2));

    if (response.ok && data.code === 0) {
      console.log("\n✅ SUCCESS! Kling API is working correctly.");
      console.log(`   Task ID: ${data.data?.task_id || 'N/A'}`);

      // Test status check with the created task ID
      if (data.data?.task_id) {
        console.log("\n🔍 Testing status check...");
        await testStatusCheck(data.data.task_id);
      }
    } else {
      console.log("\n❌ API request failed.");
      console.log("   This could be due to:");
      console.log("   - Invalid credentials");
      console.log("   - API endpoint changes");
      console.log("   - Rate limiting");
      console.log("   - Account issues");
    }
  } catch (error) {
    console.error("\n❌ Request failed with error:");
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack}`);
      }
    } else {
      console.error(`   Error:`, error);
    }
  }
}

/**
 * Test status check endpoint
 */
async function testStatusCheck(taskId: string) {
  const token = generateBearerToken();
  const endpoint = `${KLING_API_URL}/v1/videos/text2video/${taskId}`;

  console.log(`   Endpoint: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    console.log(`   HTTP Status: ${response.status} ${response.statusText}`);
    console.log(`   Response Code: ${data.code}`);
    console.log(`   Task Status: ${data.data?.task_status || 'N/A'}`);

    if (response.ok && data.code === 0) {
      console.log("✅ Status check successful!");
    } else {
      console.log("❌ Status check failed.");
    }
  } catch (error) {
    console.error("❌ Status check error:", error);
  }
}

// Run the test
testKlingAPI().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});
