/**
 * Coordinator Agent
 *
 * Master agent that orchestrates multiple specialized agents.
 * Plans workflows, delegates tasks, and synthesizes results.
 *
 * Capabilities:
 * - Task decomposition and planning
 * - Agent selection and delegation
 * - Result synthesis
 * - Error handling and retry logic
 * - Progress tracking
 *
 * Use Cases:
 * - Presentation generation (Research → Content → Design)
 * - Complex multi-step tasks
 * - Cross-domain workflows
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Agent Implementation
 */

import {
  BaseAgent,
  AgentExecutionContext,
  AgentResult,
  WorkflowPlan,
  WorkflowStep,
} from '../base';
import { AgentOrchestrator } from '../base/AgentOrchestrator';
import { LLMTool } from '../tools/LLMTool';
import { ContentWriterAgent } from './ContentWriterAgent';
import { ResearchAgent } from './ResearchAgent';

// ============================================
// Coordinator Input/Output Types
// ============================================

export interface CoordinatorInput {
  /** High-level task description */
  task: string;

  /** Task type (helps with planning) */
  taskType?:
    | 'presentation'
    | 'article'
    | 'research'
    | 'analysis'
    | 'custom';

  /** Additional requirements/constraints */
  requirements?: string[];

  /** Target audience */
  audience?: string;

  /** Enable automatic planning (default: true) */
  autoplan?: boolean;

  /** Custom workflow plan (if autoplan=false) */
  customPlan?: WorkflowPlan;
}

export interface CoordinatorOutput {
  /** Task description */
  task: string;

  /** Execution plan used */
  plan: WorkflowPlan;

  /** Final result/output */
  result: any;

  /** Results from individual steps */
  stepResults: Record<string, any>;

  /** Execution metadata */
  metadata: {
    planningTime: number;
    executionTime: number;
    totalTime: number;
    agentsUsed: string[];
    success: boolean;
  };
}

// ============================================
// Coordinator Agent Class
// ============================================

export class CoordinatorAgent extends BaseAgent<
  CoordinatorInput,
  CoordinatorOutput
