# API Key Validation System

## Overview

The API Key Validation System ensures all required environment variables are present and properly formatted before the application starts. This prevents runtime errors and provides clear, actionable error messages when configuration is incorrect.

## Features

- **Fail-fast validation**: App won't start if required keys are missing
- **Format validation**: Checks API key formats (e.g., OpenAI keys must start with `sk-`)
- **Consistency checks**: Ensures Supabase URLs match between server and client configs
- **Clear error messages**: Tells you exactly what's missing or invalid
- **Type-safe getters**: Use `getRequiredEnv()` and `getOptionalEnv()` for type-safe access
- **Development-friendly**: Logs optional key status in development mode

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Startup                      │
│                     (app/layout.tsx)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ imports
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  lib/env-startup.ts                          │
│  (Runs validation on import - server-side only)             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ calls
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  lib/validateEnv.ts                          │
│                                                              │
│  - validateEnvironment()                                     │
│    • Checks all required keys exist                         │
│    • Validates key formats                                  │
│    • Checks Supabase consistency                            │
│    • Throws detailed error if validation fails             │
│                                                              │
│  - getRequiredEnv(key)                                       │
│    • Type-safe getter for required variables                │
│                                                              │
│  - getOptionalEnv(key)                                       │
│    • Type-safe getter for optional variables                │
│                                                              │
│  - getEnvConfig()                                            │
│    • Returns complete config object                         │
└─────────────────────────────────────────────────────────────┘
```

## Required Environment Variables

The following environment variables **MUST** be set or the app will fail to start:

### AI Providers
- `OPENAI_API_KEY` - OpenAI API key for chat, image analysis, transcription
  - Format: Must start with `sk-`
  - Get from: https://platform.openai.com/api-keys

- `THESYS_API_KEY` - Thesys AI for C1 SuperChat
  - Get from: https://thesys.ai

### Video Generation
- `RUNWAY_API_KEY` - Runway ML for image-to-video generation
  - Get from: https://runwayml.com

### Image Processing
- `FREEPIK_API_KEY` - Freepik Magnific AI for image upscaling
  - Format: Must be at least 30 characters
  - Get from: https://www.freepik.com/api

### Database & Storage
- `SUPABASE_URL` - Supabase project URL (server-side)
  - Format: Must be valid URL containing "supabase"
  - Get from: https://app.supabase.com/project/_/settings/api

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (client-side)
  - **Must match `SUPABASE_URL` exactly**

- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
  - **Keep secret! Never expose to client-side**

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (client-side)
  - Safe for public exposure

## Optional Environment Variables

These variables enable additional features when configured:

### Video Providers
- `KLING_ACCESS_KEY` - Kling AI access key
- `KLING_SECRET_KEY` - Kling AI secret key
- `KLING_API_URL` - Kling AI endpoint (default: https://api-singapore.klingai.com)
- `FAL_KEY` - Fal.ai API key for alternative video generation

### AI Providers
- `GOOGLE_GEMINI_API_KEY` - Google Gemini API key

### Security
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins

### Monitoring
- `SENTRY_DSN` - Sentry error tracking DSN
- `SENTRY_ORG` - Sentry organization
- `SENTRY_PROJECT` - Sentry project name

## Setup Instructions

### 1. Copy Example File

```bash
cp .env.example .env.local
```

### 2. Fill in Required Keys

Open `.env.local` and replace all placeholder values with your actual API keys:

```bash
# Required - App won't start without these
OPENAI_API_KEY="sk-your-actual-key-here"
THESYS_API_KEY="your-actual-key-here"
RUNWAY_API_KEY="your-actual-key-here"
FREEPIK_API_KEY="your-actual-key-here"
SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-actual-key-here"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-actual-key-here"
```

### 3. Start the Application

```bash
npm run dev
```

If any required keys are missing or invalid, you'll see a detailed error message:

```
================================================================================
ENVIRONMENT VALIDATION FAILED
================================================================================
❌ Environment validation failed!

Missing environment variables:
  - OPENAI_API_KEY
  - RUNWAY_API_KEY

Invalid environment variables (check format):
  - FREEPIK_API_KEY

📝 Please check your .env.local file and ensure all required API keys are set.
   Copy .env.example to .env.local if you haven't already.

   Required environment variables:
   - OPENAI_API_KEY
   - THESYS_API_KEY
   - RUNWAY_API_KEY
   - FREEPIK_API_KEY
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
================================================================================
```

## Usage in Code

### Type-Safe Environment Access

Instead of directly accessing `process.env`, use the provided type-safe getters:

```typescript
import { getRequiredEnv, getOptionalEnv } from '@/lib/validateEnv';

// Required environment variable - throws if not set
const openaiKey = getRequiredEnv('OPENAI_API_KEY');

// Optional environment variable - returns undefined if not set
const falKey = getOptionalEnv('FAL_KEY');
```

### Get Complete Config Object

```typescript
import { getEnvConfig } from '@/lib/validateEnv';

const config = getEnvConfig();

console.log(config.OPENAI_API_KEY);  // Always defined
console.log(config.FAL_KEY);         // May be undefined
```

### Manual Validation

If you need to validate environment in a specific context:

```typescript
import { validateEnvironment } from '@/lib/validateEnv';

