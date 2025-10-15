# Sketch-to-Render Architektur

## 🎯 Ziel
Aus einem Ausgangsbild (Sketch/Grundriss) photorealistische Architektur-Renderings erstellen mit:
- GPT-4o für Prompt Enhancement
- Nano Banana (Payperwork Flash v.1 / Gemini 2.5 Flash Image) für Image Generation
- Optional: Referenzbilder für Design-Vorgaben

## 📁 Dateistruktur (Modular & Clean)

### 1. Types & Interfaces
```
types/workflows/
├── renderSettings.ts          # RenderSettings Type mit Optional Values
└── sketchToRender.ts          # API Request/Response Types
```

### 2. Backend API Routes
```
app/api/
├── sketch-to-render/
│   └── route.ts               # Main API endpoint (~150 Zeilen)
└── enhance-render-prompt/     # Neuer spezialisierter Endpoint
    └── route.ts               # GPT-4o Prompt Enhancement (~100 Zeilen)
```

### 3. Backend Library (Modular Helpers)
```
lib/api/workflows/
├── sketchToRender/
│   ├── promptBuilder.ts       # Build enhanced prompts from settings (~80 Zeilen)
│   ├── imageProcessor.ts      # Handle image order & validation (~60 Zeilen)
│   └── gptEnhancer.ts         # GPT-4o enhancement logic (~100 Zeilen)
└── index.ts                   # Re-export all
```

### 4. Frontend Components (bereits vorhanden, nur anpassen)
```
components/workflows/
├── RenderSettings.tsx         # Anpassen: Optional values, Design-Stil + Render-Stil
├── RenderPromptInput.tsx      # T-Button funktional machen
├── ResultPanel.tsx            # ✅ Bereits fertig
├── RecentGenerations.tsx      # ✅ Bereits fertig
└── InputsPanel.tsx            # ✅ Bereits fertig
```

### 5. Frontend Hooks (für saubere Logik)
```
hooks/workflows/
├── useSketchToRender.ts       # Main generation logic (~120 Zeilen)
└── usePromptEnhancer.ts       # Prompt enhancement hook (~80 Zeilen)
```

---

## 🔄 Datenfluss

### A) Generation Flow (Render erstellen)

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (page.tsx)                                              │
│ - User klickt "Generate"                                         │
│ - useSketchToRender Hook                                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ API: /api/sketch-to-render                                       │
│ 1. Input Validation                                              │
│    - sourceImage (required)                                      │
│    - prompt (optional)                                           │
│    - referenceImages (optional)                                  │
│    - settings (optional)                                         │
│                                                                   │
│ 2. Prompt Enhancement (GPT-4o)                                   │
│    - lib/api/workflows/sketchToRender/gptEnhancer.ts             │
│    - Nimmt: user prompt + settings                               │
│    - Gibt: detailed architectural prompt                         │
│                                                                   │
│ 3. Image Processing                                              │
│    - lib/api/workflows/sketchToRender/imageProcessor.ts          │
│    - Reihenfolge: [referenceImages..., sourceImage]             │
│    - sourceImage als LETZTES (bestimmt aspect ratio!)            │
│                                                                   │
│ 4. Nano Banana API Call                                          │
│    - lib/api/providers/gemini.ts (existing)                      │
│    - Model: gemini-2.5-flash-image-preview                       │
│    - Enhanced prompt + images                                    │
│                                                                   │
│ 5. Return generated image                                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Frontend Response Handler                                        │
│ - Set resultImage                                                │
│ - Add to recentGenerations (Gallery)                             │
│ - Optional: Save to Supabase Library                             │
└─────────────────────────────────────────────────────────────────┘
```

### B) Prompt Enhancement Flow (T-Button)

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (RenderPromptInput.tsx)                                 │
│ - User klickt T-Button                                           │
│ - usePromptEnhancer Hook                                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ API: /api/enhance-render-prompt                                  │
│ - Nimmt: current prompt + renderSettings                         │
│ - GPT-4o enhancement                                             │
│ - Gibt: enhanced prompt zurück                                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Frontend                                                          │
│ - Set enhanced prompt in textarea                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 RenderSettings Type (NEU - Optional Values!)

```typescript
// types/workflows/renderSettings.ts

export interface RenderSettingsType {
  // Alle Felder sind OPTIONAL (nullable)
  spaceType?: "interior" | "exterior" | null;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | null;

  // NEU: Design-Stil (vorher "style")
  designStyle?:
    | "modern"
    | "minimalist"
    | "mediterranean"
    | "scandinavian"
    | "industrial"
    | "classical"
    | "contemporary"
    | "rustic"
    | "bauhaus"
    | "art-deco"
    | "japanese"
    | "tropical"
    | "brutalist"
    | null;

  // NEU: Render-Stil (neues Feld!)
  renderStyle?:
    | "hyperrealistic"
    | "photorealistic"
    | "3d-render"
    | "architectural-visualization"
    | "concept-art"
    | null;

  timeOfDay?: "morning" | "midday" | "afternoon" | "evening" | "night" | null;
  season?: "spring" | "summer" | "autumn" | "winter" | null;
  weather?: "sunny" | "cloudy" | "rainy" | "foggy" | null;
  quality?: "ultra" | "high" | "standard" | null;
}

