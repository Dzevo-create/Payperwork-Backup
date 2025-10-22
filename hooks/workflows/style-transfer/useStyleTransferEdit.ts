// hooks/workflows/style-transfer/useStyleTransferEdit.ts
"use client";

import { useRenderEdit } from "../common/useRenderEdit";

/**
 * Style Transfer Edit Hook
 *
 * Wrapper around useRenderEdit that automatically uses the correct
 * API endpoint for Style Transfer workflow (/api/style-transfer/edit)
 *
 * Usage:
 *   const { editRender, isEditing } = useStyleTransferEdit();
 */
export function useStyleTransferEdit(options = {}) {
  return useRenderEdit({
    ...options,
    apiEndpoint: "/api/style-transfer/edit",
  });
}
