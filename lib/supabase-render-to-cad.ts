import {
  saveWorkflowGeneration,
  getRecentWorkflowGenerations,
  deleteWorkflowGeneration,
  getWorkflowGenerationById,
  type WorkflowGeneration,
  type SaveGenerationData,
} from '@/lib/utils/workflowDatabase';

// Re-export the shared type with a render-to-cad-specific alias
export type RenderToCADGeneration = WorkflowGeneration;

const TABLE_NAME = 'render_to_cad';

/**
 * Save a new render-to-cad generation to the database
 */
export async function saveRenderToCADGeneration(
  userId: string,
  data: SaveGenerationData
): Promise<RenderToCADGeneration | null> {
  return saveWorkflowGeneration(TABLE_NAME, userId, data);
}

/**
 * Get recent generations for a user
 */
export async function getRecentGenerations(
  userId: string,
  limit: number = 50
): Promise<RenderToCADGeneration[]> {
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
): Promise<RenderToCADGeneration | null> {
  return getWorkflowGenerationById(TABLE_NAME, userId, generationId);
}
