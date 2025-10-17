"use client";

import { useState, useCallback, useEffect } from "react";
import { ChatSidebar } from "@/components/chat/Sidebar/ChatSidebar";
import { InputsPanel } from "@/components/workflows/InputsPanel";
import { InputImagesPanel } from "@/components/workflows/InputImagesPanel";
import { ResultPanel } from "@/components/workflows/ResultPanel";
import { BrandingPromptInput } from "@/components/workflows/BrandingPromptInput";
import { BrandingSettingsType, DEFAULT_BRANDING_SETTINGS } from "@/types/workflows/brandingSettings";
import { RecentGenerations } from "@/components/workflows/RecentGenerations";
import { RenderLightbox } from "@/components/workflows/RenderLightbox";
import ImageCropModal from "@/components/chat/ImageCrop/ImageCropModal";
import { useChatStore } from "@/store/chatStore.supabase";
import { useRouter } from "next/navigation";
import { usePromptEnhancer } from "@/hooks/workflows/usePromptEnhancer";
import { useBranding } from "@/hooks/workflows/useBranding";
import { useRenderEdit } from "@/hooks/workflows/useRenderEdit";
import { useUpscale } from "@/hooks/workflows/useUpscale";
import { getUserIdSync } from "@/lib/supabase/insert-helper";
import { uploadBase64Image, uploadFile } from "@/lib/supabase-library";
import { workflowLogger } from '@/lib/logger';

