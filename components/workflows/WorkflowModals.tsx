/**
 * WorkflowModals Component
 *
 * Modal overlays for workflow pages (Lightbox and Crop Modal).
 *
 * Responsibilities:
 * - Render WorkflowLightbox when open
 * - Render ImageCropModal when open
 * - Handle modal actions (download, navigate, crop complete)
 */

'use client';

import { WorkflowLightbox } from '@/components/workflows/shared';
import ImageCropModal from '@/components/chat/ImageCrop/ImageCropModal';
import type { WorkflowPageState } from '@/hooks/workflows/common/useWorkflowPageState';
import type { WorkflowActions } from '@/hooks/workflows/common/useWorkflowActions';

interface WorkflowModalsProps<TSettings extends Record<string, unknown>> {
  state: WorkflowPageState<TSettings>;
  actions: WorkflowActions;
}

/**
 * Renders all modal overlays for workflow pages
 */
export function WorkflowModals<TSettings extends Record<string, unknown>>({
  state,
  actions,
}: WorkflowModalsProps<TSettings>) {

  return (
    <>
      {/* Lightbox Modal */}
      {state.lightbox.lightboxOpen && state.lightbox.lightboxItem && (
        <WorkflowLightbox
          isOpen={state.lightbox.lightboxOpen}
          item={state.lightbox.lightboxItem}
          onClose={state.lightbox.closeLightbox}
          onNavigate={state.lightbox.lightboxIndex >= 0 ? actions.handleNavigateLightbox : undefined}
          hasNext={
            state.lightbox.lightboxIndex >= 0 &&
            state.lightbox.lightboxIndex < state.generations.recentGenerations.length - 1
          }
          hasPrev={state.lightbox.lightboxIndex > 0}
          onDownload={(item) => {
            const extension = item.type === "video" ? ".mp4" : ".jpg";
            const filename = item.name
              ? item.name.includes(".")
                ? item.name
                : `${item.name}${extension}`
              : `render-${item.id}${extension}`;
            state.handlers.handleDownload(
              item.imageUrl,
              filename,
              item.type === "video" ? "video" : "image"
            );
          }}
        />
      )}

      {/* Crop Modal */}
      {state.crop.cropModalOpen && state.crop.imageToCrop && (
        <ImageCropModal
          isOpen={state.crop.cropModalOpen}
          imageUrl={state.crop.imageToCrop}
          onClose={state.crop.closeCropModal}
          onCropComplete={actions.handleCropComplete}
        />
      )}
    </>
  );
}
