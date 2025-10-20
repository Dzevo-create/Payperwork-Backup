# 🎯 API Responsibility Matrix - Wer macht was?

## Übersicht

Diese Matrix zeigt **genau**, welche API-Route welchen Agent nutzt, welches Model verwendet wird, und wer für was verantwortlich ist.

---

## 1. Complete Pipeline

### `/api/slides/workflow/pipeline`

**Verantwortlich:** Orchestrator
**Agent:** OrchestratorAgent
**Model:** Claude 3.5 Sonnet

**Was macht es:**
- Koordiniert alle Agents
- Führt komplette Pipeline aus (Research → Topics → Content → Design → Quality)
- Speichert Ergebnis in Database
- Emittiert WebSocket Events

**Input:**
```typescript
{
  prompt: string;          // "Künstliche Intelligenz"
  slideCount: number;      // 10
  userId: string;          // "user-123"
  enableResearch: boolean; // true
}
```

**Output:**
```typescript
{
  success: boolean;
  presentationId: string;
  slides: Slide[];
  qualityScore: number;
  metadata: {
    researchSources: number;
    totalTime: number;
  };
}
```

**Ruft auf:**
- ResearchAgent (wenn enableResearch = true)
- TopicAgent
- ContentAgent
- DesignerAgent
- QualityAgent

---

## 2. Research Agent

### `/api/agents/research`

**Verantwortlich:** Research & Data Gathering
**Agent:** ResearchAgent
**Model:** Claude 3.5 Sonnet + Search API

**Was macht es:**
- Sucht im Web nach Informationen
- Analysiert gefundene Quellen
- Extrahiert Key Findings
- Bewertet Relevanz

**Input:**
```typescript
{
  topic: string;     // "Künstliche Intelligenz"
  depth: string;     // "shallow" | "medium" | "deep"
  userId: string;    // "user-123"
}
```

**Output:**
```typescript
{
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    relevance: number;
  }>;
  analysis: {
    summary: string;
    keyFindings: string[];
    trends: string[];
  };
}
```

**Tools:**
- Tavily Search API
- Web Scraping (Cheerio)
- Browser Automation (Playwright)

**WebSocket Events:**
- `agent:thinking:step` - "Currently researching..."
- `agent:source:found` - Jede gefundene Quelle
- `agent:action:update` - Progress Updates

---

## 3. Topic Agent

### `/api/agents/topics`

**Verantwortlich:** Topic Generation & Outline
**Agent:** TopicAgent
**Model:** Claude 3.5 Sonnet

**Was macht es:**
- Erstellt strukturierte Outline
- Generiert 10 Topics
- Nutzt Research-Daten (wenn vorhanden)
- Ordnet Topics logisch

**Input:**
```typescript
{
  prompt: string;           // "Künstliche Intelligenz"
  slideCount: number;       // 10
  researchData?: {          // Optional
    sources: Source[];
    analysis: Analysis;
  };
  userId: string;
}
```

**Output:**
```typescript
{
  topics: Array<{
    order: number;
    title: string;
    description: string;
    keyPoints: string[];
  }>;
}
```

**WebSocket Events:**
- `agent:thinking:step` - "Creating structured outline..."
- `agent:action:update` - Progress Updates

---

## 4. Content Agent

### `/api/agents/content`

**Verantwortlich:** Slide Content Writing
**Agent:** ContentAgent
**Model:** GPT-4 / Claude 3.5 Sonnet

**Was macht es:**
- Schreibt Content für jede Slide
- Nutzt Research-Daten für Fakten
- Erstellt Bullet Points
- Generiert Speaker Notes

**Input:**
```typescript
{
  topics: Topic[];
  researchData?: {
    sources: Source[];
    analysis: Analysis;
  };
  userId: string;
}
```

**Output:**
```typescript
{
  slides: Array<{
    order: number;
    title: string;
    content: string;
    bulletPoints: string[];
    speakerNotes: string;
  }>;
}
```

**WebSocket Events:**
- `agent:thinking:step` - "Generating slide 1 of 10..."
- `agent:action:update` - Progress per Slide

---

## 5. Designer Agent

### `/api/agents/designer`

**Verantwortlich:** Layout & Visual Design
**Agent:** DesignerAgent
**Model:** Gemini 2.0 Flash

**Was macht es:**
- Wählt passende Layouts
- Generiert Farbschema
- Erstellt Visual Hierarchy
- Platziert Elemente

**Input:**
```typescript
{
  slides: Slide[];
  theme?: string;  // "modern" | "corporate" | "creative"
  userId: string;
}
```

