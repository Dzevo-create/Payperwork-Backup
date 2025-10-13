# 🔒 Security Setup Guide

## ✅ Was wurde implementiert

### 1. **Centralized Logger** ✅
- Ersetzt alle `console.log` Statements
- Production-ready (keine Logs in Production außer Errors)
- Structured Logging für Monitoring-Services (Sentry, LogRocket)
- **User Impact:** Keine - funktioniert transparent

### 2. **Error Boundaries** ✅
- App crasht nicht mehr komplett bei Fehlern
- Freundliche Fehlermeldungen mit "Erneut versuchen" Button
- Betroffene Komponente wird isoliert, Rest funktioniert weiter
- **User Impact:** Bessere Experience bei Fehlern

### 3. **Rate Limiting** ✅
- Chat: 30 Nachrichten/Minute
- Image Generation: 5 Bilder/Minute
- Video Generation: 2 Videos/Minute
- API: 60 Requests/Minute
- **User Impact:** Schutz vor Missbrauch, faire Nutzung

### 4. **Input Validation** ✅
- Validierung von Nachrichten (max 10k Zeichen)
- Validierung von Prompts (max 5k Zeichen)
- File Upload Limits:
  - Bilder: max 10MB (JPG, PNG, WebP, GIF)
  - Videos: max 100MB (MP4, WebM, MOV)
  - PDFs: max 10MB
- XSS & SQL Injection Protection
- **User Impact:** Sicherheit + bessere Fehlermeldungen

### 5. **Row Level Security (RLS) Policies** ✅
- SQL Policies erstellt (noch nicht aktiviert)
- User können nur eigene Daten sehen
- Bereit für Aktivierung nach Key-Rotation
- **User Impact:** Datenschutz + Isolation

---

## 🚨 KRITISCH: Was DU jetzt tun musst

### **SCHRITT 1: API Keys rotieren** (Pflicht vor Production!)

Deine API Keys wurden in dieser Konversation geteilt und müssen erneuert werden:

#### **OpenAI API Key erneuern:**
1. Gehe zu: https://platform.openai.com/api-keys
2. Revoke den alten Key
3. Erstelle neuen Key
4. Update in `.env.local`:
   ```bash
   OPENAI_API_KEY="sk-proj-NEW_KEY_HERE"
   ```

#### **Supabase Keys erneuern:**
1. Gehe zu: https://supabase.com/dashboard/project/wdowwqowynnwlulktxfe/settings/api
2. Reset **Service Role Key** (⚠️ Vorsicht: nur einmal sichtbar!)
3. Kopiere den neuen Key
4. Update in `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY="NEW_SERVICE_KEY_HERE"
   ```
5. Für Production: Auch Anon Key rotieren wenn möglich

#### **Vercel Environment Variables erneuern:**
1. Gehe zu: https://vercel.com/[dein-projekt]/settings/environment-variables
2. Update alle Keys dort
3. Redeploy die App

---

### **SCHRITT 2: RLS Policies aktivieren** (Nach Key-Rotation)

⚠️ **NUR NACH KEY-ROTATION AKTIVIEREN!**

1. Gehe zum Supabase SQL Editor:
   https://supabase.com/dashboard/project/wdowwqowynnwlulktxfe/sql/new

2. Führe aus: `/supabase/rls-policies.sql`

3. Erstelle die Helper Function:
   ```sql
   CREATE OR REPLACE FUNCTION set_user_id(user_id text)
   RETURNS void AS $$
   BEGIN
     PERFORM set_config('app.user_id', user_id, false);
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

4. Teste die Policies:
   ```sql
   -- Set user context
   SELECT set_user_id('user_test_123');

   -- Test query (should return 0 if no data for test user)
   SELECT COUNT(*) FROM library_items;
   ```

5. ✅ **Wenn alles funktioniert:** RLS ist aktiv und sicher!

---

### **SCHRITT 3: Storage Buckets sichern**

1. Gehe zu: https://supabase.com/dashboard/project/wdowwqowynnwlulktxfe/storage/buckets

2. Für **images** Bucket:
   - Settings → "Public bucket" deaktivieren
   - RLS Policies werden automatisch genutzt

3. Für **videos** Bucket:
   - Settings → "Public bucket" deaktivieren
   - RLS Policies werden automatisch genutzt

4. ✅ **Files sind jetzt nur für Owner sichtbar!**

---

## 📊 Monitoring Setup (Optional, aber empfohlen)

### **Sentry Integration (Error Tracking)**

1. Erstelle Account: https://sentry.io/signup/

2. Installiere Sentry:
   ```bash
   npm install @sentry/nextjs
   ```

3. Setup:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

4. Update Logger (`lib/logger.ts`):
   ```typescript
   import * as Sentry from '@sentry/nextjs';

   // In error() method:
   if (!this.isDevelopment && this.isClient) {
     Sentry.captureException(error, { extra: context });
   }
   ```

### **Upstash Redis (Production Rate Limiting)**

Aktuelles Rate Limiting ist in-memory (funktioniert, aber nicht optimal für Production mit mehreren Servern).

1. Erstelle Account: https://upstash.com/

2. Erstelle Redis Database

3. Installiere:
   ```bash
   npm install @upstash/redis
   ```

4. Update `lib/rate-limit.ts` mit Redis Backend

---

## 🧪 Testen der Security Features

### **Test 1: Rate Limiting**
```bash
# In Browser Console:
for (let i = 0; i < 35; i++) {
  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] })
  });
}
# Nach 30 Requests → 429 Error "Zu viele Anfragen"
```

### **Test 2: Input Validation**
```bash
# XSS Attempt (sollte geblockt werden):
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{
      role: 'user',
      content: '<script>alert("xss")</script>'
    }]
  })
});
# → 400 Error "Nachricht enthält unerlaubte Zeichen"
```

### **Test 3: Error Boundary**
```javascript
// In Browser Console auf /chat Seite:
throw new Error('Test Error');
// → Zeigt freundliche Fehlermeldung, App crasht nicht
```

---

## 📋 Checklist vor Production

- [ ] ✅ OpenAI API Key erneuert
- [ ] ✅ Supabase Service Role Key erneuert
- [ ] ✅ Vercel Environment Variables aktualisiert
- [ ] ✅ RLS Policies aktiviert und getestet
- [ ] ✅ Storage Buckets auf Private gestellt
- [ ] ⏸️ Sentry Setup (optional)
- [ ] ⏸️ Upstash Redis Setup (optional)
- [ ] ✅ Rate Limiting getestet
- [ ] ✅ Input Validation getestet
- [ ] ✅ Error Boundaries getestet

---

## 🚀 Deployment

Nach allen Security-Fixes:

```bash
# Test lokal
npm run build
npm start

# Wenn alles funktioniert:
git add .
git commit -m "🔒 Security: Add rate limiting, validation, RLS, error boundaries"
git push

# Vercel deployt automatisch
```

---

## 📞 Support

Bei Problemen:
1. Check Browser Console für Fehler
2. Check Vercel Logs: https://vercel.com/[dein-projekt]/logs
3. Check Supabase Logs: https://supabase.com/dashboard/project/wdowwqowynnwlulktxfe/logs

---

## 🎯 Nächste Schritte (Future)

- [ ] Supabase Auth implementieren (statt localStorage user_id)
- [ ] Real-time Subscriptions für Chat
- [ ] Server Actions statt API Routes
- [ ] Automatische Tests (Vitest, Playwright)
- [ ] CI/CD Pipeline mit Security Scans
