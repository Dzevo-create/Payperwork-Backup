# Migration Example: Using Type-Safe Environment Variables

## Overview

This guide shows how to migrate existing code from direct `process.env` access to the new type-safe environment validation system.

## Example 1: API Route with API Key Validation

### Before (Old Pattern)

```typescript
// app/api/generate-runway-video/route.ts
import { NextRequest, NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

if (!RUNWAY_API_KEY) {
  apiLogger.error('RUNWAY_API_KEY is not set');
}

export async function POST(req: NextRequest) {
  if (!RUNWAY_API_KEY) {
    return NextResponse.json(
      { error: "Runway API key not configured" },
      { status: 500 }
    );
  }

  const client = new RunwayML({ apiKey: RUNWAY_API_KEY });
  // ... rest of the code
}
```

**Issues:**
- ❌ Manual null checks scattered throughout code
- ❌ Error only discovered at runtime
- ❌ No type safety
- ❌ Inconsistent error messages

### After (New Pattern)

```typescript
// app/api/generate-runway-video/route.ts
import { NextRequest, NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";
import { getRequiredEnv } from "@/lib/validateEnv";

export async function POST(req: NextRequest) {
  // No need for manual checks - validation happens at startup
  // If we reach here, we know the key exists
  const client = new RunwayML({
    apiKey: getRequiredEnv('RUNWAY_API_KEY')
  });
  // ... rest of the code
}
```

**Benefits:**
- ✅ Validation at startup (fail-fast)
- ✅ Type-safe access
- ✅ Less boilerplate
- ✅ Cleaner code

## Example 2: OpenAI Integration

### Before

```typescript
// app/api/chat/route.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      // ...
    });
    // ...
  } catch (error) {
    // ...
  }
}
```

### After

```typescript
// app/api/chat/route.ts
import OpenAI from 'openai';
import { getRequiredEnv } from '@/lib/validateEnv';

const openai = new OpenAI({
  apiKey: getRequiredEnv('OPENAI_API_KEY'),
});

export async function POST(req: Request) {
  try {
    // No need for manual API key checks
    const completion = await openai.chat.completions.create({
      // ...
    });
    // ...
  } catch (error) {
    // ...
  }
}
```

## Example 3: Supabase Client Initialization

### Before

```typescript
// lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Using ! (non-null assertion) is risky - no validation
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

**Issues:**
- ❌ Non-null assertions (`!`) bypass TypeScript safety
- ❌ No validation that URLs are correct
- ❌ Silent failures if env vars are wrong

### After

```typescript
// lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';
import { getRequiredEnv } from './validateEnv';

// Type-safe, validated at startup
export const supabaseAdmin = createClient(
  getRequiredEnv('SUPABASE_URL'),
  getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
);
```

**Benefits:**
- ✅ Validated URL format
- ✅ Consistency checks (server vs client URLs)
- ✅ No unsafe assertions
- ✅ Clear error messages if misconfigured

## Example 4: Optional Environment Variables

### Before

```typescript
// lib/video/config/videoConfig.ts
export const VIDEO_PROVIDERS = {
  kling: {
    accessKey: process.env.KLING_ACCESS_KEY,
    secretKey: process.env.KLING_SECRET_KEY,
    enabled: !!process.env.KLING_ACCESS_KEY && !!process.env.KLING_SECRET_KEY,
  },
  fal: {
    apiKey: process.env.FAL_KEY,
    enabled: !!process.env.FAL_KEY,
  },
};
```

### After

```typescript
// lib/video/config/videoConfig.ts
import { getOptionalEnv } from '@/lib/validateEnv';

const klingAccessKey = getOptionalEnv('KLING_ACCESS_KEY');
const klingSecretKey = getOptionalEnv('KLING_SECRET_KEY');
const falKey = getOptionalEnv('FAL_KEY');

export const VIDEO_PROVIDERS = {
  kling: {
    accessKey: klingAccessKey,
    secretKey: klingSecretKey,
    enabled: !!(klingAccessKey && klingSecretKey),
  },
  fal: {
    apiKey: falKey,
    enabled: !!falKey,
  },
};
```

## Example 5: Complete Config Object

### Before

```typescript
// lib/config.ts
export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  // ... many more
};
```

**Issues:**
- ❌ Default empty strings hide missing configuration
- ❌ No validation
- ❌ Hard to track what's required vs optional

### After

```typescript
// lib/config.ts
import { getEnvConfig } from '@/lib/validateEnv';

