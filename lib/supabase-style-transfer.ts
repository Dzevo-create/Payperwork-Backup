import {
  saveWorkflowGeneration,
  getRecentWorkflowGenerations,
  deleteWorkflowGeneration,
  getWorkflowGenerationById,
  type WorkflowGeneration,
  type SaveGenerationData,
} from '@/lib/utils/workflowDatabase';

// Re-export the shared type with a style-transfer-specific alias
export type StyleTransferGeneration = WorkflowGeneration;

const TABLE_NAME = 'style_transfer';

/**
 * Save a new style-transfer generation to the database
 */
export async function saveStyleTransferGeneration(
  userId: string,
  data: SaveGenerationData
): Promise<StyleTransferGeneration | null> {
  return saveWorkflowGeneration(TABLE_NAME, userId, data);
}

/**
 * Get recent generations for a user
 */
export async function getRecentGenerations(
  userId: string,
  limit: number = 50
): Promise<StyleTransferGeneration[]> {
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
): Promise<StyleTransferGeneration | null> {
  return getWorkflowGenerationById(TABLE_NAME, userId, generationId);
}
