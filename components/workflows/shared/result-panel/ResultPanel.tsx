/**
 * ResultPanel Component
 *
 * Right column panel (flex-1) displaying:
 * - Generated render result (16:9 aspect ratio)
 * - Action buttons: Create Video, Upscale 2x, Download
 * - Loading state during generation
 */

"use client";

import { useState } from "react";
import { ResultDisplay } from "./ResultDisplay";
import { VideoModePanel } from "./VideoModePanel";
import { EditModePanel } from "./EditModePanel";
import { ResultActions } from "./ResultActions";

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
  };

  return (
    <div className="flex flex-col gap-0.5 h-full">
      {/* Section Label - Kompakter */}
      <h3 className="text-xs font-semibold text-pw-black/70 uppercase tracking-wide flex-shrink-0">
        Result
      </h3>

      {/* Split Layout: Image (left) + Controls (right) */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Left: Image Display */}
        <ResultDisplay
          imageUrl={imageUrl}
          mediaType={mediaType}
          isGenerating={isGenerating}
          generatingType={generatingType}
          onImageClick={onImageClick}
        />

        {/* Right: Action Controls Panel */}
        {imageUrl && !isGenerating && (
          <div className="flex-[1] min-w-0 flex flex-col pr-2">
            {/* Scrollable Buttons Area */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-1 py-1 pb-2">
              {/* Video Mode Panel */}
              <VideoModePanel
                mode={mode}
                videoPrompt={videoPrompt}
                videoDuration={videoDuration}
                onModeToggle={() => setMode(mode === "video" ? "idle" : "video")}
                onVideoPromptChange={setVideoPrompt}
                onVideoDurationChange={setVideoDuration}
                onVideoCreate={handleVideoCreate}
                onCameraMovementSelect={handleCameraMovementSelect}
              />

              {/* Edit Mode Panel */}
              <EditModePanel
                mode={mode}
                editPrompt={editPrompt}
                onModeToggle={() => setMode(mode === "edit" ? "idle" : "edit")}
                onEditPromptChange={setEditPrompt}
                onEdit={handleEdit}
              />

              {/* Result Actions (Upscale, Crop, Download, Name Input) */}
              <ResultActions
                mediaType={mediaType}
                renderName={renderName}
                onUpscale={onUpscale}
                onCrop={onCrop}
                onDownload={onDownload}
                onRenderNameChange={onRenderNameChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