> {
  private orchestrator: AgentOrchestrator;
  private llmTool: LLMTool;

  // Available specialized agents
  private researchAgent: ResearchAgent;
  private contentWriterAgent: ContentWriterAgent;

  constructor() {
    super({
      name: 'Coordinator',
      description: 'Master agent that orchestrates multi-agent workflows',
      version: '1.0.0',
      metadata: {
        capabilities: [
          'task_planning',
          'agent_orchestration',
          'result_synthesis',
        ],
      },
    });

    // Initialize orchestrator
    this.orchestrator = new AgentOrchestrator({
      name: 'MainOrchestrator',
      description: 'Orchestrates multi-agent workflows',
      maxParallelSteps: 2,
    });

    // Initialize tools
    this.llmTool = new LLMTool();
    this.registerTool(this.llmTool);

    // Initialize and register agents
    this.researchAgent = new ResearchAgent();
    this.contentWriterAgent = new ContentWriterAgent();

    this.orchestrator.registerAgent('research', this.researchAgent);
    this.orchestrator.registerAgent('content_writer', this.contentWriterAgent);

    this.log('info', 'Coordinator Agent initialized', {
      availableAgents: this.orchestrator.getRegisteredAgents(),
    });
  }

  async execute(
    input: CoordinatorInput,
    context: AgentExecutionContext
  ): Promise<AgentResult<CoordinatorOutput>> {
    const startTime = Date.now();

    try {
      const { task, taskType = 'custom', autoplan = true, customPlan } = input;

      this.log('info', 'Starting coordination', { task, taskType });
      this.emitProgress('coordinator:started', { task });

      // Step 1: Planning
      this.emitProgress('coordinator:planning', { task });
      const planStartTime = Date.now();

      const plan = autoplan
        ? await this.createPlan(input, context)
        : customPlan;

      if (!plan) {
        throw new Error('No workflow plan available');
      }

      const planningTime = Date.now() - planStartTime;

      this.log('info', 'Workflow plan created', {
        stepCount: plan.steps.length,
        planningTime,
      });

      this.emitProgress('coordinator:plan_created', {
        stepCount: plan.steps.length,
      });

      // Step 2: Execute workflow
      this.emitProgress('coordinator:executing', {
        stepCount: plan.steps.length,
      });

      const workflowResult = await this.orchestrator.executeWorkflow(plan);

      if (!workflowResult.success) {
        throw new Error(
          `Workflow execution failed: ${workflowResult.errors?.join(', ')}`
        );
      }

      // Step 3: Synthesize results
      this.emitProgress('coordinator:synthesizing', {});

      const finalResult = await this.synthesizeResults(
        plan,
        workflowResult.stepResults
      );

      const totalTime = Date.now() - startTime;
      const executionTime = workflowResult.executionTime || 0;

      this.log('info', 'Coordination completed', {
        totalTime,
        stepCount: plan.steps.length,
      });

      this.emitProgress('coordinator:completed', {
        totalTime,
        success: true,
      });

      return this.createSuccessResult(
        {
          task,
          plan,
          result: finalResult,
          stepResults: workflowResult.stepResults,
          metadata: {
            planningTime,
            executionTime,
            totalTime,
            agentsUsed: plan.steps.map((s) => s.agentName),
            success: true,
          },
        },
        {
          executionTime: totalTime,
          stepsCompleted: plan.steps.length,
        }
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.log('error', 'Coordination failed', { error: errorMessage });
      this.emitProgress('coordinator:error', { error: errorMessage });

      return {
        success: false,
        error: errorMessage,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Create workflow plan using LLM
   */
  private async createPlan(
    input: CoordinatorInput,
    context: AgentExecutionContext
  ): Promise<WorkflowPlan> {
    const { task, taskType, requirements, audience } = input;

    // For presentation tasks, use predefined workflow
    if (taskType === 'presentation') {
      return this.createPresentationWorkflow(task, context, audience);
    }

    // For other tasks, use LLM to plan
    const planPrompt = `You are a workflow planner. Create a workflow plan for the following task:

Task: ${task}
Type: ${taskType}
${requirements ? `Requirements: ${requirements.join(', ')}` : ''}
${audience ? `Audience: ${audience}` : ''}

Available agents:
1. research - Conducts research on topics
2. content_writer - Generates content (articles, blog posts, slides)

Create a workflow plan with steps. Each step should use one agent.

Respond in JSON format:
{
  "steps": [
    {
      "name": "step_1",
      "agentName": "research|content_writer",
      "description": "What this step does",
      "input": { /* input for the agent */ },
      "dependencies": [] // optional: names of previous steps this depends on
    }
  ]
}`;

    const planData = await this.llmTool.generateJSON<{
      steps: Array<{
        name: string;
        agentName: string;
        description: string;
        input: any;
        dependencies?: string[];
      }>;
    }>(planPrompt);

    // Convert to WorkflowPlan
    const plan: WorkflowPlan = {
      id: `plan-${Date.now()}`,
      name: `Workflow for: ${task}`,
      steps: planData.steps.map((step, index) => ({
        id: `step-${index}`,
        name: step.name,
        agentName: step.agentName,
        input: step.input,
        context,
        dependencies: step.dependencies,
        status: 'pending',
      })),
    };

    return plan;
  }

  /**
   * Create predefined workflow for presentation generation
   */
  private createPresentationWorkflow(
    topic: string,
    context: AgentExecutionContext,
    audience?: string
  ): WorkflowPlan {
    const steps: WorkflowStep[] = [
      // Step 1: Research the topic
      {
        id: 'step-0',
        name: 'research_topic',
        agentName: 'research',
        input: {
          topic,
          depth: 'medium',
          includeNews: false,
        },
        context,
        status: 'pending',
      },
      // Step 2: Generate presentation content
      {
        id: 'step-1',
        name: 'generate_content',
        agentName: 'content_writer',
        input: {
          topic,
          contentType: 'slide',
          audience,
          enableResearch: false, // Already have research from step 1
        },
        context,
        dependencies: ['research_topic'], // Depends on research
        status: 'pending',
      },
    ];

    return {
      id: `presentation-plan-${Date.now()}`,
      name: `Presentation Workflow: ${topic}`,
      steps,
      estimatedTime: 60000, // 1 minute estimate
    };
  }

  /**
   * Synthesize results from multiple steps
   */
  private async synthesizeResults(
    plan: WorkflowPlan,
    stepResults: Record<string, AgentResult>
  ): Promise<any> {
    // For presentation workflow, combine research and content
    if (plan.name.includes('Presentation Workflow')) {
      const contentStep = plan.steps.find((s) => s.name === 'generate_content');
      if (contentStep) {
        const contentResult = stepResults[contentStep.id];
        return contentResult?.data || null;
      }
    }

    // For other workflows, return last step result
    const lastStep = plan.steps[plan.steps.length - 1];
    const lastResult = stepResults[lastStep.id];

    return lastResult?.data || null;
  }

  /**
   * Helper: Generate presentation
   */
  async generatePresentation(
    topic: string,
    context: AgentExecutionContext,
    audience?: string
  ): Promise<any> {
    const result = await this.execute(
      {
        task: `Generate presentation about: ${topic}`,
        taskType: 'presentation',
        audience,
      },
      context
    );

    if (!result.success || !result.data) {
      throw new Error(`Presentation generation failed: ${result.error}`);
    }

    return result.data.result;
  }

  /**
   * Get orchestrator (for external access)
   */
  getOrchestrator(): AgentOrchestrator {
    return this.orchestrator;
  }

  /**
   * Register additional agent
   */
  registerAgent(name: string, agent: BaseAgent): void {
    this.orchestrator.registerAgent(name, agent);
    this.log('debug', `Additional agent registered: ${name}`);
  }
}
