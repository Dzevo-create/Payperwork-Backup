# Sketch-to-Render Database Setup

## ⚠️ WICHTIG: Diese Migration muss ausgeführt werden!

Die Sketch-to-Render Datenbank ist jetzt implementiert, aber die Tabelle muss noch in Supabase erstellt werden.

## 📋 Setup Schritte:

### Option 1: Supabase Dashboard (Empfohlen)

1. Gehe zu [Supabase Dashboard](https://app.supabase.com)
2. Wähle dein Projekt aus
3. Navigiere zu **SQL Editor**
4. Klicke auf **New Query**
5. Kopiere den gesamten Inhalt aus:
   ```
   supabase/migrations/004_sketch_to_render.sql
   ```
6. Füge ihn in den SQL Editor ein
7. Klicke auf **Run** (oder drücke Cmd+Enter)

### Option 2: Supabase CLI (Falls installiert)

```bash
cd /Users/dzevahiraliti/Creative\ Cloud\ Files\ Personal\ Account\ dz_aliti@hotmail.com\ 3099E26358F9F9DC0A495DB1@AdobeID/Neuer\ Ordner/Dzevahir\ Aliti\ Privat/KI\ Solutions/Cursor/Payperwork

# Migration ausführen
supabase db push
```

## ✅ Nach der Migration:

Die folgenden Features werden dann funktionieren:

1. **Persistente Speicherung**: Alle Renders, Videos und Upscales werden in der Datenbank gespeichert
2. **Laden beim Start**: Recent Generations werden automatisch aus der DB geladen
3. **Type Markers**: Videos und Upscales werden mit entsprechenden Badges angezeigt
4. **Parent-Child Beziehungen**: Videos/Upscales können auf das Original-Render verlinken

## 📊 Tabellen-Struktur:

```sql
sketch_to_render (
  id UUID PRIMARY KEY
  user_id UUID (Foreign Key zu auth.users)
  url TEXT (Bild/Video URL)
  thumbnail_url TEXT (Optional)
  type TEXT ('render', 'video', 'upscale')
  source_type TEXT ('original', 'from_render', 'from_video')
  parent_id UUID (Referenz zum Original)
  prompt TEXT
  model TEXT
  settings JSONB
  metadata JSONB
  name TEXT (Auto-generated name)
  created_at TIMESTAMP
  updated_at TIMESTAMP
)
```

## 🔐 Row Level Security (RLS):

Die Tabelle hat automatisch RLS aktiviert:
- Users können nur ihre eigenen Generierungen sehen
- Users können nur ihre eigenen Generierungen erstellen/bearbeiten/löschen

## 🎯 Nächste Schritte:

Nach der Migration wird automatisch:
1. Jede neue Generierung in der DB gespeichert
2. Videos mit "VIDEO" Badge angezeigt
3. Upscales mit "UPSCALE" Badge angezeigt
4. Recent Generations aus der DB geladen
