"use client";

import { Download, Trash2 } from "lucide-react";

interface SelectionActionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDownload: () => void;
  onDelete: () => void;
  isProcessing: boolean;
}

export function SelectionActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDownload,
  onDelete,
  isProcessing,
}: SelectionActionBarProps) {
  return (
    <div className="px-6 py-3 bg-pw-accent/10 border-b border-pw-accent/20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-pw-black">
          {selectedCount} {selectedCount === 1 ? "Item" : "Items"} ausgewählt
        </span>
        {selectedCount < totalCount && (
          <button
            onClick={onSelectAll}
            className="px-2.5 py-1 bg-pw-black hover:bg-pw-black/90 text-white rounded-full text-xs font-medium transition-all"
          >
            Alle auswählen
          </button>
        )}
        {selectedCount > 0 && (
          <button
            onClick={onDeselectAll}
            className="px-2.5 py-1 bg-white hover:bg-white/80 text-pw-black rounded-full text-xs font-medium transition-all border border-pw-black/10"
          >
            Abwählen
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onDownload}
          disabled={selectedCount === 0 || isProcessing}
          className="w-8 h-8 rounded-full bg-pw-black text-white hover:bg-pw-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          title={isProcessing ? "Verarbeite..." : "Download"}
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          disabled={selectedCount === 0 || isProcessing}
          className="w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          title={isProcessing ? "Verarbeite..." : "Löschen"}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
