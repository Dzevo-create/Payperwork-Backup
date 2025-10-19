# Präsentations-Pipeline Analyse

## Ziel
Implementierung einer vollständigen Präsentations-Pipeline für Payperwork mit:
1. **Research** - Informationen sammeln
2. **Topic Generation** - Themen/Struktur erstellen
3. **Content Generation** - Inhalte für jede Folie generieren
4. **Pre-Production** - Finalisierung und Vorbereitung

---

## Manus' Ansatz (aus der Dokumentation)

### Kernarchitektur
- **Foundation Models**: Claude 3.5/3.7 + Qwen (Multi-Model Dynamic Invocation)
- **Agent Loop**: Analyze → Plan → Execute → Observe
- **CodeAct Paradigm**: Executable Python code als Action-Mechanismus
- **Planner Module**: Task Decomposition in strukturierte Steps
- **Knowledge Module**: RAG mit externen Datenquellen
- **Multi-Agent Collaboration**: Spezialisierte Sub-Agents arbeiten parallel

### Für Präsentationen relevant:
1. **Research Phase**:
   - SearchTool für Web-Recherche
   - BrowserTool für Deep-Dive in Quellen
   - Multi-Source Information Gathering
   - Fact Verification & Source Credibility Assessment

2. **Planning Phase**:
   - Planner erstellt strukturierte Roadmap
   - Todo.md als Checklist für Fortschritt
   - Iterative Plan-Updates möglich

3. **Content Generation**:
   - LLM Tool für Content-Erstellung
   - Streaming für Echtzeit-Updates
   - File-based Memory für Zwischenergebnisse

4. **Memory Management**:
   - Event Stream Context (kurzfristig)
   - Persistent Scratchpad Files (mittelfristig)
   - Knowledge Store (langfristig)

---

## Payperwork's aktueller Stand

### Vorhandene Infrastruktur

#### 1. Multi-Agent System (bereits implementiert!)
**Pfad**: `/lib/agents/`

**Agents**:
- `ResearchAgent.ts` - Multi-Source Research, Information Synthesis
- `ContentWriterAgent.ts` - Content-Erstellung
- `CoordinatorAgent.ts` - Agent-Orchestrierung

**Tools**:
- `SearchTool.ts` - Web-Suche
- `BrowserTool.ts` - Browser-Automation
- `LLMTool.ts` - LLM-Integration

**Base**:
- `BaseAgent.ts` - Agent-Framework mit Logging, Progress Events

#### 2. Slides Services (bereits implementiert!)
**Pfad**: `/lib/api/slides/agents/`

**Services**:
- `ResearchService.ts` - Wrapper für ResearchAgent
- `ContentGenerationService.ts` - Wrapper für ContentWriterAgent
- `PresentationService.ts` - Orchestriert Research + Content

**Features**:
- Progress Callbacks
- WebSocket-Integration
- Supabase-Persistierung

#### 3. Aktuelle Workflow-Implementation
**Pfad**: `/app/api/slides/workflow/`

**Endpoints**:
- `generate-topics/route.ts` - Topic Generation mit Claude
- `generate-slides/route.ts` - Slides Generation
- `generate/route.ts` - Vollständiger Workflow

**Aktueller Flow**:
```
User Prompt → generateTopics() → Claude API → 10 Topics → DB
           → generateSlides() → Claude API (streaming) → Slides → DB
```

#### 4. Claude Service
**Pfad**: `/lib/api/slides/claude-service.ts`

**Funktionen**:
- `generateTopics()` - 10 Topics mit Claude
- `generateSlides()` - Streaming Content Generation

**Problem**: Direkte Claude-Calls ohne Research-Phase!

---

## Gap-Analyse: Was fehlt?

### ❌ Fehlende Komponenten

1. **Research-Integration in Topic Generation**
   - Aktuell: Topics werden nur aus dem Prompt generiert
   - Sollte: Research → Topic Generation basierend auf Fakten

2. **Pre-Production Phase**
   - Aktuell: Slides werden direkt in DB gespeichert
   - Sollte: Review, Refinement, Quality Check

