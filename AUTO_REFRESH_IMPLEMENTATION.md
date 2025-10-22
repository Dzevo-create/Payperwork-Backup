# Auto-Refresh Implementation Guide

**Status:** ✅ Hooks erweitert, bereit zur Integration
**Datum:** 2025-10-22

---

## 🎯 Problem

**Aktuell:**

- User generiert Bild
- **Results Panel** zeigt Bild SOFORT ✅
- **"Kürzlich hinzugefügt"** lädt erst nach Page-Reload ❌
- User denkt: "Hat nicht funktioniert" → Klickt nochmal "Generate"

**Gewünscht:**

- **"Kürzlich hinzugefügt"** aktualisiert sich AUTOMATISCH nach jeder Generierung
- User sieht neue Generierung **SOFORT** in beiden Panels

---

## ✅ Lösung: 2-Schritt Approach

### 1. Optimistic Update

Neue Generierung **SOFORT** zur Liste hinzufügen (bevor DB-Save)

### 2. Auto-Refresh after Save

Nach erfolgreichem DB-Save die Liste neu laden (synced mit DB)

---

## 📝 Geänderte Hooks

### Hook #1: useDatabaseSave.ts (UPDATED)

**Datei:** `hooks/workflows/common/useDatabaseSave.ts`

**Neue Funktionalität:**

```typescript
export interface DatabaseSaveConfig {
  apiEndpoint: string;
  workflowName: string;
  onSaveComplete?: () => void; // ✅ NEW: Callback after successful save
}
```

**Verwendung:**

```typescript
const { saveGenerationToDb } = useDatabaseSave({
  apiEndpoint: "style-transfer",
  workflowName: "Style Transfer",
  onSaveComplete: () => {
    // ✅ Auto-refresh after successful DB save
    refreshGenerations();
  },
});
```

---

### Hook #2: useRecentGenerations.ts (ALREADY SUPPORTS)

**Datei:** `hooks/workflows/common/useRecentGenerations.ts`

**Existing Functionality (perfect for optimistic updates):**

```typescript
export interface UseRecentGenerations {
  recentGenerations: Generation[];
  setRecentGenerations: (
    generations: Generation[] | ((prev: Generation[]) => Generation[])
  ) => void; // ✅ Already exists!
  isLoadingGenerations: boolean;
  loadGenerations: () => Promise<void>;
  deleteGeneration: (id: string) => Promise<void>;
  refreshGenerations: () => Promise<void>; // ✅ Already exists!
}
```

**Key Functions:**

- `setRecentGenerations`: Manually update list (for optimistic updates)
- `refreshGenerations`: Reload from DB (for sync after save)

---

## 🔧 Integration in Workflow Pages

### Beispiel: Style Transfer Page

**Vorher (KEIN Auto-Refresh):**

```typescript
// ❌ OLD: No auto-refresh
const { recentGenerations } = useRecentGenerations("style-transfer");

const { saveGenerationToDb } = useDatabaseSave({
  apiEndpoint: "style-transfer",
  workflowName: "Style Transfer",
  // ❌ No callback
});

const handleGenerationSuccess = async (result: GenerationResult) => {
  // Results Panel zeigt Bild sofort ✅
  // "Kürzlich hinzugefügt" bleibt leer ❌

  // Save to DB (im Hintergrund)
  await saveGenerationToDb({
    url: result.imageUrl,
    type: "render",
    name: `Generation ${new Date().toLocaleString()}`,
    // ...
  });
};
```

**Nachher (MIT Auto-Refresh):**

