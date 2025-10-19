/**
 * Manus Task Polling Service
 *
 * Polls Manus API for task status and emits WebSocket events for real-time updates.
 * This is necessary because Manus webhooks don't include detailed event data.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Polling Implementation
 */

import { getManusClient } from './manus-client';
import {
  emitThinkingStepUpdate,
  emitToolActionStarted,
  emitToolActionCompleted,
  emitToolActionFailed,
  emitGenerationProgress,
  emitGenerationCompleted,
  emitGenerationError,
  emitTopicsGenerated,
} from '@/lib/socket/server';

// Track active polling sessions
const activePollers = new Map<string, () => void>();

interface PollingOptions {
  taskId: string;
  userId: string;
  presentationId?: string;
  interval?: number; // ms, default 2000
  taskType?: 'topics' | 'slides';
}

/**
 * Start polling a Manus task for updates
 *
 * @param options - Polling configuration
 * @returns Stop function to cancel polling
 */
export async function startPolling(options: PollingOptions): Promise<() => void> {
  const { taskId, userId, presentationId, interval = 2000, taskType = 'slides' } = options;

  console.log(`🔄 Starting polling for task ${taskId} (${taskType})`);

  const manusClient = getManusClient();
  let isRunning = true;
  let pollCount = 0;
  const maxPolls = 300; // 10 minutes at 2s intervals

  // Track processed items to avoid duplicates
  const processedSteps = new Set<string>();
  const processedTools = new Set<string>();

  const poll = async () => {
    if (!isRunning) return;

    pollCount++;

    try {
      // Get task status from Manus API
      const taskData = await manusClient.getTaskStatus(taskId);

      console.log(`📊 Poll ${pollCount}: Status = ${taskData.status}`);

      // Process task data based on status
      if (taskData.status === 'running') {
        // Extract and emit thinking steps
        if (taskData.thinking_steps && Array.isArray(taskData.thinking_steps)) {
          for (const step of taskData.thinking_steps) {
            const stepKey = `${step.id}-${step.status}`;
            if (!processedSteps.has(stepKey)) {
              processedSteps.add(stepKey);
              emitThinkingStepUpdate(userId, {
                id: step.id,
                title: step.description || step.title || 'Processing...',
                status: step.status,
                description: step.description,
                actions: step.actions || [],
                startedAt: step.started_at,
                completedAt: step.completed_at,
              });
              console.log(`  ✅ Emitted thinking step: ${step.description}`);
            }
          }
        }

        // Extract and emit tool actions
        if (taskData.tool_calls && Array.isArray(taskData.tool_calls)) {
          for (const tool of taskData.tool_calls) {
            const toolKey = `${tool.id}-${tool.status}`;
            if (!processedTools.has(toolKey)) {
              processedTools.add(toolKey);

              const messageId = `tool-${tool.id}`;
              const toolAction = {
                id: tool.id,
                type: mapToolType(tool.name),
                status: tool.status,
                input: JSON.stringify(tool.arguments || tool.args || {}),
                timestamp: tool.created_at || new Date().toISOString(),
              };

              if (tool.status === 'running' || tool.status === 'pending') {
                emitToolActionStarted(userId, {
                  toolAction: { ...toolAction, status: 'running' },
                  messageId,
                });
                console.log(`  🔧 Tool started: ${tool.name}`);
              } else if (tool.status === 'completed') {
                emitToolActionCompleted(userId, {
                  toolAction: {
                    ...toolAction,
                    status: 'completed',
                    result: tool.result || tool.output,
                    duration: calculateDuration(tool.created_at, tool.completed_at),
                  },
                  messageId,
                });
                console.log(`  ✅ Tool completed: ${tool.name}`);
              } else if (tool.status === 'failed') {
                emitToolActionFailed(userId, {
                  toolAction: {
                    ...toolAction,
                    status: 'failed',
                    error: tool.error || 'Tool execution failed',
                  },
                  messageId,
                });
                console.log(`  ❌ Tool failed: ${tool.name}`);
              }
            }
          }
        }

        // Emit progress if available
        if (taskData.progress !== undefined) {
          emitGenerationProgress(userId, presentationId || taskId, taskData.progress);
        }

        // Continue polling
        setTimeout(poll, interval);
      } else if (taskData.status === 'completed') {
        isRunning = false;

        console.log(`✅ Task completed: ${taskId}`);

        // Handle completion based on task type
        if (taskType === 'topics') {
          // Extract topics from response
          const topics = extractTopics(taskData.output || taskData.result);
          if (topics && topics.length > 0) {
            emitTopicsGenerated(userId, {
              topics,
              messageId: `topics-${taskId}`,
            });
            console.log(`  📋 Emitted ${topics.length} topics`);
          }
        } else {
          // Slides generation completed
          emitGenerationCompleted(
            userId,
            presentationId || taskId,
            taskData.slides?.length || 0
          );
        }

        // Remove from active pollers
        activePollers.delete(taskId);
      } else if (taskData.status === 'failed') {
        isRunning = false;

        console.log(`❌ Task failed: ${taskId}`);

        emitGenerationError(
          userId,
          presentationId || taskId,
          taskData.error || 'Task execution failed'
        );

        // Remove from active pollers
        activePollers.delete(taskId);
      }

      // Stop if max polls reached
      if (pollCount >= maxPolls) {
        isRunning = false;
        console.log(`⏱️ Max polls reached for task ${taskId}`);
        emitGenerationError(userId, presentationId || taskId, 'Task timeout');
        activePollers.delete(taskId);
      }
    } catch (error: any) {
      console.error(`  ⚠️ Polling error for ${taskId}:`, error.message);

      // Retry with backoff
      if (isRunning && pollCount < maxPolls) {
        const backoffInterval = Math.min(interval * 2, 10000); // Max 10s
        setTimeout(poll, backoffInterval);
      } else {
        isRunning = false;
        emitGenerationError(userId, presentationId || taskId, 'Polling failed');
        activePollers.delete(taskId);
      }
    }
  };

  // Start polling
  poll();

  // Store stop function
  const stopPolling = () => {
    isRunning = false;
    activePollers.delete(taskId);
    console.log(`🛑 Stopped polling for task ${taskId}`);
  };

  activePollers.set(taskId, stopPolling);

  return stopPolling;
}

