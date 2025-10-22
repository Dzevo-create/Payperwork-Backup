# 🚀 Quick Guide: Performance-Indexes anwenden

## Schritt 1: Supabase öffnen

```
🌐 https://supabase.com/dashboard
```

## Schritt 2: Zu SQL Editor navigieren

1. Wähle dein Projekt aus
2. Linke Sidebar → **SQL Editor**
3. Klicke **New Query**

## Schritt 3: SQL-Datei öffnen

Öffne diese Datei:

```
supabase/migrations/011_performance_indexes.sql
```

## Schritt 4: Kompletten Inhalt kopieren

Drücke `Cmd+A` (Mac) oder `Ctrl+A` (Windows) und kopiere alles

## Schritt 5: In Supabase einfügen

Füge den kopierten SQL-Code in den SQL Editor ein

## Schritt 6: Ausführen

Klicke **RUN** (oder drücke `Cmd+Enter`)

## Erwartetes Ergebnis:

```
✅ Success

NOTICE:  === Index Verification ===
NOTICE:  Table: branding, Index: idx_branding_user_id
NOTICE:  Table: conversations, Index: idx_conversations_created_at
NOTICE:  Table: conversations, Index: idx_conversations_user_created
NOTICE:  Table: conversations, Index: idx_conversations_user_id
NOTICE:  Table: library_items, Index: idx_library_items_created_at
NOTICE:  Table: library_items, Index: idx_library_items_user_id
NOTICE:  Table: library_items, Index: idx_library_items_user_type_created
NOTICE:  Table: messages, Index: idx_messages_conversation_created
NOTICE:  Table: messages, Index: idx_messages_conversation_id
NOTICE:  Table: messages, Index: idx_messages_created_at
NOTICE:  === End Index List ===
```

## Schritt 7: Verifizieren

Query ausführen:

```sql
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

Du solltest **10 Indexes** sehen!

## ✅ Fertig!

Deine Datenbank ist jetzt optimiert für:

- Schnellere RLS-Checks
- Bessere Sortierung
- Effizientere JOINs

---

**Zeit**: ~2 Minuten
**Schwierigkeit**: Einfach (Copy & Paste)
