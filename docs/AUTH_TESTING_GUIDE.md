# Authentication Testing Guide

Quick guide to test your auth implementation before going live.

## ✅ Pre-Flight Checklist

Before testing, ensure:

- [ ] RLS policies are enabled in Supabase (run `supabase/migrations/001_enable_rls_policies.sql`)
- [ ] App is running locally (`npm run dev`)
- [ ] Supabase project is accessible
- [ ] All environment variables are set

## 🧪 Test Suite

### Test 1: Sign Up Flow

**Steps:**

1. Navigate to `http://localhost:3000/auth/signup`
2. Fill in:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "testpassword123"
   - Confirm Password: "testpassword123"
3. Click "Konto erstellen"

**Expected Result:**

- ✅ Success message appears
- ✅ Email verification message shown
- ✅ Check email for verification link
- ✅ Click verification link
- ✅ User is activated in Supabase

**Check in Supabase:**

- Dashboard > Authentication > Users
- New user should appear with email "test@example.com"

---

### Test 2: Login Flow

**Steps:**

1. Navigate to `http://localhost:3000/auth/login`
2. Enter:
   - Email: "test@example.com"
   - Password: "testpassword123"
3. Click "Anmelden"

**Expected Result:**

- ✅ Redirects to home page
- ✅ User is logged in
- ✅ Auth cookie is set (check DevTools > Application > Cookies)
- ✅ UserMenu shows user initials/name

---

### Test 3: Protected API Route

**Steps:**

1. Open DevTools > Network
2. Try to send a chat message (if using `/api/chat`)
3. Check the request

**Expected Result:**

- ✅ Request succeeds (200 OK)
- ✅ Request includes auth cookie
- ✅ Response contains data

**Now test unauthorized:**

1. Open DevTools > Application > Cookies
2. Delete all `sb-*` cookies
3. Try to send a chat message again

**Expected Result:**

- ✅ Request fails (401 Unauthorized)
- ✅ Error message: "Authentication required"

---

### Test 4: RLS Policies

**Setup:**

1. Create User A: "usera@example.com"
2. Create User B: "userb@example.com"
3. Login as User A
4. Create some data (conversations, library items, etc.)
5. Logout
6. Login as User B

**Expected Result:**

- ✅ User B sees NO data from User A
- ✅ User B can create their own data
- ✅ User A's data is completely hidden

**Check in Supabase:**

```sql
-- Should only return User A's conversations
SELECT * FROM conversations WHERE user_id = 'user-a-uuid';

-- Should return nothing for User B
SELECT * FROM conversations WHERE user_id = 'user-b-uuid';
```

---

### Test 5: Logout Flow

**Steps:**

1. Ensure you're logged in
2. Click on user avatar/menu
3. Click "Abmelden"

**Expected Result:**

- ✅ Redirects to `/auth/login`
- ✅ Auth cookies are deleted
- ✅ Subsequent API requests fail with 401
- ✅ Protected pages redirect to login

---

### Test 6: Password Reset

**Steps:**

1. Navigate to `/auth/login`
2. Click "Passwort vergessen?"
3. Enter email: "test@example.com"
4. Click "Reset-Link senden"

**Expected Result:**

- ✅ Success message appears
- ✅ Email sent with reset link
- ✅ Click link in email
- ✅ Can set new password

---

### Test 7: Session Persistence

**Steps:**

1. Login
2. Close browser tab
3. Open new tab
4. Navigate to app

**Expected Result:**

- ✅ User is still logged in
- ✅ No need to login again
- ✅ Session restored from cookie

---

### Test 8: Token Expiry

**Steps:**

1. Login
2. Wait for token to expire (default: 1 hour)
3. Try to use the app

**Expected Result:**

- ✅ Token refresh happens automatically
- ✅ OR redirects to login if refresh fails
- ✅ No errors shown to user

---

## 🐛 Common Issues & Fixes

### Issue: "User not found" after signup

**Cause:** Email verification not completed

**Fix:**

1. Check spam folder for verification email
2. Or disable email verification in Supabase (Dev only):
   - Dashboard > Authentication > Settings
   - Disable "Enable email confirmations"

---

### Issue: "Session not found"

**Cause:** Cookies blocked or deleted

**Fix:**

1. Check browser allows cookies for localhost
2. Check browser privacy settings
3. Try different browser

---

### Issue: "RLS policy violation"

**Cause:** Policies not enabled OR using wrong user ID

**Fix:**

1. Run RLS migration script
2. Verify policies exist in Supabase
3. Check user_id in database matches auth.uid()

---

### Issue: 401 even when logged in

**Cause:** Middleware not passing auth cookie

**Fix:**

1. Check middleware.ts includes auth check
2. Verify auth token is in request cookies
3. Check token is valid (not expired)

---

## 🔍 Debug Checklist

If auth is not working:

1. **Check Supabase Connection**

   ```bash
   # Verify env variables
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Check Auth Cookie**
   - DevTools > Application > Cookies
   - Look for: `sb-<project>-auth-token`
   - Should be present after login

3. **Check Middleware**
   - Add console.log in middleware.ts
   - Verify `isAuthenticated()` is called
   - Check token extraction logic

4. **Check RLS Policies**

   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

5. **Check Server Logs**
   - Look for auth errors in terminal
   - Check for "Unauthorized" messages
   - Verify user.id is logged

---

## 📊 Test Results Template

Use this template to track your testing:

```
## Auth Testing Results

Date: _______________
Tester: _______________

### Test Results

| Test | Status | Notes |
|------|--------|-------|
| Sign Up Flow | ✅ / ❌ | |
| Login Flow | ✅ / ❌ | |
| Protected API Route | ✅ / ❌ | |
| RLS Policies | ✅ / ❌ | |
| Logout Flow | ✅ / ❌ | |
| Password Reset | ✅ / ❌ | |
| Session Persistence | ✅ / ❌ | |
| Token Expiry | ✅ / ❌ | |

### Issues Found

1. _______________
2. _______________
3. _______________

### Sign-Off

All tests passed: ✅ / ❌
Ready for production: ✅ / ❌
```

---

## ✅ Production Deployment Checklist

Before going live:

- [ ] All 8 tests pass
- [ ] RLS policies enabled and tested
- [ ] Multiple users tested
- [ ] Password reset works
- [ ] Session persistence works
- [ ] Error messages are user-friendly
- [ ] No sensitive info in logs
- [ ] Rate limiting works
- [ ] Email templates customized
- [ ] Terms & Privacy policy links added

---

## 🚀 Ready for Production!

If all tests pass, you're ready to deploy! 🎉

**Final Steps:**

1. Backup your Supabase database
2. Run RLS migration on production
3. Update production environment variables
4. Deploy to Vercel/your hosting
5. Test again on production domain
6. Monitor logs for auth errors

**Need Help?**

- Check `docs/API_AUTH_MIGRATION_GUIDE.md`
- Review `docs/SUPABASE_RLS_POLICIES.md`
- See example in `/api/chat/route.ts`