```typescript
// ✅ NEW: With auto-refresh
const { recentGenerations, setRecentGenerations, refreshGenerations } =
  useRecentGenerations("style-transfer");

const { saveGenerationToDb } = useDatabaseSave({
  apiEndpoint: "style-transfer",
  workflowName: "Style Transfer",
  onSaveComplete: () => {
    // ✅ Auto-refresh after successful save
    refreshGenerations();
  },
});

const handleGenerationSuccess = async (result: GenerationResult) => {
  // ✅ STEP 1: Optimistic Update (SOFORT in UI zeigen)
  setRecentGenerations((prev) => [
    {
      id: result.id,
      imageUrl: result.imageUrl,
      timestamp: result.timestamp,
      prompt: result.prompt,
      type: "render",
      sourceType: "original",
      settings: result.settings,
    },
    ...prev,
  ]);

  // ✅ STEP 2: Save to DB (im Hintergrund)
  // onSaveComplete callback wird automatisch getriggert → refreshGenerations()
  await saveGenerationToDb({
    url: result.imageUrl,
    type: "render",
    name: `Generation ${new Date().toLocaleString()}`,
    prompt: result.prompt,
    settings: result.settings,
  });

  // ✅ ERGEBNIS:
  // - User sieht neue Generierung SOFORT in "Kürzlich hinzugefügt"
  // - Nach DB-Save wird Liste nochmal refreshed (synced mit DB)
  // - Kein Page-Reload nötig!
};
```

---

## 📄 Vollständiges Beispiel: Style Transfer Page

**Datei:** `app/workflows/style-transfer/page.tsx`

```typescript
'use client';

import { useRecentGenerations } from '@/hooks/workflows/common/useRecentGenerations';
import { useDatabaseSave } from '@/hooks/workflows/common/useDatabaseSave';
import { useStyleTransfer } from '@/hooks/workflows/style-transfer/useStyleTransfer';
import type { GenerationResult } from '@/types/workflows/common';

export default function StyleTransferPage() {
  // ✅ Get refreshGenerations and setRecentGenerations
  const {
    recentGenerations,
    setRecentGenerations,
    refreshGenerations
  } = useRecentGenerations('style-transfer');

  // ✅ Pass refreshGenerations as callback
  const { saveGenerationToDb } = useDatabaseSave({
    apiEndpoint: 'style-transfer',
    workflowName: 'Style Transfer',
    onSaveComplete: () => {
      console.log('[StyleTransfer] DB save complete, refreshing generations...');
      refreshGenerations();
    }
  });

  const { generate, isGenerating } = useStyleTransfer({
    onSuccess: async (result: GenerationResult) => {
      console.log('[StyleTransfer] Generation successful, updating UI...');

      // ✅ STEP 1: Optimistic Update (INSTANT UI update)
      setRecentGenerations(prev => [
        {
          id: result.id,
          imageUrl: result.imageUrl,
          timestamp: result.timestamp,
          prompt: result.prompt,
          type: 'render',
          sourceType: 'original',
          settings: result.settings,
        },
        ...prev
      ]);

      // ✅ STEP 2: Save to DB (background)
      // This will trigger onSaveComplete callback → refreshGenerations()
      try {
        await saveGenerationToDb({
          url: result.imageUrl,
          type: 'render',
          name: `Style Transfer ${new Date().toLocaleString()}`,
          prompt: result.prompt,
          settings: result.settings,
        });
      } catch (error) {
        console.error('[StyleTransfer] Failed to save to DB:', error);
        // ✅ ROLLBACK: Remove from UI if DB save failed
        setRecentGenerations(prev => prev.filter(g => g.id !== result.id));
      }
    }
  });

  const handleGenerate = async () => {
    if (!sourceImage?.preview) return;

    await generate(
      prompt,
      sourceImage,
      settings,
      referenceImage
    );
  };

  return (
    <div>
      {/* Generation UI */}
      <button onClick={handleGenerate} disabled={isGenerating}>
        Generate
      </button>

      {/* Results Panel (shows immediately) */}
      <ResultsPanel />

      {/* Recent Generations (now updates automatically!) */}
      <RecentGenerations generations={recentGenerations} />
    </div>
  );
}
```

---

## 🎯 Vorteile

### 1. Sofortiges Feedback

- User sieht neue Generierung **SOFORT** in "Kürzlich hinzugefügt"
- Kein Warten auf DB-Save oder Page-Reload

### 2. Synchronisiert mit DB

- Nach DB-Save: Auto-Refresh synced mit echter DB
- Garantiert Konsistenz zwischen UI und DB

### 3. Fehlerbehandlung

- Wenn DB-Save fehlschlägt: Rollback möglich
- User wird nicht mit veralteten Daten verwirrt

### 4. Skalierbar

- Funktioniert für ALLE Workflows (Branding, Furnish Empty, etc.)
- Einheitliches Pattern

---

## 📋 Integration Checklist

