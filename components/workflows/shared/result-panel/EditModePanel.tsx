/**
 * EditModePanel Component
 *
 * Edit mode with prompt textarea for image modifications.
 */

"use client";

import { Edit2, Send } from "lucide-react";

interface EditModePanelProps {
  mode: "idle" | "edit" | "video";
  editPrompt: string;
  onModeToggle: () => void;
  onEditPromptChange: (prompt: string) => void;
  onEdit: () => void;
}

export function EditModePanel({
  mode,
  editPrompt,
  onModeToggle,
  onEditPromptChange,
  onEdit,
}: EditModePanelProps) {
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
          mode === "edit" ? "max-h-[140px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="flex flex-col gap-1 px-0.5">
          <label className="text-[9px] font-medium text-pw-black/50 uppercase tracking-wide">
            Bearbeitungs-Prompt
          </label>
          <div className="relative">
            <textarea
              value={editPrompt}
              onChange={(e) => onEditPromptChange(e.target.value)}
              placeholder="Änderungen beschreiben..."
              className="w-full px-2 py-1.5 pr-10 text-xs bg-white/80 border border-pw-black/10 rounded-lg outline-none focus:ring-2 focus:ring-pw-accent/50 transition-all resize-none h-[100px]"
            />
            {/* Send Button inside textarea - black when has text */}
            <button
              onClick={onEdit}
              disabled={!editPrompt.trim()}
              className={`absolute bottom-2 right-2 p-1.5 rounded-md transition-all ${
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
    </>
  );
}