3. **Workflow-Orchestrierung**
   - Aktuell: Separate API-Calls für Topics und Slides
   - Sollte: Einheitlicher Pipeline-Flow

4. **Memory & Context Management**
   - Aktuell: Keine Persistierung zwischen Phasen
   - Sollte: Research-Ergebnisse für Content Generation nutzen

### ✅ Vorhandene Komponenten (gut!)

1. ✅ ResearchAgent mit Multi-Source Gathering
2. ✅ ContentWriterAgent für Content-Erstellung
3. ✅ PresentationService für Orchestrierung
4. ✅ WebSocket für Real-time Updates
5. ✅ Supabase für Persistierung
6. ✅ Progress Callbacks System

---

## Vorgeschlagene Architektur

### Pipeline-Flow (Manus-inspiriert)

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INPUT                                │
│  "Erstelle eine Präsentation über Künstliche Intelligenz"   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: RESEARCH                                           │
│  ─────────────────────                                       │
│  • ResearchAgent.execute()                                   │
│  • Multi-Source Web Search (SearchTool)                      │
│  • Deep-Dive in Top Sources (BrowserTool)                    │
│  • Extract Key Findings                                      │
│  • Generate Research Summary                                 │
│                                                              │
│  Output: ResearchServiceOutput                               │
│  - summary: string                                           │
│  - keyFindings: string[]                                     │
│  - sources: Source[]                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: TOPIC GENERATION                                   │
│  ──────────────────────────                                  │
│  • Input: Research Summary + Key Findings                    │
│  • LLMTool.generateJSON()                                    │
│  • Generate 10 structured topics                             │
│  • Validate topic structure                                  │
│  • Save to DB (presentations.topics)                         │
│                                                              │
│  Output: Topic[]                                             │
│  - order: number                                             │
│  - title: string                                             │
│  - description: string                                       │
│  - keyPoints: string[] (aus Research)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: CONTENT GENERATION                                 │
│  ────────────────────────────                                │
│  • Input: Topics + Research Context                          │
│  • ContentWriterAgent.execute()                              │
│  • Generate slide content (streaming)                        │
│  • For each topic:                                           │
│    - Title                                                   │
│    - Content (based on research findings)                    │
│    - Bullet Points                                           │
│    - Speaker Notes                                           │
│    - Layout suggestion                                       │
│  • Save to DB (slides table)                                 │
│                                                              │
│  Output: SlideContent[]                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: PRE-PRODUCTION                                     │
│  ─────────────────────────                                   │
│  • Quality Check                                             │
│  • Consistency Validation                                    │
│  • Fact Verification (gegen Research)                        │
│  • Generate Preview                                          │
│  • Update presentation status → 'ready'                      │
│                                                              │
│  Output: PresentationGenerationOutput                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  USER REVIEW  │
                    └───────────────┘
```

### Technische Implementation

#### 1. Neuer Service: `PresentationPipelineService`

```typescript
class PresentationPipelineService {
  private researchService: ResearchService;
  private contentService: ContentGenerationService;
  private llmTool: LLMTool;
  
