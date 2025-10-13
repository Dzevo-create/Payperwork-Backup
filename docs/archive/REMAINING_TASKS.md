# 📋 Remaining Tasks & Improvements

## 🔴 **Kritisch (Vor Production)** - P0

### 1. **API Keys rotieren** 🔑
- [ ] OpenAI API Key erneuern
- [ ] Supabase Service Role Key erneuern
- [ ] Vercel Environment Variables updaten
- [ ] Alte Keys revoken

**Warum**: Keys wurden in dieser Konversation geteilt → Sicherheitsrisiko!

---

### 2. **RLS Policies aktivieren** 🔒
- [ ] SQL aus `supabase/rls-policies.sql` ausführen
- [ ] Helper Function erstellen
- [ ] Testen mit Test-User
- [ ] Storage Buckets auf Private stellen

**Warum**: Aktuell können alle User alle Daten sehen!

---

### 3. **Remaining console.logs entfernen** 🧹

Wir haben `supabase-library.ts` und `chat/route.ts` gefixed, aber es gibt noch mehr Files:

**Zu fixen:**
```bash
# API Routes (noch nicht gefixed):
- app/api/generate-image/route.ts
- app/api/generate-video/route.ts
- app/api/enhance-prompt/route.ts
- app/api/analyze-image/route.ts
- app/api/upload/route.ts
- app/api/test-supabase/route.ts

# Stores (noch nicht gefixed):
- store/chatStore.ts (localStorage version)
- store/chatStore.v2.ts (Supabase version)
- store/libraryStore.v2.ts (teilweise gefixed)

# Components (noch nicht gefixed):
- components/chat/ChatLayout.tsx
- components/chat/Chat/ChatArea.tsx
- components/chat/Chat/ChatInput.tsx
- components/chat/Chat/ChatMessages.tsx
```

**Action**: Alle `console.log/error/warn` durch Logger ersetzen

---

## 🟠 **Hoch (Diese Woche)** - P1

### 4. **ChatArea.tsx refactoren** 📦
- **Problem**: 689 Zeilen in einer Datei
- **Solution**: In kleinere Components aufteilen:
  - `ChatMessage.tsx` - Individual message rendering
  - `ChatMessageActions.tsx` - Copy, Edit, Reply buttons
  - `ChatAttachments.tsx` - Attachments display
  - `ChatImageGeneration.tsx` - Image generation logic
  - `ChatVideoGeneration.tsx` - Video generation logic

**Warum**: Leichter zu testen, zu verstehen, zu maintainen

---

### 5. **Weitere API Routes mit Rate Limiting & Validation** 🛡️

Wir haben nur `/api/chat` gefixed. Noch zu fixen:
- [ ] `/api/generate-image` - Rate limit (5/min) + prompt validation
- [ ] `/api/generate-video` - Rate limit (2/min) + prompt validation
- [ ] `/api/enhance-prompt` - Rate limit (10/min) + input validation
- [ ] `/api/analyze-image` - Rate limit (10/min) + file validation
- [ ] `/api/upload` - File validation (bereits teilweise da)

---

### 6. **Performance Optimierung** ⚡

**6.1 React.memo für teure Components**
```typescript
// ChatMessages.tsx
export const ChatMessages = React.memo(({ messages, ... }) => {
  // ...
}, (prev, next) => {
  return prev.messages === next.messages;
});
```

**6.2 Virtualisierung für lange Listen**
- Library mit vielen Items → `react-window` oder `@tanstack/react-virtual`
- Chat mit vielen Nachrichten → Virtualisierung

**6.3 Image Optimization**
- Lazy loading für Library thumbnails
- `loading="lazy"` für alle Bilder
- WebP format bevorzugen

---

### 7. **N+1 Query Problem** 🗄️

**Problem**: In `chatStore.v2.ts` (wenn wir später Chat zu Supabase migrieren):
```typescript
// Aktuell (ineffizient):
conversations.forEach(conv => {
  const messages = await fetchMessages(conv.id); // N queries!
});

// Fix mit JOIN:
const { data } = await supabase
  .from('conversations')
  .select(`
    *,
    messages (*)
  `)
  .order('updated_at', { ascending: false });
```

---

## 🟡 **Medium (Nächster Sprint)** - P2

### 8. **Tests schreiben** 🧪

**8.1 Unit Tests (Vitest)**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```
- Test Logger utility
- Test Validation functions
- Test Rate Limiter
- Test Store logic

**8.2 E2E Tests (Playwright)**
```bash
npm init playwright@latest
```
- Test Chat flow
- Test Image generation flow
- Test Library management

---

### 9. **Monitoring & Observability** 📊

**9.1 Sentry Integration**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```
- Error tracking
- Performance monitoring
- User feedback widget

**9.2 Vercel Analytics**
```bash
npm install @vercel/analytics
```
- Page views
- User behavior
- Core Web Vitals

**9.3 Upstash Redis für Rate Limiting**
- Aktuell: In-memory (funktioniert nur mit einem Server)
- Production: Redis-basiert für Multi-Server Setup

---

### 10. **Accessibility (a11y)** ♿

- [ ] Keyboard Navigation testen
- [ ] Screen Reader Support
- [ ] ARIA Labels hinzufügen
- [ ] Focus Management (Lightbox, Modals)
- [ ] Color Contrast (WCAG AA Standard)

**Tools:**
```bash
npm install -D @axe-core/react
npm install -D eslint-plugin-jsx-a11y
```

---

### 11. **SEO Optimierung** 🔍

- [ ] Meta Tags für /chat, /library
- [ ] Open Graph Images
- [ ] Sitemap generieren
- [ ] robots.txt konfigurieren
- [ ] Structured Data (JSON-LD)

---

## 🟢 **Nice to Have (Future)** - P3

### 12. **Chat zu Supabase migrieren** 🔄
- **Aktuell**: localStorage (funktioniert gut für MVP)
- **Future**: Supabase (für Cross-Device Sync)
- **Wann**: Wenn User Multi-Device Support wollen

---

### 13. **Real-time Features** ⚡
- Supabase Realtime Subscriptions
- Live Chat updates
- Collaborative features

---

### 14. **Server Actions statt API Routes** 🚀
- Next.js 15 Server Actions
- Weniger Boilerplate
- Bessere Type Safety
- Automatische Revalidation

---

### 15. **Internationalization (i18n)** 🌍
- English version
- Multi-language support
- `next-intl` oder `next-i18next`

---

### 16. **PWA (Progressive Web App)** 📱
- Offline Support
- Install Prompt
- Push Notifications
- `next-pwa` package

---

## 🎯 **Priorität für JETZT:**

1. ✅ **API Keys rotieren** (5 Minuten)
2. ✅ **RLS aktivieren** (10 Minuten)
3. 🔄 **Remaining console.logs entfernen** (30 Minuten)
4. 🔄 **Alle API Routes mit Rate Limiting & Validation** (1 Stunde)
5. 🔄 **ChatArea.tsx refactoren** (2 Stunden)

---

## ❓ **Was willst du als nächstes angehen?**

Optionen:
- **A)** Remaining console.logs entfernen (Quick Win)
- **B)** Alle API Routes sichern (Rate Limiting + Validation)
- **C)** ChatArea.tsx refactoren (Code Quality)
- **D)** Tests schreiben (Quality Assurance)
- **E)** Monitoring Setup (Sentry) (Production Readiness)
