import { supabaseAdmin } from "@/lib/supabase-admin";
import { logger } from '@/lib/logger';

/**
 * Shared database operations for workflow generations (Sketch-to-Render, Branding, etc.)
 * This utility eliminates code duplication across workflow-specific Supabase modules.
 */

export interface WorkflowGeneration {
  id: string;
  user_id: string;
  url: string;
  thumbnail_url?: string;
  type: "render" | "video" | "upscale";
  source_type?: "original" | "from_render" | "from_video";
  parent_id?: string;
  prompt?: string;
  model: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  name: string;
  source_image?: string;
  created_at: string;
  updated_at: string;
}

export interface SaveGenerationData {
  url: string;
  thumbnailUrl?: string;
  type: "render" | "video" | "upscale";
  sourceType?: "original" | "from_render" | "from_video";
  parentId?: string;
  prompt?: string;
  model: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  name: string;
  sourceImage?: string;
}

/**
 * Save a new generation to a workflow table
 */
export async function saveWorkflowGeneration(
  tableName: string,
  userId: string,
  data: SaveGenerationData
): Promise<WorkflowGeneration | null> {
  try {
    const { data: generation, error } = await supabaseAdmin
      .from(tableName)
      .insert({
        user_id: userId,
        url: data.url,
        thumbnail_url: data.thumbnailUrl,
        type: data.type,
        source_type: data.sourceType || "original",
        parent_id: data.parentId,
        prompt: data.prompt,
        model: data.model,
        settings: data.settings || {},
        metadata: data.metadata || {},
        name: data.name,
        source_image: data.sourceImage,
      })
      .select()
      .single();

    if (error) {
      logger.error(`[${tableName} DB] Error saving generation:`, error);
      return null;
    }

    return generation;
  } catch (error) {
    logger.error(`[${tableName} DB] Unexpected error:`, error);
    return null;
  }
}

/**
 * Get recent generations for a user from a workflow table
 */
export async function getRecentWorkflowGenerations(
  tableName: string,
  userId: string,
  limit: number = 50
): Promise<WorkflowGeneration[]> {
  try {
    const { data: generations, error } = await supabaseAdmin
      .from(tableName)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error(`[${tableName} DB] Error fetching generations:`, error);
      return [];
    }

    return generations || [];
  } catch (error) {
    logger.error(`[${tableName} DB] Unexpected error:`, error);
    return [];
  }
}

/**
 * Delete a generation from a workflow table
 *
 * Supports both UUID (modern tables) and numeric IDs (legacy tables)
 */
export async function deleteWorkflowGeneration(
  tableName: string,
  userId: string,
  generationId: string | number
): Promise<boolean> {
  try {
    // Validate generation ID exists
    if (!generationId) {
      logger.error(`[${tableName} DB] Missing generation ID`);
      return false;
    }

    // UUID regex: 8-4-4-4-12 hex characters
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // For string IDs, determine if UUID or numeric
    if (typeof generationId === 'string') {
      // If it's a pure numeric string, convert to number (legacy BIGINT support)
      if (/^\d+$/.test(generationId)) {
        const numericId = parseInt(generationId, 10);
        if (!isNaN(numericId)) {
          const { error } = await supabaseAdmin
            .from(tableName)
            .delete()
            .eq("id", numericId)
            .eq("user_id", userId);

          if (error) {
            logger.error(`[${tableName} DB] Error deleting generation (numeric):`, error);
            return false;
          }
          logger.info(`[${tableName} DB] Successfully deleted generation (numeric):`, numericId);
          return true;
        }
      }

      // Validate UUID format
      if (!uuidRegex.test(generationId)) {
        logger.error(`[${tableName} DB] Invalid ID format:`, {
          generationId,
          type: typeof generationId,
          expected: 'UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx) or numeric'
        });
        return false;
      }
    }

    // Delete with ID as-is (UUID string or number)
    const { error } = await supabaseAdmin
      .from(tableName)
      .delete()
      .eq("id", generationId)
      .eq("user_id", userId);

    if (error) {
      logger.error(`[${tableName} DB] Error deleting generation:`, error);
      return false;
    }

    logger.info(`[${tableName} DB] Successfully deleted generation:`, { generationId });
    return true;
  } catch (error) {
    logger.error(`[${tableName} DB] Unexpected error:`, error);
    return false;
  }
}

/**
 * Get generation by ID from a workflow table
 *
 * Supports both UUID (modern tables) and numeric IDs (legacy tables)
 */
export async function getWorkflowGenerationById(
  tableName: string,
  userId: string,
  generationId: string | number
): Promise<WorkflowGeneration | null> {
  try {
    // Validate generation ID exists
    if (!generationId) {
      logger.error(`[${tableName} DB] Missing generation ID`);
      return null;
    }

    // UUID regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // For string IDs, determine if UUID or numeric
    if (typeof generationId === 'string') {
      // If it's a pure numeric string, convert to number (legacy BIGINT support)
      if (/^\d+$/.test(generationId)) {
        const numericId = parseInt(generationId, 10);
        if (!isNaN(numericId)) {
          const { data: generation, error } = await supabaseAdmin
            .from(tableName)
            .select("*")
            .eq("id", numericId)
            .eq("user_id", userId)
            .single();

          if (error) {
            logger.error(`[${tableName} DB] Error fetching generation (numeric):`, error);
            return null;
          }
          return generation;
        }
      }

      // Validate UUID format
      if (!uuidRegex.test(generationId)) {
        logger.error(`[${tableName} DB] Invalid ID format:`, {
          generationId,
          type: typeof generationId,
          expected: 'UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx) or numeric'
        });
        return null;
      }
    }

    // Fetch with ID as-is (UUID string or number)
    const { data: generation, error } = await supabaseAdmin
      .from(tableName)
      .select("*")
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (error) {
      logger.error(`[${tableName} DB] Error fetching generation:`, error);
      return null;
    }

    return generation;
  } catch (error) {
    logger.error(`[${tableName} DB] Unexpected error:`, error);
    return null;
  }
}
