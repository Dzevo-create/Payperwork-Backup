/**
 * Generic Workflow Page Component
 *
 * This component provides a reusable structure for all workflow pages
 * (sketch-to-render, branding, etc.) by accepting a configuration object
 * that defines workflow-specific behavior.
 *
 * Benefits:
 * - Eliminates ~97% code duplication between workflow pages
 * - Single source of truth for workflow UI structure
 * - Easier to maintain and add new features
 * - Type-safe with TypeScript
 */

"use client";

import { useState, useCallback, ReactNode } from "react";
import { ChatSidebar } from "@/components/chat/Sidebar/ChatSidebar";
import { InputsPanel } from "@/components/workflows/InputsPanel";
import { ResultPanel } from "@/components/workflows/ResultPanel";
import { RecentGenerations } from "@/components/workflows/RecentGenerations";
import { RenderLightbox } from "@/components/workflows/RenderLightbox";
import ImageCropModal from "@/components/chat/ImageCrop/ImageCropModal";
import { useChatStore } from "@/store/chatStore.supabase";
import { useRouter } from "next/navigation";
import { workflowLogger } from '@/lib/logger';

// Hooks
import {
  useWorkflowState,
  useRecentGenerations,
  useWorkflowLightbox,
  useImageCrop,
  useWorkflowHandlers
} from "@/hooks/workflows";

/**
 * Workflow generation result interface
 */
export interface WorkflowGenerationResult {
  imageUrl: string;
  id?: string;
  timestamp?: Date;
  prompt?: string;
  settings?: Record<string, unknown>;
}

/**
 * Workflow Configuration Interface
 */
export interface WorkflowPageConfig<TSettings = Record<string, unknown>> {
  /** Workflow name (e.g. "Sketch to Render") */
  name: string;

  /** API endpoint prefix (e.g. "sketch-to-render") */
  apiEndpoint: string;

  /** Default settings for this workflow */
  defaultSettings: TSettings;

  /** Prompt input component */
  PromptInputComponent: React.ComponentType<{
    prompt: string;
    onPromptChange: (value: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    onEnhancePrompt?: () => void;
    isEnhancing?: boolean;
    disabled?: boolean;
    settings: TSettings;
    onSettingsChange: (settings: TSettings) => void;
  }>;

  /** Hooks */
  hooks: {
    useGenerate: () => {
      generate: (params: {
        prompt: string;
        settings: TSettings;
        sourceImage: string | null;
        referenceImages: (string | null)[];
      }) => Promise<WorkflowGenerationResult | null>;
      isGenerating: boolean;
      error: string | null;
      progress: number;
    };
    useEnhance?: (sourceImage: string | null, settings: TSettings) => {
      enhance: (prompt: string) => Promise<string>;
      isEnhancing: boolean;
      error: string | null;
    };
    useEdit?: () => {
      edit: (params: {
        editPrompt: string;
        currentImageUrl: string;
        originalPrompt: string;
      }) => Promise<WorkflowGenerationResult | null>;
      isEditing: boolean;
      error: string | null;
    };
    useUpscale?: () => {
      upscale: (params: { imageUrl: string }) => Promise<string | null>;
      isUpscaling: boolean;
      error: string | null;
    };
  };

  /** Generate filename for this workflow */
  generateFilename: () => string;

  /** Additional workflow-specific content (optional) */
  renderAdditionalContent?: (context: {
    resultImage: string | null;
    resultMediaType: "image" | "video";
    renderName: string;
    originalPrompt: string;
    settings: TSettings;
  }) => ReactNode;
}

interface WorkflowPageProps<TSettings = Record<string, unknown>> {
  config: WorkflowPageConfig<TSettings>;
}

export function WorkflowPage<TSettings = Record<string, unknown>>({ config }: WorkflowPageProps<TSettings>) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [renderName, setRenderName] = useState("");
  const [currentSourceImage, setCurrentSourceImage] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  // Use all workflow hooks
  const workflowState = useWorkflowState<TSettings>(config.defaultSettings);
  const generations = useRecentGenerations(config.apiEndpoint as 'sketch-to-render' | 'branding');
  const lightbox = useWorkflowLightbox();
  const crop = useImageCrop();

