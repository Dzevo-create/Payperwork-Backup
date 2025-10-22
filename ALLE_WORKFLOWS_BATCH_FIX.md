# Batch-Fix für ALLE Workflows

**Datum:** 2025-10-22
**Status:** ⏸️ Bereit zur Anwendung (NICHT gepusht)
**Betroffene Workflows:** 5 (Alle)

---

## 🎯 Zusammenfassung

Fix #1 (Style Transfer) wurde bereits implementiert und gepusht.
Die anderen 4 Workflows haben **identische Probleme** und brauchen **identische Fixes**.

---

## ✅ BEREITS GEFIXT (Gepusht)

- ✅ **Style Transfer** - Fix #1 (Reference Caching)
- ✅ **Style Transfer** - Fix #2 (Edit API Hook erstellt)
- ✅ **Branding** - Fix #2 (Edit API Hook erstellt)
- ✅ **Furnish Empty** - Fix #2 (Edit API Hook erstellt)

---

## ⏸️ NOCH ZU FIXEN (Lokal, nicht gepusht)

### Fix #1: Reference Image Caching

**Betroffene Dateien:**

1. `hooks/workflows/sketch-to-render/useSketchToRender.ts`
2. `hooks/workflows/branding/useBranding.ts`
3. `hooks/workflows/furnish-empty/useFurnishEmpty.ts`

### Fix #2: Edit API Hooks

**Fehlende Dateien:**

1. `hooks/workflows/sketch-to-render/useSketchToRenderEdit.ts` (NEU)
2. `hooks/workflows/render-to-cad/useRenderToCadEdit.ts` (NEU)

**Adapter anpassen:**

- `hooks/workflows/adapters/useWorkflowAdapter.ts`

---

## 📝 FIX #1: Reference Image Caching Template

**Anwenden auf:**

- `hooks/workflows/sketch-to-render/useSketchToRender.ts`
- `hooks/workflows/branding/useBranding.ts`
- `hooks/workflows/furnish-empty/useFurnishEmpty.ts`

### SUCH NACH:

```typescript
  const generate = useCallback(
    async (
      prompt: string,
      sourceImage: ImageData,
      settings: ...,
      referenceImage?: ImageData
    ): Promise<GenerationResult | null> => {
      // ... existing code ...
    },
    []
  );
```

### ERSETZE MIT:

```typescript
// ✅ FIXED: Removed useCallback to prevent reference image caching
// The empty dependency array [] was causing React to memoize the function
// with stale referenceImage values. Now the function is recreated on each
// render, ensuring fresh parameter values are always used.
const generate = async (
  prompt: string,
  sourceImage: ImageData,
  settings: SketchToRenderSettingsType, // ← ANPASSEN je nach Workflow!
  referenceImage?: ImageData
): Promise<GenerationResult | null> => {
  // ... existing validation code ...

  try {
    // ... existing code bis zum referenceImage Teil ...

    // ✅ FIXED: Enhanced reference image validation
    // Validates that referenceImage exists, has preview data,
    // and contains a valid base64 image (minimum 100 chars)
    if (referenceImage?.preview) {
      const refPreview = referenceImage.preview.trim();

      // Validate it's a base64 image
      if (refPreview.startsWith("data:image/")) {
        const refBase64 = refPreview.split(",")[1] || "";
        const refMimeType = refPreview.split(";")[0]?.split(":")[1] || "image/jpeg";

        // Additional validation: minimum 100 characters (prevents empty/corrupt images)
        if (refBase64 && refBase64.length > 100) {
          payload.referenceImage = {
            data: refBase64,
            mimeType: refMimeType,
          };

          console.log("[WorkflowName] Using reference image:", {
            // ← ANPASSEN je nach Workflow!
            mimeType: refMimeType,
            size: refBase64.length,
            timestamp: Date.now(),
          });
        } else {
          console.warn("[WorkflowName] Reference image too small, ignoring"); // ← ANPASSEN!
        }
      } else {
        console.warn("[WorkflowName] Invalid reference image format, ignoring"); // ← ANPASSEN!
      }
    } else {
      console.log("[WorkflowName] No reference image provided"); // ← ANPASSEN!
    }

    // ... rest of existing code ...
  } catch (err) {
    // ... existing error handling ...
  } finally {
    // ... existing cleanup ...
  }
};
```

### Anpassungen pro Workflow:

#### Sketch to Render:

