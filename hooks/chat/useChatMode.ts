/**
 * useChatMode Hook
 *
 * Manages chat mode (chat/image/video), model selection, and related settings.
 * Extracted from ChatArea.tsx for better separation of concerns.
 */

import { useState, useEffect } from "react";
import { AIModel, VideoModel, GPTModel } from "@/components/chat/Chat/ChatHeader";
import { VideoSettingsType } from "@/components/chat/Chat/VideoSettings";
import { ImageSettingsType } from "@/components/chat/Chat/ImageSettings";
import { chatLogger } from '@/lib/logger';
import {
  DEFAULT_CHAT_MODE,
  DEFAULT_AI_MODEL,
  DEFAULT_GPT_MODEL,
  DEFAULT_VIDEO_MODEL,
  DEFAULT_VIDEO_SETTINGS,
  DEFAULT_IMAGE_SETTINGS,
  VIDEO_DURATIONS,
  VIDEO_DEFAULT_DURATIONS,
} from "@/config/chatArea";

export function useChatMode() {
  const [mode, setMode] = useState<"chat" | "image" | "video">(DEFAULT_CHAT_MODE);
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_AI_MODEL);
  const [selectedGPTModel, setSelectedGPTModel] = useState<GPTModel>(DEFAULT_GPT_MODEL);
  const [selectedVideoModel, setSelectedVideoModel] = useState<VideoModel>(DEFAULT_VIDEO_MODEL);
  const [videoSettings, setVideoSettings] = useState<VideoSettingsType>(DEFAULT_VIDEO_SETTINGS);
  const [imageSettings, setImageSettings] = useState<ImageSettingsType>(DEFAULT_IMAGE_SETTINGS);
  const [hasImageAttachment, setHasImageAttachment] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Update video settings when video model changes
  useEffect(() => {
    const validDurations = VIDEO_DURATIONS[selectedVideoModel];
    const defaultDuration = VIDEO_DEFAULT_DURATIONS[selectedVideoModel];

    if (!(validDurations as readonly string[]).includes(videoSettings.duration)) {
      setVideoSettings(prev => ({ ...prev, duration: defaultDuration }));
    }
  }, [selectedVideoModel, videoSettings.duration]);

  // Request notification permission when entering video mode
  useEffect(() => {
    if (mode === 'video' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((_permission) => {
          chatLogger.debug('Notification permission:');
        });
      }
    }
  }, [mode]);

  return {
    // State
    mode,
    selectedModel,
    selectedGPTModel,
    selectedVideoModel,
    videoSettings,
    imageSettings,
    hasImageAttachment,
    inputValue,

    // Setters
    setMode,
    setSelectedModel,
    setSelectedGPTModel,
    setSelectedVideoModel,
    setVideoSettings,
    setImageSettings,
    setHasImageAttachment,
    setInputValue,
  };
}
