/**
 * Base Agent Class
 *
 * Abstract base class for all AI agents in the system.
 * Agents are autonomous entities that can use tools to accomplish tasks.
 *
 * Examples: ContentWriterAgent, ResearchAgent, DesignerAgent
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 1: Base Agent System
 */

import { AgentConfig, AgentExecutionContext, AgentResult, AgentLogEntry, LogLevel } from './types';
import { BaseTool } from './BaseTool';

export abstract class BaseAgent<TInput = any, TOutput = any> {
  /** Agent configuration */
  protected config: AgentConfig;

  /** Tools available to this agent */
  protected tools: Map<string, BaseTool> = new Map();

  /** Execution history (for debugging and analytics) */
  protected executionHistory: Array<{
    input: TInput;
    context: AgentExecutionContext;
    result: AgentResult<TOutput>;
    timestamp: string;
    executionTime: number;
  }> = [];

  /** Log entries */
  protected logs: AgentLogEntry[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
    this.log('info', `Agent initialized: ${config.name} v${config.version}`);
  }

  // ============================================
  // Abstract Methods (must be implemented)
  // ============================================

  /**
   * Execute the agent with given input and context
   *
   * This is the main method that subclasses must implement.
   * It contains the agent's core logic.
   *
   * @param input - Agent input
   * @param context - Execution context
   * @returns Agent result
   */
  abstract execute(
    input: TInput,
    context: AgentExecutionContext
  ): Promise<AgentResult<TOutput>>;

  // ============================================
  // Public API
  // ============================================

  /**
   * Get agent name
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * Get agent description
   */
  get description(): string {
    return this.config.description;
  }

  /**
   * Get agent version
   */
  get version(): string {
    return this.config.version;
  }

  /**
   * Execute agent with tracking and error handling
   *
   * Wraps execute() with timing, history tracking, and error handling
   */
  async executeWithTracking(
    input: TInput,
    context: AgentExecutionContext
  ): Promise<AgentResult<TOutput>> {
    const startTime = Date.now();

    try {
      this.log('info', `Starting execution`, { input, context });

      // Execute agent
      const result = await this.execute(input, context);
      const executionTime = Date.now() - startTime;

      // Add to history
      this.executionHistory.push({
        input,
        context,
        result,
        timestamp: new Date().toISOString(),
        executionTime,
      });

      this.log('info', `Execution completed successfully`, {
        executionTime,
        success: result.success,
      });

      return {
        ...result,
        metadata: {
          ...result.metadata,
          executionTime,
          agentName: this.name,
          agentVersion: this.version,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      this.log('error', `Execution failed`, {
        error: error instanceof Error ? error.message : String(error),
        executionTime,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          executionTime,
          agentName: this.name,
          agentVersion: this.version,
        },
      };
    }
  }

  /**
   * Register a tool for use by this agent
   */
  registerTool(tool: BaseTool): void {
    this.tools.set(tool.name, tool);
    this.log('debug', `Tool registered: ${tool.name}`);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(toolName: string): void {
    this.tools.delete(toolName);
    this.log('debug', `Tool unregistered: ${toolName}`);
  }

  /**
   * Get list of available tools
   */
  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get execution history (for debugging)
   */
  getHistory(): Array<{
    input: TInput;
    context: AgentExecutionContext;
    result: AgentResult<TOutput>;
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

  // ============================================
  // Protected Utility Methods
  // ============================================

  /**
   * Use a tool by name
   *
   * @param toolName - Name of the tool to use
   * @param input - Tool input
   * @returns Tool result
   */
  protected async useTool<T = any>(toolName: string, input: any): Promise<T> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    this.log('debug', `Using tool: ${toolName}`, { input });

    const result = await tool.executeWithTracking(input);

    if (!result.success) {
      throw new Error(`Tool execution failed: ${result.error}`);
    }

    this.log('debug', `Tool completed: ${toolName}`, {
      success: result.success,
      executionTime: result.metadata?.executionTime,
    });

    return result.data as T;
  }

  /**
   * Check if a tool is available
   */
  protected hasTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Create a success result
   */
  protected createSuccessResult(
    data: TOutput,
    metadata?: Record<string, any>
  ): AgentResult<TOutput> {
    return {
      success: true,
      data,
      metadata,
    };
  }

  /**
   * Create an error result
   */
  protected createErrorResult(
    error: string,
    metadata?: Record<string, any>
  ): AgentResult<TOutput> {
    return {
      success: false,
      error,
      metadata,
    };
  }

  /**
   * Log a message
   */
  protected log(level: LogLevel, message: string, data?: any): void {
    const logEntry: AgentLogEntry = {
      level,
      agentName: this.name,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(logEntry);

    // Console output
    const prefix = `[${level.toUpperCase()}] [Agent: ${this.name}]`;

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

  /**
   * Emit a progress event (for WebSocket)
   *
   * This would typically be overridden to emit actual WebSocket events
   */
  protected emitProgress(event: string, data: any): void {
    this.log('debug', `Progress event: ${event}`, data);

    // In a real implementation, this would emit via WebSocket
    // For now, just log it
    // Example:
    // emitAgentProgress(this.context.userId, {
    //   agentName: this.name,
    //   event,
    //   data,
    // });
  }

  /**
   * Sleep for a given duration
   */
  protected async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate input against a schema
   */
  protected validateInput(
    input: any,
    schema: { required?: string[]; optional?: string[] }
  ): boolean {
    if (!input || typeof input !== 'object') {
      throw new Error('Input must be an object');
    }

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in input)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
    }

    return true;
  }
}
