import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { Attachment } from "@/types/chat";
import { ImageSettingsType } from "@/components/chat/Chat/ImageSettings";
import { VideoSettingsType } from "@/components/chat/Chat/VideoSettings";
import { logger } from '@/lib/logger';

interface ReplyToData {
  messageId: string;
  content: string;
  attachments?: Attachment[];
}

interface EnhancePromptOptions {
  prompt: string;
  mode?: "chat" | "image" | "video";
  attachments?: Attachment[];
  replyTo?: ReplyToData;
  videoSettings?: VideoSettingsType;
  imageSettings?: ImageSettingsType;
}

export function usePromptEnhancement() {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const toast = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const enhancePrompt = async (options: EnhancePromptOptions): Promise<string> => {
    const { prompt, mode, attachments = [], replyTo, videoSettings, imageSettings } = options;

    if (!prompt.trim()) {
      return prompt;
    }

    setIsEnhancing(true);

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // Check if there are images attached OR in reply message
      const hasImage = attachments.some(att => att.type === "image");
      const hasReplyImage = replyTo?.attachments?.some((att: Attachment) => att.type === "image") || false;
      const replyContext = replyTo?.content || "";

      // Get image description using Vision API if available
      let imageContext = "";

      // Priority: 1. Current attachments, 2. Reply message attachments
      let imageToAnalyze = null;

      if (hasImage) {
        imageToAnalyze = attachments.find(att => att.type === "image");
        logger.debug('Image attachment found in current message');
      } else if (hasReplyImage && mode === "image") {
        // If replying to a message with an image in image mode, use that image for context
        imageToAnalyze = replyTo?.attachments?.find((att: Attachment) => att.type === "image");
        logger.debug('Image attachment found in reply message:', {
          hasUrl: !!imageToAnalyze?.url,
          hasBase64: !!imageToAnalyze?.base64,
          name: imageToAnalyze?.name
        });

        // If reply image has URL but no base64, convert it
        if (imageToAnalyze && imageToAnalyze.url && !imageToAnalyze.base64) {
          try {
            logger.debug('📥 Converting reply image URL to base64...');
            const response = await fetch(imageToAnalyze.url, { signal });
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const result = reader.result as string;
                // Keep full data URL (data:image/xxx;base64,...)
                resolve(result);
              };
              reader.onerror = () => {
                reject(new Error("FileReader failed to read blob"));
              };
              reader.readAsDataURL(blob);
            });
            imageToAnalyze.base64 = base64;
            logger.info('Converted reply image to base64 (full data URL)');
          } catch (error) {
            logger.error('Failed to convert reply image:', error);
          }
        }
      }

      if (imageToAnalyze) {
        logger.debug('Analyzing image:', {
          hasBase64: !!imageToAnalyze?.base64,
          type: imageToAnalyze?.type,
          name: imageToAnalyze?.name
        });

        if (imageToAnalyze && imageToAnalyze.base64) {
          // Analyze image with OpenAI Vision API to get description
          try {
            logger.debug('📸 Analyzing image with Vision API...');
            const visionResponse = await fetch("/api/analyze-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                image: imageToAnalyze.base64,
                prompt: "Beschreibe detailliert, was auf diesem Bild zu sehen ist. Fokussiere auf Hauptobjekte, Farben, Stimmung und wichtige Details."
              }),
              signal,
            });

            if (visionResponse.ok) {
              const visionData = await visionResponse.json();
              imageContext = visionData.description || "";
              logger.info('Image analysis result:');
            } else {
              const errorText = await visionResponse.text();
              logger.error('Vision API failed:', errorText);
            }
          } catch (error) {
            logger.error('Image analysis failed:', error);
            // Fallback to filename if vision fails
            imageContext = `Bild angehängt: ${imageToAnalyze.name}`;
          }
        } else {
          logger.warn('No base64 data in image attachment');
        }
      }

      // Extract PDF context if present
      let pdfContext = "";

      // Priority 1: Current attachments
      const pdfAttachments = attachments.filter(att => att.type === "pdf");
      if (pdfAttachments.length > 0) {
        const pdfTexts = pdfAttachments
          .map(att => {
            const text = att.structuredText || att.pdfText || "";
            return text ? `PDF "${att.name}":\n${text.substring(0, 2000)}` : "";
          })
          .filter(text => text.length > 0);

        if (pdfTexts.length > 0) {
          pdfContext = pdfTexts.join("\n\n");
          logger.debug('PDF context extracted from attachments', {
            textPreview: pdfContext.substring(0, 100) + "..."
          });
        }
      }

      // Priority 2: Reply attachments
      if (replyTo?.attachments) {
        const replyPdfAttachments = replyTo.attachments.filter(att => att.type === "pdf");
        if (replyPdfAttachments.length > 0) {
          const replyPdfTexts = replyPdfAttachments
            .map(att => {
              const text = att.structuredText || att.pdfText || "";
              return text ? `PDF aus Reply "${att.name}":\n${text.substring(0, 2000)}` : "";
            })
            .filter(text => text.length > 0);

          if (replyPdfTexts.length > 0) {
            pdfContext = pdfContext
              ? `${pdfContext}\n\n${replyPdfTexts.join("\n\n")}`
              : replyPdfTexts.join("\n\n");
            logger.debug('📄 PDF context added from reply attachments');
          }
        }
      }

      // Prepare video settings context if in video mode
      let videoContext = "";
      if (mode === "video" && videoSettings) {
        const durationLabel = videoSettings.duration === "5" ? "5 Sekunden" : "10 Sekunden";
        const modeLabel = videoSettings.mode === "std" ? "Standard" : "Professional";
        const cameraLabel = videoSettings.cameraMovement
          ? `Kamera: ${videoSettings.cameraMovement.replace(/_/g, ' ')}`
          : "Keine Kamerabewegung";

        videoContext = `Video-Einstellungen: ${durationLabel}, ${videoSettings.aspectRatio}, ${modeLabel}, ${cameraLabel}`;
      }

      // Prepare image settings context if in image mode
      let imageSettingsContext = "";
      if (mode === "image" && imageSettings) {
        const parts = [];
        if (imageSettings.preset && imageSettings.preset !== "none") {
          parts.push(`Preset: ${imageSettings.preset}`);
        }
        if (imageSettings.style) {
          parts.push(`Stil: ${imageSettings.style}`);
        }
        if (imageSettings.lighting) {
          parts.push(`Beleuchtung: ${imageSettings.lighting}`);
        }
        parts.push(`Qualität: ${imageSettings.quality}`);
        parts.push(`Seitenverhältnis: ${imageSettings.aspectRatio}`);

        imageSettingsContext = `Bild-Einstellungen: ${parts.join(", ")}`;
      }

      const response = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          mode,
          hasImage: hasImage || hasReplyImage,
          imageContext,
          replyContext,
          pdfContext: pdfContext || undefined,
          videoContext: mode === "video" ? videoContext : undefined,
          imageSettings: mode === "image" ? imageSettings : undefined,
          imageSettingsContext: mode === "image" ? imageSettingsContext : undefined,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error("Enhancement failed");
      }

      const data = await response.json();
      return data.enhancedPrompt;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.debug('Prompt enhancement aborted');
        return prompt;
      }
      logger.error('Prompt enhancement error:', error);
      toast.error("Prompt-Verbesserung fehlgeschlagen. Bitte erneut versuchen.");
      return prompt; // Return original prompt on error
    } finally {
      setIsEnhancing(false);
    }
  };

  return {
    isEnhancing,
    enhancePrompt,
  };
}