**Output:**
```typescript
{
  slides: Array<{
    ...previousSlideData,
    layout: string;      // "title" | "content" | "two-column" | etc.
    design: {
      colors: string[];
      fonts: string[];
      spacing: object;
    };
  }>;
}
```

**WebSocket Events:**
- `agent:thinking:step` - "Designing layouts..."
- `agent:action:update` - Progress Updates

---

## 6. Quality Agent

### `/api/agents/quality`

**Verantwortlich:** Quality Check & Scoring
**Agent:** QualityAgent
**Model:** Claude 3.5 Sonnet

**Was macht es:**
- Prüft Qualität der Slides
- Bewertet Kohärenz
- Checkt Grammatik & Stil
- Gibt Verbesserungsvorschläge

**Input:**
```typescript
{
  slides: Slide[];
  userId: string;
}
```

**Output:**
```typescript
{
  score: number;        // 0-100
  insights: Array<{
    type: string;       // "strength" | "weakness" | "suggestion"
    message: string;
    confidence: number;
  }>;
  recommendations: string[];
}
```

**WebSocket Events:**
- `agent:thinking:step` - "Validating presentation quality..."
- `agent:insight:generated` - Jeder Insight

---

## 7. Tools APIs

### `/api/tools/search`

**Verantwortlich:** Web Search
**Agent:** None (Tool)
**Service:** Tavily Search API

**Was macht es:**
- Sucht im Web
- Filtert Ergebnisse
- Bewertet Relevanz

**Input:**
```typescript
{
  query: string;
  maxResults?: number;
}
```

**Output:**
```typescript
{
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    relevance: number;
  }>;
}
```

---

### `/api/tools/browse`

**Verantwortlich:** Browser Automation
**Agent:** None (Tool)
**Service:** Playwright

**Was macht es:**
- Öffnet Websites
- Extrahiert Content
- Macht Screenshots

**Input:**
```typescript
{
  url: string;
  actions?: Array<{
    type: string;  // "click" | "type" | "scroll"
    selector?: string;
    value?: string;
  }>;
}
```

**Output:**
```typescript
{
  title: string;
  content: string;
  screenshot?: string;
}
```

---

### `/api/tools/image`

**Verantwortlich:** Image Generation
**Agent:** None (Tool)
**Service:** DALL-E 3

**Was macht es:**
- Generiert Bilder
- Erstellt Visualisierungen

**Input:**
```typescript
{
  prompt: string;
  size?: string;
  quality?: string;
}
```

**Output:**
```typescript
{
  url: string;
}
```

---

## 8. Presentations CRUD

### `/api/slides/presentations`

**Verantwortlich:** Presentations Management
**Agent:** None (CRUD)
**Database:** Supabase

**GET** - List Presentations
```typescript
// Input: Query params
{
  userId: string;
  limit?: number;
  offset?: number;
}

// Output
{
  presentations: Presentation[];
  total: number;
}
```

**POST** - Create Presentation
```typescript
// Input
{
  userId: string;
  title: string;
  slideCount: number;
}

// Output
{
  presentation: Presentation;
}
```

---

### `/api/slides/presentations/[id]`

**GET** - Get Single Presentation
**PUT** - Update Presentation
**DELETE** - Delete Presentation

---

## 9. Export APIs

### `/api/slides/export/pdf`

**Verantwortlich:** PDF Export
**Agent:** None (Export)
**Library:** Puppeteer / PDFKit

**Input:**
```typescript
{
  presentationId: string;
}
```

**Output:**
```typescript
{
  url: string;  // Download URL
}
```

---

### `/api/slides/export/pptx`

**Verantwortlich:** PowerPoint Export
**Agent:** None (Export)
**Library:** PptxGenJS

**Input:**
```typescript
{
  presentationId: string;
}
```

**Output:**
```typescript
{
  url: string;  // Download URL
}
```

---

## Complete Flow Diagram