  // Get hooks from config
  const { generate, isGenerating } = config.hooks.useGenerate();
  const enhanceHook = config.hooks.useEnhance?.(workflowState.inputData.sourceImage.preview, workflowState.settings);
  const editHook = config.hooks.useEdit?.();
  const upscaleHook = config.hooks.useUpscale?.();

  // Get all complex handlers from hook
  const handlers = useWorkflowHandlers(
    {
      apiEndpoint: config.apiEndpoint,
      workflowName: config.name,
      generateFilename: config.generateFilename,
    },
    workflowState,
    generations.setRecentGenerations,
    currentSourceImage,
    setCurrentSourceImage,
    renderName,
    setRenderName,
    setIsGeneratingVideo,
    config.defaultSettings
  );

  // Chat Store
  const conversations = useChatStore((state) => state.conversations);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const addConversation = useChatStore((state) => state.addConversation);
  const setCurrentConversationId = useChatStore((state) => state.setCurrentConversationId);
  const setMessages = useChatStore((state) => state.setMessages);

  // Chat handlers
  const handleLoadConversation = (convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      setCurrentConversationId(convId);
      router.push(`/chat?convId=${convId}`);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    router.push("/chat");
  };

  // Workflow action handlers
  const handleEnhancePrompt = async () => {
    if (!enhanceHook) return;
    const enhanced = await enhanceHook.enhance(workflowState.prompt);
    if (enhanced) {
      workflowState.setPrompt(enhanced);
    }
  };

  const handleGenerate = async () => {
    if (!workflowState.inputData.sourceImage.file) {
      alert("Bitte lade zuerst ein Ausgangsbild hoch");
      return;
    }

    // Note: Prompt is optional - image-only generation is allowed
    // The AI will analyze the image and generate based on settings

    const result = await generate({
      prompt: workflowState.prompt,
      settings: workflowState.settings,
      sourceImage: workflowState.inputData.sourceImage.preview,
      referenceImages: workflowState.inputData.referenceImages.map(img => img.preview).filter(Boolean),
    });

    if (result) {
      await handlers.handleGenerateSuccess(result);
    }
  };

  const handleEdit = async (editPrompt: string) => {
    if (!workflowState.resultImage || !editPrompt.trim() || !editHook) return;
    const result = await editHook.edit({
      editPrompt,
      currentImageUrl: workflowState.resultImage,
      originalPrompt: workflowState.originalPrompt,
    });
    if (result) {
      await handlers.handleEditSuccess(result);
    }
  };

  const handleUpscale = async (gen?: { imageUrl: string }) => {
    const imageToUpscale = gen?.imageUrl || workflowState.resultImage;
    if (!imageToUpscale || !upscaleHook) {
      workflowLogger.error('[Upscale] No image to upscale');
      return;
    }

    const result = await upscaleHook.upscale({ imageUrl: imageToUpscale });
    if (result) {
      await handlers.handleUpscaleSuccess(result);
    }
  };

  // Lightbox handlers
  const handleResultClick = useCallback(() => {
    if (workflowState.resultImage) {
      const index = generations.recentGenerations.findIndex((gen) => gen.imageUrl === workflowState.resultImage);
      if (index !== -1) {
        lightbox.openLightbox(generations.recentGenerations[index], index);
      } else {
        lightbox.openLightbox(
          {
            id: "current",
            imageUrl: workflowState.resultImage,
            timestamp: new Date(),
            name: renderName,
          },
          -1
        );
      }
    }
  }, [workflowState.resultImage, renderName, generations.recentGenerations, lightbox]);

  const handleNavigateLightbox = useCallback((direction: "prev" | "next") => {
    const newIndex = direction === "prev" ? lightbox.lightboxIndex - 1 : lightbox.lightboxIndex + 1;
    if (newIndex >= 0 && newIndex < generations.recentGenerations.length) {
      lightbox.setLightboxIndex(newIndex);
      lightbox.openLightbox(generations.recentGenerations[newIndex], newIndex);
    }
  }, [lightbox, generations.recentGenerations]);

