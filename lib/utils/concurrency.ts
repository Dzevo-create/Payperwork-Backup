import { logger } from '@/lib/logger';

/**
 * Promise concurrency control utilities
 * Prevents overwhelming APIs with too many parallel requests
 */

/**
 * Execute promises with a concurrency limit
 * @param tasks - Array of promise-returning functions
 * @param limit - Max number of concurrent executions
 * @returns Array of results in original order
 *
 * @example
 * const tasks = videos.map(v => () => checkVideoStatus(v));
 * const results = await promiseAllWithLimit(tasks, 5);
 */
export async function promiseAllWithLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  const executing: Promise<void>[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (!task) continue;

    // Execute task and store result at correct index
    const promise = task().then((result) => {
      results[i] = result;
      // Remove from executing queue when done
      const execIndex = executing.indexOf(promise);
      if (execIndex !== -1) {
        executing.splice(execIndex, 1);
      }
    });

    executing.push(promise);

    // If we've hit the concurrency limit, wait for one to finish
    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  // Wait for all remaining promises
  await Promise.all(executing);

  return results;
}

/**
 * Execute promises with a concurrency limit, ignoring errors
 * Failed promises return null instead of throwing
 *
 * @param tasks - Array of promise-returning functions
 * @param limit - Max number of concurrent executions
 * @returns Array of results (null for failed tasks)
 */
export async function promiseAllWithLimitSettled<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<(T | null)[]> {
  const wrappedTasks = tasks.map((task) => () =>
    task().catch((error) => {
      logger.error('Task failed:', error);
      return null;
    })
  );

  return promiseAllWithLimit(wrappedTasks, limit);
}
