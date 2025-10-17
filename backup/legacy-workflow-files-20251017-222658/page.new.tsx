"use client";

import { useState, useCallback } from "react";
import { ChatSidebar } from "@/components/chat/Sidebar/ChatSidebar";
import { InputsPanel } from "@/components/workflows/InputsPanel";
import { ResultPanel } from "@/components/workflows/ResultPanel";
import { RenderPromptInput } from "@/components/workflows/RenderPromptInput";
import { RecentGenerations } from "@/components/workflows/RecentGenerations";
import { RenderLightbox } from "@/components/workflows/RenderLightbox";
import ImageCropModal from "@/components/chat/ImageCrop/ImageCropModal";
import { DEFAULT_RENDER_SETTINGS } from "@/types/workflows/renderSettings";
import {
  useWorkflowState,
  useRecentGenerations,
  useWorkflowLightbox,
  useImageCrop,
  usePromptEnhancer,
  useSketchToRender,
  useRenderEdit,
  useUpscale,
  type CropImageType
} from "@/hooks/workflows";
import { getUserIdSync } from "@/lib/supabase/insert-helper";
import { uploadBase64Image } from "@/lib/supabase-library";
import { workflowLogger } from '@/lib/logger';

/**
 * Sketch-to-Render Workflow Page (Refactored with Composition)
 * Uses shared hooks and WorkflowLayout for better code reuse
 */
