'use client';

import { useState, useEffect, useCallback } from 'react';
import { workflowLogger } from '@/lib/logger';
import { getUserIdSync } from '@/lib/supabase/insert-helper';

export interface Generation {
  id: string;
  imageUrl: string;
  timestamp: Date;
  prompt?: string;
  preset?: string;
  name?: string;
  type?: "image" | "video" | "render" | "upscale";
  sourceType?: "original" | "from_render" | "from_video";
  mediaType?: 'image' | 'video';
  settings?: Record<string, unknown>;
  sourceImageUrl?: string; // Source/input image URL
}

export interface UseRecentGenerations {
  recentGenerations: Generation[];
  setRecentGenerations: (generations: Generation[] | ((prev: Generation[]) => Generation[])) => void;
  isLoadingGenerations: boolean;
  loadGenerations: () => Promise<void>;
  deleteGeneration: (id: string) => Promise<void>;
  refreshGenerations: () => Promise<void>;
}

/**
 * Hook for managing recent generations from database
 * Handles loading, deleting, and refreshing generations
 */
export function useRecentGenerations(
  workflowType: 'sketch-to-render' | 'branding'
): UseRecentGenerations {
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>([]);
  const [isLoadingGenerations, setIsLoadingGenerations] = useState(true);

  const loadGenerations = useCallback(async () => {
    try {
      setIsLoadingGenerations(true);
      const userId = getUserIdSync();

      workflowLogger.info(`[${workflowType}] Loading generations for user:`, { userId });

      const response = await fetch(
        `/api/${workflowType}/generations?userId=${encodeURIComponent(userId)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to load generations: ${response.statusText}`);
      }

      const data = await response.json();

      const formattedGenerations = (data.generations || []).map((gen: Record<string, unknown>) => ({
        id: gen.id as string,
        imageUrl: (gen.url || gen.image_url || gen.imageUrl) as string,
        thumbnailUrl: gen.thumbnail_url || gen.thumbnailUrl,
        timestamp: new Date(gen.created_at || gen.timestamp),
        prompt: gen.prompt,
        preset: gen.preset,
        name: gen.name,
        type: gen.type,
        sourceType: gen.source_type || gen.sourceType,
        mediaType: gen.media_type || gen.mediaType || 'image',
        settings: gen.settings,
        sourceImageUrl: gen.source_image || gen.sourceImage || gen.source_image_url || gen.sourceImageUrl,
      }));

      setRecentGenerations(formattedGenerations);

      workflowLogger.info(
        `[${workflowType}] Loaded ${formattedGenerations.length} generations`
      );
    } catch (error) {
      workflowLogger.error(`[${workflowType}] Error loading generations:`, error as Error);
    } finally {
      setIsLoadingGenerations(false);
    }
  }, [workflowType]);

  const deleteGeneration = useCallback(
    async (id: string) => {
      try {
        const userId = getUserIdSync();

        workflowLogger.info(`[${workflowType}] Deleting generation:`, { generationId: id });

        const response = await fetch(`/api/${workflowType}/delete-generation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, id }),
        });

        if (!response.ok) {
          throw new Error(`Failed to delete generation: ${response.statusText}`);
        }

        // Remove from local state
        setRecentGenerations((prev) => prev.filter((gen) => gen.id !== id));

        workflowLogger.info(`[${workflowType}] Generation deleted successfully`);
      } catch (error) {
        workflowLogger.error(`[${workflowType}] Error deleting generation:`, error as Error);
        throw error;
      }
    },
    [workflowType]
  );

  const refreshGenerations = useCallback(async () => {
    await loadGenerations();
  }, [loadGenerations]);

  // Load generations on mount
  useEffect(() => {
    loadGenerations();
  }, [loadGenerations]);

  return {
    recentGenerations,
    setRecentGenerations,
    isLoadingGenerations,
    loadGenerations,
    deleteGeneration,
    refreshGenerations,
  };
}