// All validated and typed
export const config = getEnvConfig();

// Usage:
config.OPENAI_API_KEY  // Always string (validated at startup)
config.FAL_KEY         // string | undefined (optional)
```

## Example 6: Conditional Logic Based on Environment

### Before

```typescript
// lib/api-security.ts
export function validateOpenAIKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.error('OPENAI_API_KEY not configured');
    throw new Error('OpenAI API key not configured');
  }

  if (!apiKey.startsWith('sk-')) {
    logger.error('Invalid OPENAI_API_KEY format');
    throw new Error('Invalid OpenAI API key format');
  }

  return apiKey;
}
```

**Issues:**
- ❌ Validation logic duplicated
- ❌ Format checks only happen at runtime
- ❌ Must call this function in every route

### After

```typescript
// The validation now happens at startup automatically!
// No need for this function anymore - just use getRequiredEnv()

import { getRequiredEnv } from '@/lib/validateEnv';

// In your API route:
const apiKey = getRequiredEnv('OPENAI_API_KEY');
// Already validated format at startup ✅
```

## Migration Checklist

When migrating your code:

- [ ] Replace `process.env.VARIABLE_NAME` with `getRequiredEnv('VARIABLE_NAME')` for required vars
- [ ] Replace `process.env.VARIABLE_NAME` with `getOptionalEnv('VARIABLE_NAME')` for optional vars
- [ ] Remove manual null checks (e.g., `if (!apiKey)`)
- [ ] Remove non-null assertions (`!`)
- [ ] Remove validation functions that are now redundant
- [ ] Update imports to include validation helpers
- [ ] Test that startup validation catches missing keys
- [ ] Update any documentation referencing old patterns

## Common Patterns

### Pattern: Lazy initialization with validation

```typescript
// Before
let client: OpenAI | null = null;

function getClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI key not set');
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

// After
import { getRequiredEnv } from '@/lib/validateEnv';

const client = new OpenAI({ apiKey: getRequiredEnv('OPENAI_API_KEY') });
// Validated at startup - no lazy init needed
```

### Pattern: Environment-specific behavior

```typescript
// Before
const isDevelopment = process.env.NODE_ENV === 'development';
const apiKey = isDevelopment
  ? 'test-key'
  : process.env.OPENAI_API_KEY!;

// After
import { getRequiredEnv, getOptionalEnv } from '@/lib/validateEnv';

const nodeEnv = getOptionalEnv('NODE_ENV');
const isDevelopment = nodeEnv === 'development';
const apiKey = isDevelopment
  ? 'test-key'
  : getRequiredEnv('OPENAI_API_KEY');
```

## Testing with the New System

### Before

```typescript
describe('API Route', () => {
  it('should fail with missing API key', async () => {
    delete process.env.OPENAI_API_KEY;
    const response = await POST(mockRequest);
    expect(response.status).toBe(500);
  });
});
```

### After

```typescript
describe('API Route', () => {
  // Validation happens at app startup, not in individual routes
  // Focus tests on business logic instead of env validation

  it('should process request successfully', async () => {
    // Assumes env is valid (tested separately in validateEnv.test.ts)
    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
  });
});
```

## Rollback Plan

If you need to temporarily rollback:

1. Comment out the validation import in `app/layout.tsx`:
   ```typescript
   // import "@/lib/env-startup"; // Temporarily disabled
   ```

2. Your old code will continue to work (but without startup validation)

3. Re-enable when ready:
   ```typescript
   import "@/lib/env-startup"; // Re-enabled
   ```

## Best Practices

1. **Use getRequiredEnv for critical keys**: Any key needed for core functionality
2. **Use getOptionalEnv for feature flags**: Keys that enable optional features
3. **Remove redundant validation**: Don't check for null after using getRequiredEnv
4. **Trust startup validation**: If the app started, required keys are valid
5. **Document new required keys**: Always update .env.example when adding keys

## Questions?

See the full documentation: `docs/API_KEY_VALIDATION.md`
