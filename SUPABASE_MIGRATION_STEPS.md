# Supabase Migration: Schritt-für-Schritt

**Datum:** 2025-10-22
**Problem:** Datenbanken bei Style Transfer und CAD funktionieren nicht
**Fehler:** `ERROR: P0001: RLS not enabled on style_transfer`

---

## 🚨 Der Fehler bedeutet:

Die Tabellen `style_transfer` und `render_to_cad` existieren **NICHT** in deiner Supabase-Datenbank oder RLS ist deaktiviert.

---

## ✅ LÖSUNG: 3 Schritte

### Schritt 0: Prüfen (OPTIONAL)

**Führe aus:** `supabase/migrations/000_check_tables.sql`

Das Script prüft, ob die Tabellen existieren und gibt dir eine klare Antwort.

---

### Schritt 1: Tabellen erstellen

**Führe in Supabase SQL Editor aus (in dieser Reihenfolge):**

#### 1.1 Style Transfer Tabelle

```bash
# Kopiere KOMPLETTEN Inhalt von:
supabase/migrations/013_style_transfer_table.sql

# Füge in Supabase SQL Editor ein
# Klicke "Run"
```

**Erwartete Ausgabe:**

```
CREATE TABLE
CREATE INDEX (4x)
ALTER TABLE
CREATE POLICY (4x)
CREATE FUNCTION
CREATE TRIGGER
```

#### 1.2 Render to CAD Tabelle

```bash
# Kopiere KOMPLETTEN Inhalt von:
supabase/migrations/015_render_to_cad_table.sql

# Füge in Supabase SQL Editor ein
# Klicke "Run"
```

**Erwartete Ausgabe:**

```
CREATE TABLE
CREATE INDEX (4x)
CREATE FUNCTION
CREATE TRIGGER
```

---

### Schritt 2: RLS-Policies fixen

**Jetzt führe aus:**

```bash
# Kopiere KOMPLETTEN Inhalt von:
supabase/migrations/016_fix_rls_policies_development.sql

# Füge in Supabase SQL Editor ein
# Klicke "Run"
```

**Erwartete Ausgabe:**

```
ALTER TABLE (2x)
DROP POLICY (4x)
CREATE POLICY (8x)
NOTICE: ✅ RLS is enabled on both tables
NOTICE: ✅ All policies created successfully
NOTICE:    - style_transfer: 4 policies
NOTICE:    - render_to_cad: 4 policies
```

---

### Schritt 3: Verifizieren

**Führe diese Query aus:**

```sql
-- Prüfe Tabellen
SELECT table_name, (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.table_name) as policy_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('style_transfer', 'render_to_cad');
```

**Erwartetes Ergebnis:**

```
table_name       | policy_count
-----------------|-------------
style_transfer   | 4
render_to_cad    | 4
```

---

## 🧪 API-Tests

**Nach erfolgreicher Migration, teste die API-Routen:**

### Test 1: Style Transfer Save

```bash
curl -X POST http://localhost:3000/api/style-transfer/save-generation \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user",
    "url": "https://example.com/test.jpg",
    "type": "render",
    "model": "nano-banana",
    "name": "Test Generation"
  }'
```

**Expected:** `{"success": true, ...}`

### Test 2: Render to CAD Save

```bash
curl -X POST http://localhost:3000/api/render-to-cad/save-generation \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user",
    "url": "https://example.com/test-cad.jpg",
    "type": "render",
    "model": "imagen-3",
    "name": "Test CAD"
  }'
```

**Expected:** `{"success": true, ...}`

---

## ⚠️ Wichtig

### Development Mode

Die aktuellen Policies sind **OFFEN** für Development:

```sql
USING (true)  -- Jeder kann alles sehen/ändern
```

**Vor Production:**

1. Ersetze Development-Policies mit Production-Policies
2. Implementiere echte Supabase Auth
3. Teste mit echten Benutzern

(Details siehe Migration 016, kommentierte Policies am Ende)

---

## 🔍 Troubleshooting

### Problem: "relation does not exist"

**Lösung:** Führe Migration 013 und 015 aus (Tabellen fehlen)

### Problem: "RLS not enabled"

**Lösung:** Führe Migration 016 aus (RLS aktivieren)

### Problem: "new row violates row-level security policy"

**Lösung:** Policies fehlen, führe Migration 016 aus

### Problem: API gibt 401 Unauthorized

**Lösung:** Development Mode ist aktiv in middleware.ts, starte Server neu

---

## 📊 Checkliste

- [ ] Migration 013 ausgeführt (Style Transfer Tabelle)
- [ ] Migration 015 ausgeführt (Render to CAD Tabelle)
- [ ] Migration 016 ausgeführt (RLS-Policies)
- [ ] Verifizierung durchgeführt (beide Tabellen, je 4 Policies)
- [ ] API-Test 1: Style Transfer Save funktioniert
- [ ] API-Test 2: Render to CAD Save funktioniert

---

## 🚀 Quick Commands

**Alles in einem (kopiere in Supabase SQL Editor):**

```sql
-- 1. Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('style_transfer', 'render_to_cad');

-- 2. If empty, run migrations 013 and 015 first!

-- 3. Then verify policies
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('style_transfer', 'render_to_cad')
ORDER BY tablename, policyname;

-- Expected: 8 policies (4 per table)
```

---

**Status:** ✅ Migrationen bereit
**Nächster Schritt:** Führe Schritte 1-3 in Supabase aus
