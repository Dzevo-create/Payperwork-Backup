# Architecture Status & Migration Plan

**Last Updated:** 2025-10-11
**Project:** Payperwork (Structura V2)
**Status:** ✅ Library on Supabase, Chat on localStorage (temporary)

---

## 🎯 Current State

### ✅ What's Working

#### Library System (Supabase ✅)
- **Storage:** Supabase Storage (images + videos buckets)
- **Database:** PostgreSQL (library_items table)
- **Store:** `libraryStore.v2.ts` (using Supabase)
- **Status:** ✅ **PRODUCTION READY**
- **Benefits:**
  - No localStorage quota errors
  - Base64 images automatically uploaded to Storage
  - Persistent across devices
  - Unlimited storage capacity

#### Chat System (localStorage ⏳)
- **Storage:** Browser localStorage
- **Store:** `chatStore.ts` (v1)
- **Status:** ⏳ **TEMPORARY** - Will migrate to Supabase later
- **Limitations:**
  - ~5-10MB quota limit
  - Not synced across devices
  - Lost if cache cleared
  - Images stripped from persisted data to save space

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Chat System              Library System                     │
│  ├─ chatStore.ts (v1)     ├─ libraryStore.v2.ts ✅         │
│  └─ localStorage          └─ Supabase                        │
│                                                              │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE BACKEND                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PostgreSQL Database          Supabase Storage              │
│  ├─ conversations (unused)    ├─ images/ (active)          │
│  ├─ messages (unused)         └─ videos/ (active)          │
│  └─ library_items (active)                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Migration Status

### Phase 1: Library → Supabase ✅ COMPLETED
- [x] Created Supabase tables
- [x] Created Storage buckets
- [x] Implemented `libraryStore.v2.ts`
- [x] Migrated all imports to v2
- [x] Tested image/video generation
- [x] Base64 → Storage upload working
- [x] Fixed UUID/TEXT type mismatch

**Result:** Library fully functional on Supabase, no localStorage quota errors!

### Phase 2: Chat → Supabase ⏸️ POSTPONED
**Status:** Delayed to future sprint

**Why Postponed:**
- Chat localStorage working fine for MVP
- No quota issues (images handled by Library)
- Allows faster iteration on features
- Clean separation of concerns

**Planned for:** After product-market fit validation

**Current Workaround:**
- Chat uses `chatStore.ts` (localStorage)
- Messages persist in browser
- Conversations restore on refresh
- Images/videos stored separately in Supabase via Library

---

## 📁 File Structure

### Active Files (In Use)

```
/store/
├── chatStore.ts ✅ ACTIVE (localStorage)
└── libraryStore.v2.ts ✅ ACTIVE (Supabase)

/lib/
├── supabase.ts ✅ Client initialization
├── supabase-admin.ts ✅ Admin operations
├── supabase-library.ts ✅ Library CRUD
└── supabase-chat.ts ⏸️ Prepared (not used yet)

/supabase/
├── schema.sql ✅ Database schema
├── storage.sql ✅ Storage buckets
└── fix-ids.sql ✅ UUID→TEXT migration
```

### Deprecated Files (Not Used)

```
/store/
├── libraryStore.ts ❌ DEPRECATED (old localStorage version)
└── chatStore.v2.ts ⏸️ PREPARED (future Supabase version)
```

---

## 🚧 Known Technical Debt

### Critical (P0) - Security
1. **RLS Policies:** Currently "allow all" - ⚠️ **MUST FIX BEFORE PRODUCTION**
2. **User Authentication:** localStorage-based user IDs (insecure)
3. **API Keys Exposed:** .env.local contains production keys
4. **No Rate Limiting:** Vulnerable to abuse

### High (P1) - Architecture
1. **Dual Store Pattern:** v1 and v2 stores coexist
2. **Console.log Pollution:** 129+ debug logs in production
3. **Large Components:** ChatArea.tsx (689 lines)
4. **No Error Boundaries:** App crashes on component errors

### Medium (P2) - Performance
1. **N+1 Queries:** fetchConversations has nested queries
2. **No Virtualization:** Long lists cause performance issues
3. **Missing Image Optimization:** Using raw base64/URLs

---

## 🎯 Future Migration Plan

### When to Migrate Chat to Supabase

**Triggers:**
1. Need cross-device sync
2. Need to share conversations
3. localStorage quota becomes issue again
4. Team collaboration features needed

**Estimated Effort:** 2-3 days

**Migration Steps:**
1. Enable `chatStore.v2.ts` (already implemented)
2. Create migration script from localStorage → Supabase
3. Test thoroughly with existing data
4. Gradual rollout with feature flag
5. Remove `chatStore.ts` after successful migration

---

## 🔒 Security Recommendations

### Before Production (Critical)

1. **Implement Supabase Auth**
   ```sql
   -- Replace current RLS
   CREATE POLICY "Users see own data"
   ON library_items FOR SELECT
   USING (auth.uid() = user_id);
   ```

2. **Rotate All API Keys**
   - OpenAI
   - Google Gemini
   - Kling AI
   - fal.ai
   - Supabase service role

3. **Add Rate Limiting**
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

4. **Secure Storage Buckets**
   - Remove public upload/delete policies
   - Restrict to authenticated users only

---

## 📈 Performance Optimizations (Future)

1. **React.memo for List Items**
2. **Virtual Scrolling** (react-virtual)
3. **Image Optimization** (Next.js Image, Cloudinary)
4. **Caching Strategy** (React Query, SWR)
5. **Code Splitting** (Dynamic imports)

---

## 🧪 Testing Strategy (Todo)

### Current State: ❌ No Tests

**Needed:**
- Unit tests for stores (Vitest)
- Integration tests for API routes
- E2E tests for critical flows (Playwright)
- Component tests (React Testing Library)

**Target Coverage:** 80%+

---

## 📊 Agent Review Grades

### Architecture Review
- **Overall Grade:** B+ (Good with Room for Improvement)
- **Strengths:** TypeScript, Provider pattern, React hooks
- **Needs Work:** Console logs, large components, error boundaries

### Backend Review
- **Overall Grade:** C+ (67/100)
- **Strengths:** Database structure, API design, storage integration
- **Needs Work:** RLS policies, N+1 queries, referential integrity

### Security Review
- **Overall Grade:** D+ (Development), F (Production)
- **Strengths:** Environment separation, XSS protection
- **Critical Issues:** RLS disabled, exposed keys, no auth

---

## ✅ Next Steps

### This Week
- [x] Complete Library Supabase migration
- [x] Test image/video generation
- [x] Run agent reviews
- [x] Document architecture
- [ ] Remove debug console.logs
- [ ] Add centralized logger

### Next Sprint
- [ ] Implement Supabase Auth
- [ ] Fix RLS policies
- [ ] Add rate limiting
- [ ] Add error boundaries
- [ ] Start writing tests

### Future
- [ ] Migrate chat to Supabase
- [ ] Performance optimizations
- [ ] Add monitoring (Sentry)
- [ ] Implement caching

---

## 🎉 Achievements

✅ **Library on Supabase** - No more quota errors!
✅ **Chat refresh restoration** - Conversations persist
✅ **Clean architecture reviews** - Know what to improve
✅ **Security audit complete** - Clear roadmap to production

---

## 📞 Contact

**Questions about architecture?** Check agent review reports in project root.

**Ready to migrate chat?** Follow the migration plan above.

**Security concerns?** Prioritize the Critical (P0) items first.