/**
 * Stop polling for a specific task
 */
export function stopPolling(taskId: string): void {
  const stopFn = activePollers.get(taskId);
  if (stopFn) {
    stopFn();
  }
}

/**
 * Stop all active polling sessions
 */
export function stopAllPolling(): void {
  for (const [taskId, stopFn] of activePollers.entries()) {
    console.log(`🛑 Stopping polling for ${taskId}`);
    stopFn();
  }
  activePollers.clear();
}

/**
 * Get active polling sessions count
 */
export function getActivePollingCount(): number {
  return activePollers.size;
}

// ===== Helper Functions =====

/**
 * Map Manus tool name to our tool type
 */
function mapToolType(manusToolName: string): string {
  const name = manusToolName.toLowerCase();

  if (name.includes('search') || name.includes('google')) return 'search';
  if (name.includes('browse') || name.includes('web') || name.includes('http')) return 'browse';
  if (name.includes('python') || name.includes('code')) return 'python';
  if (name.includes('bash') || name.includes('shell') || name.includes('terminal')) return 'bash';
  if (name.includes('file') || name.includes('read') || name.includes('write')) return 'file';

  // Default to the original name
  return name;
}

/**
 * Calculate duration between timestamps in milliseconds
 */
function calculateDuration(startTime?: string, endTime?: string): number | undefined {
  if (!startTime || !endTime) return undefined;

  try {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return end - start;
  } catch {
    return undefined;
  }
}

/**
 * Extract topics array from Manus output
 */
function extractTopics(output: any): string[] | null {
  try {
    // If output is already an array
    if (Array.isArray(output)) {
      return output.filter((item) => typeof item === 'string');
    }

    // If output is a string (JSON or text)
    if (typeof output === 'string') {
      // Try to parse as JSON
      try {
        const parsed = JSON.parse(output);
        if (Array.isArray(parsed)) {
          return parsed.filter((item) => typeof item === 'string');
        }
      } catch {
        // Not JSON, try to extract from text
        const lines = output.split('\n').filter((line) => line.trim());

        // Look for JSON array in markdown code blocks
        const jsonMatch = output.match(/```json\s*(\[[\s\S]*?\])\s*```/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]);
          if (Array.isArray(parsed)) {
            return parsed.filter((item) => typeof item === 'string');
          }
        }

        // Extract lines that look like topics (start with number or bullet)
        const topics = lines
          .map((line) => line.replace(/^[\d\.\-\*\s]+/, '').trim())
          .filter((line) => line.length > 0 && line.length < 100);

        if (topics.length >= 5 && topics.length <= 15) {
          return topics;
        }
      }
    }

    // If output is an object with topics property
    if (output && typeof output === 'object' && output.topics) {
      if (Array.isArray(output.topics)) {
        return output.topics.filter((item: any) => typeof item === 'string');
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting topics:', error);
    return null;
  }
}
