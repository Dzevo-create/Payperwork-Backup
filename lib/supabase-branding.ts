import {
  saveWorkflowGeneration,
  getRecentWorkflowGenerations,
  deleteWorkflowGeneration,
  getWorkflowGenerationById,
  type WorkflowGeneration,
  type SaveGenerationData,
} from '@/lib/utils/workflowDatabase';

// Re-export the shared type with a branding-specific alias
export type BrandingGeneration = WorkflowGeneration;

const TABLE_NAME = 'branding';

/**
 * Save a new branding generation to the database
 */
export async function saveBrandingGeneration(
  userId: string,
  data: SaveGenerationData
): Promise<BrandingGeneration | null> {
  return saveWorkflowGeneration(TABLE_NAME, userId, data);
}

/**
 * Get recent generations for a user
 */
export async function getRecentGenerations(
  userId: string,
  limit: number = 50
): Promise<BrandingGeneration[]> {
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
): Promise<BrandingGeneration | null> {
  return getWorkflowGenerationById(TABLE_NAME, userId, generationId);
}
