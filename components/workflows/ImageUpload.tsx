"use client";

import { Upload, X, Image as ImageIcon, Crop } from "lucide-react";
import { useState, useRef, DragEvent } from "react";

interface ImageUploadProps {
  label: string;
  value?: string | null;
  onChange: (file: File | null | undefined, preview: string | null) => void;
  maxSizeMB?: number;
  className?: string;
  showExample?: boolean; // Show before/after example
  onCrop?: () => void; // Optional crop handler
}

/**
 * ImageUpload Component
 *
 * Reusable drag-and-drop image upload zone
 * Used for: Ausgangsbild, Referenzbilder in Sketch-to-Render workflow
 */
export function ImageUpload({
  label,
  value,
  onChange,
  maxSizeMB = 10,
  className = "",
  showExample = false,
  onCrop
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateAndProcessFile = (file: File) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Nur Bilddateien sind erlaubt");
      return;
    }

    // Validate file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`Datei zu groß (max. ${maxSizeMB}MB)`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      onChange(file, preview);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const handleRemove = () => {
    onChange(null, null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Label - More visible and prominent */}
      <label className="text-xs font-semibold text-pw-black/70 uppercase tracking-wide">
        {label}
      </label>

      {/* Upload Zone - Much more compact */}
      <div
        onClick={!value ? handleClick : undefined}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex items-center justify-center aspect-video rounded transition-all cursor-pointer ${
          !value ? (isDragging
            ? "border-2 border-dashed border-pw-accent bg-pw-accent/5"
            : "border-2 border-dashed border-pw-black/20 hover:border-pw-accent/50 hover:bg-pw-black/5")
          : ""
        }`}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {value ? (
          <div className="relative w-full h-full p-2 flex items-center justify-center group">
            {/* Preview Image with border - object-contain to show full image */}
            <img
              src={value}
              alt="Preview"
              className="max-w-full max-h-full object-contain border-2 border-dashed border-pw-black/20 rounded"
            />

            {/* Action Buttons - Show on hover */}
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
              {/* Crop Button */}
              {onCrop && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCrop();
                  }}
                  className="p-1.5 bg-pw-accent hover:bg-pw-accent/90 rounded-lg shadow-lg transition-all"
                  aria-label="Bild zuschneiden"
                >
                  <Crop className="w-4 h-4 text-white" />
                </button>
              )}

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="p-1.5 bg-white hover:bg-red-500 rounded-lg transition-all shadow-lg group/remove"
                aria-label="Bild löschen"
              >
                <X className="w-4 h-4 text-pw-black group-hover/remove:text-white transition-colors" />
              </button>
            </div>
          </div>
        ) : showExample ? (
          /* Before/After Example */
          <div className="relative w-full h-full group">
            {/* Before/After Images Side by Side */}
            <div className="absolute inset-0 flex">
              {/* Before - Sketch */}
              <div className="relative flex-1 overflow-hidden">
                <img
                  src="/images/Pictures/Workflows/Vorher nachher 1/Before 1.jpg"
                  alt="Before - Sketch"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-pw-black/80 rounded text-[8px] font-medium text-white">
                  Vorher
                </div>
              </div>

              {/* Divider */}
              <div className="w-[2px] bg-white/80 shadow-lg" />

              {/* After - Render */}
              <div className="relative flex-1 overflow-hidden">
                <img
                  src="/images/Pictures/Workflows/Vorher nachher 1/After 2.jpg"
                  alt="After - Render"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-pw-accent/90 rounded text-[8px] font-medium text-white">
                  Nachher
                </div>
              </div>
            </div>

            {/* Upload Overlay - Shows on hover */}
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              <div className="p-1 bg-pw-black/5 rounded">
                {isDragging ? (
                  <Upload className="w-3 h-3 text-pw-accent" />
                ) : (
                  <ImageIcon className="w-3 h-3 text-pw-black/40" />
                )}
              </div>
              <div>
                <p className="text-[9px] font-medium text-pw-black/70">
                  {isDragging ? "Ablegen" : "Hochladen"}
                </p>
                <p className="text-[8px] text-pw-black/40 mt-0.5">
                  max. {maxSizeMB}MB
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-center p-2">
            <div className="p-1 bg-pw-black/5 rounded">
              {isDragging ? (
                <Upload className="w-3 h-3 text-pw-accent" />
              ) : (
                <ImageIcon className="w-3 h-3 text-pw-black/40" />
              )}
            </div>
            <div>
              <p className="text-[9px] font-medium text-pw-black/70">
                {isDragging ? "Ablegen" : "Hochladen"}
              </p>
              <p className="text-[8px] text-pw-black/40 mt-0.5">
                max. {maxSizeMB}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-[9px] text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}
