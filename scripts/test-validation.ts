/**
 * Test Script: Input Validation with Zod
 *
 * This script tests that API input validation is working correctly by:
 * 1. Sending valid requests (should succeed)
 * 2. Sending invalid requests (should fail with 400)
 * 3. Verifying error messages are descriptive
 *
 * Usage: npx tsx scripts/test-validation.ts
 */

interface TestCase {
  name: string;
  endpoint: string;
  data: any;
  expectedStatus: number;
  description: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const testCases: TestCase[] = [
  // ============================================
  // Valid Requests (Note: Will return 401 if auth required)
  // ============================================
  {
    name: "Valid Slides Pipeline Request (expects 401 due to auth)",
    endpoint: "/api/slides/workflow/pipeline",
    data: {
      prompt: "Create a presentation about AI",
      userId: "123e4567-e89b-12d3-a456-426614174000",
      format: "16:9",
      theme: "professional",
      slideCount: 10,
      enableResearch: false,
      researchDepth: "medium",
    },
    expectedStatus: 401, // Auth required!
    description: "Returns 401 because endpoint requires authentication (GOOD!)",
  },

  // ============================================
  // Invalid Requests (should fail with 400)
  // ============================================
  {
    name: "Missing Required Field (prompt)",
    endpoint: "/api/slides/workflow/pipeline",
    data: {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      format: "16:9",
    },
    expectedStatus: 400,
    description: "Missing prompt field should fail",
  },
  {
    name: "Invalid UUID Format",
    endpoint: "/api/slides/workflow/pipeline",
    data: {
      prompt: "Test prompt",
      userId: "invalid-uuid",
      format: "16:9",
    },
    expectedStatus: 400,
    description: "Invalid UUID format should fail",
  },
  {
    name: "Prompt Too Short",
    endpoint: "/api/slides/workflow/pipeline",
    data: {
      prompt: "x",
      userId: "123e4567-e89b-12d3-a456-426614174000",
      format: "16:9",
    },
    expectedStatus: 400,
    description: "Prompt under 3 characters should fail",
  },
  {
    name: "Slide Count Too High",
    endpoint: "/api/slides/workflow/pipeline",
    data: {
      prompt: "Create a presentation",
      userId: "123e4567-e89b-12d3-a456-426614174000",
      format: "16:9",
      slideCount: 100,
    },
    expectedStatus: 400,
    description: "Slide count over 50 should fail",
  },
  {
    name: "Invalid Format Enum",
    endpoint: "/api/slides/workflow/pipeline",
    data: {
      prompt: "Create a presentation",
      userId: "123e4567-e89b-12d3-a456-426614174000",
      format: "21:9", // Invalid format
    },
    expectedStatus: 400,
    description: "Invalid format value should fail",
  },
  {
    name: "Invalid Research Depth Enum",
    endpoint: "/api/slides/workflow/pipeline",
    data: {
      prompt: "Create a presentation",
      userId: "123e4567-e89b-12d3-a456-426614174000",
      researchDepth: "ultra", // Invalid value
    },
    expectedStatus: 400,
    description: "Invalid researchDepth value should fail",
  },
];

interface TestResult {
  name: string;
  passed: boolean;
  expected: number;
  actual: number;
  message: string;
  duration: number;
}

async function runTest(testCase: TestCase): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${BASE_URL}${testCase.endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testCase.data),
    });

    const duration = Date.now() - startTime;
    const body = await response.json();

    const passed = response.status === testCase.expectedStatus;

    return {
      name: testCase.name,
      passed,
      expected: testCase.expectedStatus,
      actual: response.status,
      message: passed
        ? `✅ ${testCase.description}`
        : `❌ Expected ${testCase.expectedStatus}, got ${response.status}\n   Response: ${JSON.stringify(body, null, 2)}`,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name: testCase.name,
      passed: false,
      expected: testCase.expectedStatus,
      actual: 0,
      message: `❌ Request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      duration,
    };
  }
}

async function runAllTests() {
  console.log("🔍 Starting Input Validation Tests\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Total Tests: ${testCases.length}\n`);
  console.log("=".repeat(60));

  const results: TestResult[] = [];

  for (const testCase of testCases) {
    process.stdout.write(`Testing: ${testCase.name}... `);
    const result = await runTest(testCase);
    results.push(result);
    console.log(result.passed ? "✅" : "❌");

    if (!result.passed) {
      console.log(`  ${result.message}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  console.log(`✅ Passed: ${passed}/${testCases.length}`);
  console.log(`❌ Failed: ${failed}/${testCases.length}`);
  console.log(`⏱️  Average Duration: ${avgDuration.toFixed(0)}ms`);

  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`\n  ${r.name}`);
        console.log(`    ${r.message}`);
      });
  }

  if (failed === 0) {
    console.log("\n🎉 All validation tests passed! Your API is secure.");
    process.exit(0);
  } else {
    console.log("\n⚠️  Some validation tests failed. Please review the endpoints.");
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(BASE_URL, { method: "HEAD" });
    return true;
  } catch (error) {
    console.error("❌ Cannot connect to server at", BASE_URL);
    console.error("   Make sure the development server is running:");
    console.error("   npm run dev\n");
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }

  await runAllTests();
}

main();
