# QUICK TEST GUIDE - 5 Minute Verification

## FOR THE USER: FASTEST WAY TO TEST EVERYTHING

---

## TEST 1: STANDARD CHAT (2 minutes)

### Steps:
1. Open terminal in project folder
2. Run: `npm run dev`
3. Open browser: `http://localhost:3000`
4. Click "Zum Chat" button
5. Send message: "Hello, how are you?"
6. Wait for response

### Expected:
- Chat loads instantly
- Message sends successfully
- OpenAI GPT-4o responds
- No errors in console
- Response appears smoothly

### If This Fails:
- Check `OPENAI_API_KEY` in .env.local
- Check console for errors
- Verify internet connection

---

## TEST 2: TOGGLE SUPER CHAT (Optional, 3 minutes)

### Only if you want to test C1:

1. **Enable the toggle:**
   - Open `/lib/feature-flags.ts`
   - Change `SHOW_C1_TOGGLE: false` to `SHOW_C1_TOGGLE: true`
   - Save file

2. **Add toggle to UI:**
   - Open `/components/chat/Chat/ChatHeader.tsx`
   - Add at line 5: `import { C1Toggle } from "./C1Toggle";`
   - Add at line 203 (after Share button): `<C1Toggle />`
   - Save file

3. **Restart server:**
   - Stop dev server (Ctrl+C)
   - Run: `npm run dev`
   - Refresh browser

4. **Test toggle:**
   - You should see "Original" badge in header
   - Click the badge
   - It should change to "C1 Active" (purple, pulsing)
   - Send a message
   - Check network tab: should use `/api/chat-c1`
   - Click badge again
   - It should change back to "Original"
   - Send a message
   - Check network tab: should use `/api/chat`

### Expected:
- Toggle button appears
- Badge changes when clicked
- State persists on refresh
- Endpoint switches correctly

### If This Fails:
- Check `THESYS_API_KEY` in .env.local
- Check browser console for errors
- Verify Zustand store is working (check localStorage: `payperwork-superchat-storage`)

---

## TEST 3: NAVIGATION (1 minute)

### Steps:
1. Go to homepage: `http://localhost:3000`
2. Click "Zum Chat" button (yellow button in hero)
3. Verify you land on `/chat`
4. Go back to homepage
5. Click "Chat" in top navigation
6. Verify you land on `/chat`

### Expected:
- All "Chat" links work
- No 404 errors
- Chat loads correctly

---

## CRITICAL CHECKS (1 minute)

### Console Errors:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Send a chat message
4. Check for RED errors (warnings are OK)

### Network Requests:
1. Open DevTools → Network tab
2. Send a chat message
3. Look for request to `/api/chat` or `/api/chat-c1`
4. Status should be 200 (success)
5. Response should stream back

### localStorage:
1. Open DevTools → Application → Local Storage
2. Check for keys:
   - `payperwork-chat-storage` (conversations)
   - `payperwork-superchat-storage` (toggle state)
3. Verify data is saved

---

## QUICK ISSUE RESOLUTION

### "Chat doesn't load"
- Check OPENAI_API_KEY is set
- Run `npm install` (dependencies might be missing)
- Clear browser cache

### "Toggle doesn't appear"
- Verify you set `SHOW_C1_TOGGLE: true`
- Verify you imported C1Toggle in ChatHeader
- Restart dev server

### "C1 doesn't work"
- Check THESYS_API_KEY is set and valid
- Check network tab for 401/403 errors
- Try standard chat first to isolate issue

### "TypeScript errors"
- Ignore image generation errors (known issue)
- Chat should work despite them
- Run `npm run build` to see all errors

---

## SUCCESS CRITERIA

All tests pass if:
- Standard chat sends/receives messages
- Toggle appears when enabled
- Toggle switches endpoints correctly
- Navigation links all work
- No critical console errors

---

## DEPLOYMENT READY?

### YES, if:
- TEST 1 passes (Standard Chat works)
- No critical errors in console
- Navigation works

### WAIT, if:
- OPENAI_API_KEY missing/invalid
- Chat doesn't send messages
- Critical console errors appear

### OPTIONAL:
- TEST 2 (Super Chat) only needed if you plan to use C1
- Can deploy without C1 functionality

---

## FINAL CHECKLIST

Before deploying:
- [ ] Standard chat works
- [ ] No console errors
- [ ] Navigation works
- [ ] Environment variables set
- [ ] (Optional) C1 toggle works

**If all checked → Ready to deploy!**

---

**Time Required:** 5-8 minutes total
**Critical Tests:** TEST 1 + CRITICAL CHECKS
**Optional:** TEST 2 (only if using Super Chat)
