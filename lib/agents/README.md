# Multi-Agent System

A powerful, extensible Multi-Agent System inspired by Manus.ai for orchestrating complex AI workflows.

## Overview

This Multi-Agent System provides a clean, modular architecture for building sophisticated AI applications. It features:

- **Base Agent System**: Extensible abstract classes for creating custom agents
- **Core Tools**: LLM, Search, and Browser tools for common operations
- **Specialized Agents**: Pre-built agents for content generation, research, and orchestration
- **Workflow Orchestration**: Plan and execute multi-step workflows with dependency management
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Execution Tracking**: Built-in logging, history, and metadata tracking

## Architecture

```
lib/agents/
├── base/                  # Base classes and types
│   ├── types.ts          # Type definitions
│   ├── BaseAgent.ts      # Abstract base class for agents
│   ├── BaseTool.ts       # Abstract base class for tools
│   ├── AgentOrchestrator.ts  # Workflow orchestration
│   └── index.ts
├── tools/                # Core tools
│   ├── LLMTool.ts       # Claude API wrapper
│   ├── SearchTool.ts    # Brave Search API
│   ├── BrowserTool.ts   # Web scraping
│   └── index.ts
├── agents/              # Specialized agents
│   ├── CoordinatorAgent.ts   # Master orchestration agent
│   ├── ContentWriterAgent.ts # Content generation
│   ├── ResearchAgent.ts      # Research and analysis
│   └── index.ts
└── index.ts            # Main exports

```

## Quick Start

### Installation

The Multi-Agent System is already installed as part of the Payperwork project. Dependencies:

```bash
npm install @anthropic-ai/sdk jsdom turndown
```

### Environment Setup

Add the following to your `.env.local`:

```bash
# Required for LLMTool
ANTHROPIC_API_KEY="sk-ant-api03-..."

# Required for SearchTool
BRAVE_SEARCH_API_KEY="BSA8Nighy5Bvuh4bwZdAurmoCdHiYUr"
```

### Basic Usage

#### 1. Simple Content Generation

```typescript
import { ContentWriterAgent } from '@/lib/agents';

const writer = new ContentWriterAgent();

const result = await writer.execute(
  {
    topic: 'The Future of AI',
    contentType: 'article',
    audience: 'tech professionals',
    enableResearch: false,
  },
  {
    userId: 'user-123',
    sessionId: 'session-456',
  }
);

console.log(result.data?.content);
```

#### 2. Research with Content Generation

```typescript
import { ContentWriterAgent } from '@/lib/agents';

const writer = new ContentWriterAgent();

const result = await writer.execute(
  {
    topic: 'Climate Change Solutions',
    contentType: 'blog_post',
    enableResearch: true, // Enables web research
    keywords: ['renewable energy', 'carbon capture'],
  },
  context
);

// Access research data
console.log(result.data?.research?.sources);
console.log(result.data?.research?.keyPoints);
```

#### 3. Deep Research

```typescript
import { ResearchAgent } from '@/lib/agents';

const researcher = new ResearchAgent();

const result = await researcher.execute(
  {
    topic: 'Quantum Computing Applications',
    depth: 'deep', // 'quick' | 'medium' | 'deep'
    includeNews: true,
  },
  context
);

console.log(result.data?.summary);
console.log(result.data?.keyFindings);
console.log(result.data?.sources);
```

#### 4. Orchestrated Workflow

```typescript
import { CoordinatorAgent } from '@/lib/agents';

const coordinator = new CoordinatorAgent();

const result = await coordinator.execute(
  {
    task: 'Create a presentation about AI ethics',
    taskType: 'presentation',
    audience: 'board members',
    requirements: [
      'Include recent research',
      'Focus on practical implications',
    ],
  },
  context
);

console.log(result.data?.result);
console.log(result.data?.stepResults);
```

## Agents

### CoordinatorAgent

Master agent that orchestrates complex workflows by delegating to specialized agents.

**Capabilities:**
- Automatic task decomposition
- Agent selection and delegation
- Result synthesis
- Error handling and retry logic

**Example:**
```typescript
const coordinator = new CoordinatorAgent();

// Generate a presentation (automatic workflow)
const result = await coordinator.generatePresentation(
  'AI in Healthcare',
  context,
  'medical professionals'
);
```

### ContentWriterAgent

Specialized agent for creating high-quality content.

