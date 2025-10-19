/**
 * Base Tool Class
 *
 * Abstract base class for all agent tools.
 * Tools are reusable capabilities that agents can use during execution.
 *
 * Examples: SearchTool, BrowserTool, LLMTool, FileTool
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 1: Base Agent System
 */

import { ToolConfig, ToolResult, LogLevel } from './types';

export abstract class BaseTool<TInput = any, TOutput = any> {
  /** Tool configuration */
  protected config: ToolConfig;

  /** Tool execution history (for debugging) */
  protected executionHistory: Array<{
    input: TInput;
    output: ToolResult<TOutput>;
    timestamp: string;
    executionTime: number;
  }> = [];

  constructor(config: ToolConfig) {
    this.config = config;
  }

  // ============================================
  // Abstract Methods (must be implemented)
  // ============================================

  /**
   * Execute the tool with given input
   *
   * @param input - Tool input
   * @returns Tool result
   */
  abstract execute(input: TInput): Promise<ToolResult<TOutput>>;

  // ============================================
  // Public API
  // ============================================

  /**
   * Get tool name
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * Get tool description
   */
  get description(): string {
    return this.config.description;
  }

  /**
   * Get tool version
   */
  get version(): string {
    return this.config.version;
  }

  /**
   * Execute tool with tracking
   *
   * Wraps execute() with timing and history tracking
   */
  async executeWithTracking(input: TInput): Promise<ToolResult<TOutput>> {
    const startTime = Date.now();

    try {
      this.log('debug', `Executing tool: ${this.name}`, { input });

      const result = await this.execute(input);
      const executionTime = Date.now() - startTime;

      // Add to history
      this.executionHistory.push({
        input,
        output: result,
        timestamp: new Date().toISOString(),
        executionTime,
      });

      this.log('info', `Tool executed successfully: ${this.name}`, {
        executionTime,
        success: result.success,
      });

      return {
        ...result,
        metadata: {
          ...result.metadata,
          executionTime,
          toolName: this.name,
          toolVersion: this.version,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      this.log('error', `Tool execution failed: ${this.name}`, {
        error: error instanceof Error ? error.message : String(error),
        executionTime,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          executionTime,
          toolName: this.name,
          toolVersion: this.version,
        },
      };
    }
  }

  /**
   * Get execution history (for debugging)
   */
  getHistory(): Array<{
    input: TInput;
    output: ToolResult<TOutput>;
    timestamp: string;
    executionTime: number;
  }> {
    return [...this.executionHistory];
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = [];
  }

  // ============================================
  // Protected Utility Methods
  // ============================================

  /**
   * Validate input against a schema
   *
   * @param input - Input to validate
   * @param schema - Validation schema (simple object with required keys)
   * @returns True if valid, throws error otherwise
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

  /**
   * Create a success result
   */
  protected createSuccessResult(
    data: TOutput,
    metadata?: Record<string, any>
  ): ToolResult<TOutput> {
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
  ): ToolResult<TOutput> {
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
    const logEntry = {
      level,
      toolName: this.name,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    // In production, this would use a proper logger
    // For now, just console.log
    const prefix = `[${level.toUpperCase()}] [Tool: ${this.name}]`;

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
   * Sleep for a given duration (useful for rate limiting)
   */
  protected async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
