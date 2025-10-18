/**
 * EditModePanel Component
 *
 * Edit mode with prompt textarea for image modifications.
 */

"use client";

import { Edit2, Send, Plus, X } from "lucide-react";
import { useState, useRef } from "react";

interface EditModePanelProps {
  mode: "idle" | "edit" | "video";
  editPrompt: string;
  onModeToggle: () => void;
  onEditPromptChange: (prompt: string) => void;
  onEdit: (referenceImages?: string[]) => void;
}

export function EditModePanel({
  mode,
  editPrompt,
  onModeToggle,
  onEditPromptChange,
  onEdit,
}: EditModePanelProps) {
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddReferenceImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      // Check file size (max 15MB)
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 15) {
        alert(`Datei zu groß (max. 15MB): ${file.name}`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setReferenceImages((prev) => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveReferenceImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* Edit Image Button */}
      <button
        onClick={onModeToggle}
        className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all hover:shadow-lg hover:scale-[1.02] ${
          mode === "edit"
            ? "bg-pw-accent text-white"
            : "bg-pw-black text-white hover:bg-pw-black/90"
        }`}
      >
        <Edit2 className="w-4 h-4" />
        Bild bearbeiten
      </button>

      {/* Edit Prompt Field - Slides down directly under Edit Button */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          mode === "edit" ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="flex flex-col gap-2 px-0.5">
          <label className="text-[9px] font-medium text-pw-black/50 uppercase tracking-wide">
            Bearbeitungs-Prompt
          </label>

          {/* Reference Images Preview */}
          {referenceImages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {referenceImages.map((imgUrl, index) => (
                <div
                  key={index}
                  className="relative group w-12 h-12 rounded border border-pw-black/10"
                >
                  <img
                    src={imgUrl}
                    alt={`Referenz ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                  <button
                    onClick={() => handleRemoveReferenceImage(index)}
                    className="absolute -top-1 -right-1 p-0.5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Bild entfernen"
                  >
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <textarea
              value={editPrompt}
              onChange={(e) => onEditPromptChange(e.target.value)}
              placeholder="Änderungen beschreiben..."
              className="w-full px-2 py-1.5 pr-16 text-xs bg-white/80 border border-pw-black/10 rounded-lg outline-none focus:ring-2 focus:ring-pw-accent/50 transition-all resize-none h-[100px]"
            />

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Buttons container */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              {/* Add Reference Image Button */}
              <button
                onClick={handleAddReferenceImage}
                className="p-1.5 bg-pw-black/5 hover:bg-pw-black/10 rounded-md transition-all"
                title="Referenzbild hinzufügen"
              >
                <Plus className="w-3.5 h-3.5 text-pw-black/60" />
              </button>

              {/* Send Button */}
              <button
                onClick={() => onEdit(referenceImages.length > 0 ? referenceImages : undefined)}
                disabled={!editPrompt.trim()}
                className={`p-1.5 rounded-md transition-all ${
                  editPrompt.trim()
                    ? "bg-pw-black hover:bg-pw-black/90 text-white"
                    : "bg-pw-black/10 cursor-not-allowed text-pw-black/40"
                }`}
                aria-label="Bearbeitung anwenden"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
