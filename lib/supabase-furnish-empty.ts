import {
  saveWorkflowGeneration,
  getRecentWorkflowGenerations,
  deleteWorkflowGeneration,
  getWorkflowGenerationById,
  type WorkflowGeneration,
  type SaveGenerationData,
} from '@/lib/utils/workflowDatabase';

// Re-export the shared type with a furnish-empty-specific alias
export type FurnishEmptyGeneration = WorkflowGeneration;

const TABLE_NAME = 'furnish_empty';

/**
 * Save a new furnish-empty generation to the database
 */
export async function saveFurnishEmptyGeneration(
  userId: string,
  data: SaveGenerationData
): Promise<FurnishEmptyGeneration | null> {
  return saveWorkflowGeneration(TABLE_NAME, userId, data);
}

/**
 * Get recent generations for a user
 */
export async function getRecentGenerations(
  userId: string,
  limit: number = 50
): Promise<FurnishEmptyGeneration[]> {
  return getRecentWorkflowGenerations(TABLE_NAME, userId, limit);
}

/**
 * Delete a generation
 */
export async function deleteGeneration(
  userId: string,
  generationId: string | number
): Promise<boolean> {
  return deleteWorkflowGeneration(TABLE_NAME, userId, generationId);
}

/**
 * Get generation by ID
 */
export async function getGenerationById(
  userId: string,
  generationId: string | number
): Promise<FurnishEmptyGeneration | null> {
  return getWorkflowGenerationById(TABLE_NAME, userId, generationId);
}
