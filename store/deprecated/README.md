# Deprecated Store Files

These files are no longer used in the application but kept for reference.

## Files

### `libraryStore.ts`
- **Status:** DEPRECATED (replaced by `libraryStore.v2.ts`)
- **Reason:** Old localStorage-based library store
- **Replaced By:** `store/libraryStore.v2.ts` (Supabase-backed)
- **Date Deprecated:** 2025-10-11

### `chatStore.v2.ts`
- **Status:** PREPARED BUT UNUSED
- **Reason:** Supabase-backed chat store (prepared for future migration)
- **Current:** Still using `store/chatStore.ts` (localStorage)
- **Migration Plan:** Will be activated when cross-device sync is needed

## Why Keep These Files?

1. **Historical Reference:** Understand how features evolved
2. **Rollback Safety:** Can restore if migration has issues
3. **Code Patterns:** Reference for similar future migrations

## Can These Be Deleted?

**libraryStore.ts:** Yes, after 30 days of stable `libraryStore.v2.ts` operation

**chatStore.v2.ts:** No, will be activated in future migration phase

---

**Last Updated:** 2025-10-16