export default function SketchToRenderPage() {
  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [renderName, setRenderName] = useState("");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  // Shared hooks
  const workflowState = useWorkflowState(DEFAULT_RENDER_SETTINGS);
  const generations = useRecentGenerations('sketch-to-render');
  const lightbox = useWorkflowLightbox();
  const imageCrop = useImageCrop();

  // Helper function to save generation to database
  const saveGenerationToDb = useCallback(async (generation: {
    url: string;
    type: "render" | "video" | "upscale";
    name: string;
    prompt?: string;
    sourceType?: "original" | "from_render" | "from_video";
    parentId?: string;
    settings?: any;
    sourceImage?: string;
  }) => {
    try {
      const userId = getUserIdSync();
      workflowLogger.debug('[SaveGeneration] Attempting to save:', {
        userId,
        type: generation.type,
        name: generation.name,
        hasUrl: !!generation.url,
        hasSourceImage: !!generation.sourceImage
      });

      const response = await fetch("/api/sketch-to-render/save-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          url: generation.url,
          type: generation.type,
          name: generation.name,
          prompt: generation.prompt,
          model: generation.type === "video" ? "runway-gen4-turbo" : "nano-banana",
          sourceType: generation.sourceType || "original",
          parentId: generation.parentId,
          settings: generation.settings || {},
          sourceImage: generation.sourceImage || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save generation");
      }

      const data = await response.json();
      workflowLogger.debug('[SaveGeneration] Saved successfully:', data);

      // Add to recent generations
      generations.setRecentGenerations((prev: any[]) => [
        {
          id: data.generation.id,
          imageUrl: generation.url,
          timestamp: new Date(),
          prompt: generation.prompt,
          name: generation.name,
          type: generation.type,
          sourceType: generation.sourceType,
          settings: generation.settings,
          sourceImageUrl: generation.sourceImage,
        },
        ...prev,
      ]);
    } catch (error) {
      workflowLogger.error('[Sketch-to-Render] Error saving generation to DB:', error as Error);
    }
  }, [generations]);

  // Generate unique render name
  const generateRenderName = useCallback(() => {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0]?.replace(/:/g, '-') || 'unknown';
    return `render_${date}_${time}`;
  }, []);

  // Success handler for sketch-to-render
  const handleSketchToRenderSuccess = useCallback(async (result: { imageUrl: string; prompt?: string; settings?: any }) => {
    const resultUrl = result.imageUrl;

    workflowState.setResultImage(resultUrl);
    workflowState.setResultMediaType('image'); // Sketch-to-render always produces images initially
    workflowState.setIsGenerating(false);
    setIsGeneratingVideo(false);

    // Upload source image to storage
    let storageSourceUrl: string | null = null;
    if (workflowState.inputData.sourceImage.preview) {
      try {
        const sourceFileName = `${generateRenderName()}_source`;
        const sourceUploadResult = await uploadBase64Image(
          workflowState.inputData.sourceImage.preview,
          sourceFileName
        );
        if (sourceUploadResult) {
          storageSourceUrl = sourceUploadResult;
        }
      } catch (error) {
        workflowLogger.error('[Upload] Error uploading source image:', error as Error);
      }
    }

    // Save to database
    await saveGenerationToDb({
      url: resultUrl,
      type: 'render', // Always 'render' for initial sketch-to-render
      name: renderName || generateRenderName(),
      prompt: workflowState.originalPrompt,
      sourceType: "original",
      settings: workflowState.settings,
      sourceImage: storageSourceUrl || undefined,
    });
  }, [workflowState, renderName, generateRenderName, saveGenerationToDb]);

  // Success handler for video generation
  const handleVideoSuccess = useCallback(async (videoUrl: string) => {
    workflowState.setResultImage(videoUrl);
    workflowState.setResultMediaType('video');
    setIsGeneratingVideo(false);

    // Upload previous result (image) as source
    let storagePreviousUrl: string | null = null;
    if (workflowState.resultImage) {
      try {
        const previousFileName = `${generateRenderName()}_previous`;
        const uploadResult = await uploadBase64Image(workflowState.resultImage, previousFileName);

        if (uploadResult) {
          storagePreviousUrl = uploadResult;
        }
      } catch (error) {
        workflowLogger.error('[Upload] Error uploading previous result:', error as Error);
      }
    }

    // Save video to database
    await saveGenerationToDb({
      url: videoUrl,
      type: "video",
      name: `${renderName || generateRenderName()}_video`,
      prompt: "", // No prompt for video
      sourceType: "from_render",
      settings: workflowState.settings,
      sourceImage: storagePreviousUrl || undefined,
    });
  }, [workflowState, renderName, generateRenderName, saveGenerationToDb]);

  // Success handler for render edit
  const handleEditSuccess = useCallback(async (resultUrl: string) => {
    workflowState.setResultImage(resultUrl);
    workflowState.setResultMediaType('image');
    workflowState.setIsGenerating(false);

    // Upload previous result as source
    let storagePreviousUrl: string | null = null;
    if (workflowState.resultImage) {
      try {
        const previousFileName = `${generateRenderName()}_previous`;
        const uploadResult = await uploadBase64Image(
          workflowState.resultImage,
          previousFileName
        );
        if (uploadResult) {
          storagePreviousUrl = uploadResult;
        }
      } catch (error) {
        workflowLogger.error('[Upload] Error uploading previous result:', error as Error);
      }
    }

    // Save edited render to database
    await saveGenerationToDb({
      url: resultUrl,
      type: "render",
      name: `${renderName || generateRenderName()}_edit`,
      prompt: workflowState.prompt,
      sourceType: "from_render",
      settings: workflowState.settings,
      sourceImage: storagePreviousUrl || undefined,
    });
  }, [workflowState, renderName, generateRenderName, saveGenerationToDb]);

  // Success handler for upscale
  const handleUpscaleSuccess = useCallback(async (resultUrl: string) => {
    workflowState.setResultImage(resultUrl);
    workflowState.setIsGenerating(false);

    // Upload previous result as source
    let storagePreviousUrl: string | null = null;
    if (workflowState.resultImage) {
      try {
        const previousFileName = `${generateRenderName()}_previous`;
        const uploadResult = await uploadBase64Image(
          workflowState.resultImage,
          previousFileName
        );
        if (uploadResult) {
          storagePreviousUrl = uploadResult;
        }
      } catch (error) {
        workflowLogger.error('[Upload] Error uploading previous result:', error as Error);
      }
    }

    // Save upscaled image to database
    await saveGenerationToDb({
      url: resultUrl,
      type: "upscale",
      name: `${renderName || generateRenderName()}_upscale`,
      prompt: "", // No prompt for upscale
      sourceType: "from_render",
      settings: workflowState.settings,
      sourceImage: storagePreviousUrl || undefined,
    });
  }, [workflowState, renderName, generateRenderName, saveGenerationToDb]);

  // Workflow-specific hooks
  const { enhancePrompt, isEnhancing } = usePromptEnhancer({
    onSuccess: (enhancedPrompt) => {
      workflowState.setPrompt(enhancedPrompt);
    },
    onError: (error) => {
      alert(`Prompt Enhancement fehlgeschlagen: ${error}`);
    },
  });

  const { generate, isGenerating } = useSketchToRender({
    onSuccess: handleSketchToRenderSuccess,
    onError: (error) => {
      alert(`Generierung fehlgeschlagen: ${error}`);
      workflowState.setIsGenerating(false);
    },
  });

  const { editRender, isEditing } = useRenderEdit({
    onSuccess: handleEditSuccess,
    onError: (error) => {
      alert(`Edit fehlgeschlagen: ${error}`);
      workflowState.setIsGenerating(false);
    },
  });

  const { upscale, isUpscaling } = useUpscale({
    onSuccess: handleUpscaleSuccess,
    onError: (error) => {
      alert(`Upscaling fehlgeschlagen: ${error}`);
    },
  });

  // Workflow handlers
  const handleEnhancePrompt = async () => {
    await enhancePrompt(
      workflowState.prompt,
      workflowState.inputData.sourceImage,
      workflowState.settings,
      workflowState.inputData.referenceImages[0]
    );
  };

  const handleGenerate = async () => {
    if (!workflowState.inputData.sourceImage.file) {
      alert("Bitte lade zuerst ein Ausgangsbild hoch");
      return;
    }

    if (!workflowState.prompt.trim()) {
      alert("Bitte gib einen Prompt ein");
      return;
    }

    workflowState.setOriginalPrompt(workflowState.prompt);
    workflowState.setIsGenerating(true);
    setRenderName(generateRenderName());

    await generate(
      workflowState.prompt,
      workflowState.inputData.sourceImage,
      workflowState.settings,
      workflowState.inputData.referenceImages[0]
    );
  };

  const handleGenerateVideo = async () => {
    if (!workflowState.resultImage) {
      alert("Es muss zuerst ein Bild generiert werden");
      return;
    }

    setIsGeneratingVideo(true);

    try {
      const response = await fetch("/api/generate-runway-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: workflowState.resultImage,
          prompt: workflowState.prompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Video generation failed");
      }

      const data = await response.json();
      await handleVideoSuccess(data.videoUrl);
    } catch (error) {
      workflowLogger.error('[Video] Generation failed:', error as Error);
      alert("Video-Generierung fehlgeschlagen");
      setIsGeneratingVideo(false);
    }
  };

  const handleEdit = async () => {
    if (!workflowState.resultImage || !workflowState.prompt.trim()) {
      alert("Bitte gib einen Prompt ein");
      return;
    }

    workflowState.setIsGenerating(true);
    await editRender(workflowState.prompt, workflowState.resultImage, workflowState.originalPrompt);
  };

  const handleUpscale = async () => {
    if (!workflowState.resultImage) {
      alert("Es muss zuerst ein Bild generiert werden");
      return;
    }

    await upscale(workflowState.resultImage);
  };

  const handleDownload = async (url: string | null, filename?: string, mediaType?: 'image' | 'video') => {
    const urlToDownload = url || workflowState.resultImage;

    if (!urlToDownload || typeof urlToDownload !== 'string') {
      workflowLogger.error('[Download] No valid URL to download', new Error(`Invalid URL: ${typeof urlToDownload}`));
      return;
    }

    try {
      const response = await fetch(urlToDownload);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;

      const actualMediaType = mediaType || workflowState.resultMediaType;
      const extension = actualMediaType === 'video' ? 'mp4' : 'png';
      link.download = filename || `render_${Date.now()}.${extension}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      workflowLogger.error('[Download] Download failed:', error as Error);
      alert('Download fehlgeschlagen');
    }
  };

  const handleDeleteGeneration = async (id: string) => {
    if (confirm("Möchtest du diese Generierung wirklich löschen?")) {
      try {
        await generations.deleteGeneration(id);
      } catch (error) {
        alert("Fehler beim Löschen der Generierung");
      }
    }
  };

  // Load generation from RecentGenerations for editing
  const handleLoadForEdit = (gen: any) => {
    const mediaType = gen.type === "video" ? "video" : "image";
    workflowState.setResultImage(gen.imageUrl);
    workflowState.setResultMediaType(mediaType);
    setRenderName(gen.name || "");
    workflowState.setOriginalPrompt(gen.prompt || "");
    // Scroll to top to show ResultPanel
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Load generation from RecentGenerations for video creation
  const handleLoadForVideo = (gen: any) => {
    const mediaType = gen.type === "video" ? "video" : "image";
    workflowState.setResultImage(gen.imageUrl);
    workflowState.setResultMediaType(mediaType);
    setRenderName(gen.name || "");
    workflowState.setOriginalPrompt(gen.prompt || "");
    // Scroll to top to show ResultPanel
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Upscale handler for RecentGenerations
  const handleUpscaleFromGallery = async (gen: any) => {
    const imageToUpscale = gen.imageUrl;

    if (!imageToUpscale) {
      workflowLogger.error('[Upscale] No image to upscale', new Error('No imageUrl in generation'));
      return;
    }

    workflowLogger.debug('[Upscale] Starting upscale for image from gallery', {
      urlPreview: imageToUpscale.substring(0, 50) + "..."
    });

    // Use default upscale settings (good quality)
    await upscale(imageToUpscale, {
      sharpen: 50,
      smart_grain: 7,
      ultra_detail: 30,
    });
  };

  // Image crop handlers
  const handleCropImage = (image: string, type: 'source' | 'reference', index?: number) => {
    imageCrop.openCropModal(image, type, index);
  };

  const handleCropComplete = (croppedImage: string) => {
    imageCrop.handleCropComplete(croppedImage, (type: CropImageType, index: number | null, image: string) => {
      if (type === 'source') {
        workflowState.setInputData(prev => ({
          ...prev,
          sourceImage: {
            file: prev.sourceImage.file,
            preview: image,
            originalPreview: prev.sourceImage.originalPreview || prev.sourceImage.preview,
          }
        }));
      } else if (type === 'reference' && index !== null) {
        workflowState.setInputData(prev => {
          const newReferenceImages = [...prev.referenceImages];
          const current = newReferenceImages[index];
          newReferenceImages[index] = {
            file: current?.file || null,
            preview: image,
            originalPreview: current?.originalPreview || current?.preview || null,
          };
          return { ...prev, referenceImages: newReferenceImages };
        });
      }
    });
  };

  return (
    <div className="h-screen bg-pw-dark overflow-hidden px-0 sm:px-1 md:px-2 py-0 sm:py-1">
      <div className="h-full flex gap-0 sm:gap-1 max-w-none mx-auto">
        {/* Sidebar */}
        <ChatSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        {/* Main Content Area - Fixed height, no overflow */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-lg border border-pw-black/10">
          {/* Header */}
          <div className="px-4 sm:px-6 py-2 bg-transparent flex-shrink-0">
            <h1 className="text-base font-semibold text-pw-black/80">Sketch to Render</h1>
          </div>

          {/* Content - Fixed height with internal scrolling */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 pt-3 flex flex-col gap-6 overflow-hidden">
              {/* 2-Column Layout: Inputs (left, 380px) | Result + Prompt (right, flex-1) */}
              <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                {/* Left Column: Inputs Panel (380px fixed) */}
                <div className="lg:w-[380px] flex-shrink-0 h-full overflow-hidden">
                  <div className="h-full p-4 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-lg border border-pw-black/10 rounded-xl">
                    <InputsPanel
                      data={workflowState.inputData}
                      onChange={workflowState.setInputData}
                      onCropSource={() => {
                        if (workflowState.inputData.sourceImage.preview) {
                          handleCropImage(workflowState.inputData.sourceImage.preview, 'source');
                        }
                      }}
                      onCropReference={(index) => {
                        const refImage = workflowState.inputData.referenceImages[index];
                        if (refImage?.preview) {
                          handleCropImage(refImage.preview, 'reference', index);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Right Column: Result + Prompt + Gallery (flex-1) */}
                <div className="flex-1 h-full overflow-hidden">
                  <div className="h-full p-4 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-lg border border-pw-black/10 rounded-xl overflow-y-auto">
                    <div className="h-full flex flex-col gap-2">
                      {/* Result Panel */}
                      <div className="flex-[2.5] min-h-0 overflow-visible">
                        <ResultPanel
                          imageUrl={workflowState.resultImage}
                          mediaType={workflowState.resultMediaType}
                          isGenerating={isGenerating || isEditing || isUpscaling}
                          generatingType={
                            isGeneratingVideo ? "video"
                            : isUpscaling ? "upscale"
                            : isEditing ? "edit"
                            : "render"
                          }
                          onCreateVideo={handleGenerateVideo}
                          onUpscale={handleUpscale}
                          onDownload={() => handleDownload(workflowState.resultImage || null, undefined, workflowState.resultMediaType)}
                          onEdit={handleEdit}
                          renderName={renderName}
                          onRenderNameChange={setRenderName}
                        />
                      </div>

                      {/* Prompt Input with Settings */}
                      <div className="flex-shrink-0 min-h-0 flex flex-col">
                        <RenderPromptInput
                          prompt={workflowState.prompt}
                          onPromptChange={workflowState.setPrompt}
                          onGenerate={handleGenerate}
                          onEnhancePrompt={handleEnhancePrompt}
                          isGenerating={isGenerating}
                          isEnhancing={isEnhancing}
                          disabled={false}
                          settings={workflowState.settings}
                          onSettingsChange={workflowState.setSettings}
                        />
                      </div>

                      {/* Recent Generations Gallery */}
                      <div className="flex-[1.5] min-h-0 overflow-hidden">
                        <RecentGenerations
                          generations={generations.recentGenerations}
                          onSelect={(gen) => {
                            const index = generations.recentGenerations.findIndex((g) => g.id === gen.id);
                            lightbox.openLightbox(gen, index);
                          }}
                          onDownload={(gen) => handleDownload(gen.imageUrl, gen.name || undefined, gen.type === 'video' ? 'video' : 'image')}
                          onDelete={(id) => handleDeleteGeneration(id)}
                          onEdit={handleLoadForEdit}
                          onCreateVideo={handleLoadForVideo}
                          onUpscale={handleUpscaleFromGallery}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overlays */}
        {/* Lightbox */}
        {lightbox.lightboxOpen && lightbox.lightboxItem && (
          <RenderLightbox
            isOpen={lightbox.lightboxOpen}
            item={lightbox.lightboxItem}
            onClose={lightbox.closeLightbox}
            onNavigate={(direction) => {
              const currentIndex = lightbox.lightboxIndex;
              const newIndex = direction === 'next'
                ? Math.min(currentIndex + 1, generations.recentGenerations.length - 1)
                : Math.max(currentIndex - 1, 0);
              lightbox.setLightboxIndex(newIndex);
              lightbox.openLightbox(generations.recentGenerations[newIndex], newIndex);
            }}
            hasNext={lightbox.lightboxIndex < generations.recentGenerations.length - 1}
            hasPrev={lightbox.lightboxIndex > 0}
            onDownload={(item) => handleDownload(item.imageUrl, item.name || undefined, item.type === 'video' ? 'video' : 'image')}
          />
        )}

        {/* Image Crop Modal */}
        {imageCrop.cropModalOpen && imageCrop.imageToCrop && (
          <ImageCropModal
            imageUrl={imageCrop.imageToCrop}
            isOpen={imageCrop.cropModalOpen}
            onClose={imageCrop.closeCropModal}
            onCropComplete={handleCropComplete}
          />
        )}
      </div>
    </div>
  );
}