try {
  validateEnvironment();
  console.log('Environment is valid!');
} catch (error) {
  console.error('Environment validation failed:', error.message);
}
```

## Validation Rules

### Basic Validation
All API keys must:
- Be at least 10 characters long
- Be less than 500 characters long
- Not contain spaces
- Not have leading or trailing whitespace

### Specific Validations

#### OpenAI Keys
- Must start with `sk-` (covers both `sk-` and `sk-proj-` formats)

#### Supabase URLs
- Must be valid URLs
- Must contain "supabase" in the domain
- `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` must be identical

#### Freepik Keys
- Must be at least 30 characters long (UUID-like format)

## Testing

Run the test suite:

```bash
npm test __tests__/lib/validateEnv.test.ts
```

The tests cover:
- Valid configuration scenarios
- Missing required variables
- Invalid key formats
- Supabase URL consistency
- Edge cases (empty strings, whitespace, etc.)

## Migration Guide

### Updating Existing Code

If you have existing code that directly accesses `process.env`, migrate to the type-safe getters:

**Before:**
```typescript
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OpenAI key not configured');
}
```

**After:**
```typescript
import { getRequiredEnv } from '@/lib/validateEnv';
const apiKey = getRequiredEnv('OPENAI_API_KEY');
```

### Benefits of Migration
1. **Type safety**: TypeScript knows which variables are required
2. **Less boilerplate**: No manual existence checks needed
3. **Consistent error messages**: Centralized error handling
4. **Startup validation**: Errors caught before runtime

## Troubleshooting

### App Won't Start

**Symptom**: App crashes on startup with environment validation error

**Solution**:
1. Check that `.env.local` exists (not just `.env.example`)
2. Ensure all required keys are filled in (not placeholder values)
3. Check for typos in key names
4. Verify key formats (e.g., OpenAI keys start with `sk-`)

### Supabase URL Mismatch

**Symptom**: Error about "SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL must be identical"

**Solution**:
```bash
# Both should be exactly the same
SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
```

### Invalid Key Format

**Symptom**: Error about "Invalid environment variables (check format)"

**Solution**:
- OpenAI keys must start with `sk-`
- Supabase URLs must be valid URLs containing "supabase"
- Keys cannot contain spaces or have leading/trailing whitespace
- Keys must be between 10-500 characters

### Optional Keys Not Working

**Symptom**: Feature disabled even though optional key is set

**Solution**:
- Check that the key is actually set (not commented out with `#`)
- Remove quotes if you copied from example
- Restart the development server after changing `.env.local`

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore` by default
2. **Use different keys for development and production**
3. **Rotate keys regularly**, especially if exposed
4. **Keep `SUPABASE_SERVICE_ROLE_KEY` secret** - Never expose to client-side code
5. **Use environment-specific Supabase projects** (dev, staging, prod)

## File Structure

```
/lib
  ├── validateEnv.ts        # Core validation logic
  └── env-startup.ts        # Startup hook (auto-validates on import)

/app
  └── layout.tsx            # Imports env-startup.ts

/__tests__/lib
  └── validateEnv.test.ts   # Comprehensive test suite

/.env.example               # Template with documentation
/.env.local                 # Your actual keys (gitignored)
```

## API Reference

### `validateEnvironment(): void`
Validates all required environment variables. Throws `EnvironmentValidationError` if validation fails.

**Throws:**
- `EnvironmentValidationError` with details about missing/invalid variables

**Example:**
```typescript
try {
  validateEnvironment();
} catch (error) {
  if (error instanceof EnvironmentValidationError) {
    console.log('Missing:', error.missingVars);
    console.log('Invalid:', error.invalidVars);
  }
}
```

### `getRequiredEnv(key: RequiredEnvKeys): string`
Gets a required environment variable with type safety.

**Parameters:**
- `key`: One of the required environment variable names

**Returns:** `string` - The environment variable value

**Throws:** `Error` if variable is not set

**Example:**
```typescript
const apiKey = getRequiredEnv('OPENAI_API_KEY'); // Type-safe
```

### `getOptionalEnv(key: string): string | undefined`
Gets an optional environment variable.

**Parameters:**
- `key`: Environment variable name

**Returns:** `string | undefined` - The value or undefined if not set

**Example:**
```typescript
const falKey = getOptionalEnv('FAL_KEY');
if (falKey) {
  // FAL is configured
}
```

### `getEnvConfig(): EnvironmentConfig`
Returns a complete typed configuration object.

**Returns:** `EnvironmentConfig` - Object with all environment variables

**Example:**
```typescript
const config = getEnvConfig();
console.log(config.OPENAI_API_KEY);
console.log(config.FAL_KEY); // May be undefined
```

## Contributing

When adding new environment variables:

1. **Update `lib/validateEnv.ts`**:
   - Add to `EnvironmentConfig` interface
   - Add to `REQUIRED_ENV_VARS` or `OPTIONAL_ENV_VARS`
   - Add specific validation if needed

2. **Update `.env.example`**:
   - Add the new variable with documentation
   - Include where to get the key
   - Mark as REQUIRED or OPTIONAL

3. **Update tests**:
   - Add test cases for the new variable
   - Test validation rules

4. **Update this documentation**:
   - Add to the appropriate section
   - Document any special validation rules