```
User Request
    ↓
POST /api/slides/workflow/pipeline
    ↓
OrchestratorAgent
    ↓
┌───────────────────────────────────────────┐
│                                           │
│  Phase 1: Research (optional)            │
│  ┌─────────────────────────────────────┐ │
│  │ ResearchAgent                       │ │
│  │ - POST /api/tools/search            │ │
│  │ - POST /api/tools/browse            │ │
│  │ - Analyze with Claude 3.5           │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  Phase 2: Topic Generation               │
│  ┌─────────────────────────────────────┐ │
│  │ TopicAgent                          │ │
│  │ - Use Research Data                 │ │
│  │ - Generate with Claude 3.5          │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  Phase 3: Content Generation             │
│  ┌─────────────────────────────────────┐ │
│  │ ContentAgent                        │ │
│  │ - Use Topics + Research             │ │
│  │ - Generate with GPT-4               │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  Phase 4: Design                         │
│  ┌─────────────────────────────────────┐ │
│  │ DesignerAgent                       │ │
│  │ - Choose Layouts                    │ │
│  │ - Generate with Gemini 2.0          │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  Phase 5: Quality Check                  │
│  ┌─────────────────────────────────────┐ │
│  │ QualityAgent                        │ │
│  │ - Validate Quality                  │ │
│  │ - Score with Claude 3.5             │ │
│  └─────────────────────────────────────┘ │
│                                           │
└───────────────────────────────────────────┘
    ↓
Save to Database (Supabase)
    ↓
Return Result to User
```

---

## WebSocket Events Flow

```
Backend (Agent)
    ↓
emitToUser(userId, 'agent:thinking:step', data)
    ↓
Socket.IO Server
    ↓
io.to(`user:${userId}`).emit('agent:thinking:step', data)
    ↓
Socket.IO Client (Frontend)
    ↓
socket.on('agent:thinking:step', (data) => { ... })
    ↓
Update Store (Zustand)
    ↓
useSlidesStore.getState().addMessage(...)
    ↓
React Component Re-renders
    ↓
<AgentThinkingMessage /> appears
```

---

## Model Selection Strategy

| Task | Model | Reason |
|------|-------|--------|
| **Research Analysis** | Claude 3.5 | Best at reasoning & analysis |
| **Topic Generation** | Claude 3.5 | Excellent at structure & planning |
| **Content Writing** | GPT-4 | Best at creative writing |
| **Design** | Gemini 2.0 | Fast & good at visual tasks |
| **Quality Check** | Claude 3.5 | Best at evaluation & critique |
| **Orchestration** | Claude 3.5 | Best at complex reasoning |

---

## Error Handling

### Agent Level
```typescript
try {
  const result = await agent.execute(input);
  return result;
} catch (error) {
  // Emit error event
  emitter.status(agent.name, 'error');
  
  // Log to database
  await logAgentError(agent.name, error);
  
  // Retry or fallback
  return await fallbackStrategy(input);
}
```

### API Level
```typescript
try {
  const result = await orchestrator.execute(input);
  return Response.json({ success: true, ...result });
} catch (error) {
  // Log error
  logger.error('Pipeline failed', { error, input });
  
  // Emit error to user
  emitToUser(userId, 'generation:error', {
    message: 'Pipeline failed',
    error: error.message,
  });
  
  return Response.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

---

## Rate Limiting

### Per API Route
```typescript
// lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export async function checkRateLimit(userId: string) {
  const { success } = await ratelimit.limit(userId);
  if (!success) {
    throw new Error('Rate limit exceeded');
  }
}
```

---

## Zusammenfassung

### API Routes Übersicht

| Route | Agent | Model | Responsibility |
|-------|-------|-------|----------------|
| `/api/slides/workflow/pipeline` | Orchestrator | Claude 3.5 | Complete Pipeline |
| `/api/agents/research` | ResearchAgent | Claude 3.5 + Search | Web Research |
| `/api/agents/topics` | TopicAgent | Claude 3.5 | Topic Generation |
| `/api/agents/content` | ContentAgent | GPT-4 | Content Writing |
| `/api/agents/designer` | DesignerAgent | Gemini 2.0 | Layout Design |
| `/api/agents/quality` | QualityAgent | Claude 3.5 | Quality Check |
| `/api/tools/search` | - | Tavily | Web Search |
| `/api/tools/browse` | - | Playwright | Browser Automation |
| `/api/tools/image` | - | DALL-E 3 | Image Generation |

### Wer macht was?

**OrchestratorAgent:**
- Koordiniert alle Agents
- Verwaltet Pipeline-Flow
- Speichert Ergebnisse

**ResearchAgent:**
- Sucht Informationen
- Analysiert Quellen
- Extrahiert Key Findings

**TopicAgent:**
- Erstellt Outline
- Generiert Topics
- Strukturiert Präsentation

**ContentAgent:**
- Schreibt Slide-Content
- Erstellt Bullet Points
- Generiert Speaker Notes

**DesignerAgent:**
- Wählt Layouts
- Erstellt Design
- Platziert Elemente

**QualityAgent:**
- Prüft Qualität
- Bewertet Slides
- Gibt Feedback

**Das ist dein kompletter Tech Stack!** 🚀