**Content Types:**
- `article` - Full articles with introduction, body, conclusion
- `blog_post` - Engaging blog posts with CTA
- `slide` - Concise presentation slides
- `outline` - Structured outlines
- `summary` - Brief summaries

**Example:**
```typescript
const writer = new ContentWriterAgent();

// Quick article without research
const article = await writer.writeContent(
  'Machine Learning Basics',
  'article',
  context
);

// Article with research
const researchedArticle = await writer.writeWithResearch(
  'Latest AI Trends',
  'article',
  context
);

// Presentation slide
const slide = await writer.writeSlide(
  'Key Benefits of AI',
  context,
  {
    audience: 'executives',
    keywords: ['ROI', 'efficiency', 'innovation'],
  }
);
```

### ResearchAgent

Conducts deep research by gathering and synthesizing information from multiple sources.

**Research Depth:**
- `quick` - 3 sources, basic analysis
- `medium` - 7 sources, comprehensive analysis (default)
- `deep` - 12 sources, detailed analysis with trends

**Example:**
```typescript
const researcher = new ResearchAgent();

// Quick research
const quickResearch = await researcher.quickResearch(
  'GPT-4 capabilities',
  context
);

// Deep research with news
const deepResearch = await researcher.execute(
  {
    topic: 'AI regulation in Europe',
    depth: 'deep',
    includeNews: true,
    focusAreas: ['GDPR', 'AI Act', 'data privacy'],
  },
  context
);
```

## Tools

### LLMTool

Wraps the Claude API for LLM operations.

**Features:**
- Streaming and non-streaming modes
- Token usage tracking
- Multiple model support
- JSON response parsing
- Yes/no questions

**Example:**
```typescript
import { LLMTool } from '@/lib/agents/tools';

const llm = new LLMTool();

// Simple text generation
const text = await llm.generateText('Explain quantum computing');

// With system prompt
const content = await llm.generateWithSystem(
  'You are a technical writer',
  'Write about Docker containers'
);

// JSON response
interface Analysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
}

const analysis = await llm.generateJSON<Analysis>(
  'Analyze sentiment: "This product is amazing!"'
);

// Streaming
await llm.generateStreaming(
  'Write a story',
  (chunk) => console.log(chunk) // Called for each chunk
);

// Yes/no question
const answer = await llm.askYesNo('Is TypeScript better than JavaScript?');
```

### SearchTool

Brave Search API integration for web search.

**Features:**
- Web and news search
- Result filtering
- Domain-specific search
- Markdown formatting

**Example:**
```typescript
import { SearchTool } from '@/lib/agents/tools';

const search = new SearchTool();

// Web search
const results = await search.search('AI breakthroughs 2024', 10);

// News search
const news = await search.searchNews('climate change', 5);

// Get top result
const topResult = await search.getTopResult('OpenAI GPT-4');

// Domain-specific search
const redditResults = await search.searchDomain(
  'best AI tools',
  'reddit.com'
);

// Format as markdown
const markdown = search.formatAsMarkdown(results);
```

### BrowserTool

Web scraping and content extraction.

**Features:**
- HTML, Text, and Markdown output
- Metadata extraction (title, description, og tags)
- Selector-based extraction
- Clean content formatting

**Example:**
```typescript
import { BrowserTool } from '@/lib/agents/tools';

const browser = new BrowserTool();

// Fetch as markdown
const markdown = await browser.fetchMarkdown('https://example.com');

// Fetch as text
const text = await browser.fetchText('https://example.com/article');

// Get metadata
const metadata = await browser.fetchMetadata('https://example.com');
console.log(metadata.title, metadata.description);

// Extract specific content
const content = await browser.extractBySelector(
  'https://example.com',
  'article.main-content'
);

// Check accessibility
const isAccessible = await browser.isAccessible('https://example.com');
```

## Custom Agents

### Creating a Custom Agent

```typescript
import { BaseAgent, AgentExecutionContext, AgentResult } from '@/lib/agents/base';
import { LLMTool } from '@/lib/agents/tools';

interface MyAgentInput {
  query: string;
  options?: string[];
}

interface MyAgentOutput {
  answer: string;
  confidence: number;
}

class MyCustomAgent extends BaseAgent<MyAgentInput, MyAgentOutput> {
  private llmTool: LLMTool;

  constructor() {
    super({
      name: 'MyCustomAgent',
      description: 'Does something custom',
      version: '1.0.0',
    });

    this.llmTool = new LLMTool();
    this.registerTool(this.llmTool);
  }

  async execute(
    input: MyAgentInput,
    context: AgentExecutionContext
  ): Promise<AgentResult<MyAgentOutput>> {
    try {
      this.log('info', 'Processing query', { query: input.query });

      // Use LLM
      const answer = await this.llmTool.generateText(input.query);

      return this.createSuccessResult({
        answer,
        confidence: 0.95,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
```

