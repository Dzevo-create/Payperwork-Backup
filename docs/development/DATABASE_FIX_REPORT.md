# Datenbank-Probleme & Lösungen

## Problem: Chats werden nicht mehr angezeigt

### Root Cause
Der Code erwartet **7 Datenbankfelder**, die in den Tabellen **NICHT existieren**:

#### Messages Tabelle - 6 fehlende Felder:
1. `was_generated_with_c1` (BOOLEAN)
2. `generation_type` (TEXT)
3. `generation_attempt` (INTEGER)
4. `generation_max_attempts` (INTEGER)
5. `is_c1_streaming` (BOOLEAN)
6. `reply_to` (JSONB)

#### Library Items Tabelle - 1 fehlendes Feld:
1. `is_favorite` (BOOLEAN)

### Warum die Chats nicht geladen werden

Wenn `fetchConversations()` aufgerufen wird:
1. Lädt alle Conversations aus Supabase ✅
2. Für jede Conversation werden Messages geladen
3. **PROBLEM**: `fetchMessages()` versucht die fehlenden Felder zu lesen
4. Felder kommen als `undefined` zurück
5. Messages werden nicht korrekt verarbeitet
6. Conversations erscheinen leer oder werden nicht angezeigt

## Lösung

### ✅ ERLEDIGT:

1. **schema.sql aktualisiert** ([supabase/schema.sql](supabase/schema.sql))
   - Alle 7 fehlenden Felder hinzugefügt
   - CHECK constraints für generation_type
   - Performance-Indizes erstellt
   - Dokumentation als COMMENT hinzugefügt

2. **Migration erstellt** ([supabase/migrations/002_add_message_fields.sql](supabase/migrations/002_add_message_fields.sql))
   - ALTER TABLE statements für bestehende Datenbank
   - Sicher mit `IF NOT EXISTS` - kann mehrfach ausgeführt werden
   - Alle Indizes und Dokumentation

### 🔴 NOCH ZU TUN:

1. **Migration in Supabase ausführen**
   - Gehe zu deinem Supabase Dashboard
   - SQL Editor öffnen
   - Inhalt von `supabase/migrations/002_add_message_fields.sql` kopieren
   - SQL ausführen

2. **Testen**
   - Neue Conversation erstellen
   - Message mit C1 (Super Chat) senden
   - Prüfen ob Conversation in Sidebar erscheint
   - Bild zur Library hinzufügen
   - Als Favorit markieren

## Zusätzliche Probleme gefunden

### localStorage vs Supabase

**Aktuelles Problem:**
- User IDs werden in localStorage gespeichert
- Bei Browser-Wechsel = neue User ID
- Alte Conversations nicht mehr sichtbar

**Empfehlung:**
- Supabase Auth implementieren
- Echte User-Authentifizierung
- Dann werden Conversations dauerhaft gespeichert

### Bilder & Videos

**Aktuelles Problem:**
- Videos werden NICHT zu Supabase hochgeladen
- Bleiben auf externen CDNs (Kling, Fal.ai)
- Können nach einiger Zeit ablaufen

**Betroffen:**
- [hooks/useVideoQueue.ts:142](hooks/useVideoQueue.ts#L142)

**Fix:**
```typescript
// Video von CDN herunterladen und zu Supabase hochladen
const response = await fetch(videoUrl);
const blob = await response.blob();
const supabaseUrl = await uploadFile(blob, fileName, 'video');
onVideoReady(video.messageId, supabaseUrl);
```

### Row Level Security (RLS)

**Aktuelles Problem:**
- RLS Policies erlauben ALLES: `USING (true)`
- Jeder User kann Daten von allen Users sehen/ändern
- **Nicht production-ready!**

**Betroffen:**
- [supabase/schema.sql:70-72](supabase/schema.sql#L70-L72)

**Fix nach Supabase Auth:**
```sql
-- Nur eigene Daten sehen
CREATE POLICY "Users see own data" ON conversations
  FOR ALL USING (auth.uid()::text = user_id);
```

## Migration ausführen

### Option 1: Supabase Dashboard (EMPFOHLEN)

1. Öffne https://supabase.com/dashboard
2. Wähle dein Projekt
3. Gehe zu "SQL Editor"
4. Klicke "New Query"
5. Kopiere den Inhalt von `supabase/migrations/002_add_message_fields.sql`
6. Klicke "Run"

### Option 2: Supabase CLI

```bash
# Supabase CLI installieren (falls nicht vorhanden)
npm install -g supabase

# Migration ausführen
supabase db push
```

### Option 3: Direkt in PostgreSQL

```bash
# Verbinde mit deiner Supabase Datenbank
psql -h db.your-project.supabase.co -U postgres -d postgres

# Führe die Migration aus
\i supabase/migrations/002_add_message_fields.sql
```

## Nächste Schritte (Priorität)

1. ✅ Schema & Migration erstellt
2. 🔴 **Migration in Supabase ausführen** (JETZT!)
3. 🟡 Error Logging testen (Library add item)
4. 🟡 Video Persistenz fixen
5. 🟡 Supabase Auth implementieren
6. 🟡 RLS Policies sichern

## Zusammenfassung

**Was wurde gemacht:**
- ✅ 7 fehlende Datenbankfelder identifiziert
- ✅ schema.sql vollständig aktualisiert
- ✅ Migration Script erstellt
- ✅ Error Logging in supabase-library.ts verbessert
- ✅ Zusätzliche Probleme dokumentiert

**Was muss noch gemacht werden:**
- 🔴 Migration in Supabase ausführen (5 Min)
- 🟡 Video Upload zu Supabase implementieren (30 Min)
- 🟡 Supabase Auth implementieren (2-3 Stunden)
- 🟡 RLS Policies korrigieren (1 Stunde)

**Danach ist die App production-ready für:**
- ✅ Chat Persistenz
- ✅ Library Management
- ✅ Super Chat (C1) Features
- ✅ Image & Video Generation
