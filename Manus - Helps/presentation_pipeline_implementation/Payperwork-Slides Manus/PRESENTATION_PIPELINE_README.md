# Presentation Pipeline - Implementation Guide

## Übersicht

Die **Presentation Pipeline** ist eine vollständige Implementierung eines Multi-Agent-Systems für die automatisierte Erstellung von Präsentationen, inspiriert von Manus AI's Architektur.

### Die 4 Phasen

```
┌─────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐
│  RESEARCH   │ -> │ TOPIC GENERATION │ -> │ CONTENT GEN.     │ -> │ PRE-PRODUCTION │
│             │    │                  │    │                  │    │                │
│ Multi-Source│    │ Structured       │    │ Detailed Slide   │    │ Quality Checks │
│ Information │    │ Outline with     │    │ Content with     │    │ & Finalization │
│ Gathering   │    │ Research Context │    │ Research Context │    │                │
└─────────────┘    └──────────────────┘    └──────────────────┘    └────────────────┘
```

---

## Architektur

### Services

#### 1. **PresentationPipelineService** (NEU!)
Der Haupt-Orchestrator, der alle Phasen koordiniert.

**Pfad**: `/lib/api/slides/agents/PresentationPipelineService.ts`

**Funktionen**:
- `execute()` - Vollständige Pipeline-Ausführung
- `quickGenerate()` - Schnelle Generierung ohne Research

**Input**:
```typescript
interface PresentationPipelineInput {
  topic: string;
  slideCount?: number;
  audience?: string;
  format?: string;
  theme?: string;
  enableResearch?: boolean;
  researchDepth?: 'quick' | 'medium' | 'deep';
}
```

**Output**:
```typescript
interface PresentationPipelineOutput {
  presentationId: string;
  topics: TopicWithResearch[];
  slides: SlideContent[];
  research?: ResearchServiceOutput;
  metadata: {
    totalTime: number;
    phaseTimes: {
      research: number;
      topicGeneration: number;
      contentGeneration: number;
      preProduction: number;
    };
    qualityScore?: number;
  };
}
```

#### 2. **ResearchService**
Nutzt den `ResearchAgent` für Multi-Source Research.

**Features**:
- Web-Suche mit `SearchTool`
- Deep-Dive mit `BrowserTool`
- Fact Verification
- Source Credibility Assessment

#### 3. **ContentGenerationService**
Nutzt den `ContentWriterAgent` für Content-Erstellung.

**Features**:
- Slide-by-Slide Content Generation
- Research-Context Integration
- Progress Tracking

---

## API-Endpoints

### Neuer Endpoint: `/api/slides/workflow/pipeline`

**POST** - Vollständige Pipeline-Ausführung

**Request Body**:
```json
{
  "prompt": "Erstelle eine Präsentation über Künstliche Intelligenz",
  "slideCount": 10,
  "userId": "user-123",
  "format": "16:9",
  "theme": "default",
  "enableResearch": true,
  "researchDepth": "medium",
  "audience": "Business Executives"
}
```

**Response**:
```json
{
  "success": true,
  "presentationId": "uuid-here",
  "topics": [
    {
      "order": 1,
      "title": "Einleitung",
      "description": "Übersicht über KI",
      "keyPoints": ["Definition von KI", "Geschichte der KI"],
      "relevantSources": ["https://example.com/ai-intro"]
    }
  ],
  "slideCount": 10,
  "metadata": {
    "totalTime": 45000,
    "phaseTimes": {
      "research": 15000,
      "topicGeneration": 5000,
      "contentGeneration": 20000,
      "preProduction": 5000
    },
    "qualityScore": 85
  },
  "research": {
    "summary": "KI ist...",
    "sourceCount": 7,
    "findingCount": 12
  }
}
```

---

## Datenbank-Schema

### Neue Spalten in `presentations`

```sql
-- Topics (JSONB Array)
topics JSONB

-- Research Data (JSONB Object)
research_data JSONB

-- Pipeline Metadata (JSONB Object)
metadata JSONB

-- Slide Count (Integer)
slide_count INTEGER DEFAULT 0

-- Erweiterte Status-Werte
status TEXT CHECK (status IN (
  'generating',
  'processing',
  'planning',
  'topics_generated',
  'ready',
  'error'
))
```

### Migration ausführen

```bash
# Supabase CLI
supabase db push

# Oder manuell in Supabase Dashboard
# SQL Editor -> Paste content from:
# supabase/migrations/20251019_pipeline_enhancements.sql
```

