"use client";

import { ImageUpload } from "./ImageUpload";

interface InputData {
  sourceImage: { file: File | null; preview: string | null; originalPreview: string | null };
  referenceImages: Array<{ file: File | null; preview: string | null; originalPreview: string | null }>;
}

interface InputsPanelProps {
  data: InputData;
  onChange: (data: InputData) => void;
  onCropSource?: () => void;
  onCropReference?: (index: number) => void;
}

/**
 * InputsPanel Component
 *
 * Left column panel (400px fixed width) containing:
 * - Ausgangsbild upload (required)
 * - Referenzbilder upload (optional, max 3)
 */
export function InputsPanel({ data, onChange, onCropSource, onCropReference }: InputsPanelProps) {
  const handleSourceImageChange = (file: File | null | undefined, preview: string | null) => {
    onChange({
      ...data,
      sourceImage: {
        file: file ?? null,
        preview,
        // Store as original when first uploaded, preserve existing original on subsequent changes
        originalPreview: preview || data?.sourceImage?.originalPreview || null
      },
    });
  };

  const handleReferenceImageChange = (
    index: number,
    file: File | null,
    preview: string | null
  ) => {
    const newReferenceImages = [...(data?.referenceImages || [])];
    // Ensure the array has at least index+1 elements
    while (newReferenceImages.length <= index) {
      newReferenceImages.push({ file: null, preview: null, originalPreview: null });
    }
    const existingOriginal = newReferenceImages[index]?.originalPreview;
    newReferenceImages[index] = {
      file,
      preview,
      // Store as original when first uploaded, preserve existing original on subsequent changes
      originalPreview: preview || existingOriginal || null
    };
    onChange({
      ...data,
      referenceImages: newReferenceImages,
    });
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
      {/* Section Label - Larger text */}
      <h3 className="text-xs font-semibold text-pw-black/70 uppercase tracking-wide">
        Input Bilder
      </h3>

      {/* Source Image Upload (Required) */}
      <ImageUpload
        label="Ausgangsbild"
        value={data?.sourceImage?.preview || null}
        onChange={handleSourceImageChange}
        maxSizeMB={10}
        onCrop={onCropSource}
      />

      {/* Reference Images Upload - Single field, 3 uploads possible */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-pw-black/50 uppercase tracking-wide">
            Referenzen (Optional)
          </label>
          <span className="text-[10px] text-pw-black/40">
            {(data?.referenceImages || []).filter(ref => ref.preview).length}/1
          </span>
        </div>

        <ImageUpload
          label="Referenzbilder"
          value={data?.referenceImages?.[0]?.preview || null}
          onChange={(file, preview) =>
            handleReferenceImageChange(0, file ?? null, preview)
          }
          maxSizeMB={10}
          onCrop={onCropReference ? () => onCropReference(0) : undefined}
        />

        {/* Only 1 reference image allowed - removed additional slots */}

        {/* Example Cards in empty space below - Before and After */}
        <div className="flex flex-col gap-2 mt-4">
          <p className="text-[9px] font-medium text-pw-black/40 uppercase tracking-wide">
            Beispiel Workflow
          </p>

          {/* Before Card - Sketch */}
          <div className="relative h-[152px] rounded-xl border-2 border-pw-black/20 bg-pw-black/5 overflow-hidden">
            <div className="absolute top-2 left-2 px-2 py-1 bg-pw-black rounded-md text-[9px] font-semibold text-white">
              BEFORE
            </div>
          </div>

          {/* After Card - Render */}
          <div className="relative h-[152px] rounded-xl border-2 border-pw-accent/40 bg-pw-accent/5 overflow-hidden">
            <div className="absolute top-2 left-2 px-2 py-1 bg-pw-black rounded-md text-[9px] font-semibold text-white">
              AFTER
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
