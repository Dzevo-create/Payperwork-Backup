import { fal } from "@fal-ai/client";
import { VideoProvider } from "./BaseProvider";
import { ENV, PROVIDER_CONSTRAINTS } from "../config/videoConfig";
import type { VideoGenerationRequest, VideoGenerationResponse, VideoType } from "@/types/video";
import { videoLogger } from '@/lib/logger';

// Configure fal.ai client
fal.config({
  credentials: ENV.fal.apiKey,
});

/**
 * fal.ai Provider (payperwork-v2)
 * Supports: text2video, image2video via Sora 2
 * Features: Fast generation, automatic polling, immediate results
 */
export class FalProvider extends VideoProvider {
  async createTask(req: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const {
      type,
      prompt,
      image,
      duration = PROVIDER_CONSTRAINTS.fal.defaults.duration,
      aspectRatio = PROVIDER_CONSTRAINTS.fal.defaults.aspectRatio,
      resolution: _resolution = PROVIDER_CONSTRAINTS.fal.defaults.resolution,
    } = req;

    // Validate required parameters
    if (!prompt) {
      throw new Error("Prompt is required for fal.ai video generation");
    }
    if (type === "image2video" && !image) {
      throw new Error("Image is required for image2video generation");
    }

    // Determine fal.ai endpoint
    const endpoint =
      type === "image2video"
        ? "fal-ai/sora-2/image-to-video"
        : "fal-ai/sora-2/text-to-video";

    // Validate and normalize settings for fal.ai Sora 2 API
    const durationNum = parseInt(duration);
    const validDuration = PROVIDER_CONSTRAINTS.fal.durations.includes(durationNum as any)
      ? durationNum
      : parseInt(PROVIDER_CONSTRAINTS.fal.defaults.duration);

    // For image2video: support "auto" aspect ratio (fal.ai specific)
    let validAspectRatio: string;
    if (type === "image2video" && aspectRatio === "auto") {
      validAspectRatio = "auto";
    } else {
      validAspectRatio = PROVIDER_CONSTRAINTS.fal.aspectRatios.includes(aspectRatio as any)
        ? aspectRatio
        : PROVIDER_CONSTRAINTS.fal.defaults.aspectRatio;
    }

    // Build request payload
    const payload: any = {
      prompt,
      duration: validDuration,
      aspect_ratio: validAspectRatio,
    };

    // Add OpenAI API key if available (for direct OpenAI billing instead of fal credits)
    // This enables $0.1/second billing directly through OpenAI (much faster than fal credits)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
      payload.openai_api_key = openaiApiKey;
      videoLogger.debug('🔑 Using OpenAI API key for direct billing ($0.1/s) - FASTER PROCESSING');
    } else {
      videoLogger.warn('No OpenAI API key found - using fal.ai credits (slower queue times)');
      videoLogger.warn('Add OPENAI_API_KEY to .env.local for faster video generation');
    }

    // For image2video: add resolution (can be "auto" or "720p")
    if (type === "image2video") {
      payload.resolution = aspectRatio === "auto" ? "auto" : "720p";
      payload.image_url = image;
    } else {
      // For text2video: only 720p resolution
      payload.resolution = "720p";
    }

    videoLogger.debug(`Starting fal.ai Sora 2 ${type}`, {
      endpoint,
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      duration: validDuration,
      aspectRatio: validAspectRatio,
    });

    videoLogger.debug('fal.ai payload prepared', { payloadKeys: Object.keys(payload) });

    // Queue the fal.ai job (non-blocking - returns immediately with request_id)
    const { request_id } = await fal.queue.submit(endpoint, {
      input: payload,
    });

    videoLogger.info('fal.ai Sora 2 task queued:');

    // Return immediately with task_id for polling
    return {
      task_id: request_id,
      status: "processing",
      message: `Video generation queued. Poll GET /api/generate-video?task_id=${request_id}&model=payperwork-v2&type=${type} for status.`,
      provider: "fal",
      model: "payperwork-v2",
      type,
    };
  }

  async checkStatus(taskId: string, type: VideoType): Promise<VideoGenerationResponse> {
    try {
      // Validate type parameter
      if (!["text2video", "image2video"].includes(type)) {
        throw new Error(`Invalid type parameter: ${type}. Must be 'text2video' or 'image2video'`);
      }

      // Determine endpoint based on type
      const endpoint =
        type === "image2video"
          ? "fal-ai/sora-2/image-to-video"
          : "fal-ai/sora-2/text-to-video";

      // Check the status of the queued fal.ai job
      const status = await fal.queue.status(endpoint, {
        requestId: taskId,
        logs: true,
      });

      // Log detailed status with timing info
      const queuePosition = status.queue_position;
      const statusMsg = status.status === "IN_QUEUE"
        ? `IN_QUEUE (position: ${queuePosition || 'unknown'})`
        : status.status;
      videoLogger.info('fal.ai status check for ${taskId}:');

      // Map fal.ai status to our VideoStatus
      if (status.status === "COMPLETED") {
        // Fetch the result
        const result = await fal.queue.result(endpoint, {
          requestId: taskId,
        });
        const videoUrl = result.data?.video?.url;

        if (!videoUrl) {
          throw new Error("Video generation completed but no video URL returned");
        }

        return {
          task_id: taskId,
          status: "succeed",
          videos: [{ url: videoUrl }],
          message: "Video generation completed successfully",
          provider: "fal",
          model: "payperwork-v2",
          type,
        };
      } else if (status.status === "FAILED") {
        return {
          task_id: taskId,
          status: "failed",
          videos: [],
          message: "Video generation failed",
          provider: "fal",
          model: "payperwork-v2",
          type,
        };
      } else {
        // IN_QUEUE or IN_PROGRESS
        // Provide more detailed status messages
        let detailedMessage = "Video generation in progress";
        if (status.status === "IN_QUEUE") {
          const position = queuePosition ? ` (position: ${queuePosition})` : "";
          detailedMessage = `Waiting in queue${position}... This can take 1-3 minutes depending on server load.`;
        } else if (status.status === "IN_PROGRESS") {
          detailedMessage = "Video is being generated... This typically takes 1-2 minutes.";
        }

        return {
          task_id: taskId,
          status: "processing",
          videos: [],
          message: detailedMessage,
          provider: "fal",
          model: "payperwork-v2",
          type,
        };
      }
    } catch (error: any) {
      videoLogger.error('fal.ai status check error:', error);
      throw new Error(`Failed to check fal.ai task status: ${error.message}`);
    }
  }
}