---

## Verwendung

### 1. Frontend-Integration

```typescript
// In deiner React-Komponente
async function generatePresentation() {
  const response = await fetch('/api/slides/workflow/pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: userInput,
      slideCount: 10,
      userId: currentUser.id,
      enableResearch: true,
      researchDepth: 'medium',
    }),
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Presentation created:', result.presentationId);
    console.log('Quality Score:', result.metadata.qualityScore);
    console.log('Total Time:', result.metadata.totalTime, 'ms');
  }
}
```

### 2. WebSocket Events

Die Pipeline emittiert Real-time Progress Events:

```typescript
// WebSocket Event Types
'research:started'
'research:completed'
'topic_generation:started'
'topic_generation:completed'
'content_generation:started'
'content_generation:progress'  // Per-slide progress
'content_generation:completed'
'pre_production:started'
'pre_production:completed'
'pipeline:completed'
'agent:error'
```

### 3. Direkter Service-Aufruf

```typescript
import { PresentationPipelineService } from '@/lib/api/slides/agents';

const pipelineService = new PresentationPipelineService();

const result = await pipelineService.execute(
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
  },
  (event) => {
    console.log('Progress:', event.type, event.data);
  }
);
```

---

## Vergleich: Alt vs. Neu

### ❌ Alte Implementation (ohne Pipeline)

```typescript
// Direkte Claude-API-Calls
const topics = await generateTopics(prompt);  // Nur aus Prompt
const slides = await generateSlides(topics);  // Ohne Research-Context
```

**Probleme**:
- Keine Research-Phase
- Topics nur aus Prompt generiert
- Kein Research-Context in Content
- Keine Quality Checks

### ✅ Neue Implementation (mit Pipeline)

```typescript
// Vollständige Pipeline
const result = await pipelineService.execute({
  topic: prompt,
  enableResearch: true,
});
```

**Vorteile**:
- ✅ Multi-Source Research
- ✅ Topics basierend auf Research
- ✅ Content mit Research-Context
- ✅ Quality Checks & Scoring
- ✅ Strukturierte Phasen
- ✅ Progress Tracking

---

## Performance

### Typische Ausführungszeiten

| Phase              | Quick  | Medium | Deep   |
|--------------------|--------|--------|--------|
| Research           | 5-10s  | 15-20s | 30-45s |
| Topic Generation   | 3-5s   | 5-8s   | 8-12s  |
| Content Generation | 15-25s | 30-45s | 60-90s |
| Pre-Production     | 2-3s   | 3-5s   | 5-8s   |
| **TOTAL**          | **25-43s** | **53-78s** | **103-155s** |

### Optimierungen

1. **Parallel Processing** (zukünftig):
   - Research und Topic Generation parallel
   - Content Generation für mehrere Slides parallel

2. **Caching**:
   - Research-Ergebnisse für ähnliche Topics cachen
   - LLM-Responses cachen

3. **Progressive Enhancement**:
   - Erste Version schnell liefern
   - Research-basierte Verbesserungen nachliefern

---

## Quality Scoring

Die Pre-Production Phase berechnet einen Quality Score (0-100):

### Checks

| Check | Punkte | Beschreibung |
|-------|--------|--------------|
| Empty Slides | -10 pro Slide | Slides ohne Inhalt |
| Short Slides | -5 pro Slide | Slides mit < 20 Wörtern |
| Missing Intro | -5 | Erste Folie ist keine Einleitung |
| Missing Conclusion | -5 | Letzte Folie ist kein Fazit |
| Research Used | +10 | Bonus für Research-Nutzung |

**Beispiel**:
```
Base Score: 100
- 2 leere Slides: -20
- 1 zu kurze Slide: -5
+ Research verwendet: +10
= Final Score: 85/100
```

---

## Testing

### Unit Tests

```bash
# ResearchService Tests
npm test lib/api/slides/agents/ResearchService.test.ts

# PresentationPipelineService Tests
npm test lib/api/slides/agents/PresentationPipelineService.test.ts
```

### Integration Tests

```bash
# Full Pipeline Test
npm test tests/agents/pipeline-integration.spec.ts
```

### Manual Testing

```bash
# Test mit curl
curl -X POST http://localhost:3000/api/slides/workflow/pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Künstliche Intelligenz in der Medizin",
    "slideCount": 10,
    "userId": "test-user",
    "enableResearch": true,
    "researchDepth": "medium"
  }'
```

---

## Troubleshooting

