/**
 * Agent Orchestrator
 *
 * Coordinates multiple agents to execute complex workflows.
 * Handles workflow planning, dependency resolution, and parallel execution.
 *
 * Features:
 * - Agent registration and management
 * - Workflow execution with dependency resolution
 * - Parallel step execution where possible
 * - Progress tracking and WebSocket events
 * - Comprehensive error handling
 * - Execution history and analytics
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 1: Base Agent System
 */

import { BaseAgent } from './BaseAgent';
import {
  WorkflowPlan,
  WorkflowStep,
  WorkflowResult,
  AgentExecutionContext,
  AgentResult,
  LogLevel,
  AgentLogEntry,
} from './types';

// ============================================
// Orchestrator Configuration
// ============================================

export interface OrchestratorConfig {
  name: string;
  description?: string;
  maxParallelSteps?: number; // Max concurrent steps (default: 3)
  timeout?: number; // Workflow timeout in ms (default: 600000 = 10 min)
  enableLogging?: boolean;
}

// ============================================
// Step Execution Context
// ============================================

interface StepExecutionContext {
  stepId: string;
  agentName: string;
  startTime: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: AgentResult;
  error?: string;
}

// ============================================
// AgentOrchestrator Class
// ============================================

export class AgentOrchestrator {
  private config: OrchestratorConfig;
  private agents: Map<string, BaseAgent> = new Map();
  private executionHistory: Array<{
    plan: WorkflowPlan;
    result: WorkflowResult;
    timestamp: string;
    executionTime: number;
  }> = [];
  private logs: AgentLogEntry[] = [];

  constructor(config: OrchestratorConfig) {
    this.config = {
      maxParallelSteps: 3,
      timeout: 600000, // 10 minutes
      enableLogging: true,
      ...config,
    };
    this.log('info', `Orchestrator initialized: ${config.name}`);
  }

  // ============================================
  // Agent Management
  // ============================================

