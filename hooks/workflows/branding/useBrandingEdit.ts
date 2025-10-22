// hooks/workflows/branding/useBrandingEdit.ts
"use client";

import { useRenderEdit } from "../common/useRenderEdit";

/**
 * Branding Edit Hook
 *
 * Wrapper around useRenderEdit that automatically uses the correct
 * API endpoint for Branding workflow (/api/branding/edit)
 *
 * Usage:
 *   const { editRender, isEditing } = useBrandingEdit();
 */
export function useBrandingEdit(options = {}) {
  return useRenderEdit({
    ...options,
    apiEndpoint: "/api/branding/edit",
  });
}