### Creating a Custom Tool

```typescript
import { BaseTool, ToolResult } from '@/lib/agents/base';

interface MyToolInput {
  data: string;
}

interface MyToolOutput {
  processed: string;
}

class MyCustomTool extends BaseTool<MyToolInput, MyToolOutput> {
  constructor() {
    super({
      name: 'my_tool',
      description: 'Processes data',
      version: '1.0.0',
    });
  }

  async execute(input: MyToolInput): Promise<ToolResult<MyToolOutput>> {
    try {
      this.validateInput(input, { required: ['data'] });

      const processed = input.data.toUpperCase();

      return this.createSuccessResult({ processed });
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}
```

## Custom Workflows

### Manual Workflow Creation

```typescript
import { AgentOrchestrator, WorkflowPlan } from '@/lib/agents';
import { ResearchAgent, ContentWriterAgent } from '@/lib/agents/agents';

// Create orchestrator
const orchestrator = new AgentOrchestrator({
  name: 'CustomOrchestrator',
  maxParallelSteps: 3,
});

// Register agents
orchestrator.registerAgent('research', new ResearchAgent());
orchestrator.registerAgent('writer', new ContentWriterAgent());

// Define workflow
const plan: WorkflowPlan = {
  id: 'custom-workflow-1',
  name: 'Research and Write Article',
  steps: [
    {
      id: 'step-1',
      name: 'research_topic',
      agentName: 'research',
      input: {
        topic: 'AI Safety',
        depth: 'deep',
      },
      context: {
        userId: 'user-123',
        sessionId: 'session-456',
      },
      status: 'pending',
    },
    {
      id: 'step-2',
      name: 'write_article',
      agentName: 'writer',
      input: {
        topic: 'AI Safety',
        contentType: 'article',
        audience: 'general public',
      },
      context: {
        userId: 'user-123',
        sessionId: 'session-456',
      },
      dependencies: ['research_topic'], // Wait for research
      status: 'pending',
    },
  ],
};

// Execute workflow
const result = await orchestrator.executeWorkflow(plan);

console.log(result.success);
console.log(result.stepResults);
```

## Best Practices

1. **Error Handling**: Always check `result.success` before accessing `result.data`
2. **Context**: Provide meaningful `userId` and `sessionId` for tracking
3. **Logging**: Use built-in logging methods: `this.log('info', 'message', data)`
4. **Progress**: Emit progress events: `this.emitProgress('event_name', data)`
5. **Tool Registration**: Register all tools in the constructor
6. **Input Validation**: Use `this.validateInput()` for required fields

## Type Safety

All agents and tools are fully typed:

```typescript
import type {
  AgentConfig,
  AgentResult,
  ToolResult,
  WorkflowPlan,
  ContentWriterInput,
  ResearchAgentOutput,
} from '@/lib/agents';
```

## Execution Tracking

All agents and tools track execution history:

```typescript
const agent = new ContentWriterAgent();

// Execute
await agent.execute(input, context);

// Get history
const history = agent.getHistory();
console.log(history); // Array of past executions

// Get logs
const logs = agent.getLogs();
console.log(logs); // Array of log entries
```

## Future Enhancements

- **WebSocket Integration**: Real-time progress updates to frontend
- **Additional Agents**: DesignerAgent, QualityControlAgent, OptimizerAgent
- **Advanced Tools**: ImageTool, VideoTool, DataAnalysisTool
- **Workflow Templates**: Pre-built workflows for common tasks
- **Caching**: Result caching for improved performance
- **Retry Logic**: Automatic retry on transient failures
- **Rate Limiting**: Built-in rate limiting for API calls

## Contributing

To add a new agent:

1. Create file in `lib/agents/agents/YourAgent.ts`
2. Extend `BaseAgent<Input, Output>`
3. Implement `execute()` method
4. Register tools in constructor
5. Export from `lib/agents/agents/index.ts`
6. Add types and documentation

## License

Part of the Payperwork project - © 2025 Payperwork Team

## Support

For questions or issues:
- Check existing agents for examples
- Review type definitions in `lib/agents/base/types.ts`
- Consult this README
