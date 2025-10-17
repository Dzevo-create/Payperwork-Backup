# Workflow Adapter Guide

## Problem: Type Mismatches zwischen Hooks und Adaptern

### Was ist passiert?
Bei der Implementierung des Branding-Workflows gab es einen kritischen Bug im `useBrandingAdapter`, der dazu führte, dass der Send-Button nicht funktionierte.

**Root Cause:**
Der Adapter verwendete falsche Property-Namen für ImageData:

```typescript
// ❌ FALSCH - Funktioniert nicht!
const sourceImageData = sourceImage ? {
  data: sourceImage,        // Falsches Property
  mimeType: 'image/jpeg',   // Falsches Property
} : undefined;
```

**Lösung:**
Alle Workflow-Hooks erwarten ein standardisiertes `ImageData` Interface:

```typescript
// ✅ RICHTIG - Funktioniert!
const sourceImageData = sourceImage ? {
  file: null,               // Korrektes Property
  preview: sourceImage,     // Korrektes Property (Base64 data URL)
} : {file: null, preview: null};
```

---

## Best Practices für neue Workflow-Adapter

### 1. **IMMER den Shared Type verwenden**

```typescript
import type { ImageData, GenerationResult, WorkflowHookOptions } from "@/types/workflows/common";
```

**Warum?**
- Verhindert Type-Mismatches
- TypeScript zeigt Fehler sofort an
- Alle Workflows verwenden dieselbe Struktur

### 2. **Adapter-Template für neue Workflows**

Wenn du einen neuen Workflow-Adapter erstellst, kopiere dieses Template:

```typescript
export function useNewWorkflowAdapter(): StandardGenerateHook {
  const hook = useNewWorkflow();

  return {
    generate: async (params) => {
      const { prompt, settings, sourceImage, referenceImages } = params;

      // ✅ STANDARDISIERTES ImageData Format
      const sourceImageData = sourceImage ? {
        file: null,           // File object not needed for generation
        preview: sourceImage, // Base64 data URL
      } : {file: null, preview: null};

      const referenceImageData = referenceImages.length > 0 ? {
        file: null,
        preview: referenceImages[0],
      } : undefined;

      const result = await hook.generate(
        prompt,
        sourceImageData,
        settings,
        referenceImageData
      );

      return result;
    },
    isGenerating: hook.isGenerating,
    error: hook.error,
    progress: hook.progress,
  };
}
```

### 3. **Checkliste für neue Adapters**

- [ ] Importiert `ImageData` aus `@/types/workflows/common`
- [ ] Verwendet `file` und `preview` Properties (NICHT `data` oder `mimeType`)
- [ ] Setzt `file: null` wenn kein File-Objekt vorhanden ist
- [ ] Übergibt `preview` als Base64 data URL string
- [ ] Handhabt sowohl sourceImage als auch referenceImage gleich
- [ ] Testet Send-Button im Browser (nicht nur TypeScript-Check!)

### 4. **Testing Checklist**

Teste jeden neuen Adapter mit:

1. **Mit Bild + Prompt** - Standard-Use-Case
2. **Nur mit Bild** - Prompt optional (T-Button generiert ihn)
3. **Mit Reference Image** - Falls der Workflow das unterstützt
4. **Server Logs überprüfen** - Sicherstellen dass API aufgerufen wird

---

## Fehlersuche

### Symptom: Send-Button funktioniert nicht

**Diagnose-Schritte:**

1. **Check Browser Console** - Gibt es JavaScript-Fehler?
2. **Check Server Logs** - Wird der API-Endpoint aufgerufen?
   - ✅ Gut: `ℹ️ Branding: Starting generation`
   - ❌ Problem: Keine API-Logs sichtbar
3. **Check Adapter Code** - Verwendet er `file` und `preview`?
4. **Check TypeScript** - Gibt es Type-Errors in der IDE?

### Häufige Fehler

| Fehler | Symptom | Lösung |
|--------|---------|--------|
| Falsches ImageData Format | Button disabled oder keine API-Calls | Verwende `file` + `preview` statt `data` + `mimeType` |
| Fehlende Preview-Validierung | "Ausgangsbild ist erforderlich" Fehler | Check `sourceImage?.preview` nicht `sourceImage?.file` |
| Null-Handling | TypeScript Errors mit `split()` | Verwende `?.` und `\|\| ''` für null-safety |

---

## Architektur-Übersicht

```
┌─────────────────────┐
│   WorkflowPage      │  Config-based generic component
│   (Generic)         │
└──────────┬──────────┘
           │
           │ Uses adapters
           ▼
┌─────────────────────┐
│ useWorkflowAdapter  │  Standardized interface layer
│ (Adapter Pattern)   │
└──────────┬──────────┘
           │
           │ Wraps specific hooks
           ▼
┌─────────────────────┐
│  useBranding        │  Workflow-specific implementation
│  useSketchToRender  │  Each uses ImageData type
└─────────────────────┘
```

**Key Insight:**
Alle Workflows sprechen dieselbe "Sprache" (ImageData), aber Adapter übersetzen zwischen WorkflowPage und den spezifischen Hooks.

---

## Zukünftige Verbesserungen

### Option 1: Runtime Type Validation (Zod)
```typescript
import { z } from 'zod';

const ImageDataSchema = z.object({
  file: z.instanceof(File).nullable(),
  preview: z.string().nullable(),
});

// In Adapter:
const validatedImage = ImageDataSchema.parse(sourceImageData);
```

### Option 2: ESLint Custom Rule
Erstelle eine ESLint-Regel die warnt wenn:
- `ImageData` Properties nicht `file` und `preview` sind
- Adapter nicht den shared Type importieren

### Option 3: Integration Tests
```typescript
describe('useBrandingAdapter', () => {
  it('should convert source image to correct ImageData format', () => {
    const adapter = useBrandingAdapter();
    // Test that adapter.generate() passes correct format to hook
  });
});
```

---

## Lessons Learned

1. **Type Safety alleine reicht nicht** - TypeScript erlaubt `as any` casts
2. **Adapter sind fehleranfällig** - Jede manuelle Konvertierung ist ein Risiko
3. **Shared Types sind essentiell** - Single source of truth verhindert Drift
4. **Test in Browser, nicht nur TypeScript** - Runtime-Behavior ist wichtig

---

**Erstellt:** 2025-10-17
**Letztes Update:** 2025-10-17
**Anlass:** Branding Send-Button Bug (ImageData format mismatch)
