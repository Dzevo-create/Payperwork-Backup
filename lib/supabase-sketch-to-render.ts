import {
  saveWorkflowGeneration,
  getRecentWorkflowGenerations,
  deleteWorkflowGeneration,
  getWorkflowGenerationById,
  type WorkflowGeneration,
  type SaveGenerationData,
} from '@/lib/utils/workflowDatabase';

// Re-export the shared type with a sketch-to-render-specific alias
export type SketchToRenderGeneration = WorkflowGeneration;

const TABLE_NAME = 'sketch_to_render';

/**
 * Save a new sketch-to-render generation to the database
 */
export async function saveSketchToRenderGeneration(
  userId: string,
  data: SaveGenerationData
): Promise<SketchToRenderGeneration | null> {
  return saveWorkflowGeneration(TABLE_NAME, userId, data);
}

/**
 * Get recent generations for a user
 */
export async function getRecentGenerations(
  userId: string,
  limit: number = 50
): Promise<SketchToRenderGeneration[]> {
  return getRecentWorkflowGenerations(TABLE_NAME, userId, limit);
}

/**
 * Delete a generation
 */
export async function deleteGeneration(
  userId: string,
  generationId: string
): Promise<boolean> {
  return deleteWorkflowGeneration(TABLE_NAME, userId, generationId);
}

/**
 * Get generation by ID
 */
export async function getGenerationById(
  userId: string,
  generationId: string
): Promise<SketchToRenderGeneration | null> {
  return getWorkflowGenerationById(TABLE_NAME, userId, generationId);
}