  async generatePresentation(input, context, onProgress) {
    // Phase 1: Research
    const research = await this.conductResearch(input.topic);
    
    // Phase 2: Topic Generation (mit Research-Context!)
    const topics = await this.generateTopicsWithResearch(
      input.topic, 
      research
    );
    
    // Phase 3: Content Generation
    const slides = await this.generateContentWithResearch(
      topics,
      research
    );
    
    // Phase 4: Pre-Production
    const finalPresentation = await this.preProduction(
      slides,
      research
    );
    
    return finalPresentation;
  }
}
```

#### 2. Erweiterte Topic Generation

```typescript
async generateTopicsWithResearch(
  topic: string,
  research: ResearchServiceOutput
): Promise<Topic[]> {
  const prompt = `
    Du bist ein Präsentations-Experte.
    
    Thema: ${topic}
    
    Research Summary:
    ${research.summary}
    
    Key Findings:
    ${research.keyFindings.join('\n')}
    
    Erstelle 10 Folienthemen basierend auf den Research-Ergebnissen.
    Jedes Thema sollte:
    - Einen klaren Titel haben
    - Eine Beschreibung enthalten
    - Relevante Key Points aus dem Research zuordnen
    
    Output als JSON...
  `;
  
  return await this.llmTool.generateJSON(prompt);
}
```

#### 3. Erweiterte Content Generation

```typescript
async generateContentWithResearch(
  topics: Topic[],
  research: ResearchServiceOutput
): Promise<SlideContent[]> {
  const slides = [];
  
  for (const topic of topics) {
    // Finde relevante Research-Findings für dieses Topic
    const relevantFindings = this.findRelevantFindings(
      topic,
      research.keyFindings
    );
    
    // Generiere Content mit Research-Context
    const slide = await this.contentService.generateSlideContent({
      topic: topic.title,
      description: topic.description,
      researchContext: relevantFindings,
      sources: research.sources
    });
    
    slides.push(slide);
  }
  
  return slides;
}
```

#### 4. Pre-Production Phase

```typescript
async preProduction(
  slides: SlideContent[],
  research: ResearchServiceOutput
): Promise<PresentationGenerationOutput> {
  // Quality Checks
  await this.validateConsistency(slides);
  await this.verifyFacts(slides, research);
  
  // Generate metadata
  const metadata = {
    totalSlides: slides.length,
    wordCount: this.calculateWordCount(slides),
    researchSources: research.sources.map(s => s.url),
    qualityScore: await this.calculateQualityScore(slides)
  };
  
  return {
    slides,
    research,
    metadata
  };
}
```

---

## Implementierungsplan

### Phase 1: Research-Integration (Priorität: HOCH)
- [ ] `PresentationPipelineService` erstellen
- [ ] Research-Phase in Workflow integrieren
- [ ] Research-Ergebnisse persistieren (neue DB-Spalte?)
- [ ] WebSocket Events für Research-Progress

### Phase 2: Topic Generation mit Research (Priorität: HOCH)
- [ ] `generateTopicsWithResearch()` implementieren
- [ ] Topic-Schema erweitern (keyPoints aus Research)
- [ ] Prompt Engineering für bessere Topics
- [ ] Validation der generierten Topics

### Phase 3: Content Generation mit Research (Priorität: MITTEL)
- [ ] `generateContentWithResearch()` implementieren
- [ ] Relevante Findings pro Topic zuordnen
- [ ] Source-Attribution in Slides
- [ ] Speaker Notes mit Research-Details

### Phase 4: Pre-Production (Priorität: NIEDRIG)
- [ ] Quality Check System
- [ ] Fact Verification gegen Research
- [ ] Consistency Validation
- [ ] Preview Generation

### Phase 5: API-Endpoints (Priorität: HOCH)
- [ ] Neuer Endpoint: `/api/slides/workflow/full-pipeline`
- [ ] Bestehende Endpoints refactoren
- [ ] WebSocket-Integration testen
- [ ] Error Handling verbessern

---

## Nächste Schritte

1. **Sofort**: PresentationPipelineService erstellen
2. **Dann**: Research-Integration in Topic Generation
3. **Danach**: Content Generation mit Research-Context
4. **Später**: Pre-Production Phase
5. **Abschließend**: Testing & Refinement

---

## Offene Fragen

1. **Datenbank-Schema**: Wo speichern wir Research-Ergebnisse?
   - Neue Tabelle `presentation_research`?
   - Oder JSONB-Spalte in `presentations`?

2. **Caching**: Research-Ergebnisse cachen für ähnliche Topics?

3. **User Feedback**: Soll User Topics/Content reviewen können vor Finalisierung?

4. **Performance**: Wie lange dauert die komplette Pipeline?
   - Research: ~10-30s
   - Topics: ~5-10s
   - Content: ~30-60s
   - **Total: ~45-100s** (akzeptabel?)

5. **API Keys**: Welche APIs sind bereits konfiguriert?
   - Claude (Anthropic)
   - OpenAI?
   - Search API (welche?)

