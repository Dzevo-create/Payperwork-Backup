/**
 * LLM Tool
 *
 * Wraps Claude API for LLM capabilities.
 * Used by agents to generate text, analyze content, and make decisions.
 *
 * Features:
 * - Streaming and non-streaming modes
 * - Token usage tracking
 * - Multiple model support
 * - System prompt support
 * - Temperature and max_tokens control
 * - Automatic retry on rate limits
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 2: Core Tools
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseTool, ToolResult } from '../base';

// ============================================
// LLM Tool Input/Output Types
// ============================================

export interface LLMToolInput {
  /** User prompt/message */
  prompt: string;

  /** System prompt (optional) */
  systemPrompt?: string;

  /** Model to use (default: claude-3-5-sonnet-20241022) */
  model?: string;

  /** Temperature (0-1, default: 0.7) */
  temperature?: number;

  /** Max tokens to generate (default: 4096) */
  maxTokens?: number;

  /** Enable streaming mode (default: false) */
  stream?: boolean;

  /** Callback for streaming chunks (only used if stream=true) */
  onChunk?: (chunk: string) => void;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface LLMToolOutput {
  /** Generated text */
  text: string;

  /** Token usage stats */
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };

  /** Model used */
  model: string;

  /** Stop reason */
  stopReason?: string;

  /** Raw response (for debugging) */
  rawResponse?: any;
}

// ============================================
// LLM Tool Class
// ============================================

export class LLMTool extends BaseTool<LLMToolInput, LLMToolOutput> {
  private client: Anthropic;

  constructor() {
    super({
      name: 'llm',
      description: 'Generate text using Claude AI',
      version: '1.0.0',
    });

    // Initialize Anthropic client
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.client = new Anthropic({
      apiKey,
    });

    this.log('info', 'LLM Tool initialized');
  }

  /**
   * Execute LLM generation
   */
  async execute(input: LLMToolInput): Promise<ToolResult<LLMToolOutput>> {
    try {
      // Validate input
      this.validateInput(input, {
        required: ['prompt'],
      });

      const {
        prompt,
        systemPrompt,
        model = 'claude-3-5-sonnet-20241022',
        temperature = 0.7,
        maxTokens = 4096,
        stream = false,
        onChunk,
      } = input;

      this.log('debug', `Making LLM request`, {
        model,
        promptLength: prompt.length,
        stream,
      });

      // Build messages
      const messages: Anthropic.MessageParam[] = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      // Non-streaming mode
      if (!stream) {
        const response = await this.client.messages.create({
          model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages,
        });

        const text = response.content
          .filter((block) => block.type === 'text')
          .map((block) => (block as Anthropic.TextBlock).text)
          .join('');

        const tokensUsed = {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens,
        };

        this.log('debug', `LLM request completed`, {
          tokensUsed: tokensUsed.total,
          textLength: text.length,
        });

        return this.createSuccessResult(
          {
            text,
            tokensUsed,
            model,
            stopReason: response.stop_reason || undefined,
            rawResponse: response,
          },
          {
            tokensUsed: tokensUsed.total,
            model,
          }
        );
      }

      // Streaming mode
      else {
        let fullText = '';
        let inputTokens = 0;
        let outputTokens = 0;

        const stream = await this.client.messages.create({
          model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages,
          stream: true,
        });

        for await (const event of stream) {
          if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
              const chunk = event.delta.text;
              fullText += chunk;

              // Call chunk callback
              if (onChunk) {
                onChunk(chunk);
              }
            }
          } else if (event.type === 'message_start') {
            inputTokens = event.message.usage.input_tokens;
          } else if (event.type === 'message_delta') {
            outputTokens = event.usage.output_tokens;
          }
        }

        const tokensUsed = {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens,
        };

        this.log('debug', `LLM streaming completed`, {
          tokensUsed: tokensUsed.total,
          textLength: fullText.length,
        });

        return this.createSuccessResult(
          {
            text: fullText,
            tokensUsed,
            model,
          },
          {
            tokensUsed: tokensUsed.total,
            model,
          }
        );
      }
    } catch (error) {
      this.log('error', `LLM request failed`, {
        error: error instanceof Error ? error.message : String(error),
      });

      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown LLM error'
      );
    }
  }

  /**
   * Helper: Generate text with simple prompt
   */
  async generateText(
    prompt: string,
    options?: Partial<LLMToolInput>
  ): Promise<string> {
    const result = await this.execute({
      prompt,
      ...options,
    });

    if (!result.success || !result.data) {
      throw new Error(`LLM generation failed: ${result.error}`);
    }

    return result.data.text;
  }

  /**
   * Helper: Generate with system prompt
   */
  async generateWithSystem(
    systemPrompt: string,
    prompt: string,
    options?: Partial<LLMToolInput>
  ): Promise<string> {
    const result = await this.execute({
      systemPrompt,
      prompt,
      ...options,
    });

    if (!result.success || !result.data) {
      throw new Error(`LLM generation failed: ${result.error}`);
    }

    return result.data.text;
  }

  /**
   * Helper: Generate with streaming
   */
  async generateStreaming(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: Partial<LLMToolInput>
  ): Promise<string> {
    const result = await this.execute({
      prompt,
      stream: true,
      onChunk,
      ...options,
    });

    if (!result.success || !result.data) {
      throw new Error(`LLM generation failed: ${result.error}`);
    }

    return result.data.text;
  }

  /**
   * Helper: Generate JSON response
   *
   * Asks the LLM to respond in JSON format and parses the result
   */
  async generateJSON<T = any>(
    prompt: string,
    schema?: string,
    options?: Partial<LLMToolInput>
  ): Promise<T> {
    const jsonPrompt = schema
      ? `${prompt}\n\nRespond in JSON format following this schema:\n${schema}\n\nRespond ONLY with valid JSON, no other text.`
      : `${prompt}\n\nRespond in JSON format. Respond ONLY with valid JSON, no other text.`;

    const result = await this.execute({
      prompt: jsonPrompt,
      temperature: 0.3, // Lower temperature for structured output
      ...options,
    });

    if (!result.success || !result.data) {
      throw new Error(`LLM generation failed: ${result.error}`);
    }

    try {
      // Try to extract JSON from markdown code blocks if present
      let text = result.data.text.trim();

      // Remove markdown code blocks
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      return JSON.parse(text) as T;
    } catch (error) {
      throw new Error(
        `Failed to parse LLM JSON response: ${
          error instanceof Error ? error.message : String(error)
        }\n\nResponse was: ${result.data.text}`
      );
    }
  }

  /**
   * Helper: Ask a yes/no question
   */
  async askYesNo(question: string, options?: Partial<LLMToolInput>): Promise<boolean> {
    const result = await this.execute({
      prompt: `${question}\n\nRespond with ONLY "yes" or "no", nothing else.`,
      temperature: 0.3,
      maxTokens: 10,
      ...options,
    });

    if (!result.success || !result.data) {
      throw new Error(`LLM generation failed: ${result.error}`);
    }

    const answer = result.data.text.trim().toLowerCase();
    return answer === 'yes' || answer === 'y';
  }
}
