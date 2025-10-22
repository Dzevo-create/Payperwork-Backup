# Supabase Row Level Security (RLS) Setup Guide

## ⚠️ Important: Your Current Setup

**Your application ALREADY HAS RLS ENABLED!**

Your RLS policies are already applied via migration `008_enable_proper_rls.sql`.

**Your Setup:**

- **Tables**: `conversations`, `messages`, `library_items`, `branding`
- **Auth Method**: Custom user ID context using `set_user_id()` function
- **Policy Pattern**: `current_setting('app.user_id', true)`
- **Status**: ✅ RLS is ACTIVE and WORKING

**Why you got the error:**
The RLS policy file `00_rls_policies.sql` was created assuming tables like `profiles`, `presentations`, `slides` exist, but your actual schema uses `conversations`, `messages`, `library_items`, `branding`.

---

## Overview

Row Level Security (RLS) is a PostgreSQL feature that allows you to restrict database access at the row level based on the current user. This is critical for multi-tenant applications like Payperwork, where users should only access their own data.

---

## Quick Start

### 1. Apply RLS Policies

**Option A: Using Supabase Dashboard**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/00_rls_policies.sql`
4. Paste and run the SQL

**Option B: Using Supabase CLI**

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migration
supabase db push
```

### 2. Verify RLS is Enabled

Run this query in SQL Editor:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected Output**: All tables should show `rowsecurity = true`

### 3. Test RLS Policies

#### Test User Isolation

1. Create two test users in Supabase Auth
2. Sign in as User A and create some data
3. Sign in as User B
4. Try to query User A's data - it should return empty results

```sql
-- This should only return User B's data, not User A's
SELECT * FROM presentations;
```

---

## Policy Structure

Each table has 4 basic policies:

1. **SELECT**: Users can view their own data
2. **INSERT**: Users can create their own data
3. **UPDATE**: Users can modify their own data
4. **DELETE**: Users can delete their own data

### Example: Presentations Table

```sql
-- View own presentations
CREATE POLICY "Users can view own presentations"
  ON presentations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create own presentations
CREATE POLICY "Users can create own presentations"
  ON presentations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## Storage Bucket Policies

### Setup Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Create bucket: `uploads`
3. Set it to **Private** (not public)
4. The RLS policies in `00_rls_policies.sql` will handle access control

### Folder Structure

Files are organized by user ID:

```
uploads/
  └── {user_id}/
      ├── images/
      ├── videos/
      └── presentations/
```

### Storage Policies

```sql
-- Users can only access files in their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## Testing RLS Policies

### Test Script

Create a test file `scripts/test-rls.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testRLS() {
  // Sign in as test user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "testuser@example.com",
    password: "testpassword123",
  });

  if (authError) {
    console.error("Auth error:", authError);
    return;
  }

  console.log("✅ Authenticated as:", authData.user.email);

  // Try to fetch presentations
  const { data: presentations, error: presentationsError } = await supabase
    .from("presentations")
    .select("*");

  if (presentationsError) {
    console.error("❌ Error fetching presentations:", presentationsError);
  } else {
    console.log("✅ Presentations fetched:", presentations.length);
    console.log(
      "   All belong to user:",
      presentations.every((p) => p.user_id === authData.user.id)
    );
  }

  // Try to access another user's data (should fail)
  const { data: otherUserData, error: otherUserError } = await supabase
    .from("presentations")
    .select("*")
    .eq("user_id", "00000000-0000-0000-0000-000000000000"); // Random UUID

  if (otherUserError) {
    console.error("❌ Error (expected):", otherUserError);
  } else {
    console.log("⚠️  WARNING: Could access other user data!", otherUserData);
  }

  await supabase.auth.signOut();
}

testRLS().catch(console.error);
```

Run with: `npx tsx scripts/test-rls.ts`

---

## Troubleshooting

### Problem: "No rows returned" even for own data

**Cause**: RLS policies are too restrictive or auth context is missing

**Solution**:

1. Verify user is authenticated: `auth.uid()` should return a valid UUID
2. Check the user_id column matches the authenticated user
3. Verify RLS policy uses correct column name

```sql
-- Debug query (run as service_role, not anon)
SELECT
  id,
  user_id,
  auth.uid() as current_user_id,
  user_id = auth.uid() as matches
FROM presentations;
```

### Problem: "Row level security is not enabled"

**Cause**: RLS not enabled on table

**Solution**:

```sql
ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;
```

### Problem: Service role bypass RLS

**Cause**: Using `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS

**Solution**:

- Use `SUPABASE_ANON_KEY` for user-facing operations
- Only use service role key for admin operations
- Be careful with service role key in API routes

---

## Advanced Scenarios

### Shared Resources

If users need to share resources (e.g., team presentations):

```sql
-- Create junction table
CREATE TABLE presentation_shares (
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')),
  PRIMARY KEY (presentation_id, user_id)
);

-- Policy: Users can view shared presentations
CREATE POLICY "Users can view shared presentations"
  ON presentations
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM presentation_shares
      WHERE presentation_shares.presentation_id = presentations.id
      AND presentation_shares.user_id = auth.uid()
    )
  );
```

### Public Resources

For public presentations:

```sql
-- Add column
ALTER TABLE presentations
ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

-- Policy: Anyone can view public presentations
CREATE POLICY "Anyone can view public presentations"
  ON presentations
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);
```

### Admin Access

For admin users:

```sql
-- Helper function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Admins can view all presentations
CREATE POLICY "Admins can view all presentations"
  ON presentations
  FOR ALL
  USING (is_admin());
```

---

## Security Best Practices

1. **Always Enable RLS**: Every table with user data should have RLS enabled
2. **Test Policies**: Create test users and verify isolation
3. **Use Service Role Carefully**: Only use service role key when absolutely necessary
4. **Audit Policies**: Regularly review and update RLS policies
5. **Log Access**: Monitor `auth.uid()` usage in production
6. **Principle of Least Privilege**: Start restrictive, then relax as needed

---

## Monitoring

### Check Active Policies

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Analyze Policy Performance

```sql
EXPLAIN ANALYZE
SELECT * FROM presentations
WHERE user_id = auth.uid();
```

If performance is slow, add indexes:

```sql
CREATE INDEX idx_presentations_user_id ON presentations(user_id);
```

---

## Deployment Checklist

Before deploying to production:

- [ ] RLS enabled on all tables
- [ ] Policies tested with multiple users
- [ ] Storage bucket policies configured
- [ ] Service role key secured
- [ ] Indexes added for user_id columns
- [ ] Audit logs enabled (Supabase Pro)
- [ ] Backup strategy in place

---

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

---

**Last Updated**: 2025-10-22
**Version**: 1.0.0