// Default: Alle Werte sind null/undefined
export const DEFAULT_RENDER_SETTINGS: RenderSettingsType = {
  spaceType: null,
  aspectRatio: null,
  designStyle: null,
  renderStyle: null,
  timeOfDay: null,
  season: null,
  weather: null,
  quality: null,
};
```

---

## 🎨 RenderSettings UI Änderungen

### Vorher (Falsch):
```tsx
// Dropdowns zeigen Default-Wert
<button>Interior</button>  // ❌ Vorausgewählt
<button>16:9</button>       // ❌ Vorausgewählt
```

### Nachher (Richtig):
```tsx
// Dropdowns zeigen Kategorie-Überschrift wenn nicht ausgewählt
<button>
  {spaceType || "Space Type"}  // ✅ Zeigt "Space Type" wenn null
</button>
<button>
  {designStyle || "Design-Stil"}  // ✅ Zeigt "Design-Stil" wenn null
</button>
<button>
  {renderStyle || "Render-Stil"}  // ✅ NEU: Render-Stil Dropdown
</button>
```

---

## 🔧 Implementierungs-Reihenfolge

### Phase 1: Types & Settings (Foundation)
1. **Type Definitions erstellen**
   - `types/workflows/renderSettings.ts` - Optional RenderSettings
   - `types/workflows/sketchToRender.ts` - API Types

2. **RenderSettings Component anpassen**
   - Optional values (null als default)
   - "Style" → "Design-Stil" umbenennen
   - Neues "Render-Stil" Feld hinzufügen
   - Placeholder-State für Dropdowns (Überschriften)

### Phase 2: Backend Library (Modular Helpers)
3. **Prompt Builder erstellen**
   - `lib/api/workflows/sketchToRender/promptBuilder.ts`
   - Function: `buildArchitecturalPrompt(userPrompt, settings)`

4. **Image Processor erstellen**
   - `lib/api/workflows/sketchToRender/imageProcessor.ts`
   - Function: `prepareImagesForGeneration(sourceImage, referenceImages)`
   - Stellt sicher: sourceImage ist LETZTES Bild

5. **GPT Enhancer erstellen**
   - `lib/api/workflows/sketchToRender/gptEnhancer.ts`
   - Function: `enhanceArchitecturalPrompt(prompt, settings)`

### Phase 3: Backend API Routes
6. **API Route: /api/sketch-to-render**
   - Main generation endpoint
   - Nutzt alle Helper-Functions
   - Nano Banana API Integration

7. **API Route: /api/enhance-render-prompt**
   - Prompt enhancement endpoint
   - Nutzt gptEnhancer

### Phase 4: Frontend Integration
8. **Custom Hook: useSketchToRender**
   - Generation logic
   - Loading states
   - Error handling

9. **Custom Hook: usePromptEnhancer**
   - T-Button functionality
   - Prompt enhancement logic

10. **Page.tsx Integration**
    - Connect hooks
    - Gallery updates
    - Result handling

### Phase 5: Supabase Integration
11. **Library Storage**
    - Save renders to Supabase
    - Metadata storage

---

## 🤖 Agenten-Einsatz

### Agent 1: TypeScript Pro
**Task:** Type definitions & interfaces erstellen
- `types/workflows/renderSettings.ts`
- `types/workflows/sketchToRender.ts`

### Agent 2: Frontend Developer
**Task:** RenderSettings.tsx anpassen
- Optional values
- Design-Stil + Render-Stil
- Placeholder states

### Agent 3: Backend Architect
**Task:** Backend Library erstellen (modular)
- `lib/api/workflows/sketchToRender/promptBuilder.ts`
- `lib/api/workflows/sketchToRender/imageProcessor.ts`
- `lib/api/workflows/sketchToRender/gptEnhancer.ts`

### Agent 4: API Developer
**Task:** API Routes erstellen
- `/api/sketch-to-render/route.ts`
- `/api/enhance-render-prompt/route.ts`

### Agent 5: Frontend Developer
**Task:** Hooks & Integration
- `hooks/workflows/useSketchToRender.ts`
- `hooks/workflows/usePromptEnhancer.ts`
- `page.tsx` Integration

---

## 📊 Code Size Estimates

| File | Lines | Purpose |
|------|-------|---------|
| `types/workflows/renderSettings.ts` | ~50 | Type definitions |
| `types/workflows/sketchToRender.ts` | ~40 | API types |
| `lib/.../promptBuilder.ts` | ~80 | Prompt building logic |
| `lib/.../imageProcessor.ts` | ~60 | Image handling |
| `lib/.../gptEnhancer.ts` | ~100 | GPT-4o integration |
| `app/api/sketch-to-render/route.ts` | ~150 | Main API endpoint |
| `app/api/enhance-render-prompt/route.ts` | ~80 | Enhancement endpoint |
| `hooks/workflows/useSketchToRender.ts` | ~120 | Generation hook |
| `hooks/workflows/usePromptEnhancer.ts` | ~80 | Enhancement hook |
| `components/workflows/RenderSettings.tsx` | ~400 | UI component (angepasst) |

**Total: ~1160 Zeilen** über **10 modulare Files** statt ein monolithischer 1000+ Zeilen File!

---

## 🚀 Nächste Schritte

1. ✅ **Architektur definiert** (dieses Dokument)
2. 🔄 **Phase 1 starten**: Types & RenderSettings anpassen
3. 🔄 **Phase 2**: Backend Library (modular)
4. 🔄 **Phase 3**: API Routes
5. 🔄 **Phase 4**: Frontend Integration
6. 🔄 **Phase 5**: Supabase Integration

**Agenten werden parallel eingesetzt für maximale Effizienz!**
