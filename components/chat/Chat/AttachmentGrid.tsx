"use client";

import { X, FileText, Edit2 } from "lucide-react";

interface Attachment {
  type: string;
  url: string;
  name: string;
}

interface AttachmentGridProps {
  attachments: Attachment[];
  onRemove: (index: number) => void;
  onEdit?: (index: number) => void;
}

export function AttachmentGrid({ attachments, onRemove, onEdit }: AttachmentGridProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-2 border-t border-pw-black/5">
      {attachments.map((att, index) => (
        <div key={index} className="relative group">
          {att.type === "image" ? (
            // Image Thumbnail - Behält Original Aspect Ratio
            <div className="relative max-w-32 max-h-32 rounded-lg overflow-hidden border border-pw-black/10">
              <img
                src={att.url}
                alt={att.name}
                className="w-full h-full object-contain"
                style={{ maxWidth: "128px", maxHeight: "128px" }}
              />
              {/* Buttons - Top Right - Beide rechts nebeneinander */}
              <div className="absolute top-1 right-1 flex items-center gap-1">
                {/* Edit Button - Stift */}
                {onEdit && (
                  <button
                    onClick={() => onEdit(index)}
                    className="p-1 bg-pw-black/90 hover:bg-pw-black rounded-full transition-colors shadow-lg"
                  >
                    <Edit2 className="w-3 h-3 text-white" />
                  </button>
                )}
                {/* X Button - Weiß */}
                <button
                  onClick={() => onRemove(index)}
                  className="p-1 bg-pw-black/90 hover:bg-pw-black rounded-full transition-colors shadow-lg"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          ) : (
            // PDF Thumbnail - Größer: 20x20
            <div className="relative w-20 h-20 rounded-lg border border-pw-black/10 bg-pw-black/5 flex flex-col items-center justify-center">
              <FileText className="w-7 h-7 text-pw-black/60" />
              <span className="text-[9px] text-pw-black/50 mt-1">PDF</span>
              {/* X Button - Top Right - Weiß, besser sichtbar */}
              <button
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 p-1 bg-pw-black/90 hover:bg-pw-black rounded-full transition-colors shadow-lg"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