  // Crop handlers
  const handleCropSource = useCallback(() => {
    const imageToUse = workflowState.inputData.sourceImage.originalPreview || workflowState.inputData.sourceImage.preview;
    if (imageToUse) {
      crop.openCropModal(imageToUse, 'source');
    }
  }, [workflowState.inputData.sourceImage, crop]);

  const handleCropReference = useCallback((index: number) => {
    const refImage = workflowState.inputData.referenceImages[index];
    const imageToUse = refImage?.originalPreview || refImage?.preview;
    if (imageToUse) {
      crop.openCropModal(imageToUse, 'reference', index);
    }
  }, [workflowState.inputData.referenceImages, crop]);

  const handleCropResult = useCallback(() => {
    if (workflowState.resultImage) {
      crop.openCropModal(workflowState.resultImage, 'source');
    }
  }, [workflowState.resultImage, crop]);

  const handleCropComplete = useCallback(async (croppedImageUrl: string) => {
    const response = await fetch(croppedImageUrl);
    const blob = await response.blob();
    const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });

    if (crop.cropImageType === 'source') {
      workflowState.setInputData((prev) => ({
        ...prev,
        sourceImage: {
          file,
          preview: croppedImageUrl,
          originalPreview: prev.sourceImage.originalPreview || prev.sourceImage.preview
        },
      }));
    } else if (crop.cropImageType === 'reference' && crop.cropReferenceIndex !== null) {
      workflowState.setInputData((prev) => {
        const newReferenceImages = [...prev.referenceImages];
        const currentRef = newReferenceImages[crop.cropReferenceIndex!];
        newReferenceImages[crop.cropReferenceIndex!] = {
          file,
          preview: croppedImageUrl,
          originalPreview: currentRef?.originalPreview || currentRef?.preview || null
        };
        return {
          ...prev,
          referenceImages: newReferenceImages,
        };
      });
    } else if (crop.cropImageType === null) {
      // Cropping the result image - replace result image
      workflowState.setResultImage(croppedImageUrl);
    }

