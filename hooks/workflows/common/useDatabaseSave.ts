"use client";

import { useCallback } from "react";
import { workflowLogger } from "@/lib/logger";
import { getUserIdSync } from "@/lib/supabase/insert-helper";

export interface DatabaseSaveConfig {
  apiEndpoint: string;
  workflowName: string;
  onSaveComplete?: () => void; // ✅ NEW: Callback after successful save
}

export interface UseDatabaseSave {
  saveGenerationToDb: (generation: {
    url: string;
    type: "render" | "video" | "upscale";
    name: string;
    prompt?: string;
    sourceType?: "original" | "from_render" | "from_video";
    parentId?: string;
    settings?: Record<string, unknown>;
    sourceImage?: string;
  }) => Promise<void>;
}

/**
 * Hook for saving workflow generations to the database
 * Handles all database persistence operations including renders, videos, and upscales
 *
 * ✅ UPDATED: Now supports onSaveComplete callback for auto-refresh
 *
 * Usage:
 *   useDatabaseSave({
 *     apiEndpoint: 'style-transfer',
 *     workflowName: 'Style Transfer',
 *     onSaveComplete: () => refreshGenerations() // Auto-refresh recent generations
 *   })
 */
export function useDatabaseSave(config: DatabaseSaveConfig): UseDatabaseSave {
  const saveGenerationToDb = useCallback(
    async (generation: {
      url: string;
      type: "render" | "video" | "upscale";
      name: string;
      prompt?: string;
      sourceType?: "original" | "from_render" | "from_video";
      parentId?: string;
      settings?: Record<string, unknown>;
      sourceImage?: string;
    }) => {
      try {
        const userId = getUserIdSync();
        workflowLogger.debug("[SaveGeneration] Attempting to save:", {
          userId,
          type: generation.type,
          name: generation.name,
          hasUrl: !!generation.url,
          hasSourceImage: !!generation.sourceImage,
        });

        const response = await fetch(`/api/${config.apiEndpoint}/save-generation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            url: generation.url,
            type: generation.type,
            sourceType: generation.sourceType || "original",
            parentId: generation.parentId,
            prompt: generation.prompt,
            model: generation.type === "video" ? "runway-gen4-turbo" : "nano-banana",
            settings: generation.settings || {},
            name: generation.name,
            sourceImage: generation.sourceImage,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          workflowLogger.error("[SaveGeneration] Failed to save:", errorData);
        } else {
          await response.json();
          workflowLogger.info("[SaveGeneration] Successfully saved");

          // ✅ NEW: Trigger callback for auto-refresh
          config.onSaveComplete?.();
        }
      } catch (error) {
        workflowLogger.error(
          `[${config.workflowName}] Error saving generation to DB:`,
          error as Error
        );
      }
    },
    [config.apiEndpoint, config.workflowName, config.onSaveComplete]
  );

  return {
    saveGenerationToDb,
  };
}