### Problem: "Failed to generate topics"

**Ursache**: LLM generiert kein valides JSON

**Lösung**:
```typescript
// In PresentationPipelineService.ts
// JSON-Extraktion ist bereits implementiert:
const jsonMatch = topicsText.match(/\[[\s\S]*\]/);
```

### Problem: "Research takes too long"

**Ursache**: Zu viele Quellen oder Deep Research

**Lösung**:
```typescript
// Nutze 'quick' statt 'medium'
researchDepth: 'quick'  // 3 Quellen statt 7
```

### Problem: "Quality Score zu niedrig"

**Ursache**: Content-Generierung produziert zu kurze Slides

**Lösung**:
```typescript
// Erweitere den Content-Generation-Prompt
const prompt = `
  Erstelle AUSFÜHRLICHEN Inhalt (mindestens 50 Wörter) für:
  ${topic.title}
  ...
`;
```

---

## Roadmap

### Phase 1: ✅ DONE
- [x] PresentationPipelineService
- [x] Research-Integration
- [x] Topic Generation mit Research
- [x] Content Generation mit Research
- [x] Pre-Production Quality Checks
- [x] API-Endpoint
- [x] Datenbank-Migration

### Phase 2: 🚧 TODO
- [ ] Parallel Processing für Content Generation
- [ ] Research-Caching
- [ ] User Feedback Loop (Topic Review)
- [ ] Image Generation Integration
- [ ] Advanced Quality Metrics

### Phase 3: 💡 FUTURE
- [ ] Multi-Language Support
- [ ] Custom Templates
- [ ] Collaborative Editing
- [ ] AI-Powered Design Suggestions

---

## Beispiel-Output

### Topics (mit Research)

```json
[
  {
    "order": 1,
    "title": "Einleitung: Was ist Künstliche Intelligenz?",
    "description": "Grundlegende Definition und historischer Überblick",
    "keyPoints": [
      "KI simuliert menschliche Intelligenz in Maschinen",
      "Erste KI-Forschung begann in den 1950er Jahren",
      "Durchbruch durch Deep Learning in den 2010ern"
    ],
    "relevantSources": [
      "https://en.wikipedia.org/wiki/Artificial_intelligence",
      "https://www.ibm.com/topics/artificial-intelligence"
    ]
  },
  {
    "order": 2,
    "title": "Arten von KI-Systemen",
    "description": "Unterscheidung zwischen schwacher und starker KI",
    "keyPoints": [
      "Schwache KI: Spezialisiert auf einzelne Aufgaben",
      "Starke KI: Generelle Intelligenz (noch theoretisch)",
      "Aktuelle Systeme sind alle schwache KI"
    ],
    "relevantSources": [
      "https://www.forbes.com/sites/bernardmarr/types-of-ai"
    ]
  }
]
```

### Research Data

```json
{
  "summary": "Künstliche Intelligenz (KI) bezeichnet die Fähigkeit von Maschinen, Aufgaben auszuführen, die normalerweise menschliche Intelligenz erfordern. Die Entwicklung begann in den 1950er Jahren und hat durch Deep Learning einen enormen Aufschwung erlebt.",
  "keyFindings": [
    "KI-Markt wird bis 2030 auf $1.5 Billionen geschätzt",
    "Deep Learning ermöglicht Durchbrüche in Bild- und Spracherkennung",
    "Ethische Fragen rund um KI-Bias werden zunehmend wichtig",
    "GPT-Modelle zeigen beeindruckende Sprachfähigkeiten",
    "KI wird in Medizin, Finanzen und Automotive eingesetzt"
  ],
  "sources": [
    {
      "title": "Artificial Intelligence - Wikipedia",
      "url": "https://en.wikipedia.org/wiki/Artificial_intelligence",
      "snippet": "AI is intelligence demonstrated by machines..."
    },
    {
      "title": "What is AI? - IBM",
      "url": "https://www.ibm.com/topics/artificial-intelligence",
      "snippet": "Artificial intelligence leverages computers..."
    }
  ]
}
```

---

## Support

Bei Fragen oder Problemen:

1. **Dokumentation**: Diese README
2. **Code-Kommentare**: Inline-Dokumentation in den Services
3. **Tests**: Siehe `/tests/agents/`
4. **Team**: Kontaktiere das Payperwork-Team

---

## Credits

**Inspiriert von**: Manus AI's Multi-Agent Architecture

**Implementiert von**: Payperwork Team

**Datum**: 2025-10-19

**Version**: 1.0.0

