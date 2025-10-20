# 🚀 Payperwork Tech Stack - Kompletter Guide

## Basierend auf Manus AI Architektur

---

## 📋 Inhaltsverzeichnis

1. [Kompletter Tech Stack](#kompletter-tech-stack)
2. [Architektur-Übersicht](#architektur-übersicht)
3. [API-Struktur](#api-struktur)
4. [Implementation Guide](#implementation-guide)
5. [Deployment](#deployment)

---

## 1. Kompletter Tech Stack

### Frontend

```
Next.js 15 (App Router)
├── React 18
├── TypeScript
├── Tailwind CSS
├── Shadcn/ui Components
├── Zustand (State Management)
├── Socket.IO Client (Real-time)
└── Lucide Icons
```

### Backend

```
Node.js 22
├── Next.js API Routes
├── Custom Server (server.js)
├── Socket.IO Server (WebSockets)
├── Express (optional, für separate API)
└── TypeScript
```

### Database

```
Supabase (PostgreSQL)
├── Presentations Table
├── Slides Table
├── Users Table
├── Research Data Table
└── Agent Logs Table
```

### AI/ML Models

```
Multi-Model Strategy (wie Manus)
├── Claude 3.5 Sonnet (Anthropic) - Main Reasoning
├── GPT-4 (OpenAI) - Coding & Analysis
├── Gemini 2.0 Flash (Google) - Fast Tasks
└── Custom Fine-tuned Models (optional)
```

### Agent System

```
Multi-Agent Architecture
├── ResearchAgent (Web Search, Data Gathering)
├── TopicAgent (Outline Generation)
├── ContentAgent (Slide Content Writing)
├── DesignerAgent (Layout & Visual Design)
├── QualityAgent (Quality Check & Scoring)
└── OrchestratorAgent (Coordination)
```

### Tools & Services

```
External Services
├── Search API (Tavily, Perplexity, Google)
├── Browser Automation (Playwright)
├── Image Generation (DALL-E, Midjourney)
├── File Storage (Supabase Storage / S3)
├── Email (Resend, SendGrid)
└── Analytics (PostHog, Mixpanel)
```

### DevOps & Infrastructure

```
Deployment
├── Railway / Render (Hosting)
├── GitHub (Version Control)
├── GitHub Actions (CI/CD)
├── Docker (optional, für Sandbox)
└── Vercel (nur für Static Frontend, optional)

Monitoring
├── Sentry (Error Tracking)
├── LogTail (Logging)
└── Uptime Robot (Monitoring)
```

---

## 2. Architektur-Übersicht

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  Next.js App (React Components + Socket.IO Client)         │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP + WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                      API LAYER                              │
│  Next.js API Routes + Custom Server (server.js)            │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌───▼──────┐ ┌───▼──────┐
│   Database   │ │  Agents  │ │ External │
│  (Supabase)  │ │  System  │ │   APIs   │
└──────────────┘ └──────────┘ └──────────┘
```

### Detailed Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                        │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Chat UI   │  │ Dashboard  │  │  Preview   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Agent Dashboard (Generative UI)                │ │
│  │  - Agent Thinking Messages                             │ │
│  │  - Agent Status Cards                                  │ │
│  │  - Research Sources                                    │ │
│  │  - Pipeline Progress                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────┬──────────────────────────────────┘
                            │
                    Socket.IO Client
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                      CUSTOM SERVER                            │
│                      (server.js)                              │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Socket.IO Server                           ││
│  │  - User Rooms                                           ││
│  │  - Event Broadcasting                                   ││
│  │  - Agent Event Listeners                                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Next.js Handler                            ││
│  │  - API Routes                                           ││
│  │  - SSR/SSG                                              ││
│  └─────────────────────────────────────────────────────────┘│
└───────────────────────────┬──────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐   ┌────────▼────────┐   ┌─────▼──────┐
│   Database   │   │  Agent System   │   │  External  │
│  (Supabase)  │   │  (Orchestrator) │   │    APIs    │
└──────────────┘   └────────┬────────┘   └────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐   ┌────────▼────────┐   ┌─────▼──────┐
│   Research   │   │     Topic       │   │  Content   │
│    Agent     │   │     Agent       │   │   Agent    │
└──────────────┘   └─────────────────┘   └────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                   ┌────────▼────────┐
                   │    Designer     │
                   │     Agent       │
                   └────────┬────────┘
                            │
                   ┌────────▼────────┐
                   │    Quality      │
                   │     Agent       │
                   └─────────────────┘
```

---

## 3. API-Struktur

### API Routes Organization

```
app/api/
├── auth/                          # Authentication
│   ├── login/route.ts
│   ├── register/route.ts
│   └── logout/route.ts
│
├── slides/                        # Slides System
│   ├── workflow/                  # Main Workflow
│   │   ├── pipeline/              # Complete Pipeline
│   │   │   └── route.ts           # POST /api/slides/workflow/pipeline
│   │   ├── generate-topics/       # Topic Generation
│   │   │   └── route.ts           # POST /api/slides/workflow/generate-topics
│   │   ├── generate-slides/       # Slide Generation
│   │   │   └── route.ts           # POST /api/slides/workflow/generate-slides
│   │   └── regenerate/            # Regenerate Single Slide
│   │       └── route.ts           # POST /api/slides/workflow/regenerate
│   │
│   ├── presentations/             # Presentations CRUD
│   │   ├── route.ts               # GET, POST /api/slides/presentations
│   │   └── [id]/
│   │       ├── route.ts           # GET, PUT, DELETE /api/slides/presentations/:id
│   │       └── slides/
│   │           └── route.ts       # GET /api/slides/presentations/:id/slides
│   │
│   └── export/                    # Export
│       ├── pdf/route.ts           # POST /api/slides/export/pdf
│       └── pptx/route.ts          # POST /api/slides/export/pptx
│
├── agents/                        # Agent System
│   ├── research/                  # Research Agent
│   │   └── route.ts               # POST /api/agents/research
│   ├── topics/                    # Topic Agent
│   │   └── route.ts               # POST /api/agents/topics
│   ├── content/                   # Content Agent
│   │   └── route.ts               # POST /api/agents/content
│   ├── designer/                  # Designer Agent
│   │   └── route.ts               # POST /api/agents/designer
│   └── quality/                   # Quality Agent
│       └── route.ts               # POST /api/agents/quality
│
├── tools/                         # Tool APIs
│   ├── search/                    # Web Search
│   │   └── route.ts               # POST /api/tools/search
│   ├── browse/                    # Browser Automation
│   │   └── route.ts               # POST /api/tools/browse
│   └── image/                     # Image Generation
│       └── route.ts               # POST /api/tools/image
│
└── webhooks/                      # Webhooks
    ├── supabase/route.ts          # Supabase Webhooks
    └── stripe/route.ts            # Stripe Webhooks
```

### API Responsibility Matrix

| API Route | Responsibility | Agent | Model |
|-----------|---------------|-------|-------|
| `/api/slides/workflow/pipeline` | Complete Pipeline Orchestration | OrchestratorAgent | Claude 3.5 |
| `/api/agents/research` | Web Research & Data Gathering | ResearchAgent | Claude 3.5 + Search API |
| `/api/agents/topics` | Topic Generation & Outline | TopicAgent | Claude 3.5 |
| `/api/agents/content` | Slide Content Writing | ContentAgent | GPT-4 / Claude 3.5 |
| `/api/agents/designer` | Layout & Visual Design | DesignerAgent | Gemini 2.0 |
| `/api/agents/quality` | Quality Check & Scoring | QualityAgent | Claude 3.5 |
| `/api/tools/search` | Web Search Tool | - | Tavily/Perplexity |
| `/api/tools/browse` | Browser Automation | - | Playwright |
| `/api/tools/image` | Image Generation | - | DALL-E/Midjourney |

---

## 4. Implementation Guide

### Phase 1: Foundation (Week 1)

#### 1.1 Setup Project Structure

```bash
# Already done! ✅
payperwork/
├── app/
│   ├── api/
│   ├── (routes)/
│   └── layout.tsx
├── components/
├── lib/
├── hooks/
├── types/
├── server.js
└── package.json
```

#### 1.2 Install Dependencies

```bash
# AI Models
npm install openai @anthropic-ai/sdk @google/generative-ai

# Tools
npm install playwright-core tavily cheerio

# Utils
npm install zod date-fns nanoid
```

#### 1.3 Environment Variables

```env
# AI Models
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Search
TAVILY_API_KEY=tvly-...

# Database
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Phase 2: Agent System (Week 2)

#### 2.1 Create Agent Base Class

```typescript
// lib/agents/BaseAgent.ts
import { AgentEventEmitter } from '@/lib/api/slides/agents/pipeline/utils/agentEventEmitter';

export interface AgentContext {
  userId: string;
  presentationId?: string;
  sessionId: string;
}

export interface AgentConfig {
  name: string;
  model: 'claude' | 'gpt4' | 'gemini';
  temperature?: number;
  maxTokens?: number;
}

export abstract class BaseAgent {
  protected name: string;
  protected model: string;
  protected emitter?: AgentEventEmitter;
  protected context?: AgentContext;

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.model = config.model;
  }

  /**
   * Initialize agent with context
   */
  async initialize(context: AgentContext): Promise<void> {
    this.context = context;
    this.emitter = new AgentEventEmitter(context.userId);
    
    // Emit agent started
    this.emitter.status(this.name, 'thinking', 'initializing');
  }

  /**
   * Execute agent task
   */
  abstract execute(input: any): Promise<any>;

  /**
   * Cleanup agent resources
   */
  async cleanup(): Promise<void> {
    if (this.emitter) {
      this.emitter.status(this.name, 'completed');
    }
  }

  /**
   * Get AI client based on model
   */
  protected getAIClient() {
    switch (this.model) {
      case 'claude':
        return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      case 'gpt4':
        return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      case 'gemini':
        return new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
      default:
        throw new Error(`Unknown model: ${this.model}`);
    }
  }
}
```

#### 2.2 Implement ResearchAgent (Already done! ✅)

```typescript
// lib/agents/ResearchAgent.ts
import { BaseAgent } from './BaseAgent';
import { searchWeb } from '@/lib/tools/search';

export class ResearchAgent extends BaseAgent {
  constructor() {
    super({
      name: 'ResearchAgent',
      model: 'claude',
    });
  }

  async execute(input: { topic: string; depth: string }): Promise<ResearchResult> {
    // Emit thinking
    this.emitter?.thinking(
      this.name,
      `Currently researching "${input.topic}" to gather comprehensive information...`
    );

    // Emit status
    this.emitter?.status(this.name, 'working', 'researching', 0);

    // Search web
    const searchResults = await searchWeb(input.topic);

    // Emit sources
    for (const source of searchResults) {
      this.emitter?.sourceFound(this.name, {
        title: source.title,
        url: source.url,
        snippet: source.snippet,
        relevance: source.relevance,
      });
    }

    // Analyze with AI
    const analysis = await this.analyzeResults(searchResults);

    // Emit completion
    this.emitter?.actionCompleted(this.name, 'researching', {
      sourceCount: searchResults.length,
    });

    return {
      sources: searchResults,
      analysis,
      keyFindings: analysis.keyFindings,
    };
  }

  private async analyzeResults(results: any[]) {
    // Use Claude to analyze
    const client = this.getAIClient();
    // ... implementation
  }
}
```

#### 2.3 Implement Other Agents

**TopicAgent** (Already done! ✅)
**ContentAgent** (TODO)
**DesignerAgent** (TODO)
**QualityAgent** (TODO)

### Phase 3: Orchestrator (Week 3)

#### 3.1 Create Orchestrator

```typescript
// lib/agents/Orchestrator.ts
import { BaseAgent } from './BaseAgent';
import { ResearchAgent } from './ResearchAgent';
import { TopicAgent } from './TopicAgent';
import { ContentAgent } from './ContentAgent';
import { DesignerAgent } from './DesignerAgent';
import { QualityAgent } from './QualityAgent';

export interface OrchestratorInput {
  prompt: string;
  slideCount: number;
  userId: string;
  enableResearch?: boolean;
}

export class Orchestrator extends BaseAgent {
  private agents: Map<string, BaseAgent>;

  constructor() {
    super({
      name: 'OrchestratorAgent',
      model: 'claude',
    });

    // Initialize agents
    this.agents = new Map([
      ['research', new ResearchAgent()],
      ['topic', new TopicAgent()],
      ['content', new ContentAgent()],
      ['designer', new DesignerAgent()],
      ['quality', new QualityAgent()],
    ]);
  }

  async execute(input: OrchestratorInput): Promise<PresentationResult> {
    const context = {
      userId: input.userId,
      sessionId: nanoid(),
    };

    // Initialize all agents
    for (const agent of this.agents.values()) {
      await agent.initialize(context);
    }

    try {
      // Phase 1: Research (optional)
      let researchData = null;
      if (input.enableResearch) {
        const researchAgent = this.agents.get('research')!;
        researchData = await researchAgent.execute({
          topic: input.prompt,
          depth: 'medium',
        });
      }

      // Phase 2: Generate Topics
      const topicAgent = this.agents.get('topic')!;
      const topics = await topicAgent.execute({
        prompt: input.prompt,
        slideCount: input.slideCount,
        researchData,
      });

      // Phase 3: Generate Content
      const contentAgent = this.agents.get('content')!;
      const slides = await contentAgent.execute({
        topics,
        researchData,
      });

      // Phase 4: Design Layouts
      const designerAgent = this.agents.get('designer')!;
      const designedSlides = await designerAgent.execute({
        slides,
      });

      // Phase 5: Quality Check
      const qualityAgent = this.agents.get('quality')!;
      const qualityResult = await qualityAgent.execute({
        slides: designedSlides,
      });

      return {
        slides: designedSlides,
        qualityScore: qualityResult.score,
        metadata: {
          researchSources: researchData?.sources.length || 0,
          totalTime: Date.now() - context.sessionId,
        },
      };
    } finally {
      // Cleanup all agents
      for (const agent of this.agents.values()) {
        await agent.cleanup();
      }
    }
  }
}
```

#### 3.2 Create Pipeline API Route

```typescript
// app/api/slides/workflow/pipeline/route.ts
import { Orchestrator } from '@/lib/agents/Orchestrator';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, slideCount, userId, enableResearch } = body;

    // Validate input
    if (!prompt || !slideCount || !userId) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create orchestrator
    const orchestrator = new Orchestrator();

    // Execute pipeline
    const result = await orchestrator.execute({
      prompt,
      slideCount,
      userId,
      enableResearch,
    });

    // Save to database
    const supabase = createClient();
    const { data: presentation } = await supabase
      .from('presentations')
      .insert({
        user_id: userId,
        title: prompt,
        slide_count: slideCount,
        quality_score: result.qualityScore,
        metadata: result.metadata,
      })
      .select()
      .single();

    // Save slides
    await supabase.from('slides').insert(
      result.slides.map((slide, index) => ({
        presentation_id: presentation.id,
        order_index: index,
        title: slide.title,
        content: slide.content,
        layout: slide.layout,
      }))
    );

    return Response.json({
      success: true,
      presentationId: presentation.id,
      slides: result.slides,
      qualityScore: result.qualityScore,
    });
  } catch (error) {
    console.error('Pipeline error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Phase 4: Tools Integration (Week 4)

#### 4.1 Web Search Tool

```typescript
// lib/tools/search.ts
import { TavilySearchClient } from 'tavily';

const tavily = new TavilySearchClient({
  apiKey: process.env.TAVILY_API_KEY!,
});

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

export async function searchWeb(
  query: string,
  options?: {
    maxResults?: number;
    includeImages?: boolean;
  }
): Promise<SearchResult[]> {
  const response = await tavily.search(query, {
    max_results: options?.maxResults || 7,
    include_images: options?.includeImages || false,
  });

  return response.results.map((result) => ({
    title: result.title,
    url: result.url,
    snippet: result.content,
    relevance: result.score,
  }));
}
```

#### 4.2 Browser Automation Tool

```typescript
// lib/tools/browser.ts
import { chromium } from 'playwright-core';

export async function browseWebsite(url: string): Promise<{
  title: string;
  content: string;
  screenshot?: string;
}> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    const title = await page.title();
    const content = await page.textContent('body');
    const screenshot = await page.screenshot({ encoding: 'base64' });

    return {
      title,
      content: content || '',
      screenshot,
    };
  } finally {
    await browser.close();
  }
}
```

#### 4.3 Image Generation Tool

```typescript
// lib/tools/image.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateImage(
  prompt: string,
  options?: {
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
  }
): Promise<string> {
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: options?.size || '1024x1024',
    quality: options?.quality || 'standard',
    n: 1,
  });

  return response.data[0].url!;
}
```

### Phase 5: Database Schema (Week 5)

#### 5.1 Supabase Migrations

```sql
-- Create presentations table
CREATE TABLE presentations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  slide_count INTEGER NOT NULL,
  quality_score INTEGER,
  topics JSONB,
  research_data JSONB,
  metadata JSONB,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create slides table
CREATE TABLE slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  layout TEXT DEFAULT 'default',
  design JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_logs table (for debugging)
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL,
  input JSONB,
  output JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_presentations_user_id ON presentations(user_id);
CREATE INDEX idx_slides_presentation_id ON slides(presentation_id);
CREATE INDEX idx_agent_logs_presentation_id ON agent_logs(presentation_id);
```

---

## 5. Deployment

### Railway Deployment

#### 5.1 Setup Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to GitHub repo
railway link
```

#### 5.2 Environment Variables

```bash
# Set environment variables
railway variables set OPENAI_API_KEY=sk-...
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set GOOGLE_API_KEY=...
railway variables set TAVILY_API_KEY=tvly-...
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://...
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=...
railway variables set SUPABASE_SERVICE_ROLE_KEY=...
railway variables set NODE_ENV=production
```

#### 5.3 Deploy

```bash
# Deploy
railway up

# Check logs
railway logs

# Open app
railway open
```

---

## 6. Testing

### 6.1 Test Pipeline

```bash
curl -X POST http://localhost:3000/api/slides/workflow/pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Künstliche Intelligenz",
    "slideCount": 10,
    "userId": "test-user-123",
    "enableResearch": true
  }'
```

### 6.2 Expected Response

```json
{
  "success": true,
  "presentationId": "uuid-here",
  "slides": [
    {
      "title": "Introduction to AI",
      "content": "...",
      "layout": "title"
    },
    // ... more slides
  ],
  "qualityScore": 92
}
```

---

## 7. Monitoring

### 7.1 Add Logging

```typescript
// lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### 7.2 Add Error Tracking

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

---

## Zusammenfassung

### Was du jetzt hast:

✅ **Complete Tech Stack** - Frontend, Backend, Database, AI
✅ **Multi-Agent System** - ResearchAgent, TopicAgent, etc.
✅ **API Structure** - Klare Verantwortlichkeiten
✅ **Real-time Updates** - Socket.IO Integration
✅ **Generative UI** - Agent Dashboard

### Nächste Schritte:

1. **Week 1:** Setup & Dependencies
2. **Week 2:** Implement Agents (ContentAgent, DesignerAgent, QualityAgent)
3. **Week 3:** Build Orchestrator
4. **Week 4:** Integrate Tools
5. **Week 5:** Database & Testing
6. **Week 6:** Deploy auf Railway

**Du bist auf dem richtigen Weg!** 🚀