```typescript
settings: SketchToRenderSettingsType,
console.log('[SketchToRender] Using reference image:', ...);
console.warn('[SketchToRender] Reference image too small, ignoring');
console.warn('[SketchToRender] Invalid reference image format, ignoring');
console.log('[SketchToRender] No reference image provided');
```

#### Branding:

```typescript
settings: BrandingSettingsType,
console.log('[Branding] Using reference image:', ...);
console.warn('[Branding] Reference image too small, ignoring');
console.warn('[Branding] Invalid reference image format, ignoring');
console.log('[Branding] No reference image provided');
```

#### Furnish Empty:

```typescript
settings: FurnishEmptySettingsType,
console.log('[FurnishEmpty] Using reference image:', ...);
console.warn('[FurnishEmpty] Reference image too small, ignoring');
console.warn('[FurnishEmpty] Invalid reference image format, ignoring');
console.log('[FurnishEmpty] No reference image provided');
```

---

## 📝 FIX #2: Fehlende Edit-Hooks

### Datei 1: `hooks/workflows/sketch-to-render/useSketchToRenderEdit.ts` (NEU)

```typescript
// hooks/workflows/sketch-to-render/useSketchToRenderEdit.ts
"use client";

import { useRenderEdit } from "../common/useRenderEdit";

/**
 * Sketch to Render Edit Hook
 *
 * Wrapper around useRenderEdit that automatically uses the correct
 * API endpoint for Sketch to Render workflow (/api/sketch-to-render/edit)
 *
 * Usage:
 *   const { editRender, isEditing } = useSketchToRenderEdit();
 */
export function useSketchToRenderEdit(options = {}) {
  return useRenderEdit({
    ...options,
    apiEndpoint: "/api/sketch-to-render/edit",
  });
}
```

### Datei 2: `hooks/workflows/render-to-cad/useRenderToCadEdit.ts` (NEU)

```typescript
// hooks/workflows/render-to-cad/useRenderToCadEdit.ts
"use client";

import { useRenderEdit } from "../common/useRenderEdit";

/**
 * Render to CAD Edit Hook
 *
 * Wrapper around useRenderEdit that automatically uses the correct
 * API endpoint for Render to CAD workflow (/api/render-to-cad/edit)
 *
 * Usage:
 *   const { editRender, isEditing } = useRenderToCadEdit();
 */
export function useRenderToCadEdit(options = {}) {
  return useRenderEdit({
    ...options,
    apiEndpoint: "/api/render-to-cad/edit",
  });
}
```

---

## 📝 FIX #2: Adapter anpassen

**Datei:** `hooks/workflows/adapters/useWorkflowAdapter.ts`

### SCHRITT 1: Imports hinzufügen (am Anfang der Datei)

**NACH:**

```typescript
import { useRenderEdit } from "../common/useRenderEdit";
```

**FÜGE HINZU:**

```typescript
// ✅ Workflow-specific edit hooks
import { useSketchToRenderEdit } from "../sketch-to-render/useSketchToRenderEdit";
import { useBrandingEdit } from "../branding/useBrandingEdit";
import { useStyleTransferEdit } from "../style-transfer/useStyleTransferEdit";
import { useFurnishEmptyEdit } from "../furnish-empty/useFurnishEmptyEdit";
import { useRenderToCadEdit } from "../render-to-cad/useRenderToCadEdit";
```

### SCHRITT 2: Edit Adapter Functions erstellen

**FÜGE HINZU (am Ende der Datei, vor dem letzten Export):**

