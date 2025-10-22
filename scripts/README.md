# Test Scripts

This folder contains test scripts for verifying production-ready features.

## Available Scripts

### 1. RLS (Row Level Security) Test

Tests that users can only access their own data.

```bash
npx tsx scripts/test-rls.ts
```

**What it tests:**

- Creates 2 test users
- Creates data for each user
- Verifies User 1 cannot see User 2's data
- Tests `conversations` and `library_items` tables

**Expected output:**

```
✅ Passed: 2
✅ All RLS tests passed! Your database is secure.
```

---

### 2. Input Validation Test

Tests that API endpoints reject invalid input.

```bash
npx tsx scripts/test-validation.ts
```

**What it tests:**

- Valid requests (should succeed)
- Invalid UUIDs (should fail with 400)
- Too short/long inputs (should fail with 400)
- Invalid enum values (should fail with 400)
- Missing required fields (should fail with 400)

**Expected output:**

```
✅ Passed: 7/7
🎉 All validation tests passed! Your API is secure.
```

---

### 3. Rate Limiting Test

Tests that API endpoints enforce rate limits.

```bash
npx tsx scripts/test-rate-limit.ts
```

**What it tests:**

- Sends requests up to the limit (should succeed)
- Sends requests over the limit (should get 429)
- Verifies rate limit headers are present
- Tests `/api/slides/workflow/pipeline` (20 req/min)

**Expected output:**

```
✅ Successful requests: 20
🚫 Rate limited (429): 5
🎉 All rate limit tests passed!
```

---

## Prerequisites

### For all tests:

```bash
npm install tsx --save-dev
```

### For RLS test:

- Supabase project with tables created
- Environment variables set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### For Validation & Rate Limit tests:

- Development server running (`npm run dev`)
- Server accessible at `http://localhost:3000`

---

## Running All Tests

```bash
# Run RLS test
npx tsx scripts/test-rls.ts

# Run validation test
npx tsx scripts/test-validation.ts

# Run rate limit test
npx tsx scripts/test-rate-limit.ts
```

---

## CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Build application
        run: npm run build

      - name: Start dev server
        run: npm run dev &

      - name: Wait for server
        run: sleep 10

      - name: Run validation tests
        run: npx tsx scripts/test-validation.ts

      - name: Run rate limit tests
        run: npx tsx scripts/test-rate-limit.ts

      - name: Run RLS tests
        run: npx tsx scripts/test-rls.ts
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

---

## Troubleshooting

### "Cannot connect to server"

**Solution**: Make sure the development server is running:

```bash
npm run dev
```

### "Missing environment variables"

**Solution**: Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### "RLS test failed"

**Possible causes:**

1. RLS not enabled on tables
2. Policies not created
3. User context not set correctly

**Solution**: Run the RLS migration:

```bash
# In Supabase SQL Editor
# Execute: supabase/migrations/008_enable_proper_rls.sql
```

### "Rate limit test passed but no 429 responses"

**Possible causes:**

1. Rate limiting not implemented on endpoint
2. Rate limit window hasn't expired from previous test
3. In-memory rate limiter was cleared

**Solution**: Wait 1 minute and run again

---

## Adding New Tests

### Create a new test file

```typescript
// scripts/test-my-feature.ts
async function testMyFeature() {
  console.log("🧪 Testing: My Feature");

  // Your test logic here

  if (testPassed) {
    console.log("✅ Test passed!");
    process.exit(0);
  } else {
    console.log("❌ Test failed!");
    process.exit(1);
  }
}

testMyFeature();
```

### Run it

```bash
npx tsx scripts/test-my-feature.ts
```

---

**Last Updated**: 2025-10-22
