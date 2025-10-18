"use client";

import { Download, Video, Sparkles, Loader2, Send, Edit2, Camera, Crop, Clock, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ResultPanelProps {
  imageUrl: string | null;
  mediaType?: "image" | "video";
  isGenerating: boolean;
  generatingType?: "render" | "video" | "upscale" | "edit";
  onCreateVideo?: (videoPrompt: string, duration?: 5 | 10) => void;
  onUpscale?: () => void;
  onDownload?: () => void;
  onCrop?: () => void;
  renderName?: string;
  onRenderNameChange?: (name: string) => void;
  onEdit?: (editPrompt: string) => void;
  onImageClick?: () => void;
}

type Mode = "idle" | "edit" | "video";

const CAMERA_MOVEMENTS = [
  { label: "Push In", value: "push in" },
  { label: "Push Out", value: "push out" },
  { label: "Pan Left", value: "pan left" },
  { label: "Pan Right", value: "pan right" },
  { label: "Pan Up", value: "pan up" },
  { label: "Pan Down", value: "pan down" },
  { label: "Orbit Left", value: "orbit left" },
  { label: "Orbit Right", value: "orbit right" },
  { label: "Crane Up", value: "crane up" },
  { label: "Crane Down", value: "crane down" },
  { label: "Dolly In", value: "dolly in" },
  { label: "Dolly Out", value: "dolly out" },
  { label: "Tilt Up", value: "tilt up" },
  { label: "Tilt Down", value: "tilt down" },
  { label: "Zoom In", value: "zoom in" },
  { label: "Zoom Out", value: "zoom out" },
  { label: "Static", value: "static camera" },
];

const VIDEO_DURATIONS = [
  { label: "5 Sekunden", value: 5 },
  { label: "10 Sekunden", value: 10 },
];

/**
 * ResultPanel Component
 *
 * Right column panel (flex-1) displaying:
 * - Generated render result (16:9 aspect ratio)
 * - Action buttons: Create Video, Upscale 2x, Download
 * - Loading state during generation
 */
export function ResultPanel({
  imageUrl,
  mediaType = "image",
  isGenerating,
  generatingType = "render",
  onCreateVideo,
  onUpscale,
  onDownload,
  onCrop,
  renderName = "",
  onRenderNameChange,
  onEdit,
  onImageClick,
}: ResultPanelProps) {
  const [mode, setMode] = useState<Mode>("idle");
  const [editPrompt, setEditPrompt] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoDuration, setVideoDuration] = useState<5 | 10>(5);
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [showDurationMenu, setShowDurationMenu] = useState(false);
  const cameraMenuRef = useRef<HTMLButtonElement>(null);
  const cameraDropdownRef = useRef<HTMLDivElement>(null);
  const durationMenuRef = useRef<HTMLButtonElement>(null);
  const durationDropdownRef = useRef<HTMLDivElement>(null);

  const handleEdit = () => {
    if (editPrompt.trim() && onEdit) {
      onEdit(editPrompt);
      setEditPrompt("");
    }
  };

  const handleVideoCreate = () => {
    if (onCreateVideo) {
      onCreateVideo(videoPrompt, videoDuration);
      setVideoPrompt("");
    }
  };

  const handleCameraMovementSelect = (movement: string) => {
    // Add camera movement to video prompt
    const currentPrompt = videoPrompt.trim();
    const newPrompt = currentPrompt
      ? `${currentPrompt}, ${movement}`
      : movement;
    setVideoPrompt(newPrompt);
    setShowCameraMenu(false);
  };

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

  return (
    <div className="flex flex-col gap-0.5 h-full">
      {/* Section Label - Kompakter */}
      <h3 className="text-xs font-semibold text-pw-black/70 uppercase tracking-wide flex-shrink-0">
        Result
      </h3>

      {/* Split Layout: Image (left) + Controls (right) */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Left: Image Display */}
        <div className="flex-[3] min-w-0">
          <div className={`relative w-full h-full flex items-center justify-center bg-gradient-to-br from-pw-black/5 to-pw-black/10 rounded-lg ${
            !imageUrl && !isGenerating ? "border border-pw-black/20" : "p-3"
          }`}>
          {isGenerating ? (
            // Loading State - Larger
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-pw-accent animate-spin" />
              <div className="text-center">
                <p className="text-base font-medium text-pw-black/70">
                  {generatingType === "video" && "Video wird generiert..."}
                  {generatingType === "upscale" && "Bild wird upscaled..."}
                  {generatingType === "edit" && "Bild wird bearbeitet..."}
                  {generatingType === "render" && "Rendering wird generiert..."}
                </p>
                <p className="text-sm text-pw-black/50 mt-2">
                  30-60 Sekunden
                </p>
              </div>
            </div>
          ) : imageUrl ? (
            // Generated Media (Image or Video) with border - object-contain to show full result
            mediaType === "video" ? (
              <video
                src={imageUrl}
                onClick={onImageClick}
                className="max-w-full max-h-full object-contain border border-pw-black/20 rounded-lg cursor-pointer"
                autoPlay
                loop
                muted
                playsInline
                controls
              />
            ) : (
              <img
                src={imageUrl}
                alt="Generated render"
                onClick={onImageClick}
                className="max-w-full max-h-full object-contain border border-pw-black/20 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              />
            )
          ) : (
            // Empty State - Larger
            <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="p-4 bg-pw-black/5 rounded-xl">
                <Sparkles className="w-8 h-8 text-pw-black/30" />
              </div>
              <div>
                <p className="text-base font-medium text-pw-black/60">
                  Noch kein Rendering
                </p>
                <p className="text-sm text-pw-black/40 mt-2">
                  Lade ein Ausgangsbild hoch
                </p>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Right: Action Controls Panel */}
        {imageUrl && !isGenerating && (
          <div className="flex-[1] min-w-0 flex flex-col pr-2">
            {/* Scrollable Buttons Area */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-1 py-1 pb-2">
              {/* Create Video Button */}
              <button
                onClick={() => setMode(mode === "video" ? "idle" : "video")}
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
                                setVideoDuration(option.value as 5 | 10);
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
                              onClick={() => handleCameraMovementSelect(movement.value)}
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
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder="Beschreibe die Video-Animation..."
                      className="w-full px-2 py-1.5 pr-10 text-xs bg-white/80 border border-pw-black/10 rounded-lg outline-none focus:ring-2 focus:ring-pw-accent/50 transition-all resize-none h-[80px]"
                    />
                    {/* Send Button inside textarea */}
                    <button
                      onClick={handleVideoCreate}
                      className="absolute bottom-2 right-2 p-1.5 bg-pw-black hover:bg-pw-black/90 text-white rounded-md transition-all"
                      aria-label="Video erstellen"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Edit Image Button */}
              <button
                onClick={() => setMode(mode === "edit" ? "idle" : "edit")}
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
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="Änderungen beschreiben..."
                      className="w-full px-2 py-1.5 pr-10 text-xs bg-white/80 border border-pw-black/10 rounded-lg outline-none focus:ring-2 focus:ring-pw-accent/50 transition-all resize-none h-[100px]"
                    />
                    {/* Send Button inside textarea - black when has text */}
                    <button
                      onClick={handleEdit}
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

              {/* Upscale Button - Slides down when video/edit mode active */}
              <button
                onClick={onUpscale}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-pw-black text-xs font-medium rounded-lg border border-pw-black/20 hover:bg-pw-black/5 hover:shadow-lg transition-all hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4" />
                Upscale 2x
              </button>

              {/* Crop Button - Only show for images */}
              {mediaType === "image" && (
                <button
                  onClick={onCrop}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-pw-black text-xs font-medium rounded-lg border border-pw-black/20 hover:bg-pw-black/5 hover:shadow-lg transition-all hover:scale-[1.02]"
                >
                  <Crop className="w-4 h-4" />
                  Crop
                </button>
              )}

              {/* Download Button - Slides down when video/edit mode active */}
              <button
                onClick={onDownload}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-pw-black text-xs font-medium rounded-lg border border-pw-black/20 hover:bg-pw-black/5 hover:shadow-lg transition-all hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>

            {/* Render Name Input - Fixed at bottom */}
            <div className="flex-shrink-0 pt-2 px-1 bg-gradient-to-br from-white/80 to-white/70">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-medium text-pw-black/50 uppercase tracking-wide">
                  Name
                </label>
                <input
                  type="text"
                  value={renderName}
                  onChange={(e) => onRenderNameChange?.(e.target.value)}
                  placeholder="Rendering benennen..."
                  className="w-full px-2 py-1.5 text-xs bg-white/80 border border-pw-black/10 rounded-lg outline-none focus:ring-2 focus:ring-pw-accent/50 transition-all"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
