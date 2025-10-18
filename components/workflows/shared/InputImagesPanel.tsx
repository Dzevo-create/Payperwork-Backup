"use client";

import { X, Crop } from "lucide-react";

interface InputImagesPanelProps {
  sourceImage: { file: File | null; preview: string | null };
  referenceImages: Array<{ file: File | null; preview: string | null }>;
  onRemoveSource: () => void;
  onRemoveReference: (index: number) => void;
  onCropSource?: () => void;
  onCropReference?: (index: number) => void;
}

/**
 * InputImagesPanel Component
 *
 * Displays uploaded source and reference images in card format
 * with delete buttons. Shows when images are uploaded.
 */
export function InputImagesPanel({
  sourceImage,
  referenceImages,
  onRemoveSource,
  onRemoveReference,
  onCropSource,
  onCropReference,
}: InputImagesPanelProps) {
  const hasSourceImage = sourceImage.preview !== null;
  const activeReferenceImages = referenceImages.filter((img) => img.preview !== null);
  const hasAnyImage = hasSourceImage || activeReferenceImages.length > 0;

  if (!hasAnyImage) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Section Label */}
      <h3 className="text-xs font-semibold text-pw-black/70 uppercase tracking-wide">
        Hochgeladene Bilder
      </h3>

      <div className="flex flex-col gap-3">
        {/* Source Image Card */}
        {hasSourceImage && (
          <div className="relative group">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-medium text-pw-black/50 uppercase tracking-wide">
                Ausgangsbild
              </label>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-pw-black/5 border border-pw-black/10">
                <img
                  src={sourceImage.preview!}
                  alt="Source"
                  className="w-full h-full object-cover"
                />
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  {/* Crop Button */}
                  {onCropSource && (
                    <button
                      onClick={onCropSource}
                      className="p-1.5 bg-pw-accent hover:bg-pw-accent/90 rounded-lg shadow-lg"
                      aria-label="Ausgangsbild zuschneiden"
                    >
                      <Crop className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                  {/* Delete Button */}
                  <button
                    onClick={onRemoveSource}
                    className="p-1.5 bg-pw-black/80 hover:bg-red-500 rounded-lg shadow-lg"
                    aria-label="Ausgangsbild löschen"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reference Images Cards */}
        {activeReferenceImages.map((refImage, index) => (
          <div key={index} className="relative group">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-medium text-pw-black/50 uppercase tracking-wide">
                Referenzbild {index + 1}
              </label>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-pw-black/5 border border-pw-black/10">
                <img
                  src={refImage.preview!}
                  alt={`Reference ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  {/* Crop Button */}
                  {onCropReference && (
                    <button
                      onClick={() => onCropReference(index)}
                      className="p-1.5 bg-pw-accent hover:bg-pw-accent/90 rounded-lg shadow-lg"
                      aria-label={`Referenzbild ${index + 1} zuschneiden`}
                    >
                      <Crop className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                  {/* Delete Button */}
                  <button
                    onClick={() => onRemoveReference(index)}
                    className="p-1.5 bg-pw-black/80 hover:bg-red-500 rounded-lg shadow-lg"
                    aria-label={`Referenzbild ${index + 1} löschen`}
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
