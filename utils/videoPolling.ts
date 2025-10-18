// Video generation polling utility

import { videoLogger } from '@/lib/logger';

export interface PendingVideoTask {
  taskId: string;
  messageId: string;
  type: "text2video" | "image2video";
  startTime: number;
  estimatedDuration: number; // in seconds
}

interface VideoTaskResult {
  status: string;
  message?: string;
  [key: string]: unknown;
}

class VideoPollingManager {
  private pendingTasks: Map<string, PendingVideoTask> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private onTaskComplete?: (taskId: string, result: VideoTaskResult) => void;
  private onTaskUpdate?: (taskId: string, progress: number) => void;

  constructor() {
    // Load pending tasks from localStorage on init
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pending_video_tasks');
      if (saved) {
        try {
          const tasks = JSON.parse(saved);
          this.pendingTasks = new Map(tasks);
          this.startPolling();
        } catch (e) {
          videoLogger.error('Failed to load pending tasks', e instanceof Error ? e : undefined);
        }
      }
    }
  }

  addTask(task: PendingVideoTask) {
    this.pendingTasks.set(task.taskId, task);
    this.saveTasks();
    this.startPolling();
  }

  removeTask(taskId: string) {
    this.pendingTasks.delete(taskId);
    this.saveTasks();
    if (this.pendingTasks.size === 0) {
      this.stopPolling();
    }
  }

  onComplete(callback: (taskId: string, result: VideoTaskResult) => void) {
    this.onTaskComplete = callback;
  }

  onUpdate(callback: (taskId: string, progress: number) => void) {
    this.onTaskUpdate = callback;
  }

  private saveTasks() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'pending_video_tasks',
        JSON.stringify(Array.from(this.pendingTasks.entries()))
      );
    }
  }

  private startPolling() {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(async () => {
      for (const [taskId, task] of this.pendingTasks.entries()) {
        try {
          // Calculate progress based on elapsed time
          const elapsed = Date.now() - task.startTime;
          const progress = Math.min(95, (elapsed / (task.estimatedDuration * 1000)) * 100);

          if (this.onTaskUpdate) {
            this.onTaskUpdate(taskId, progress);
          }

          // Check task status
          const endpoint = task.type === "text2video"
            ? `/api/generate-video/text2video?task_id=${taskId}`
            : `/api/generate-video/image2video?task_id=${taskId}`;

          const response = await fetch(endpoint);
          const data = await response.json();

          if (data.status === "succeed") {
            // Task completed
            if (this.onTaskComplete) {
              this.onTaskComplete(taskId, data);
            }
            this.removeTask(taskId);
          } else if (data.status === "failed") {
            // Task failed
            const error = new Error(data.message || 'Video generation failed');
            videoLogger.error('Video generation failed', error, {
              taskId,
            });
            this.removeTask(taskId);
          }
          // Otherwise keep polling (status is "processing" or "submitted")
        } catch (error) {
          videoLogger.error('Polling error for task', error instanceof Error ? error : undefined, { taskId });
        }
      }
    }, 5000); // Poll every 5 seconds
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  getPendingTasks() {
    return Array.from(this.pendingTasks.values());
  }

  getTaskProgress(taskId: string): number {
    const task = this.pendingTasks.get(taskId);
    if (!task) return 0;

    const elapsed = Date.now() - task.startTime;
    return Math.min(95, (elapsed / (task.estimatedDuration * 1000)) * 100);
  }
}

// Singleton instance
export const videoPollingManager = new VideoPollingManager();
