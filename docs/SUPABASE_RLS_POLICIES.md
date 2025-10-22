# Supabase Row Level Security (RLS) Policies

Diese Datei dokumentiert alle erforderlichen RLS-Policies für die Payperwork-Datenbank.

## Wichtig: Security First!

**ALLE TABELLEN MÜSSEN RLS AKTIVIERT HABEN!**

Ohne RLS-Policies können alle Nutzer auf die Daten aller anderen Nutzer zugreifen.

## Setup-Schritte in Supabase

### 1. Enable RLS auf allen Tabellen

Führe diese SQL-Befehle in der Supabase SQL Editor aus:

```sql
-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_slides ENABLE ROW LEVEL SECURITY;
```

### 2. conversations Tabelle

Nur der Besitzer kann seine eigenen Konversationen sehen und bearbeiten.

```sql
-- Policy: Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own conversations
CREATE POLICY "Users can insert own conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own conversations
CREATE POLICY "Users can update own conversations"
  ON conversations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own conversations
CREATE POLICY "Users can delete own conversations"
  ON conversations
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 3. messages Tabelle

Nur der Besitzer der Konversation kann die Nachrichten sehen.

```sql
-- Policy: Users can only see messages from their own conversations
CREATE POLICY "Users can view own messages"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Policy: Users can only insert messages to their own conversations
CREATE POLICY "Users can insert own messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Policy: Users can only delete messages from their own conversations
CREATE POLICY "Users can delete own messages"
  ON messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );
```

### 4. library_items Tabelle

Nur der Besitzer kann seine eigenen Library Items sehen und bearbeiten.

```sql
-- Policy: Users can only see their own library items
CREATE POLICY "Users can view own library items"
  ON library_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own library items
CREATE POLICY "Users can insert own library items"
  ON library_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own library items
CREATE POLICY "Users can update own library items"
  ON library_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own library items
CREATE POLICY "Users can delete own library items"
  ON library_items
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 5. presentations Tabelle

Nur der Besitzer kann seine eigenen Präsentationen sehen und bearbeiten.

```sql
-- Policy: Users can only see their own presentations
CREATE POLICY "Users can view own presentations"
  ON presentations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own presentations
CREATE POLICY "Users can insert own presentations"
  ON presentations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own presentations
CREATE POLICY "Users can update own presentations"
  ON presentations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own presentations
CREATE POLICY "Users can delete own presentations"
  ON presentations
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 6. presentation_slides Tabelle

Nur der Besitzer der Präsentation kann die Slides sehen.

```sql
-- Policy: Users can only see slides from their own presentations
CREATE POLICY "Users can view own presentation slides"
  ON presentation_slides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = presentation_slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  );

-- Policy: Users can only insert slides to their own presentations
CREATE POLICY "Users can insert own presentation slides"
  ON presentation_slides
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = presentation_slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  );

-- Policy: Users can only update slides from their own presentations
CREATE POLICY "Users can update own presentation slides"
  ON presentation_slides
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = presentation_slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = presentation_slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  );

-- Policy: Users can only delete slides from their own presentations
CREATE POLICY "Users can delete own presentation slides"
  ON presentation_slides
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = presentation_slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  );
```

### 7. Storage Buckets

Auch Storage Buckets brauchen RLS-Policies!

```sql
-- Enable RLS on storage buckets
-- (Dies muss in der Supabase UI unter Storage > Policies gemacht werden)

-- Bucket: 'uploads'
-- Policy: Users can only upload to their own folder
CREATE POLICY "Users can upload own files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can only view their own files
CREATE POLICY "Users can view own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can only delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Testen der RLS-Policies

### 1. Manueller Test in Supabase

1. Erstelle zwei Test-User in Supabase Auth
2. Logge dich als User A ein
3. Erstelle einige Konversationen, Messages, Library Items
4. Logge dich als User B ein
5. Versuche, die Daten von User A abzurufen
6. ✅ Erfolg: User B sieht KEINE Daten von User A

### 2. Automated Tests

Siehe `__tests__/lib/supabase-rls.test.ts` für automatisierte RLS-Tests.

```bash
npm test -- supabase-rls
```

## Wichtige Hinweise

### ⚠️ auth.uid() ist NULL für unauthentifizierte User

Wenn ein User nicht eingeloggt ist, gibt `auth.uid()` NULL zurück.
Das bedeutet, dass **ALLE** Queries fehlschlagen werden (keine Daten sichtbar).

### ✅ Das ist gewollt!

Unauthentifizierte User sollen **KEINE** Daten sehen können.

### 🔒 Service Role Key umgeht RLS

Der `SUPABASE_SERVICE_ROLE_KEY` umgeht alle RLS-Policies!
**Niemals** den Service Role Key im Frontend verwenden!

Nur in Server-seitigen API-Routes verwenden, wo Admin-Zugriff benötigt wird.

### 📝 Migration von bestehendem Code

Alle Stellen im Code, die `user_id` verwenden, müssen aktualisiert werden:

**Vorher (localStorage-basiert):**

```typescript
const userId = getSupabaseUserId(); // Returns localStorage ID
```

**Nachher (Auth-basiert):**

```typescript
const user = await requireAuth(request);
const userId = user.id; // Returns Supabase auth.uid()
```

## Deployment Checklist

Vor dem Go-Live:

- [ ] RLS auf allen Tabellen aktiviert
- [ ] Alle Policies erstellt und getestet
- [ ] Storage Policies konfiguriert
- [ ] Manuelle Tests durchgeführt
- [ ] Automated Tests bestehen
- [ ] Code migriert (kein localStorage mehr)
- [ ] Service Role Key nur server-seitig verwendet

## Weitere Ressourcen

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
