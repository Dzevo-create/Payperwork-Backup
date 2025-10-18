/**
 * VideoModePanel Component
 *
 * Video creation mode with duration selector, camera movement selector, and prompt textarea.
 */

"use client";

import { Video, Send, Camera, Clock, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { CAMERA_MOVEMENTS, VIDEO_DURATIONS } from "@/constants/resultPanelConstants";

interface VideoModePanelProps {
  mode: "idle" | "edit" | "video";
  videoPrompt: string;
  videoDuration: 5 | 10;
  onModeToggle: () => void;
  onVideoPromptChange: (prompt: string) => void;
  onVideoDurationChange: (duration: 5 | 10) => void;
  onVideoCreate: () => void;
  onCameraMovementSelect: (movement: string) => void;
}

export function VideoModePanel({
  mode,
  videoPrompt,
  videoDuration,
  onModeToggle,
  onVideoPromptChange,
  onVideoDurationChange,
  onVideoCreate,
  onCameraMovementSelect,
}: VideoModePanelProps) {
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [showDurationMenu, setShowDurationMenu] = useState(false);
  const cameraMenuRef = useRef<HTMLDivElement>(null);
  const cameraDropdownRef = useRef<HTMLDivElement>(null);
  const durationMenuRef = useRef<HTMLDivElement>(null);
  const durationDropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close camera menu
      if (
        cameraMenuRef.current &&
        !cameraMenuRef.current.contains(event.target as Node) &&
        cameraDropdownRef.current &&
        !cameraDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCameraMenu(false);
      }

      // Close duration menu
      if (
        durationMenuRef.current &&
        !durationMenuRef.current.contains(event.target as Node) &&
        durationDropdownRef.current &&
        !durationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDurationMenu(false);
      }
    };

    if (showCameraMenu || showDurationMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }

    return undefined;
  }, [showCameraMenu, showDurationMenu]);

  const handleCameraSelect = (movement: string) => {
    onCameraMovementSelect(movement);
    setShowCameraMenu(false);
  };

  return (
    <>
      {/* Create Video Button */}
      <button
        onClick={onModeToggle}
        className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all hover:shadow-lg hover:scale-[1.02] ${
          mode === "video"
            ? "bg-pw-accent text-white"
            : "bg-pw-black text-white hover:bg-pw-black/90"
        }`}
      >
        <Video className="w-4 h-4" />
        Video erstellen
      </button>

      {/* Video Prompt Field - Slides down directly under Video Button */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          mode === "video" ? "max-h-[180px] opacity-100 overflow-visible" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="flex flex-col gap-2 px-0.5">
          {/* Settings Row - Both on the right */}
          <div className="flex items-center justify-end gap-2">
            {/* Duration Dropdown */}
            <div className="relative" ref={durationMenuRef}>
              <button
                onClick={() => setShowDurationMenu(!showDurationMenu)}
                className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
                  showDurationMenu ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
                }`}
              >
                <Clock className={`w-3.5 h-3.5 transition-colors ${showDurationMenu ? "text-pw-accent" : "text-pw-black/40"}`} />
                <span className="text-xs font-medium text-pw-black/70">{videoDuration}s</span>
                <ChevronDown className={`w-3 h-3 text-pw-black/40 transition-transform duration-200 ${showDurationMenu ? "rotate-180" : ""}`} />
              </button>

              {showDurationMenu && (
                <div
                  ref={durationDropdownRef}
                  className="absolute top-full left-0 mt-1 w-36 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {VIDEO_DURATIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onVideoDurationChange(option.value as 5 | 10);
                        setShowDurationMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        videoDuration === option.value
                          ? "bg-pw-accent text-white font-medium"
                          : "text-pw-black/70 hover:bg-pw-black/5"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {videoDuration === option.value && <span className="text-xs">✓</span>}
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Camera Movement Dropdown - Icon only */}
            <div className="relative" ref={cameraMenuRef}>
              <button
                onClick={() => setShowCameraMenu(!showCameraMenu)}
                className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
                  showCameraMenu ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
                }`}
              >
                <Camera className={`w-3.5 h-3.5 transition-colors ${showCameraMenu ? "text-pw-accent" : "text-pw-black/40"}`} />
                <ChevronDown className={`w-3 h-3 text-pw-black/40 transition-transform duration-200 ${showCameraMenu ? "rotate-180" : ""}`} />
              </button>

              {showCameraMenu && (
                <div
                  ref={cameraDropdownRef}
                  className="absolute top-full right-0 mt-1 w-40 max-h-64 overflow-y-auto bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {CAMERA_MOVEMENTS.map((movement) => (
                    <button
                      key={movement.value}
                      onClick={() => handleCameraSelect(movement.value)}
                      className="w-full text-left px-3 py-2 text-xs text-pw-black/70 hover:bg-pw-accent/10 transition-colors"
                    >
                      {movement.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Video Prompt Textarea */}
          <div className="relative">
            <textarea
              value={videoPrompt}
              onChange={(e) => onVideoPromptChange(e.target.value)}
              placeholder="Beschreibe die Video-Animation..."
              className="w-full px-2 py-1.5 pr-10 text-xs bg-white/80 border border-pw-black/10 rounded-lg outline-none focus:ring-2 focus:ring-pw-accent/50 transition-all resize-none h-[80px]"
            />
            {/* Send Button inside textarea */}
            <button
              onClick={onVideoCreate}
              className="absolute bottom-2 right-2 p-1.5 bg-pw-black hover:bg-pw-black/90 text-white rounded-md transition-all"
              aria-label="Video erstellen"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
