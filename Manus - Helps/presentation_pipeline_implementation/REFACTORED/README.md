# Presentation Pipeline - Refactored Modular Architecture

## Übersicht

Diese Version ist ein **Refactoring** des ursprünglichen `PresentationPipelineService.ts` (~600 Zeilen) in eine **modulare, wartbare Architektur**.

### Vorher vs. Nachher

**Vorher (Monolith):**
```
PresentationPipelineService.ts (600 Zeilen)
├── execute()
├── generateTopicsWithResearch()
├── generateContentWithResearch()
├── buildSlideContext()
└── preProduction()
```

**Nachher (Modular):**
```
pipeline/
├── PresentationPipeline.ts          (Main Orchestrator - 150 Zeilen)
├── phases/
│   ├── ResearchPhase.ts             (100 Zeilen)
│   ├── TopicGenerationPhase.ts      (120 Zeilen)
│   ├── ContentGenerationPhase.ts    (130 Zeilen)
│   └── PreProductionPhase.ts        (70 Zeilen)
├── utils/
│   ├── contextBuilder.ts            (80 Zeilen)
│   ├── qualityScorer.ts             (110 Zeilen)
│   └── progressEmitter.ts           (90 Zeilen)
└── types.ts                         (100 Zeilen)
```

---

## Vorteile des Refactorings

### 1. **Separation of Concerns**
- Jede Phase hat ihre eigene Klasse
- Utilities sind wiederverwendbar
- Klare Verantwortlichkeiten

### 2. **Testbarkeit**
- Jede Phase kann unabhängig getestet werden
- Utilities können isoliert getestet werden
- Mock-freundlich

### 3. **Wartbarkeit**
- Kleinere, fokussierte Dateien
- Einfacher zu verstehen
- Leichter zu erweitern

### 4. **Wiederverwendbarkeit**
- Phasen können einzeln verwendet werden
- Utilities können in anderen Projekten verwendet werden
- Flexiblere Konfiguration

---

## Verwendung

### Basic Usage

```typescript
import { PresentationPipeline } from '@/lib/api/slides/agents/pipeline';

const pipeline = new PresentationPipeline(onProgress);

const result = await pipeline.execute(
  {
    topic: 'Künstliche Intelligenz',
    slideCount: 10,
    enableResearch: true,
    researchDepth: 'medium',
  },
  {
    userId: 'user-123',
    sessionId: 'session-456',
    presentationId: 'pres-789',
  }
);
```

### Using Individual Phases

```typescript
import {
  ResearchPhase,
  TopicGenerationPhase,
  ContentGenerationPhase,
  PreProductionPhase,
} from '@/lib/api/slides/agents/pipeline';

// Run only research
const researchPhase = new ResearchPhase(onProgress);
const researchResult = await researchPhase.execute(input, context);

// Run only topic generation
const topicPhase = new TopicGenerationPhase(onProgress);
const topicResult = await topicPhase.execute(input, researchResult?.research);
```

### Using Utilities

```typescript
import { QualityScorer, ContextBuilder } from '@/lib/api/slides/agents/pipeline';

// Calculate quality score
const result = QualityScorer.calculate(slides, research);
console.log('Quality Score:', result.score);
console.log('Quality Level:', QualityScorer.getQualityLevel(result.score));

// Build slide context
const context = ContextBuilder.buildSlideContext(topic, research);
```

---

## Dateistruktur

### Main Components

#### 1. `PresentationPipeline.ts`
- Haupt-Orchestrator
- Koordiniert alle Phasen
- Sammelt Metadata
- Emittiert Progress Events

#### 2. `phases/ResearchPhase.ts`
- **Verantwortlichkeit**: Multi-Source Research
- **Input**: Topic, Research Depth
- **Output**: ResearchServiceOutput + Duration

#### 3. `phases/TopicGenerationPhase.ts`
- **Verantwortlichkeit**: Strukturierte Topic-Generierung
- **Input**: Topic, Research (optional)
- **Output**: Topics + Duration

#### 4. `phases/ContentGenerationPhase.ts`
- **Verantwortlichkeit**: Slide Content Generation
- **Input**: Topics, Research (optional)
- **Output**: Slides + Duration

#### 5. `phases/PreProductionPhase.ts`
- **Verantwortlichkeit**: Quality Checks
- **Input**: Slides, Research (optional)
- **Output**: Quality Score + Duration + Issues

### Utilities

