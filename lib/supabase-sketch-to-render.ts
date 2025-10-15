import { supabaseAdmin } from "./supabase-admin";

export interface SketchToRenderGeneration {
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
  source_image?: string; // Source image URL for lightbox display
  created_at: string;
  updated_at: string;
}

/**
 * Save a new sketch-to-render generation to the database
 */
export async function saveSketchToRenderGeneration(
  userId: string,
  data: {
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
    sourceImage?: string; // Source image URL
  }
): Promise<SketchToRenderGeneration | null> {
  try {
    const { data: generation, error } = await supabaseAdmin
      .from("sketch_to_render")
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
        source_image: data.sourceImage, // Include source image
      })
      .select()
      .single();

    if (error) {
      console.error("[SketchToRender DB] Error saving generation:", error);
      return null;
    }

    return generation;
  } catch (error) {
    console.error("[SketchToRender DB] Unexpected error:", error);
    return null;
  }
}

/**
 * Get recent generations for a user
 */
export async function getRecentGenerations(
  userId: string,
  limit: number = 50
): Promise<SketchToRenderGeneration[]> {
  try {
    const { data: generations, error } = await supabaseAdmin
      .from("sketch_to_render")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[SketchToRender DB] Error fetching generations:", error);
      return [];
    }

    return generations || [];
  } catch (error) {
    console.error("[SketchToRender DB] Unexpected error:", error);
    return [];
  }
}

/**
 * Delete a generation
 */
export async function deleteGeneration(
  userId: string,
  generationId: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("sketch_to_render")
      .delete()
      .eq("id", generationId)
      .eq("user_id", userId);

    if (error) {
      console.error("[SketchToRender DB] Error deleting generation:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[SketchToRender DB] Unexpected error:", error);
    return false;
  }
}

/**
 * Get generation by ID
 */
export async function getGenerationById(
  userId: string,
  generationId: string
): Promise<SketchToRenderGeneration | null> {
  try {
    const { data: generation, error } = await supabaseAdmin
      .from("sketch_to_render")
      .select("*")
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("[SketchToRender DB] Error fetching generation:", error);
      return null;
    }

    return generation;
  } catch (error) {
    console.error("[SketchToRender DB] Unexpected error:", error);
    return null;
  }
}