    crop.closeCropModal();
  }, [crop, workflowState]);

  const { PromptInputComponent } = config;

  return (
    <div className="h-screen bg-pw-dark overflow-hidden px-0 sm:px-1 md:px-2 py-0 sm:py-1">
      <div className="h-full flex gap-0 sm:gap-1 max-w-none mx-auto">
        {/* Sidebar */}
        <ChatSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onNewChat={handleNewChat}
          conversations={conversations}
          currentConversationId={currentConversationId}
          onLoadConversation={handleLoadConversation}
          onDeleteConversation={deleteConversation}
          onDuplicateConversation={(id) => {
            const conv = conversations.find((c) => c.id === id);
            if (conv) {
              addConversation({
                ...conv,
                id: Date.now().toString(),
                title: `${conv.title} (Kopie)`,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }}
          onRenameConversation={(id, title) => updateConversation(id, { title })}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-lg border border-pw-black/10">
          {/* Header */}
          <div className="px-4 sm:px-6 py-2 bg-transparent flex-shrink-0">
            <h1 className="text-base font-semibold text-pw-black/80">{config.name}</h1>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 pt-3 flex flex-col gap-6 overflow-hidden">
              {/* 2-Column Layout: Inputs (left, 380px) | Result + Prompt + Gallery (right, flex-1) */}
              <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                {/* Left Column: Inputs Panel (380px fixed) */}
                <div className="lg:w-[380px] flex-shrink-0 h-full overflow-hidden">
                  <div className="h-full p-4 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-lg border border-pw-black/10 rounded-xl">
                    <InputsPanel
                      data={workflowState.inputData}
                      onChange={workflowState.setInputData}
                      onCropSource={handleCropSource}
                      onCropReference={handleCropReference}
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
                          isGenerating={isGenerating || editHook?.isEditing || upscaleHook?.isUpscaling || isGeneratingVideo}
                          generatingType={
                            isGeneratingVideo ? "video"
                            : upscaleHook?.isUpscaling ? "upscale"
                            : editHook?.isEditing ? "edit"
                            : "render"
                          }
                          onCreateVideo={handlers.handleCreateVideo}
                          onUpscale={handleUpscale}
                          onDownload={() => handlers.handleDownload(workflowState.resultImage || undefined, undefined, workflowState.resultMediaType)}
                          onCrop={handleCropResult}
                          renderName={renderName}
                          onRenderNameChange={setRenderName}
                          onEdit={handleEdit}
                          onImageClick={handleResultClick}
                        />
                      </div>

                      {/* Prompt Input with Settings */}
                      <div className="flex-shrink-0 min-h-0 flex flex-col">
                        <PromptInputComponent
                          prompt={workflowState.prompt}
                          onPromptChange={workflowState.setPrompt}
                          onGenerate={handleGenerate}
                          onEnhancePrompt={enhanceHook ? handleEnhancePrompt : undefined}
                          isGenerating={isGenerating}
                          isEnhancing={enhanceHook?.isEnhancing}
                          disabled={false}
                          settings={workflowState.settings}
                          onSettingsChange={workflowState.setSettings}
                        />
                      </div>

                      {/* Recent Generations */}
                      <div className="flex-[1.5] min-h-0 overflow-hidden">
                        <RecentGenerations
                          generations={generations.recentGenerations}
                          onSelect={(gen) => {
                            const index = generations.recentGenerations.findIndex((g) => g.id === gen.id);
                            lightbox.openLightbox(gen, index);
                          }}
                          onDownload={(gen) => {
                            // Determine if this is a video based on type field
                            const isVideo = gen.type === "video";
                            const mediaType = isVideo ? "video" : "image";
                            const extension = isVideo ? ".mp4" : ".jpg";

                            workflowLogger.debug('Download Debug', {
                              genType: gen.type,
                              genMediaType: (gen as any).mediaType ?? 'unknown',
                              isVideo,
                              mediaType,
                              extension,
                              url: gen.imageUrl
                            });

                            // Generate descriptive filename based on type
                            let filename: string;
                            const timestamp = gen.timestamp ? new Date(gen.timestamp).toISOString().slice(0, 19).replace(/[T:]/g, '-') : 'unknown';

                            if (gen.type === "video") {
                              filename = `video-${timestamp}${extension}`;
                            } else if (gen.type === "upscale") {
                              filename = `upscaled-${timestamp}${extension}`;
                            } else if (gen.type === "render") {
                              filename = `render-${timestamp}${extension}`;
                            } else if (gen.name) {
                              // Fallback: use DB name
                              const nameWithoutExt = gen.name.includes(".")
                                ? gen.name.substring(0, gen.name.lastIndexOf("."))
                                : gen.name;
                              filename = `${nameWithoutExt}${extension}`;
                            } else {
                              filename = `generation-${timestamp}${extension}`;
                            }

                            handlers.handleDownload(gen.imageUrl, filename, mediaType);
                          }}
                          onDelete={generations.deleteGeneration}
                          onEdit={handlers.handleLoadForEdit}
                          onCreateVideo={handlers.handleLoadForVideo}
                          onUpscale={handleUpscale}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      {/* Lightbox */}
      {lightbox.lightboxOpen && lightbox.lightboxItem && (
        <RenderLightbox
          isOpen={lightbox.lightboxOpen}
          item={lightbox.lightboxItem}
          onClose={lightbox.closeLightbox}
          onNavigate={lightbox.lightboxIndex >= 0 ? handleNavigateLightbox : undefined}
          hasNext={lightbox.lightboxIndex >= 0 && lightbox.lightboxIndex < generations.recentGenerations.length - 1}
          hasPrev={lightbox.lightboxIndex > 0}
          onDownload={(item) => {
            const extension = item.type === "video" ? ".mp4" : ".jpg";
            const filename = item.name
              ? item.name.includes(".")
                ? item.name
                : `${item.name}${extension}`
              : `render-${item.id}${extension}`;
            handlers.handleDownload(item.imageUrl, filename, item.type === "video" ? "video" : "image");
          }}
        />
      )}

      {/* Crop Modal */}
      {crop.cropModalOpen && crop.imageToCrop && (
        <ImageCropModal
          isOpen={crop.cropModalOpen}
          imageUrl={crop.imageToCrop}
          onClose={crop.closeCropModal}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
