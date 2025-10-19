/**
 * E2E Workflow Tests
 *
 * End-to-end tests for complete Multi-Agent System workflows.
 * Tests full workflows from start to finish with real integrations.
 *
 * Test Coverage:
 * - Presentation generation workflow
 * - Research to content workflow
 * - Custom multi-step workflows
 * - Workflow orchestration
 * - Error recovery
 * - Performance benchmarks
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { test, expect } from '@playwright/test';
import { AgentOrchestrator } from '../../lib/agents/base/AgentOrchestrator';
import { ResearchAgent } from '../../lib/agents/agents/ResearchAgent';
import { ContentWriterAgent } from '../../lib/agents/agents/ContentWriterAgent';
import { CoordinatorAgent } from '../../lib/agents/agents/CoordinatorAgent';
import { WorkflowPlan, AgentExecutionContext } from '../../lib/agents/base';

// Test context
const testContext: AgentExecutionContext = {
  userId: 'e2e-test-user',
  sessionId: 'e2e-test-session',
};

// Skip tests if API keys are not configured
const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
const hasBraveKey = !!process.env.BRAVE_SEARCH_API_KEY;
const hasAllKeys = hasAnthropicKey && hasBraveKey;

test.describe('E2E Workflow Tests', () => {
  test.describe('Presentation Generation Workflow', () => {
    test.skip(
      !hasAllKeys,
      'should complete full presentation generation workflow',
      async () => {
        const coordinator = new CoordinatorAgent();

        const result = await coordinator.execute(
          {
            task: 'Create a presentation about Artificial Intelligence in Healthcare',
            taskType: 'presentation',
            audience: 'medical professionals',
            requirements: [
              'Include recent research',
              'Focus on practical applications',
              'Keep technical but accessible',
            ],
          },
          testContext
        );

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();

        // Verify workflow plan
        expect(result.data?.plan).toBeDefined();
        expect(result.data?.plan.steps.length).toBeGreaterThan(0);

        // Verify step results
        expect(result.data?.stepResults).toBeDefined();
        const stepIds = Object.keys(result.data?.stepResults || {});
        expect(stepIds.length).toBe(result.data?.plan.steps.length);

        // Verify all steps succeeded
        for (const stepId of stepIds) {
          const stepResult = result.data?.stepResults[stepId];
          expect(stepResult.success).toBe(true);
        }

        // Verify final output
        expect(result.data?.result).toBeDefined();

        // Verify metadata
        expect(result.data?.metadata.success).toBe(true);
        expect(result.data?.metadata.planningTime).toBeGreaterThan(0);
        expect(result.data?.metadata.executionTime).toBeGreaterThan(0);
        expect(result.data?.metadata.totalTime).toBeGreaterThan(0);
        expect(result.data?.metadata.agentsUsed).toContain('research');
        expect(result.data?.metadata.agentsUsed).toContain('content_writer');
      }
    );

    test.skip(
      !hasAllKeys,
      'should generate presentation with different topics',
      async () => {
        const coordinator = new CoordinatorAgent();

        const topics = [
          'Blockchain Technology',
          'Climate Change Solutions',
          'Future of Remote Work',
        ];

        for (const topic of topics) {
          const result = await coordinator.generatePresentation(
            topic,
            testContext
          );

          expect(result).toBeDefined();
        }
      }
    );
  });

  test.describe('Research to Content Workflow', () => {
    test.skip(
      !hasAllKeys,
      'should research topic and generate article',
      async () => {
        const orchestrator = new AgentOrchestrator({
          name: 'ResearchToArticleOrchestrator',
          maxParallelSteps: 1,
        });

        const researchAgent = new ResearchAgent();
        const writerAgent = new ContentWriterAgent();

        orchestrator.registerAgent('research', researchAgent);
        orchestrator.registerAgent('writer', writerAgent);

        const plan: WorkflowPlan = {
          id: 'research-to-article',
          name: 'Research and Write Article',
          steps: [
            {
              id: 'step-research',
              name: 'research_topic',
              agentName: 'research',
              input: {
                topic: 'Quantum Computing Applications',
                depth: 'medium',
              },
              context: testContext,
              status: 'pending',
            },
            {
              id: 'step-write',
              name: 'write_article',
              agentName: 'writer',
              input: {
                topic: 'Quantum Computing Applications',
                contentType: 'article',
                wordCount: 300,
              },
              context: testContext,
              dependencies: ['research_topic'],
              status: 'pending',
            },
          ],
        };

        const result = await orchestrator.executeWorkflow(plan);

        expect(result.success).toBe(true);
        expect(result.stepResults['step-research'].success).toBe(true);
        expect(result.stepResults['step-write'].success).toBe(true);

        // Research should have found sources
        const researchData = result.stepResults['step-research'].data;
        expect(researchData.sources.length).toBeGreaterThan(0);

        // Article should be generated
        const articleData = result.stepResults['step-write'].data;
        expect(articleData.content).toBeDefined();
        expect(articleData.metadata.wordCount).toBeGreaterThan(0);
      }
    );
  });

  test.describe('Custom Multi-Step Workflows', () => {
    test.skip(
      !hasAllKeys,
      'should execute custom 3-step workflow',
      async () => {
        const orchestrator = new AgentOrchestrator({
          name: 'CustomWorkflowOrchestrator',
        });

        const researchAgent = new ResearchAgent();
        const writerAgent = new ContentWriterAgent();

        orchestrator.registerAgent('research', researchAgent);
        orchestrator.registerAgent('writer', writerAgent);

        const plan: WorkflowPlan = {
          id: 'custom-3-step',
          name: 'Custom 3-Step Workflow',
          steps: [
            // Step 1: Research main topic
            {
              id: 'step-1',
              name: 'research_main',
              agentName: 'research',
              input: {
                topic: 'Machine Learning',
                depth: 'quick',
              },
              context: testContext,
              status: 'pending',
            },
            // Step 2: Generate outline
            {
              id: 'step-2',
              name: 'create_outline',
              agentName: 'writer',
              input: {
                topic: 'Machine Learning',
                contentType: 'outline',
              },
              context: testContext,
              dependencies: ['research_main'],
              status: 'pending',
            },
            // Step 3: Write full article
            {
              id: 'step-3',
              name: 'write_article',
              agentName: 'writer',
              input: {
                topic: 'Machine Learning',
                contentType: 'article',
                wordCount: 400,
              },
              context: testContext,
              dependencies: ['create_outline'],
              status: 'pending',
            },
          ],
        };

        const result = await orchestrator.executeWorkflow(plan);

        expect(result.success).toBe(true);
        expect(Object.keys(result.stepResults).length).toBe(3);

        // All steps should succeed
        expect(result.stepResults['step-1'].success).toBe(true);
        expect(result.stepResults['step-2'].success).toBe(true);
        expect(result.stepResults['step-3'].success).toBe(true);
      }
    );

    test.skip(
      !hasAllKeys,
      'should handle parallel independent steps',
      async () => {
        const orchestrator = new AgentOrchestrator({
          name: 'ParallelWorkflowOrchestrator',
          maxParallelSteps: 3,
        });

        const writerAgent = new ContentWriterAgent();
        orchestrator.registerAgent('writer', writerAgent);

        // Create 3 independent content generation tasks
        const plan: WorkflowPlan = {
          id: 'parallel-workflow',
          name: 'Parallel Content Generation',
          steps: [
            {
              id: 'step-a',
              name: 'write_intro',
              agentName: 'writer',
              input: {
                topic: 'Introduction to AI',
                contentType: 'summary',
              },
              context: testContext,
              status: 'pending',
            },
            {
              id: 'step-b',
              name: 'write_conclusion',
              agentName: 'writer',
              input: {
                topic: 'Future of AI',
                contentType: 'summary',
              },
              context: testContext,
              status: 'pending',
            },
            {
              id: 'step-c',
              name: 'write_summary',
              agentName: 'writer',
              input: {
                topic: 'AI Applications',
                contentType: 'summary',
              },
              context: testContext,
              status: 'pending',
            },
          ],
        };

        const startTime = Date.now();
        const result = await orchestrator.executeWorkflow(plan);
        const elapsed = Date.now() - startTime;

        expect(result.success).toBe(true);

        // Parallel execution should be faster than sequential
        // (Hard to test precisely, but workflow should complete)
        expect(result.executionTime).toBeLessThan(60000);
      }
    );
  });

  test.describe('Workflow Error Handling', () => {
    test.skip(!hasAnthropicKey, 'should handle failing step gracefully', async () => {
      const orchestrator = new AgentOrchestrator({
        name: 'ErrorTestOrchestrator',
      });

      const writerAgent = new ContentWriterAgent();
      orchestrator.registerAgent('writer', writerAgent);

      const plan: WorkflowPlan = {
        id: 'error-workflow',
        name: 'Workflow with Error',
        steps: [
          {
            id: 'step-1',
            name: 'normal_step',
            agentName: 'writer',
            input: {
              topic: 'Valid Topic',
              contentType: 'summary',
            },
            context: testContext,
            status: 'pending',
          },
          {
            id: 'step-2',
            name: 'error_step',
            agentName: 'non_existent_agent', // This will fail
            input: {},
            context: testContext,
            dependencies: ['normal_step'],
            status: 'pending',
          },
        ],
      };

      const result = await orchestrator.executeWorkflow(plan);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);

      // First step should succeed
      expect(result.stepResults['step-1']?.success).toBe(true);

      // Second step should fail
      expect(result.stepResults['step-2']?.success).toBe(false);
    });
  });

  test.describe('Performance Benchmarks', () => {
    test.skip(
      !hasAllKeys,
      'should complete simple workflow within time limit',
      async () => {
        const coordinator = new CoordinatorAgent();

        const startTime = Date.now();

        const result = await coordinator.execute(
          {
            task: 'Create a brief summary about TypeScript',
            taskType: 'custom',
          },
          testContext
        );

        const elapsed = Date.now() - startTime;

        expect(result.success).toBe(true);
        expect(elapsed).toBeLessThan(60000); // Should complete within 60 seconds
      }
    );

    test.skip(
      !hasAllKeys,
      'should track detailed timing metadata',
      async () => {
        const coordinator = new CoordinatorAgent();

        const result = await coordinator.execute(
          {
            task: 'Create presentation about Web Development',
            taskType: 'presentation',
          },
          testContext
        );

        expect(result.success).toBe(true);

        const metadata = result.data?.metadata;
        expect(metadata?.planningTime).toBeDefined();
        expect(metadata?.executionTime).toBeDefined();
        expect(metadata?.totalTime).toBeDefined();

        // Total time should be sum of planning + execution
        expect(metadata?.totalTime).toBeGreaterThanOrEqual(
          metadata!.planningTime + metadata!.executionTime
        );
      }
    );
  });

  test.describe('Workflow History and Debugging', () => {
    test.skip(
      !hasAnthropicKey,
      'orchestrator should track workflow history',
      async () => {
        const orchestrator = new AgentOrchestrator({
          name: 'HistoryTestOrchestrator',
        });

        const writerAgent = new ContentWriterAgent();
        orchestrator.registerAgent('writer', writerAgent);

        // Execute first workflow
        const plan1: WorkflowPlan = {
          id: 'workflow-1',
          name: 'First Workflow',
          steps: [
            {
              id: 'step-1',
              name: 'write_1',
              agentName: 'writer',
              input: {
                topic: 'Topic 1',
                contentType: 'summary',
              },
              context: testContext,
              status: 'pending',
            },
          ],
        };

        await orchestrator.executeWorkflow(plan1);

        // Execute second workflow
        const plan2: WorkflowPlan = {
          id: 'workflow-2',
          name: 'Second Workflow',
          steps: [
            {
              id: 'step-1',
              name: 'write_2',
              agentName: 'writer',
              input: {
                topic: 'Topic 2',
                contentType: 'summary',
              },
              context: testContext,
              status: 'pending',
            },
          ],
        };

        await orchestrator.executeWorkflow(plan2);

        const history = orchestrator.getHistory();
        expect(history.length).toBe(2);
        expect(history[0].plan.id).toBe('workflow-1');
        expect(history[1].plan.id).toBe('workflow-2');
      }
    );
  });
});