### Für jeden Workflow (z.B. Style Transfer):

- [ ] **Hook Setup:**
  - [ ] `const { setRecentGenerations, refreshGenerations } = useRecentGenerations(...)`
  - [ ] `useDatabaseSave({ ..., onSaveComplete: () => refreshGenerations() })`

- [ ] **Optimistic Update:**
  - [ ] In `onSuccess` callback: `setRecentGenerations(prev => [newItem, ...prev])`

- [ ] **DB Save:**
  - [ ] Call `saveGenerationToDb(...)` after optimistic update
  - [ ] Add error handling with rollback

- [ ] **Testing:**
  - [ ] Generate image
  - [ ] Verify "Kürzlich hinzugefügt" updates IMMEDIATELY
  - [ ] Verify list refreshes after DB save
  - [ ] Test error case (DB save fails)

---

## 🧪 Testing Scenarios

### Test #1: Normal Flow

```
1. User generiert Bild
2. Results Panel zeigt Bild SOFORT ✅
3. "Kürzlich hinzugefügt" zeigt Bild SOFORT ✅
4. Nach ~1 Sekunde (DB save complete): Liste bleibt unverändert ✅
```

### Test #2: Multiple Generations

```
1. User generiert Bild A
2. "Kürzlich hinzugefügt" zeigt A SOFORT ✅
3. User generiert Bild B
4. "Kürzlich hinzugefügt" zeigt [B, A] SOFORT ✅
5. Nach DB saves: Liste korrekt [B, A] ✅
```

### Test #3: DB Save Failure

```
1. User generiert Bild
2. "Kürzlich hinzugefügt" zeigt Bild SOFORT ✅
3. DB save schlägt fehl ❌
4. Bild wird aus "Kürzlich hinzugefügt" entfernt ✅
5. Error message an User ✅
```

---

## 🚀 Deployment

### Phase 1: Core Hooks (DONE ✅)

- ✅ `useDatabaseSave.ts` updated with `onSaveComplete` callback
- ✅ `useRecentGenerations.ts` already supports optimistic updates

### Phase 2: Workflow Integration (TODO)

- [ ] Style Transfer page
- [ ] Branding page
- [ ] Furnish Empty page
- [ ] Sketch to Render page (if needed)

### Phase 3: Testing (TODO)

- [ ] Manual testing all workflows
- [ ] Edge cases (errors, multiple generations)
- [ ] Performance testing

---

## 💡 Best Practices

### 1. Optimistic Update First

```typescript
// ✅ GOOD: Update UI first, then save to DB
setRecentGenerations(prev => [newItem, ...prev]);
await saveGenerationToDb(...);
```

```typescript
// ❌ BAD: Wait for DB save before UI update
await saveGenerationToDb(...);
setRecentGenerations(prev => [newItem, ...prev]); // User waits!
```

### 2. Error Handling with Rollback

```typescript
try {
  await saveGenerationToDb(...);
} catch (error) {
  // Rollback optimistic update
  setRecentGenerations(prev => prev.filter(g => g.id !== result.id));
  showError('Failed to save generation');
}
```

### 3. Unique IDs

```typescript
// ✅ GOOD: Use timestamp-based IDs for immediate generations
const id = `style-transfer-${Date.now()}`;

// ❌ BAD: Wait for DB to generate ID
const id = await saveAndGetId(); // User waits!
```

---

## 🎉 Resultat

**Vorher:**

```
User: *generiert Bild*
Results Panel: ✅ Zeigt Bild sofort
"Kürzlich hinzugefügt": ❌ Leer (bis Page-Reload)
User: "Hat nicht funktioniert?" → Generiert nochmal
```

**Nachher:**

```
User: *generiert Bild*
Results Panel: ✅ Zeigt Bild sofort
"Kürzlich hinzugefügt": ✅ Zeigt Bild sofort (optimistic update)
*Nach 1 Sek*: ✅ DB-Save complete, Liste refreshed
User: 😊 "Super, funktioniert!"
```

---

**Status:** ✅ Hooks bereit, Integration in Workflow-Pages nötig
**Aufwand pro Workflow:** ~15-20 Minuten
**Nächster Schritt:** Integration in Style Transfer Page als Beispiel
