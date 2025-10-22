/**
 * Test Script: Rate Limiting
 *
 * This script tests that API rate limiting is working correctly by:
 * 1. Sending requests up to the limit (should succeed)
 * 2. Sending requests over the limit (should get 429)
 * 3. Verifying rate limit headers are present
 *
 * Usage: npx tsx scripts/test-rate-limit.ts
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface RateLimitTest {
  name: string;
  endpoint: string;
  limit: number;
  window: string;
  sampleData: any;
}

const rateLimitTests: RateLimitTest[] = [
  {
    name: "Slides Generation API",
    endpoint: "/api/slides/workflow/pipeline",
    limit: 20, // 20 requests per minute
    window: "1m",
    sampleData: {
      prompt: "Test presentation for rate limit testing",
      userId: "123e4567-e89b-12d3-a456-426614174000",
      format: "16:9",
      slideCount: 5,
    },
  },
];

interface RequestResult {
  index: number;
  status: number;
  headers: {
    rateLimitLimit?: string;
    rateLimitRemaining?: string;
    rateLimitReset?: string;
    retryAfter?: string;
  };
  duration: number;
}

async function sendRequest(endpoint: string, data: any, index: number): Promise<RequestResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const duration = Date.now() - startTime;

    return {
      index,
      status: response.status,
      headers: {
        rateLimitLimit: response.headers.get("X-RateLimit-Limit") || undefined,
        rateLimitRemaining: response.headers.get("X-RateLimit-Remaining") || undefined,
        rateLimitReset: response.headers.get("X-RateLimit-Reset") || undefined,
        retryAfter: response.headers.get("Retry-After") || undefined,
      },
      duration,
    };
  } catch (error) {
    return {
      index,
      status: 0,
      headers: {},
      duration: Date.now() - startTime,
    };
  }
}

async function testRateLimit(test: RateLimitTest) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${test.name}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Endpoint: ${test.endpoint}`);
  console.log(`Rate Limit: ${test.limit} requests per ${test.window}`);
  console.log(`\nSending ${test.limit + 5} requests...\n`);

  const results: RequestResult[] = [];

  // Send requests one by one to track individual responses
  for (let i = 1; i <= test.limit + 5; i++) {
    process.stdout.write(`Request ${i}/${test.limit + 5}... `);

    const result = await sendRequest(test.endpoint, test.sampleData, i);
    results.push(result);

    // Color code the response
    if (result.status === 200 || result.status === 201) {
      console.log(`✅ ${result.status} (${result.duration}ms)`);
    } else if (result.status === 429) {
      console.log(`🚫 ${result.status} - Rate Limited (${result.duration}ms)`);
      if (result.headers.retryAfter) {
        console.log(`   Retry after: ${result.headers.retryAfter}s`);
      }
    } else {
      console.log(`⚠️  ${result.status} (${result.duration}ms)`);
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Analysis
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Results Analysis");
  console.log(`${"=".repeat(60)}`);

  const successCount = results.filter((r) => r.status === 200 || r.status === 201).length;
  const rateLimitedCount = results.filter((r) => r.status === 429).length;
  const otherCount = results.filter(
    (r) => r.status !== 200 && r.status !== 201 && r.status !== 429
  ).length;

  console.log(`✅ Successful requests: ${successCount}`);
  console.log(`🚫 Rate limited (429): ${rateLimitedCount}`);
  console.log(`⚠️  Other status codes: ${otherCount}`);

  // Check rate limit headers
  const firstResult = results[0];
  if (firstResult.headers.rateLimitLimit) {
    console.log(`\n📋 Rate Limit Headers (from first request):`);
    console.log(`   X-RateLimit-Limit: ${firstResult.headers.rateLimitLimit}`);
    console.log(`   X-RateLimit-Remaining: ${firstResult.headers.rateLimitRemaining}`);
    console.log(`   X-RateLimit-Reset: ${firstResult.headers.rateLimitReset}`);
  } else {
    console.log(`\n⚠️  No rate limit headers found in response`);
  }

  // Validation
  console.log(`\n${"=".repeat(60)}`);
  console.log("✅ Validation");
  console.log(`${"=".repeat(60)}`);

  const passed: string[] = [];
  const failed: string[] = [];

  // Test 1: Should get some successful requests
  if (successCount > 0) {
    passed.push(`✅ Received ${successCount} successful responses`);
  } else {
    failed.push(`❌ No successful responses (expected some)`);
  }

  // Test 2: Should get rate limited after limit
  if (rateLimitedCount > 0) {
    passed.push(`✅ Rate limiting activated after ${successCount} requests`);
  } else {
    failed.push(`❌ No rate limiting detected (expected 429 responses)`);
  }

  // Test 3: Rate limit should kick in around the limit
  if (successCount >= test.limit - 2 && successCount <= test.limit + 2) {
    passed.push(`✅ Rate limit threshold correct (~${test.limit} requests)`);
  } else {
    failed.push(
      `⚠️  Rate limit threshold seems off (got ${successCount}, expected ~${test.limit})`
    );
  }

  // Test 4: Headers should be present
  if (firstResult.headers.rateLimitLimit) {
    passed.push(`✅ Rate limit headers present`);
  } else {
    failed.push(`⚠️  Rate limit headers missing`);
  }

  passed.forEach((msg) => console.log(msg));
  failed.forEach((msg) => console.log(msg));

  return {
    passed: failed.length === 0,
    successCount,
    rateLimitedCount,
  };
}

async function main() {
  console.log("🚦 Starting Rate Limit Tests\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Total Tests: ${rateLimitTests.length}`);

  // Check if server is running
  try {
    await fetch(BASE_URL, { method: "HEAD" });
  } catch (error) {
    console.error("\n❌ Cannot connect to server at", BASE_URL);
    console.error("   Make sure the development server is running:");
    console.error("   npm run dev\n");
    process.exit(1);
  }

  const results: any[] = [];

  for (const test of rateLimitTests) {
    const result = await testRateLimit(test);
    results.push(result);
  }

  // Final summary
  console.log(`\n\n${"=".repeat(60)}`);
  console.log("🏁 Final Summary");
  console.log(`${"=".repeat(60)}`);

  const allPassed = results.every((r) => r.passed);

  if (allPassed) {
    console.log("🎉 All rate limit tests passed!");
    console.log("✅ Rate limiting is working correctly\n");
    process.exit(0);
  } else {
    console.log("⚠️  Some rate limit tests had issues");
    console.log("   Review the results above for details\n");
    process.exit(1);
  }
}

main();
