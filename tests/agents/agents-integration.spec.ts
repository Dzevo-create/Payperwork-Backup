/**
 * Agent Integration Tests
 *
 * Integration tests for Multi-Agent System agents.
 * Tests agents with real API calls (requires valid API keys).
 *
 * Test Coverage:
 * - ContentWriterAgent
 * - ResearchAgent
 * - CoordinatorAgent
 * - Agent workflows
 * - Tool usage
 * - Error handling
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { test, expect } from '@playwright/test';
import { ContentWriterAgent } from '../../lib/agents/agents/ContentWriterAgent';
import { ResearchAgent } from '../../lib/agents/agents/ResearchAgent';
import { CoordinatorAgent } from '../../lib/agents/agents/CoordinatorAgent';
import { AgentExecutionContext } from '../../lib/agents/base';

// Test context
const testContext: AgentExecutionContext = {
  userId: 'test-user-123',
  sessionId: 'test-session-456',
};

// Skip tests if API keys are not configured
const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
const hasBraveKey = !!process.env.BRAVE_SEARCH_API_KEY;

test.describe('Agent Integration Tests', () => {
  test.describe('ContentWriterAgent', () => {
    let agent: ContentWriterAgent;

    test.beforeEach(() => {
      agent = new ContentWriterAgent();
    });

    test.skip(!hasAnthropicKey, 'should generate article content', async () => {
      const result = await agent.execute(
        {
          topic: 'The Benefits of TypeScript',
          contentType: 'article',
          wordCount: 200,
          tone: 'professional',
        },
        testContext
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.content).toBeDefined();
      expect(result.data?.metadata.wordCount).toBeGreaterThan(0);
      expect(result.data?.metadata.contentType).toBe('article');
    });

    test.skip(!hasAnthropicKey, 'should generate blog post', async () => {
      const result = await agent.execute(
        {
          topic: 'Getting Started with AI',
          contentType: 'blog_post',
          tone: 'casual',
        },
        testContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeDefined();
    });

    test.skip(!hasAnthropicKey, 'should generate slide content', async () => {
      const result = await agent.execute(
        {
          topic: 'Key Features of Modern Web Development',
          contentType: 'slide',
        },
        testContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeDefined();
      // Slide content should be concise
      expect(result.data!.metadata.wordCount).toBeLessThan(300);
    });

    test.skip(
      !hasAnthropicKey || !hasBraveKey,
      'should generate content with research',
      async () => {
        const result = await agent.execute(
          {
            topic: 'Latest AI Trends 2024',
            contentType: 'article',
            enableResearch: true,
          },
          testContext
        );

        expect(result.success).toBe(true);
        expect(result.data?.content).toBeDefined();
        expect(result.data?.research).toBeDefined();
        expect(result.data?.research?.sources).toBeDefined();
        expect(result.data?.research?.sources.length).toBeGreaterThan(0);
        expect(result.data?.research?.keyPoints).toBeDefined();
      }
    );

    test.skip(!hasAnthropicKey, 'should generate summary', async () => {
      const result = await agent.execute(
        {
          topic: 'Machine Learning Basics',
          contentType: 'summary',
          context: 'Explain the core concepts of machine learning for beginners',
        },
        testContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeDefined();
    });

    test.skip(!hasAnthropicKey, 'should include keywords', async () => {
      const keywords = ['TypeScript', 'type safety', 'JavaScript'];

      const result = await agent.execute(
        {
          topic: 'TypeScript vs JavaScript',
          contentType: 'article',
          keywords,
        },
        testContext
      );

      expect(result.success).toBe(true);
      const content = result.data?.content.toLowerCase() || '';
      // At least one keyword should be mentioned
      const hasKeyword = keywords.some((kw) =>
        content.includes(kw.toLowerCase())
      );
      expect(hasKeyword).toBe(true);
    });

    test.skip(!hasAnthropicKey, 'should use writeContent helper', async () => {
      const content = await agent.writeContent(
        'Quick Introduction to GraphQL',
        'article',
        testContext
      );

      expect(content).toBeDefined();
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  test.describe('ResearchAgent', () => {
    let agent: ResearchAgent;

    test.beforeEach(() => {
      agent = new ResearchAgent();
    });

    test.skip(!hasBraveKey || !hasAnthropicKey, 'should conduct quick research', async () => {
      const result = await agent.execute(
        {
          topic: 'Quantum Computing',
          depth: 'quick',
        },
        testContext
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.summary).toBeDefined();
      expect(result.data?.keyFindings).toBeDefined();
      expect(result.data?.sources).toBeDefined();
      expect(result.data?.sources.length).toBeGreaterThan(0);
      expect(result.data?.metadata.researchDepth).toBe('quick');
    });

    test.skip(
      !hasBraveKey || !hasAnthropicKey,
      'should conduct medium research',
      async () => {
        const result = await agent.execute(
          {
            topic: 'Renewable Energy Solutions',
            depth: 'medium',
          },
          testContext
        );

        expect(result.success).toBe(true);
        expect(result.data?.sources.length).toBeGreaterThanOrEqual(5);
        expect(result.data?.keyFindings.length).toBeGreaterThan(0);
      }
    );

    test.skip(
      !hasBraveKey || !hasAnthropicKey,
      'should conduct deep research',
      async () => {
        const result = await agent.execute(
          {
            topic: 'Climate Change Impact',
            depth: 'deep',
          },
          testContext
        );

        expect(result.success).toBe(true);
        expect(result.data?.sources.length).toBeGreaterThanOrEqual(10);
        expect(result.data?.detailedAnalysis).toBeDefined();
      }
    );

    test.skip(
      !hasBraveKey || !hasAnthropicKey,
      'should include news sources',
      async () => {
        const result = await agent.execute(
          {
            topic: 'AI Regulation',
            depth: 'medium',
            includeNews: true,
          },
          testContext
        );

        expect(result.success).toBe(true);
        expect(result.data?.sources.length).toBeGreaterThan(0);
      }
    );

    test.skip(
      !hasBraveKey || !hasAnthropicKey,
      'should use quickResearch helper',
      async () => {
        const result = await agent.quickResearch(
          'Machine Learning Applications',
          testContext
        );

        expect(result).toBeDefined();
        expect(result.summary).toBeDefined();
        expect(result.keyFindings).toBeDefined();
      }
    );
  });

  test.describe('CoordinatorAgent', () => {
    let agent: CoordinatorAgent;

    test.beforeEach(() => {
      agent = new CoordinatorAgent();
    });

    test.skip(
      !hasAnthropicKey || !hasBraveKey,
      'should execute presentation workflow',
      async () => {
        const result = await agent.execute(
          {
            task: 'Create presentation about Web3 Technology',
            taskType: 'presentation',
            audience: 'tech professionals',
          },
          testContext
        );

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.plan).toBeDefined();
        expect(result.data?.stepResults).toBeDefined();
        expect(result.data?.result).toBeDefined();
        expect(result.data?.metadata.agentsUsed).toContain('research');
        expect(result.data?.metadata.agentsUsed).toContain('content_writer');
      }
    );

    test.skip(
      !hasAnthropicKey || !hasBraveKey,
      'should use generatePresentation helper',
      async () => {
        const result = await agent.generatePresentation(
          'Blockchain Basics',
          testContext,
          'business executives'
        );

        expect(result).toBeDefined();
      }
    );

    test.skip(
      !hasAnthropicKey || !hasBraveKey,
      'should track execution metadata',
      async () => {
        const result = await agent.execute(
          {
            task: 'Create article about AI Ethics',
            taskType: 'article',
          },
          testContext
        );

        expect(result.success).toBe(true);
        expect(result.data?.metadata.planningTime).toBeGreaterThan(0);
        expect(result.data?.metadata.executionTime).toBeGreaterThan(0);
        expect(result.data?.metadata.totalTime).toBeGreaterThan(0);
        expect(result.data?.metadata.success).toBe(true);
      }
    );
  });

  test.describe('Agent Error Handling', () => {
    test('should handle invalid input gracefully', async () => {
      const agent = new ContentWriterAgent();

      const result = await agent.execute(
        {
          topic: '', // Invalid empty topic
          contentType: 'article',
        },
        testContext
      );

      // Should either succeed with minimal content or fail gracefully
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    test('should handle missing API keys gracefully', async () => {
      // Temporarily remove API key
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const agent = new ContentWriterAgent();

      try {
        const result = await agent.execute(
          {
            topic: 'Test Topic',
            contentType: 'article',
          },
          testContext
        );

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      } finally {
        // Restore API key
        if (originalKey) {
          process.env.ANTHROPIC_API_KEY = originalKey;
        }
      }
    });
  });

  test.describe('Agent Execution Tracking', () => {
    test.skip(!hasAnthropicKey, 'should track execution history', async () => {
      const agent = new ContentWriterAgent();

      await agent.execute(
        {
          topic: 'Test Topic 1',
          contentType: 'summary',
        },
        testContext
      );

      await agent.execute(
        {
          topic: 'Test Topic 2',
          contentType: 'summary',
        },
        testContext
      );

      const history = agent.getHistory();
      expect(history.length).toBe(2);
    });

    test.skip(!hasAnthropicKey, 'should track logs', async () => {
      const agent = new ContentWriterAgent();

      await agent.execute(
        {
          topic: 'Test Topic',
          contentType: 'summary',
        },
        testContext
      );

      const logs = agent.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].agentName).toBe('ContentWriter');
    });
  });

  test.describe('Tool Usage', () => {
    test.skip(!hasAnthropicKey, 'ContentWriter should use LLM tool', async () => {
      const agent = new ContentWriterAgent();

      const result = await agent.execute(
        {
          topic: 'TypeScript Advantages',
          contentType: 'summary',
        },
        testContext
      );

      expect(result.success).toBe(true);
      expect(result.metadata?.tokensUsed).toBeGreaterThan(0);
    });

    test.skip(
      !hasBraveKey,
      'Research should use Search tool',
      async () => {
        const agent = new ResearchAgent();

        const result = await agent.execute(
          {
            topic: 'AI Safety',
            depth: 'quick',
          },
          testContext
        );

        expect(result.success).toBe(true);
        expect(result.data?.sources.length).toBeGreaterThan(0);
      }
    );
  });
});
