# API Authentication Migration Guide

This guide shows you how to add authentication to your API routes.

## Quick Migration Pattern

### Before (Unauthenticated)

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Process request...

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

### After (Authenticated)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-api";
import { apiLogger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    // 1. Add authentication check at the start
    let user;
    try {
      user = await requireAuth(req);
      apiLogger.info("Authenticated request", { userId: user.id });
    } catch (authError) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // 2. Use user.id in your database queries
    const result = await supabase.from("table_name").insert({ ...data, user_id: user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

## Step-by-Step Instructions

### Step 1: Add requireAuth Import

```typescript
import { requireAuth } from "@/lib/auth-api";
import { apiLogger } from "@/lib/logger";
```

### Step 2: Add Auth Check

Add this at the **very beginning** of your route handler:

```typescript
let user;
try {
  user = await requireAuth(req);
  apiLogger.info("Authenticated API request", {
    userId: user.id,
    route: "/api/your-route",
  });
} catch (authError) {
  return NextResponse.json(
    { error: "Unauthorized", message: "Authentication required" },
    { status: 401 }
  );
}
```

### Step 3: Use user.id in Database Queries

Replace any hardcoded user IDs or localStorage-based IDs:

```typescript
// ❌ OLD: Using localStorage or demo user
const userId = "demo-user-123";

// ✅ NEW: Using authenticated user
const userId = user.id;

// Use in database queries
const result = await supabase.from("conversations").insert({
  title: "New Conversation",
  user_id: userId, // ← Use real user ID
});
```

### Step 4: Resource Ownership Check (Optional)

If the route accesses existing resources, verify ownership:

```typescript
import { checkResourceOwnership } from "@/lib/auth-api";

// Get resource from database
const { data: conversation } = await supabase
  .from("conversations")
  .select("user_id")
  .eq("id", conversationId)
  .single();

if (!conversation) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// Check if user owns this resource
const isOwner = await checkResourceOwnership(req, conversation.user_id);

if (!isOwner) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

## Priority Routes to Secure

### High Priority (User Data)

- ✅ `/api/chat` - Already secured
- [ ] `/api/chat-c1`
- [ ] `/api/slides/generate`
- [ ] `/api/slides/workflow/*`
- [ ] `/api/upload`
- [ ] `/api/transcribe`

### Medium Priority (Workflows)

- [ ] `/api/sketch-to-render`
- [ ] `/api/branding`
- [ ] `/api/furnish-empty`
- [ ] `/api/style-transfer`
- [ ] `/api/render-to-cad`

### Lower Priority (Sub-routes)

- [ ] `/api/*/save-generation`
- [ ] `/api/*/delete-generation`
- [ ] `/api/*/upscale`
- [ ] `/api/*/edit`

## Testing Your Changes

### 1. Test Unauthenticated Access

```bash
# Should return 401 Unauthorized
curl -X POST http://localhost:3000/api/your-route \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 2. Test Authenticated Access

```bash
# Get auth token from browser (Application > Storage > Cookies)
# Look for: sb-xxx-auth-token

curl -X POST http://localhost:3000/api/your-route \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"test": "data"}'
```

### 3. Test in Browser

1. Login at `/auth/login`
2. Open DevTools > Network
3. Make a request to your API route
4. Verify:
   - Request includes auth cookie
   - Response is 200 OK (not 401)
   - Data belongs to current user

## Common Issues

### Issue 1: "TypeError: Cannot read properties of undefined (reading 'id')"

**Cause:** Forgot to check if user exists before using user.id

**Fix:**

```typescript
// ❌ WRONG
const user = await requireAuth(req);
const userId = user.id; // Error if auth fails

// ✅ CORRECT
let user;
try {
  user = await requireAuth(req);
} catch (authError) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const userId = user.id; // Safe now
```

### Issue 2: "RLS policy violation"

**Cause:** RLS policies are active, but you're using demo user ID

**Fix:**

```typescript
// ❌ WRONG: Hardcoded or localStorage ID
const userId = "demo-user-123";

// ✅ CORRECT: Real authenticated user ID
const user = await requireAuth(req);
const userId = user.id;
```

### Issue 3: "Infinite redirect loop"

**Cause:** Protected page redirects to login, but login redirects back

**Fix:** Exclude auth pages from middleware:

```typescript
// middleware.ts
export const config = {
  matcher: [
    "/api/:path*",
    // Don't protect auth pages
    "/((?!auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

## Checklist

Before deploying, ensure:

- [ ] All routes that access user data are protected
- [ ] All database queries use real user IDs (not demo/localStorage)
- [ ] RLS policies are enabled in Supabase
- [ ] Tested with multiple users
- [ ] Verified users can only see their own data
- [ ] Error messages don't leak sensitive info
- [ ] Logging includes user IDs for debugging

## Next Steps

1. Secure all High Priority routes first
2. Test thoroughly with multiple users
3. Enable RLS policies in Supabase
4. Monitor logs for authentication failures
5. Add rate limiting per user (not just per IP)

## Need Help?

- Check `lib/auth-api.ts` for all available auth helpers
- See `/api/chat/route.ts` for a complete example
- Read `docs/SUPABASE_RLS_POLICIES.md` for database security
