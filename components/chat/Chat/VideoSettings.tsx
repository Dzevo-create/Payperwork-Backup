"use client";

import { Clock, RectangleHorizontal, Sparkles, Video, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { VideoModel } from "./ChatHeader";
import {
  getDurationOptions,
  getAspectRatioOptions,
  hasFeature,
  KLING_MODES,
  KLING_CAMERA_MOVEMENTS,
} from "@/config/videoSettings";

export interface VideoSettingsType {
  duration: "4" | "5" | "8" | "10" | "12"; // Sora: 4,8,12 | Kling: 5,10
  aspectRatio: "16:9" | "9:16" | "1:1" | "original" | "auto"; // Sora: 16:9,9:16,auto | Kling: 16:9,9:16,1:1,original
  mode: "std" | "pro"; // Kling only
  cameraMovement?: "none" | "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "tilt_up" | "tilt_down"; // Kling only
  // Sora 2 specific
  audioEnabled?: boolean;
}

interface VideoSettingsProps {
  settings: VideoSettingsType;
  onSettingsChange: (settings: VideoSettingsType) => void;
  hasImageAttachment?: boolean;
  videoModel?: VideoModel; // NEW: To show different options based on model
}

type DropdownType = "duration" | "aspect" | "mode" | "camera" | null;

export default function VideoSettings({ settings, onSettingsChange, hasImageAttachment = false, videoModel = "kling" }: VideoSettingsProps) {
  // Get options based on video model using helper functions
  const durationOptions = getDurationOptions(videoModel);
  const aspectRatioOptions = getAspectRatioOptions(videoModel, hasImageAttachment);
  const modeOptions = hasFeature(videoModel, "modes") ? KLING_MODES : [];
  const showModeSelector = hasFeature(videoModel, "modes");
  const showAudioToggle = hasFeature(videoModel, "audio");
  const showCameraMovement = hasImageAttachment && hasFeature(videoModel, "cameraMovement");
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdown && !Object.values(dropdownRefs.current).some(ref => ref?.contains(e.target as Node))) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const getCurrentLabel = (type: string) => {
    switch (type) {
      case "duration":
        return `${settings.duration}s`;
      case "aspect":
        return settings.aspectRatio === "original" ? "Orig" : settings.aspectRatio;
      case "mode":
        return settings.mode === "std" ? "Std" : "Pro";
      case "camera":
        const camera = KLING_CAMERA_MOVEMENTS.find(c => c.value === (settings.cameraMovement || "none"));
        return camera?.label.split(" ")[0] || "Statisch";
      default:
        return "";
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5 flex-wrap">
      {/* Duration Card */}
      <div className="relative" ref={el => dropdownRefs.current["duration"] = el}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "duration" ? null : "duration")}
          className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "duration" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Clock className={`w-3.5 h-3.5 transition-colors ${openDropdown === "duration" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-xs font-medium text-pw-black/70">{getCurrentLabel("duration")}</span>
          <ChevronDown className={`w-3 h-3 text-pw-black/40 transition-transform duration-200 ${openDropdown === "duration" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "duration" && (
          <div className="absolute bottom-full mb-2 right-0 w-40 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {durationOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, duration: option.value as "5" | "10" });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.duration === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.duration === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Aspect Ratio Card */}
      <div className="relative" ref={el => dropdownRefs.current["aspect"] = el}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "aspect" ? null : "aspect")}
          className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "aspect" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <RectangleHorizontal className={`w-3.5 h-3.5 transition-colors ${openDropdown === "aspect" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-xs font-medium text-pw-black/70">{getCurrentLabel("aspect")}</span>
          <ChevronDown className={`w-3 h-3 text-pw-black/40 transition-transform duration-200 ${openDropdown === "aspect" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "aspect" && (
          <div className="absolute bottom-full mb-2 right-0 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {aspectRatioOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, aspectRatio: option.value as any });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.aspectRatio === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.aspectRatio === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quality Mode Card - Only for Kling */}
      {showModeSelector && (
        <div className="relative" ref={el => dropdownRefs.current["mode"] = el}>
          <button
            onClick={() => setOpenDropdown(openDropdown === "mode" ? null : "mode")}
            className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
              openDropdown === "mode" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 transition-colors ${openDropdown === "mode" ? "text-pw-accent" : "text-pw-black/40"}`} />
            <span className="text-xs font-medium text-pw-black/70">{getCurrentLabel("mode")}</span>
            <ChevronDown className={`w-3 h-3 text-pw-black/40 transition-transform duration-200 ${openDropdown === "mode" ? "rotate-180" : ""}`} />
          </button>

          {openDropdown === "mode" && (
            <div className="absolute bottom-full mb-2 right-0 w-44 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {modeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSettingsChange({ ...settings, mode: option.value as "std" | "pro" });
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    settings.mode === option.value
                      ? "bg-pw-accent text-white font-medium"
                      : "text-pw-black/70 hover:bg-pw-black/5"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {settings.mode === option.value && <span className="text-xs">✓</span>}
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Camera Control Card - Only for Kling Image2Video */}
      {showCameraMovement && (
        <div className="relative" ref={el => dropdownRefs.current["camera"] = el}>
          <button
            onClick={() => setOpenDropdown(openDropdown === "camera" ? null : "camera")}
            className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
              openDropdown === "camera" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
            }`}
          >
            <Video className={`w-3.5 h-3.5 transition-colors ${openDropdown === "camera" ? "text-pw-accent" : "text-pw-black/40"}`} />
            <span className="text-xs font-medium text-pw-black/70">{getCurrentLabel("camera")}</span>
            <ChevronDown className={`w-3 h-3 text-pw-black/40 transition-transform duration-200 ${openDropdown === "camera" ? "rotate-180" : ""}`} />
          </button>

          {openDropdown === "camera" && (
            <div className="absolute bottom-full mb-2 right-0 w-52 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {KLING_CAMERA_MOVEMENTS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSettingsChange({
                      ...settings,
                      cameraMovement: option.value as any,
                    });
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    (settings.cameraMovement || "none") === option.value
                      ? "bg-pw-accent text-white font-medium"
                      : "text-pw-black/70 hover:bg-pw-black/5"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {(settings.cameraMovement || "none") === option.value && <span className="text-xs">✓</span>}
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audio Toggle - Sora 2 Only */}
      {showAudioToggle && (
        <button
          onClick={() => onSettingsChange({ ...settings, audioEnabled: !settings.audioEnabled })}
          className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            settings.audioEnabled ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 transition-colors ${settings.audioEnabled ? "text-pw-accent" : "text-pw-black/40"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {settings.audioEnabled ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            )}
          </svg>
          <span className="text-xs font-medium text-pw-black/70">
            {settings.audioEnabled ? "Audio" : "Stumm"}
          </span>
        </button>
      )}
    </div>
  );
}