export default function BrandingPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Workflow state
  const [prompt, setPrompt] = useState("");
  const [renderSettings, setRenderSettings] = useState<BrandingSettingsType>(DEFAULT_BRANDING_SETTINGS);
  const [inputData, setInputData] = useState<{
    sourceImage: { file: File | null; preview: string | null; originalPreview: string | null };
    referenceImages: Array<{ file: File | null; preview: string | null; originalPreview: string | null }>;
  }>({
    sourceImage: { file: null, preview: null, originalPreview: null },
    referenceImages: [],
  });
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultMediaType, setResultMediaType] = useState<"image" | "video">("image");
  const [renderName, setRenderName] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState<string>("");
  const [recentGenerations, setRecentGenerations] = useState<any[]>([]);
  const [currentSourceImage, setCurrentSourceImage] = useState<string | null>(null); // Store current source for lightbox
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isLoadingGenerations, setIsLoadingGenerations] = useState(true);

  // Image crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropImageType, setCropImageType] = useState<'source' | 'reference' | null>(null);
  const [cropReferenceIndex, setCropReferenceIndex] = useState<number | null>(null);

  // Load recent generations from database on mount
  useEffect(() => {
    const loadGenerations = async () => {
      try {
        const userId = getUserIdSync();
        const response = await fetch(`/api/branding/generations?userId=${encodeURIComponent(userId)}`);
        if (response.ok) {
          const data = await response.json();
          // Transform database generations to UI format
          const generations = data.generations.map((gen: any) => ({
            id: gen.id,
            imageUrl: gen.url,
            timestamp: new Date(gen.created_at),
            prompt: gen.prompt,
            name: gen.name,
            type: gen.type,
            sourceType: gen.source_type,
            settings: gen.settings,
            sourceImageUrl: gen.source_image, // Include source image for lightbox
          }));
          setRecentGenerations(generations);
        }
      } catch (error) {
        workflowLogger.error('[Branding] Error loading generations:', error);
      } finally {
        setIsLoadingGenerations(false);
      }
    };

    loadGenerations();
  }, []);

  // Helper function to save generation to database
  const saveGenerationToDb = async (generation: {
    url: string;
    type: "render" | "video" | "upscale";
    name: string;
    prompt?: string;
    sourceType?: "original" | "from_render" | "from_video";
    parentId?: string;
    settings?: any;
    sourceImage?: string; // Source image URL to show in lightbox
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

      const response = await fetch("/api/branding/save-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          url: generation.url,
          type: generation.type,
          sourceType: generation.sourceType || "original",
          parentId: generation.parentId,
          prompt: generation.prompt,
          model: generation.type === "video" ? "runway-gen4-turbo" : "nano-banana",
          settings: generation.settings || {},
          name: generation.name,
          sourceImage: generation.sourceImage, // Include source image
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        workflowLogger.error('[SaveGeneration] Failed to save:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
      } else {
        const result = await response.json();
        workflowLogger.info('[SaveGeneration] Successfully saved:');
      }
    } catch (error) {
      workflowLogger.error('[Branding] Error saving generation to DB:', error);
    }
  };

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<any | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const conversations = useChatStore((state) => state.conversations);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const addConversation = useChatStore((state) => state.addConversation);
  const setCurrentConversationId = useChatStore((state) => state.setCurrentConversationId);
  const setMessages = useChatStore((state) => state.setMessages);

  const handleLoadConversation = (convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      setCurrentConversationId(convId);
      router.push(`/chat?convId=${convId}`);
    }
  };

  const handleDuplicateConversation = (convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;

    const newConvId = Date.now().toString();
    const newConv = {
      ...conv,
      id: newConvId,
      title: `${conv.title} (Kopie)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addConversation(newConv);
  };

  const handleRenameConversation = (convId: string, newTitle: string) => {
    updateConversation(convId, { title: newTitle });
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    router.push("/chat");
  };

  // Initialize workflow hooks with stable callbacks
  const handlePromptSuccess = useCallback((enhancedPrompt: string) => {
    setPrompt(enhancedPrompt);
  }, []);

  const handlePromptError = useCallback((error: string) => {
    alert(`Prompt-Generierung fehlgeschlagen: ${error}`);
  }, []);

  // Generate automatic render name
  const generateRenderName = useCallback(() => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, ""); // HHMMSS
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0"); // 4-digit random
    return `payperwork-sketchtorender-${dateStr}-${timeStr}-${random}`;
  }, []);

  const handleGenerateSuccess = useCallback(async (result: any) => {
    const autoName = generateRenderName();

    // UPLOAD IMAGES TO STORAGE FIRST
    let storageImageUrl = result.imageUrl;
    let storageSourceUrl = inputData.sourceImage.preview;

    try {
      // Upload result image
      const uploadedResult = await uploadBase64Image(
        result.imageUrl,
        `${autoName}-result.jpg`
      );
      if (uploadedResult) {
        storageImageUrl = uploadedResult;
      } else {
        workflowLogger.error('[Upload] Failed to upload result image, using base64');
      }

      // Upload source image
      if (inputData.sourceImage.preview) {
        const uploadedSource = await uploadBase64Image(
          inputData.sourceImage.preview,
          `${autoName}-source.jpg`
        );
        if (uploadedSource) {
          storageSourceUrl = uploadedSource;
        } else {
          workflowLogger.error('[Upload] Failed to upload source image, using base64');
        }
      }
    } catch (error) {
      workflowLogger.error('[Upload] Error uploading images:', error);
      // Continue with base64 URLs as fallback
    }

    // NOW use storageImageUrl and storageSourceUrl instead of base64
    setResultImage(storageImageUrl);
    setRenderName(autoName);
    setOriginalPrompt(result.prompt || ""); // Store original prompt for editing

    // Store current source image for lightbox
    setCurrentSourceImage(storageSourceUrl);

    // Add to recent generations with auto name
    const newGeneration = {
      id: result.id,
      imageUrl: storageImageUrl,  // Storage URL
      timestamp: result.timestamp || new Date(),
      prompt: result.prompt, // Keep original prompt for metadata
      name: autoName, // Add auto-generated name
      type: "render" as const,
      settings: result.settings,
      sourceImageUrl: storageSourceUrl,  // Storage URL
    };
    setRecentGenerations((prev) => [newGeneration, ...prev]);

    // Save to database
    await saveGenerationToDb({
      url: storageImageUrl,  // Storage URL
      type: "render",
      name: autoName,
      prompt: result.prompt,
      sourceType: "original",
      settings: result.settings,
      sourceImage: storageSourceUrl, // Storage URL
    });

    // Clear prompt and reset settings after successful generation
    setPrompt("");
    setRenderSettings(DEFAULT_BRANDING_SETTINGS);
  }, [generateRenderName, inputData.sourceImage.preview]);

  const handleGenerateError = useCallback((error: string) => {
    alert(`Generierung fehlgeschlagen: ${error}`);
  }, []);

  const {
    enhancePrompt,
    isEnhancing,
    error: enhanceError,
  } = usePromptEnhancer({
    onSuccess: handlePromptSuccess,
    onError: handlePromptError,
  });

  const {
    generate,
    isGenerating,
    error: generateError,
    progress,
  } = useBranding({
    onSuccess: handleGenerateSuccess,
    onError: handleGenerateError,
  });

  const handleEditSuccess = useCallback(
    async (editedImageUrl: string) => {
      // Generate new name for edited image
      const autoName = generateRenderName();

      // Store previous result as source for lightbox
      const previousImage = resultImage;

      // UPLOAD IMAGES TO STORAGE FIRST
      let storageEditedUrl = editedImageUrl;
      let storagePreviousUrl = previousImage;

      try {
        // Upload edited image (always base64 from hook)
        const uploadedEdited = await uploadBase64Image(
          editedImageUrl,
          `${autoName}-edited.jpg`
        );
        if (uploadedEdited) {
          storageEditedUrl = uploadedEdited;
        } else {
          workflowLogger.error('[Upload] Failed to upload edited image, using base64');
        }

        // Upload previous image (could be base64, storage URL, or Freepik URL)
        if (previousImage) {
          // Check if it's already a storage URL
          if (previousImage.includes('supabase.co/storage')) {
            storagePreviousUrl = previousImage; // Already uploaded
          } else {
            // Need to upload (base64 or Freepik URL)
            if (previousImage.startsWith('data:')) {
              // Base64 data URL
              const uploadedPrevious = await uploadBase64Image(
                previousImage,
                `${autoName}-previous.jpg`
              );
              if (uploadedPrevious) {
                storagePreviousUrl = uploadedPrevious;
              }
            } else {
              // External URL (Freepik temporary), download and upload
              const response = await fetch(previousImage);
              const blob = await response.blob();
              const uploadedPrevious = await uploadFile(
                blob,
                `${autoName}-previous.jpg`,
                'image'
              );
              if (uploadedPrevious) {
                storagePreviousUrl = uploadedPrevious;
              }
            }
          }
        }
      } catch (error) {
        workflowLogger.error('[Upload] Error uploading images:', error);
        // Continue with original URLs as fallback
      }

      setResultImage(storageEditedUrl);
      setRenderName(autoName);
      setCurrentSourceImage(storagePreviousUrl); // Previous result becomes source

      // Add to recent generations
      const newGeneration = {
        id: Date.now().toString(),
        imageUrl: storageEditedUrl,
        timestamp: new Date(),
        name: autoName,
        prompt: originalPrompt || "", // Use original prompt as context
        type: "render" as const,
        sourceType: "from_render" as const,
        settings: renderSettings,
        sourceImageUrl: storagePreviousUrl || undefined, // Previous result as source
      };

      setRecentGenerations((prev) => [newGeneration, ...prev]);

      // Save to database
      await saveGenerationToDb({
        url: storageEditedUrl,
        type: "render",
        name: autoName,
        prompt: originalPrompt || "",
        sourceType: "from_render",
        settings: renderSettings,
        sourceImage: storagePreviousUrl, // Previous result as source
      });
    },
    [generateRenderName, originalPrompt, renderSettings, resultImage]
  );

  const {
    editRender,
    isEditing,
    error: editError,
  } = useRenderEdit({
    onSuccess: handleEditSuccess,
    onError: (error) => {
      alert(`Bearbeitung fehlgeschlagen: ${error}`);
    },
  });

  const handleUpscaleSuccess = useCallback(
    async (upscaledImageUrl: string) => {
      workflowLogger.info('[Upscale] Success! Displaying upscaled image in Results View');

      // Generate new name for upscaled image
      const autoName = generateRenderName();

      // Store previous result as source for lightbox
      const previousImage = resultImage;

      // UPLOAD IMAGES TO STORAGE FIRST
      let storageUpscaledUrl = upscaledImageUrl;
      let storagePreviousUrl = previousImage;

      try {
        // Upload upscaled image (Freepik temporary URL)
        const response = await fetch(upscaledImageUrl);
        const blob = await response.blob();
        const uploadedUpscaled = await uploadFile(
          blob,
          `${autoName}-upscaled.jpg`,
          'image'
        );
        if (uploadedUpscaled) {
          storageUpscaledUrl = uploadedUpscaled;
        } else {
          workflowLogger.error('[Upload] Failed to upload upscaled image, using Freepik URL');
        }

        // Upload previous image (could be base64, storage URL, or Freepik URL)
        if (previousImage) {
          // Check if it's already a storage URL
          if (previousImage.includes('supabase.co/storage')) {
            storagePreviousUrl = previousImage; // Already uploaded
          } else {
            // Need to upload (base64 or Freepik URL)
            if (previousImage.startsWith('data:')) {
              // Base64 data URL
              const uploadedPrevious = await uploadBase64Image(
                previousImage,
                `${autoName}-previous.jpg`
              );
              if (uploadedPrevious) {
                storagePreviousUrl = uploadedPrevious;
              }
            } else {
              // External URL (Freepik temporary), download and upload
              const prevResponse = await fetch(previousImage);
              const prevBlob = await prevResponse.blob();
              const uploadedPrevious = await uploadFile(
                prevBlob,
                `${autoName}-previous.jpg`,
                'image'
              );
              if (uploadedPrevious) {
                storagePreviousUrl = uploadedPrevious;
              }
            }
          }
        }
      } catch (error) {
        workflowLogger.error('[Upload] Error uploading images:', error);
        // Continue with original URLs as fallback
      }

      // Show upscaled image in Results View
      setResultImage(storageUpscaledUrl);
      setResultMediaType("image"); // Upscaled images are always images
      setRenderName(autoName);
      setCurrentSourceImage(storagePreviousUrl); // Previous result becomes source

      // Scroll to top to show ResultPanel
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Add to recent generations
      const newGeneration = {
        id: Date.now().toString(),
        imageUrl: storageUpscaledUrl,
        timestamp: new Date(),
        name: autoName,
        prompt: "", // No prompt for upscale
        type: "upscale" as const,
        sourceType: "from_render" as const,
        settings: renderSettings,
        sourceImageUrl: storagePreviousUrl || undefined, // Previous result as source
      };

      setRecentGenerations((prev) => [newGeneration, ...prev]);

      // Save to database
      await saveGenerationToDb({
        url: storageUpscaledUrl,
        type: "upscale",
        name: autoName,
        prompt: "", // No prompt for upscale
        sourceType: "from_render",
        settings: renderSettings,
        sourceImage: storagePreviousUrl, // Previous result as source
      });
    },
    [generateRenderName, originalPrompt, renderSettings, resultImage]
  );

  const {
    upscale,
    isUpscaling,
    error: upscaleError,
  } = useUpscale({
    onSuccess: handleUpscaleSuccess,
    onError: (error) => {
      alert(`Upscaling fehlgeschlagen: ${error}`);
    },
  });

  // Workflow handlers
  const handleEnhancePrompt = async () => {
    await enhancePrompt(
      prompt,
      inputData.sourceImage,
      renderSettings,
      inputData.referenceImages[0]
    );
  };

  const handleGenerate = async () => {
    if (!inputData.sourceImage.file) {
      alert("Bitte lade zuerst ein Ausgangsbild hoch");
      return;
    }

    if (!prompt.trim()) {
      alert("Bitte gib einen Prompt ein");
      return;
    }

    await generate(
      prompt,
      inputData.sourceImage,
      renderSettings,
      inputData.referenceImages[0]
    );
  };

  const handleDownload = async (imageUrl?: string, filename?: string, mediaType?: "image" | "video") => {
    const urlToDownload = imageUrl || resultImage;
    const type = mediaType || resultMediaType;

    if (!urlToDownload || typeof urlToDownload !== 'string') {
      workflowLogger.error('[Download] No valid URL to download', { urlToDownload, type: typeof urlToDownload });
      return;
    }

    try {
      workflowLogger.debug('[Download] Starting download:', {
        url: urlToDownload.substring(0, 50) + "...",
        type,
        mediaType,
        resultMediaType
      });

      // Determine file extension based on media type and URL
      let extension = ".jpg";
      if (type === "video" || urlToDownload.includes(".mp4")) {
        extension = ".mp4";
      } else if (urlToDownload.includes(".png") || urlToDownload.startsWith("data:image/png")) {
        extension = ".png";
      }

      const downloadName = filename || `${renderName || `render-${Date.now()}`}${extension}`;

      workflowLogger.debug('[Download] Download info:', {
        extension,
        downloadName,
        isVideo: type === "video",
        isHTTP: urlToDownload.startsWith("http")
      });

      // For videos and external URLs, use fetch + blob with correct MIME type
      if (type === "video" || urlToDownload.startsWith("http")) {
        workflowLogger.debug('[Download] Fetching video/external URL');
        const response = await fetch(urlToDownload);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the blob with correct MIME type
        let blob = await response.blob();

        workflowLogger.debug('[Download] Original blob:', {
          size: blob.size,
          type: blob.type
        });

        // Ensure correct MIME type for videos
        if (type === "video" || extension === ".mp4") {
          if (!blob.type.includes("video")) {
            workflowLogger.debug('[Download] Correcting MIME type to video/mp4');
            blob = new Blob([blob], { type: "video/mp4" });
          }
        }

        workflowLogger.debug('[Download] Final blob:', {
          size: blob.size,
          type: blob.type,
          extension
        });

        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = downloadName;
        link.setAttribute("type", blob.type);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      } else {
        // For base64 data URLs, use direct download
        workflowLogger.debug('[Download] Using direct base64 download');
        const link = document.createElement("a");
        link.href = urlToDownload;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      workflowLogger.debug('[Download] Download completed:');
    } catch (error) {
      workflowLogger.error('[Download] Download failed:', error);
      alert("Download fehlgeschlagen. Bitte versuche es erneut.");
    }
  };

  const handleEdit = async (editPrompt: string) => {
    if (!resultImage || !editPrompt.trim()) return;

    await editRender(editPrompt, resultImage, originalPrompt);
  };

  const handleCreateVideo = async (videoPrompt: string) => {
    if (!resultImage) {
      alert("Kein Bild zum Verarbeiten vorhanden");
      return;
    }

    if (!videoPrompt.trim()) {
      alert("Bitte gib einen Video-Prompt ein");
      return;
    }

    setIsGeneratingVideo(true);

    try {
      // Extract camera movement from prompt if exists
      const cameraMovements = [
        "push in", "push out", "pan left", "pan right", "pan up", "pan down",
        "orbit left", "orbit right", "crane up", "crane down",
        "dolly in", "dolly out", "tilt up", "tilt down",
        "zoom in", "zoom out", "static camera"
      ];

      let cameraMovement = "none";
      for (const movement of cameraMovements) {
        if (videoPrompt.toLowerCase().includes(movement)) {
          cameraMovement = movement;
          break;
        }
      }

      workflowLogger.debug('[Branding] Starting Runway video generation...');

      const response = await fetch("/api/generate-runway-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: resultImage,
          prompt: videoPrompt,
          cameraMovement,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Video-Generierung fehlgeschlagen");
      }

      const data = await response.json();
      workflowLogger.debug('[Branding] Video generated:');

      // Generate new name for video
      const autoName = generateRenderName().replace("sketchtorender", "v.turbo");

      // Store previous result as source for lightbox
      const previousImage = resultImage;

      // Display video in ResultPanel immediately
      setResultImage(data.videoUrl);
      setResultMediaType("video");
      setRenderName(autoName);
      setCurrentSourceImage(previousImage); // Image used to create video

      // Add video to recent generations
      const newGeneration = {
        id: data.taskId || Date.now().toString(),
        imageUrl: data.videoUrl, // Use video URL in imageUrl field
        timestamp: new Date(),
        name: autoName,
        prompt: videoPrompt,
        type: "video" as const,
        sourceType: "from_render" as const,
        settings: renderSettings,
        sourceImageUrl: previousImage || undefined, // Image used to create video
      };

      setRecentGenerations((prev) => [newGeneration, ...prev]);

      // Save to database
      await saveGenerationToDb({
        url: data.videoUrl,
        type: "video",
        name: autoName,
        prompt: videoPrompt,
        sourceType: "from_render",
        settings: renderSettings,
        sourceImage: previousImage, // Image used to create video
      });

      // Scroll to top to show the video
      window.scrollTo({ top: 0, behavior: "smooth" });

      alert("Video erfolgreich erstellt! ✨");
    } catch (error: any) {
      workflowLogger.error('[Branding] Video generation error:', error);
      alert(`Video-Generierung fehlgeschlagen: ${error.message}`);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleUpscale = async (gen?: any) => {
    // If generation provided (from RecentGenerations), use its imageUrl
    // Otherwise use current resultImage
    const imageToUpscale = gen?.imageUrl || resultImage;

    if (!imageToUpscale) {
      workflowLogger.error('[Upscale] No image to upscale');
      return;
    }

    workflowLogger.debug('Starting upscale for image', {
      urlPreview: imageToUpscale.substring(0, 50) + "..."
    });

    // Use default upscale settings (good quality)
    await upscale(imageToUpscale, {
      sharpen: 50,
      smart_grain: 7,
      ultra_detail: 30,
    });
  };

  // Load generation from RecentGenerations for editing
  const handleLoadForEdit = (gen: any) => {
    const mediaType = gen.type === "video" ? "video" : "image";
    setResultImage(gen.imageUrl);
    setResultMediaType(mediaType);
    setRenderName(gen.name || "");
    setOriginalPrompt(gen.prompt || "");
    // Scroll to top to show ResultPanel
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Load generation from RecentGenerations for video creation
  const handleLoadForVideo = (gen: any) => {
    const mediaType = gen.type === "video" ? "video" : "image";
    setResultImage(gen.imageUrl);
    setResultMediaType(mediaType);
    setRenderName(gen.name || "");
    setOriginalPrompt(gen.prompt || "");
    // Scroll to top to show ResultPanel
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Lightbox handlers
  const handleOpenLightbox = useCallback(
    (item: any, index: number = 0) => {
      setLightboxItem(item);
      setLightboxIndex(index);
      setLightboxOpen(true);
    },
    []
  );

  const handleCloseLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const handleNavigateLightbox = useCallback(
    (direction: "prev" | "next") => {
      const newIndex = direction === "prev" ? lightboxIndex - 1 : lightboxIndex + 1;
      if (newIndex >= 0 && newIndex < recentGenerations.length) {
        setLightboxIndex(newIndex);
        setLightboxItem(recentGenerations[newIndex]);
      }
    },
    [lightboxIndex, recentGenerations]
  );

  // Click handler for result image
  const handleResultClick = useCallback(() => {
    if (resultImage) {
      // Find if result image is in recent generations
      const index = recentGenerations.findIndex((gen) => gen.imageUrl === resultImage);
      if (index !== -1) {
        handleOpenLightbox(recentGenerations[index], index);
      } else {
        // If not in recent generations, create temp item
        handleOpenLightbox(
          {
            id: "current",
            imageUrl: resultImage,
            timestamp: new Date(),
            name: renderName,
          },
          -1
        );
      }
    }
  }, [resultImage, renderName, recentGenerations, handleOpenLightbox]);

  // Handlers for removing images from cards
  const handleRemoveSource = useCallback(() => {
    setInputData((prev) => ({
      ...prev,
      sourceImage: { file: null, preview: null, originalPreview: null },
    }));
  }, []);

  const handleRemoveReference = useCallback((index: number) => {
    setInputData((prev) => {
      const newReferenceImages = [...prev.referenceImages];
      newReferenceImages[index] = { file: null, preview: null, originalPreview: null };
      return {
        ...prev,
        referenceImages: newReferenceImages,
      };
    });
  }, []);

  // Crop handlers
  const handleCropSource = useCallback(() => {
    // Always use original image for cropping, fallback to current preview if no original
    const imageToUse = inputData.sourceImage.originalPreview || inputData.sourceImage.preview;
    if (imageToUse) {
      setImageToCrop(imageToUse);
      setCropImageType('source');
      setCropModalOpen(true);
    }
  }, [inputData.sourceImage.preview, inputData.sourceImage.originalPreview]);

  const handleCropReference = useCallback((index: number) => {
    const refImage = inputData.referenceImages[index];
    // Always use original image for cropping, fallback to current preview if no original
    const imageToUse = refImage?.originalPreview || refImage?.preview;
    if (imageToUse) {
      setImageToCrop(imageToUse);
      setCropImageType('reference');
      setCropReferenceIndex(index);
      setCropModalOpen(true);
    }
  }, [inputData.referenceImages]);

  const handleCropResult = useCallback(() => {
    if (resultImage) {
      setImageToCrop(resultImage);
      setCropImageType(null); // Result image is neither source nor reference
      setCropModalOpen(true);
    }
  }, [resultImage]);

  const handleCropComplete = useCallback(async (croppedImageUrl: string) => {
    // Convert base64 to File
    const response = await fetch(croppedImageUrl);
    const blob = await response.blob();
    const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });

    // Update inputData with cropped image, keeping original
    if (cropImageType === 'source') {
      setInputData((prev) => ({
        ...prev,
        sourceImage: {
          file,
          preview: croppedImageUrl,
          // Keep original if it exists, otherwise store current preview as original
          originalPreview: prev.sourceImage.originalPreview || prev.sourceImage.preview
        },
      }));
    } else if (cropImageType === 'reference' && cropReferenceIndex !== null) {
      setInputData((prev) => {
        const newReferenceImages = [...prev.referenceImages];
        const currentRef = newReferenceImages[cropReferenceIndex];
        newReferenceImages[cropReferenceIndex] = {
          file,
          preview: croppedImageUrl,
          // Keep original if it exists, otherwise store current preview as original
          originalPreview: currentRef?.originalPreview || currentRef?.preview || null
        };
        return {
          ...prev,
          referenceImages: newReferenceImages,
        };
      });
    } else if (cropImageType === null) {
      // Cropping the result image - replace result image
      setResultImage(croppedImageUrl);
    }

    // Reset crop state
    setCropModalOpen(false);
    setImageToCrop(null);
    setCropImageType(null);
    setCropReferenceIndex(null);
  }, [cropImageType, cropReferenceIndex]);

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
          onDuplicateConversation={handleDuplicateConversation}
          onRenameConversation={handleRenameConversation}
        />

        {/* Main Content Area - Fixed height, no overflow */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-lg border border-pw-black/10">
          {/* Header */}
          <div className="px-4 sm:px-6 py-2 bg-transparent flex-shrink-0">
            <h1 className="text-base font-semibold text-pw-black/80">Branding</h1>
          </div>

          {/* Content - Fixed height with internal scrolling */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 pt-3 flex flex-col gap-6 overflow-hidden">
              {/* 2-Column Layout: Inputs (left, 380px) | Result + Prompt (right, flex-1) - SAME HEIGHT */}
              <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                {/* Left Column: Inputs Panel (380px fixed, wider) */}
                <div className="lg:w-[380px] flex-shrink-0 h-full overflow-hidden">
                  <div className="h-full p-4 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-lg border border-pw-black/10 rounded-xl">
                    <InputsPanel
                      data={inputData}
                      onChange={setInputData}
                      onCropSource={handleCropSource}
                      onCropReference={handleCropReference}
                    />
                  </div>
                </div>

                {/* Right Column: Result + Prompt + Gallery (flex-1) - SAME HEIGHT as left, symmetrisch verteilt */}
                <div className="flex-1 h-full overflow-hidden">
                  <div className="h-full p-4 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-lg border border-pw-black/10 rounded-xl overflow-y-auto">
                    <div className="h-full flex flex-col gap-2">
                      {/* Result Panel - Smaller height */}
                      <div className="flex-[2.5] min-h-0 overflow-visible">
                        <ResultPanel
                          imageUrl={resultImage}
                          mediaType={resultMediaType}
                          isGenerating={isGenerating || isEditing || isUpscaling || isGeneratingVideo}
                          generatingType={
                            isGeneratingVideo ? "video"
                            : isUpscaling ? "upscale"
                            : isEditing ? "edit"
                            : "render"
                          }
                          onCreateVideo={handleCreateVideo}
                          onUpscale={handleUpscale}
                          onDownload={() => handleDownload(resultImage, undefined, resultMediaType)}
                          onCrop={handleCropResult}
                          renderName={renderName}
                          onRenderNameChange={setRenderName}
                          onEdit={handleEdit}
                          onImageClick={handleResultClick}
                        />
                      </div>

                      {/* Prompt Input with Settings - Flexible size based on content */}
                      <div className="flex-shrink-0 min-h-0 flex flex-col">
                        <BrandingPromptInput
                          prompt={prompt}
                          onPromptChange={setPrompt}
                          onGenerate={handleGenerate}
                          onEnhancePrompt={handleEnhancePrompt}
                          isGenerating={isGenerating}
                          isEnhancing={isEnhancing}
                          disabled={false}
                          settings={renderSettings}
                          onSettingsChange={setRenderSettings}
                        />
                      </div>

                      {/* Recent Generations - Adjusted size */}
                      <div className="flex-[1.5] min-h-0 overflow-hidden">
                        <RecentGenerations
                          generations={recentGenerations}
                          onSelect={(gen) => {
                            const index = recentGenerations.findIndex((g) => g.id === gen.id);
                            handleOpenLightbox(gen, index);
                          }}
                          onDownload={(gen) => {
                            // Determine extension based on generation type
                            const extension = gen.type === "video" ? ".mp4" : ".jpg";
                            const filename = gen.name
                              ? gen.name.includes(".")
                                ? gen.name
                                : `${gen.name}${extension}`
                              : `render-${gen.id}${extension}`;
                            handleDownload(gen.imageUrl, filename, gen.type === "video" ? "video" : "image");
                          }}
                          onDelete={async (id) => {
                            // Remove from UI immediately
                            setRecentGenerations((prev) => prev.filter((g) => g.id !== id));

                            // Delete from database
                            try {
                              await fetch("/api/branding/delete-generation", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ generationId: id }),
                              });
                            } catch (error) {
                              workflowLogger.error('[Branding] Error deleting generation:', error);
                            }
                          }}
                          onEdit={handleLoadForEdit}
                          onCreateVideo={handleLoadForVideo}
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
      {lightboxOpen && lightboxItem && (
        <RenderLightbox
          isOpen={lightboxOpen}
          item={lightboxItem}
          onClose={handleCloseLightbox}
          onNavigate={lightboxIndex >= 0 ? handleNavigateLightbox : undefined}
          hasNext={lightboxIndex >= 0 && lightboxIndex < recentGenerations.length - 1}
          hasPrev={lightboxIndex > 0}
          onDownload={(item) => {
            // Use the proper download function with correct file extension
            const extension = item.type === "video" ? ".mp4" : ".jpg";
            const filename = item.name
              ? item.name.includes(".")
                ? item.name
                : `${item.name}${extension}`
              : `render-${item.id}${extension}`;
            handleDownload(item.imageUrl, filename, item.type === "video" ? "video" : "image");
          }}
        />
      )}

      {/* Crop Modal */}
      {cropModalOpen && imageToCrop && (
        <ImageCropModal
          isOpen={cropModalOpen}
          imageUrl={imageToCrop}
          onClose={() => {
            setCropModalOpen(false);
            setImageToCrop(null);
            setCropImageType(null);
            setCropReferenceIndex(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