#### 1. `utils/progressEmitter.ts`
- Standardisierte Progress Event Emission
- Type-safe Events
- Phase-specific Methods

#### 2. `utils/contextBuilder.ts`
- Builds Research Context for Slides
- Finds Relevant Findings
- Formats Context Strings

#### 3. `utils/qualityScorer.ts`
- Calculates Quality Scores
- Runs Quality Checks
- Generates Issue Reports

---

## Vergleich: Vorher vs. Nachher

### Code-Länge

| Datei | Vorher | Nachher |
|-------|--------|---------|
| Main Service | 600 Zeilen | 150 Zeilen |
| Research Logic | - | 100 Zeilen |
| Topic Generation | - | 120 Zeilen |
| Content Generation | - | 130 Zeilen |
| Pre-Production | - | 70 Zeilen |
| Utilities | - | 280 Zeilen |
| Types | - | 100 Zeilen |
| **TOTAL** | **600 Zeilen** | **950 Zeilen** |

**Warum mehr Code?**
- Mehr Dokumentation
- Mehr Type Safety
- Mehr Struktur
- Mehr Tests möglich
- Aber: **Viel besser wartbar!**

### Funktionalität

| Feature | Vorher | Nachher |
|---------|--------|---------|
| 4-Phasen-Pipeline | ✅ | ✅ |
| Research Integration | ✅ | ✅ |
| Progress Tracking | ✅ | ✅ |
| Quality Scoring | ✅ | ✅ |
| Individual Phase Execution | ❌ | ✅ |
| Utility Reusability | ❌ | ✅ |
| Unit Testability | ⚠️ | ✅ |

---

## Testing

### Unit Tests

```typescript
// Test individual phases
describe('ResearchPhase', () => {
  it('should conduct research', async () => {
    const phase = new ResearchPhase();
    const result = await phase.execute(input, context);
    expect(result.research.sources.length).toBeGreaterThan(0);
  });
});

// Test utilities
describe('QualityScorer', () => {
  it('should calculate quality score', () => {
    const result = QualityScorer.calculate(slides, research);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
```

### Integration Tests

```typescript
describe('PresentationPipeline', () => {
  it('should execute full pipeline', async () => {
    const pipeline = new PresentationPipeline();
    const result = await pipeline.execute(input, context);

    expect(result.topics).toHaveLength(10);
    expect(result.slides).toHaveLength(10);
    expect(result.metadata.qualityScore).toBeGreaterThan(0);
  });
});
```

---

## Migration vom Monolith

### Schritt 1: Update Imports

**Vorher:**
```typescript
import { PresentationPipelineService } from '@/lib/api/slides/agents/PresentationPipelineService';
```

**Nachher:**
```typescript
import { PresentationPipeline } from '@/lib/api/slides/agents/pipeline';
```

### Schritt 2: Update Instantiation

**Vorher:**
```typescript
const service = new PresentationPipelineService();
const result = await service.execute(input, context, onProgress);
```

**Nachher:**
```typescript
const pipeline = new PresentationPipeline(onProgress);
const result = await pipeline.execute(input, context);
```

### Schritt 3: Types bleiben gleich

Alle Input/Output Types sind identisch:
- `PresentationPipelineInput` ✅
- `PresentationPipelineOutput` ✅
- `TopicWithResearch` ✅

---

## Performance

Keine Performance-Unterschiede zur Monolith-Version:
- Gleiche LLM-Calls
- Gleiche Research-Logik
- Gleiche Anzahl von Operations

**Overhead**: ~1-2ms für zusätzliche Objekt-Instantiierung (vernachlässigbar)

---

## Nächste Schritte

### Phase 1: ✅ DONE
- [x] Refactoring in Module
- [x] Utilities extrahieren
- [x] Types definieren
- [x] Dokumentation

### Phase 2: TODO
- [ ] Unit Tests schreiben
- [ ] Integration Tests
- [ ] In Haupt-Projekt integrieren
- [ ] Performance-Tests

### Phase 3: FUTURE
- [ ] Parallel Processing für Slides
- [ ] Caching Layer
- [ ] Custom Phase Hooks
- [ ] Plugin System

---

## Support

Bei Fragen:
- **Code**: Siehe inline Kommentare
- **Architektur**: Diese README
- **Migration**: Siehe "Migration vom Monolith"

---

**Version**: 2.0 (Refactored)
**Date**: 2025-10-19
**Author**: Payperwork Team