```typescript
// ========================================
// EDIT ADAPTERS (Workflow-specific)
// ========================================

/**
 * Sketch to Render Edit Adapter
 * Uses /api/sketch-to-render/edit
 */
export function useSketchToRenderEditAdapter(): StandardEditHook {
  const hook = useSketchToRenderEdit();

  return {
    edit: async (params) => {
      const imageUrl = await hook.editRender(
        params.editPrompt,
        params.currentImageUrl,
        params.originalPrompt,
        params.referenceImages
      );

      if (!imageUrl) return null;

      return {
        imageUrl,
        id: `sketch-edit-${Date.now()}`,
        timestamp: new Date(),
      };
    },
    isEditing: hook.isEditing,
    error: hook.error,
  };
}

/**
 * Branding Edit Adapter
 * Uses /api/branding/edit
 */
export function useBrandingEditAdapter(): StandardEditHook {
  const hook = useBrandingEdit();

  return {
    edit: async (params) => {
      const imageUrl = await hook.editRender(
        params.editPrompt,
        params.currentImageUrl,
        params.originalPrompt,
        params.referenceImages
      );

      if (!imageUrl) return null;

      return {
        imageUrl,
        id: `branding-edit-${Date.now()}`,
        timestamp: new Date(),
      };
    },
    isEditing: hook.isEditing,
    error: hook.error,
  };
}

/**
 * Style Transfer Edit Adapter
 * Uses /api/style-transfer/edit
 */
export function useStyleTransferEditAdapter(): StandardEditHook {
  const hook = useStyleTransferEdit();

  return {
    edit: async (params) => {
      const imageUrl = await hook.editRender(
        params.editPrompt,
        params.currentImageUrl,
        params.originalPrompt,
        params.referenceImages
      );

      if (!imageUrl) return null;

      return {
        imageUrl,
        id: `style-transfer-edit-${Date.now()}`,
        timestamp: new Date(),
      };
    },
    isEditing: hook.isEditing,
    error: hook.error,
  };
}

/**
 * Furnish Empty Edit Adapter
 * Uses /api/furnish-empty/edit
 */
export function useFurnishEmptyEditAdapter(): StandardEditHook {
  const hook = useFurnishEmptyEdit();

  return {
    edit: async (params) => {
      const imageUrl = await hook.editRender(
        params.editPrompt,
        params.currentImageUrl,
        params.originalPrompt,
        params.referenceImages
      );

      if (!imageUrl) return null;

      return {
        imageUrl,
        id: `furnish-edit-${Date.now()}`,
        timestamp: new Date(),
      };
    },
    isEditing: hook.isEditing,
    error: hook.error,
  };
}

/**
 * Render to CAD Edit Adapter
 * Uses /api/render-to-cad/edit
 */
export function useRenderToCadEditAdapter(): StandardEditHook {
  const hook = useRenderToCadEdit();

  return {
    edit: async (params) => {
      const imageUrl = await hook.editRender(
        params.editPrompt,
        params.currentImageUrl,
        params.originalPrompt,
        params.referenceImages
      );

      if (!imageUrl) return null;

      return {
        imageUrl,
        id: `cad-edit-${Date.now()}`,
        timestamp: new Date(),
      };
    },
    isEditing: hook.isEditing,
    error: hook.error,
  };
}
```

### SCHRITT 3: Alte useRenderEditAdapter() ersetzen/löschen

**SUCHE NACH:**

```typescript
export function useRenderEditAdapter(): StandardEditHook {
  const hook = useRenderEdit(); // ❌ Generic hook without apiEndpoint

  return {
    edit: async (params) => {
      // ...
    },
    isEditing: hook.isEditing,
    error: hook.error,
  };
}
```

**AKTION:**

- **Option A:** Lösche diese Funktion komplett
- **Option B:** Ersetze mit `useSketchToRenderEditAdapter()` (falls Sketch to Render der Default ist)
- **Option C:** Deprecate und behalte für Backward Compatibility:

```typescript
/**
 * @deprecated Use workflow-specific edit adapters instead:
 * - useSketchToRenderEditAdapter()
 * - useBrandingEditAdapter()
 * - useStyleTransferEditAdapter()
 * - useFurnishEmptyEditAdapter()
 * - useRenderToCadEditAdapter()
 */
export function useRenderEditAdapter(): StandardEditHook {
  // Default to Sketch to Render for backward compatibility
  return useSketchToRenderEditAdapter();
}
```

---

## 📋 Anwendungs-Checkliste

### Fix #1: Reference Caching (3 Dateien)

- [ ] **Sketch to Render:**
  - [ ] Öffne `hooks/workflows/sketch-to-render/useSketchToRender.ts`
  - [ ] Suche `const generate = useCallback(`
  - [ ] Ersetze mit Template oben
  - [ ] Ändere `SketchToRenderSettingsType`
  - [ ] Ändere Logging `[SketchToRender]`
  - [ ] Speichern

- [ ] **Branding:**
  - [ ] Öffne `hooks/workflows/branding/useBranding.ts`
  - [ ] Suche `const generate = useCallback(`
  - [ ] Ersetze mit Template oben
  - [ ] Ändere `BrandingSettingsType`
  - [ ] Ändere Logging `[Branding]`
  - [ ] Speichern

