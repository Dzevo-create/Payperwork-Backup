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
 */
export async function deleteWorkflowGeneration(
  tableName: string,
  userId: string,
  generationId: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from(tableName)
      .delete()
      .eq("id", generationId)
      .eq("user_id", userId);

    if (error) {
      logger.error(`[${tableName} DB] Error deleting generation:`, error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error(`[${tableName} DB] Unexpected error:`, error);
    return false;
  }
}

/**
 * Get generation by ID from a workflow table
 */
export async function getWorkflowGenerationById(
  tableName: string,
  userId: string,
  generationId: string
): Promise<WorkflowGeneration | null> {
  try {
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
