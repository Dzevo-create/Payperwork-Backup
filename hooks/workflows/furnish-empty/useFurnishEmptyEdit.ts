// hooks/workflows/furnish-empty/useFurnishEmptyEdit.ts
"use client";

import { useRenderEdit } from "../common/useRenderEdit";

/**
 * Furnish Empty Edit Hook
 *
 * Wrapper around useRenderEdit that automatically uses the correct
 * API endpoint for Furnish Empty workflow (/api/furnish-empty/edit)
 *
 * Usage:
 *   const { editRender, isEditing } = useFurnishEmptyEdit();
 */
export function useFurnishEmptyEdit(options = {}) {
  return useRenderEdit({
    ...options,
    apiEndpoint: "/api/furnish-empty/edit",
  });
}
