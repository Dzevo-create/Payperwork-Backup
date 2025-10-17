'use client';

import { useState, useCallback } from 'react';

export interface ImageData {
  file: File | null;
  preview: string | null;
  originalPreview: string | null;
}

export interface InputData {
  sourceImage: ImageData;
  referenceImages: ImageData[];
}

export interface WorkflowState<TSettings> {
  prompt: string;
  setPrompt: (prompt: string) => void;

  settings: TSettings;
  setSettings: (settings: TSettings | ((prev: TSettings) => TSettings)) => void;

  inputData: InputData;
  setInputData: (data: InputData | ((prev: InputData) => InputData)) => void;

  resultImage: string | null;
  setResultImage: (image: string | null) => void;

  resultMediaType: 'image' | 'video';
  setResultMediaType: (type: 'image' | 'video') => void;

  originalPrompt: string;
  setOriginalPrompt: (prompt: string) => void;

  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;

  progress: number;
  setProgress: (progress: number) => void;

  resetState: () => void;
}

const DEFAULT_INPUT_DATA: InputData = {
  sourceImage: { file: null, preview: null, originalPreview: null },
  referenceImages: [],
};

/**
 * Shared workflow state hook
 * Manages basic state for all workflows: prompt, settings, input data, result
 */
export function useWorkflowState<TSettings>(
  defaultSettings: TSettings
): WorkflowState<TSettings> {
  const [prompt, setPrompt] = useState("");
  const [settings, setSettings] = useState<TSettings>(defaultSettings);
  const [inputData, setInputData] = useState<InputData>(DEFAULT_INPUT_DATA);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultMediaType, setResultMediaType] = useState<'image' | 'video'>('image');
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const resetState = useCallback(() => {
    setPrompt("");
    setSettings(defaultSettings);
    setInputData(DEFAULT_INPUT_DATA);
    setResultImage(null);
    setResultMediaType('image');
    setOriginalPrompt("");
    setIsGenerating(false);
    setProgress(0);
  }, [defaultSettings]);

  return {
    prompt,
    setPrompt,
    settings,
    setSettings,
    inputData,
    setInputData,
    resultImage,
    setResultImage,
    resultMediaType,
    setResultMediaType,
    originalPrompt,
    setOriginalPrompt,
    isGenerating,
    setIsGenerating,
    progress,
    setProgress,
    resetState,
  };
}