- [ ] **Furnish Empty:**
  - [ ] Öffne `hooks/workflows/furnish-empty/useFurnishEmpty.ts`
  - [ ] Suche `const generate = useCallback(`
  - [ ] Ersetze mit Template oben
  - [ ] Ändere `FurnishEmptySettingsType`
  - [ ] Ändere Logging `[FurnishEmpty]`
  - [ ] Speichern

### Fix #2: Edit Hooks (2 neue Dateien)

- [ ] **Sketch to Render Edit:**
  - [ ] Erstelle `hooks/workflows/sketch-to-render/useSketchToRenderEdit.ts`
  - [ ] Kopiere Code von oben
  - [ ] Speichern

- [ ] **Render to CAD Edit:**
  - [ ] Erstelle `hooks/workflows/render-to-cad/useRenderToCadEdit.ts`
  - [ ] Kopiere Code von oben
  - [ ] Speichern

### Fix #2: Adapter (1 Datei)

- [ ] **Adapter anpassen:**
  - [ ] Öffne `hooks/workflows/adapters/useWorkflowAdapter.ts`
  - [ ] Füge Imports hinzu (Schritt 1)
  - [ ] Füge 5 neue Adapter-Funktionen hinzu (Schritt 2)
  - [ ] Deprecate/lösche alte `useRenderEditAdapter()` (Schritt 3)
  - [ ] Speichern

---

## 🧪 Testing nach Anwendung

### Test #1: Reference Image Caching (3 Workflows)

**Sketch to Render:**

```
1. Lade Ref-Bild A hoch
2. Generiere → Stil von A ✅
3. Lösche Ref-Bild A
4. Lade Ref-Bild B hoch
5. Generiere → Stil von B ✅ (nicht A!)
```

**Branding:** (Same test)
**Furnish Empty:** (Same test)

### Test #2: Edit API Routes (5 Workflows)

**Browser DevTools → Network Tab:**

```
Sketch to Render Edit → POST /api/sketch-to-render/edit ✅
Branding Edit → POST /api/branding/edit ✅
Style Transfer Edit → POST /api/style-transfer/edit ✅
Furnish Empty Edit → POST /api/furnish-empty/edit ✅
Render to CAD Edit → POST /api/render-to-cad/edit ✅
```

---

## 📊 Fortschritt

### Bereits deployed (gepusht):

- ✅ Fix #1: Style Transfer Reference Caching
- ✅ Fix #2: useRenderEdit.ts erweitert (apiEndpoint parameter)
- ✅ Fix #2: Style Transfer Edit Hook
- ✅ Fix #2: Branding Edit Hook
- ✅ Fix #2: Furnish Empty Edit Hook
- ✅ Fix #3: useDatabaseSave.ts erweitert (onSaveComplete callback)
- ✅ Fix #3: Dokumentation (AUTO_REFRESH_IMPLEMENTATION.md)

### Bereit zur Anwendung (lokal, nicht gepusht):

- ⏸️ Fix #1: Sketch to Render Reference Caching
- ⏸️ Fix #1: Branding Reference Caching
- ⏸️ Fix #1: Furnish Empty Reference Caching
- ⏸️ Fix #2: Sketch to Render Edit Hook (neu)
- ⏸️ Fix #2: Render to CAD Edit Hook (neu)
- ⏸️ Fix #2: Adapter anpassen (5 neue Functions)

---

## ⏰ Geschätzter Aufwand

| Task                           | Zeit        |
| ------------------------------ | ----------- |
| Fix #1: 3 Dateien editieren    | ~30 Min     |
| Fix #2: 2 neue Hooks erstellen | ~10 Min     |
| Fix #2: Adapter anpassen       | ~20 Min     |
| Testing alle Workflows         | ~30 Min     |
| **TOTAL**                      | **~90 Min** |

---

## 💡 Hinweise

1. **Reihenfolge:** Egal, beide Fixes sind unabhängig
2. **Testing:** Teste immer einen Workflow komplett (Reference + Edit) bevor du weitergehst
3. **Backup:** Mache vorher Backup oder nutze Git Stash
4. **Server:** Server muss nach Änderungen neu laden (Hot Reload)

---

**Status:** ⏸️ Bereit zur Anwendung
**Push:** NEIN (wie gewünscht)
**Nächster Schritt:** Wende Fixes manuell an mit diesem Template