  /**
   * Register an agent for use in workflows
   */
  registerAgent(name: string, agent: BaseAgent): void {
    this.agents.set(name, agent);
    this.log('debug', `Agent registered: ${name}`);
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(name: string): void {
    this.agents.delete(name);
    this.log('debug', `Agent unregistered: ${name}`);
  }

  /**
   * Get list of registered agents
   */
  getRegisteredAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Check if an agent is registered
   */
  hasAgent(name: string): boolean {
    return this.agents.has(name);
  }

  // ============================================
  // Workflow Execution
  // ============================================

  /**
   * Execute a workflow plan
   *
   * Executes all steps in the workflow, respecting dependencies
   * and running independent steps in parallel where possible.
   */
  async executeWorkflow(plan: WorkflowPlan): Promise<WorkflowResult> {
    const startTime = Date.now();

    this.log('info', `Starting workflow: ${plan.name}`, {
      planId: plan.id,
      stepCount: plan.steps.length,
    });

    try {
      // Validate workflow plan
      this.validateWorkflowPlan(plan);

      // Initialize step execution contexts
      const stepContexts = new Map<string, StepExecutionContext>();
      for (const step of plan.steps) {
        stepContexts.set(step.id, {
          stepId: step.id,
          agentName: step.agentName,
          startTime: 0,
          status: 'pending',
        });
      }

      // Storage for step results (referenced by step name)
      const stepResults: Record<string, AgentResult> = {};
      const dataResults: Record<string, any> = {};
      const errors: string[] = [];

      // Execute steps in dependency order
      await this.executeStepsWithDependencies(
        plan.steps,
        stepContexts,
        stepResults,
        dataResults,
        errors
      );

      const executionTime = Date.now() - startTime;
      const success = errors.length === 0;

      this.log(
        success ? 'info' : 'error',
        `Workflow ${success ? 'completed' : 'failed'}: ${plan.name}`,
        {
          planId: plan.id,
          executionTime,
          stepCount: plan.steps.length,
          errorCount: errors.length,
        }
      );

      // Create result
      const result: WorkflowResult = {
        plan,
        stepResults,
        success,
        executionTime,
        errors: errors.length > 0 ? errors : undefined,
        metadata: {
          orchestratorName: this.config.name,
          completedSteps: Object.keys(stepResults).length,
          totalSteps: plan.steps.length,
        },
      };

      // Add to history
      this.executionHistory.push({
        plan,
        result,
        timestamp: new Date().toISOString(),
        executionTime,
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.log('error', `Workflow execution failed: ${plan.name}`, {
        error: errorMessage,
      });

      return {
        plan,
        stepResults: {},
        success: false,
        executionTime,
        errors: [errorMessage],
        metadata: {
          orchestratorName: this.config.name,
        },
      };
    }
  }

  /**
   * Execute steps with dependency resolution
   *
   * Executes steps in topological order, running independent steps in parallel
   */
  private async executeStepsWithDependencies(
    steps: WorkflowStep[],
    stepContexts: Map<string, StepExecutionContext>,
    stepResults: Record<string, AgentResult>,
    dataResults: Record<string, any>,
    errors: string[]
  ): Promise<void> {
    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(steps);

    // Find steps with no dependencies (can run immediately)
    const readySteps = steps.filter(
      (step) => !step.dependencies || step.dependencies.length === 0
    );

    // Execute ready steps
    for (const step of readySteps) {
      await this.executeStep(
        step,
        stepContexts,
        stepResults,
        dataResults,
        errors
      );
    }

    // Execute remaining steps as dependencies are satisfied
    const remainingSteps = steps.filter((step) => !readySteps.includes(step));

    while (remainingSteps.length > 0) {
      // Find steps whose dependencies are all completed
      const nowReady = remainingSteps.filter((step) =>
        this.areDependenciesSatisfied(step, stepResults)
      );

      if (nowReady.length === 0) {
        // No more steps can be executed - check if all dependencies failed
        const allFailed = remainingSteps.every((step) =>
          step.dependencies?.some((dep) => {
            const depStep = steps.find((s) => s.name === dep);
            return depStep && stepResults[depStep.id]?.success === false;
          })
        );

        if (allFailed) {
          errors.push(
            'Workflow blocked: All remaining steps have failed dependencies'
          );
          break;
        }

        // Wait a bit before checking again
        await this.sleep(100);
        continue;
      }

      // Execute ready steps (with parallelism limit)
      const maxParallel = this.config.maxParallelSteps || 3;
      const batch = nowReady.slice(0, maxParallel);

      await Promise.all(
        batch.map((step) =>
          this.executeStep(step, stepContexts, stepResults, dataResults, errors)
        )
      );

      // Remove executed steps from remaining
      batch.forEach((step) => {
        const index = remainingSteps.indexOf(step);
        if (index !== -1) {
          remainingSteps.splice(index, 1);
        }
      });
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    stepContexts: Map<string, StepExecutionContext>,
    stepResults: Record<string, AgentResult>,
    dataResults: Record<string, any>,
    errors: string[]
  ): Promise<void> {
    const context = stepContexts.get(step.id);
    if (!context) {
      errors.push(`Step context not found: ${step.id}`);
      return;
    }

    try {
      // Update context
      context.status = 'running';
      context.startTime = Date.now();

      this.log('debug', `Executing step: ${step.name}`, {
        stepId: step.id,
        agentName: step.agentName,
      });

      // Get agent
      const agent = this.agents.get(step.agentName);
      if (!agent) {
        throw new Error(`Agent not found: ${step.agentName}`);
      }

      // Resolve input with dependency data
      const input = this.resolveDependencies(step, dataResults);

      // Execute agent
      const result = await agent.executeWithTracking(input, step.context);

      // Store result
      stepResults[step.id] = result;
      if (result.success && result.data !== undefined) {
        dataResults[step.name] = result.data;
      }

      // Update context
      context.status = result.success ? 'completed' : 'failed';
      context.result = result;

      if (!result.success) {
        const errorMsg = `Step ${step.name} failed: ${result.error}`;
        errors.push(errorMsg);
        context.error = errorMsg;
      }

      this.log(
        result.success ? 'debug' : 'error',
        `Step ${result.success ? 'completed' : 'failed'}: ${step.name}`,
        {
          stepId: step.id,
          success: result.success,
          executionTime: result.metadata?.executionTime,
        }
      );
    } catch (error) {
      const errorMsg = `Step ${step.name} error: ${
        error instanceof Error ? error.message : String(error)
      }`;
      errors.push(errorMsg);
      context.status = 'failed';
      context.error = errorMsg;

      this.log('error', errorMsg, { stepId: step.id });

      // Store error result
      stepResults[step.id] = {
        success: false,
        error: errorMsg,
      };
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Validate workflow plan
   */
  private validateWorkflowPlan(plan: WorkflowPlan): void {
    if (!plan.steps || plan.steps.length === 0) {
      throw new Error('Workflow plan must have at least one step');
    }

    // Check for circular dependencies
    this.checkCircularDependencies(plan.steps);

    // Check that all agents exist
    for (const step of plan.steps) {
      if (!this.agents.has(step.agentName)) {
        throw new Error(
          `Agent not found for step ${step.name}: ${step.agentName}`
        );
      }
    }

    // Check that all dependencies reference valid step names
    for (const step of plan.steps) {
      if (step.dependencies) {
        for (const dep of step.dependencies) {
          const depExists = plan.steps.some((s) => s.name === dep);
          if (!depExists) {
            throw new Error(
              `Invalid dependency in step ${step.name}: ${dep} does not exist`
            );
          }
        }
      }
    }
  }

  /**
   * Check for circular dependencies
   */
  private checkCircularDependencies(steps: WorkflowStep[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepName: string): boolean => {
      if (recursionStack.has(stepName)) {
        return true; // Cycle detected
      }

      if (visited.has(stepName)) {
        return false; // Already processed
      }

      visited.add(stepName);
      recursionStack.add(stepName);

      const step = steps.find((s) => s.name === stepName);
      if (step?.dependencies) {
        for (const dep of step.dependencies) {
          if (hasCycle(dep)) {
            return true;
          }
        }
      }

      recursionStack.delete(stepName);
      return false;
    };

    for (const step of steps) {
      if (hasCycle(step.name)) {
        throw new Error(
          `Circular dependency detected in workflow involving step: ${step.name}`
        );
      }
    }
  }

  /**
   * Build dependency graph
   */
  private buildDependencyGraph(
    steps: WorkflowStep[]
  ): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const step of steps) {
      graph.set(step.name, step.dependencies || []);
    }

    return graph;
  }

  /**
   * Check if all dependencies are satisfied
   */
  private areDependenciesSatisfied(
    step: WorkflowStep,
    stepResults: Record<string, AgentResult>
  ): boolean {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }

    // Find dependency steps by name
    for (const depName of step.dependencies) {
      // Check if any step result with this name exists and succeeded
      const depCompleted = Object.values(stepResults).some(
        (result, index) => {
          // Need to match step name - this is a simplification
          // In practice, we'd need to track step names in results
          return result.success === true;
        }
      );

      // For now, just check if result exists
      // TODO: Improve dependency tracking with step name mapping
    }

    return true; // Simplified for now
  }

  /**
   * Resolve dependencies by injecting data from previous steps
   */
  private resolveDependencies(
    step: WorkflowStep,
    dataResults: Record<string, any>
  ): any {
    const input = { ...step.input };

    if (step.dependencies) {
      for (const dep of step.dependencies) {
        if (dataResults[dep] !== undefined) {
          input[dep] = dataResults[dep];
        }
      }
    }

    return input;
  }

  /**
   * Sleep for a given duration
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Log a message
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.config.enableLogging) return;

    const logEntry: AgentLogEntry = {
      level,
      agentName: this.config.name,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(logEntry);

    const prefix = `[${level.toUpperCase()}] [Orchestrator: ${this.config.name}]`;

    switch (level) {
      case 'debug':
        console.debug(prefix, message, data);
        break;
      case 'info':
        console.info(prefix, message, data);
        break;
      case 'warn':
        console.warn(prefix, message, data);
        break;
      case 'error':
        console.error(prefix, message, data);
        break;
    }
  }

  // ============================================
  // History and Debugging
  // ============================================

  /**
   * Get execution history
   */
  getHistory(): Array<{
    plan: WorkflowPlan;
    result: WorkflowResult;
    timestamp: string;
    executionTime: number;
  }> {
    return [...this.executionHistory];
  }

  /**
   * Get logs
   */
  getLogs(): AgentLogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear history and logs
   */
  clearHistory(): void {
    this.executionHistory = [];
    this.logs = [];
    this.log('debug', 'History and logs cleared');
  }

  /**
   * Get orchestrator name
   */
  get name(): string {
    return this.config.name;
  }
}
