import jwt from "jsonwebtoken";
import { VideoProvider } from "./BaseProvider";
import { validateAndFixKlingSettings } from "@/utils/klingValidation";
import { fetchWithRetry } from "@/utils/fetchWithTimeout";
import { ENV, VIDEO_CONFIG } from "../config/videoConfig";
import type { VideoGenerationRequest, VideoGenerationResponse, VideoType } from "@/types/video";
import { videoLogger } from '@/lib/logger';

/**
 * JWT Token Cache
 * Stores token and expiration timestamp to avoid regenerating on every request
 */
interface TokenCache {
  token: string;
  expiresAt: number;
}

/**
 * Kling AI Provider (payperwork-v1)
 * Supports: text2video, image2video
 * Features: High quality, pro mode, camera control, motion masks
 */
export class KlingProvider extends VideoProvider {
  private tokenCache: TokenCache | null = null;

  /**
   * Generate JWT Bearer token for Kling AI authentication
   * Implements caching to avoid regenerating tokens on every request
   * Tokens are valid for 30 minutes, cached for 25 minutes (5 min buffer)
   */
  private generateBearerToken(): string {
    const now = Math.floor(Date.now() / 1000);

    // Return cached token if still valid (with 5 min buffer)
    if (this.tokenCache && this.tokenCache.expiresAt > now + 300) {
      videoLogger.debug('🔑 Using cached JWT token');
      return this.tokenCache.token;
    }

    // Validate credentials
    if (!ENV.kling.accessKey || !ENV.kling.secretKey) {
      throw new Error("Kling AI credentials not configured");
    }

    // Generate new token
    const expiresAt = now + 1800; // 30 minutes from now
    const payload = {
      iss: ENV.kling.accessKey,
      exp: expiresAt,
      nbf: now - 5, // Valid from 5 seconds ago
    };

    const token = jwt.sign(payload, ENV.kling.secretKey, {
      algorithm: "HS256",
      header: {
        alg: "HS256",
        typ: "JWT",
      },
    });

    // Cache the token
    this.tokenCache = { token, expiresAt };
    videoLogger.debug('🔑 Generated new JWT token (valid for 30 min)');

    return token;
  }

  async createTask(req: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const {
      type,
      prompt,
      negative_prompt,
      image,
      image_tail,
      duration = "5",
      aspectRatio = "16:9",
      mode = "std",
      cfg_scale = 0.5,
      static_mask,
      dynamic_masks,
    } = req;

    // Validate required parameters based on type
    if (type === "text2video" && !prompt) {
      throw new Error("Prompt is required for text2video generation");
    }
    if (type === "image2video" && !image) {
      throw new Error("Image is required for image2video generation");
    }

    // Validate and auto-fix settings
    const settingsToValidate =
      aspectRatio && aspectRatio !== "original"
        ? { duration, aspectRatio, mode }
        : { duration, aspectRatio: "16:9", mode };

    const { params, warnings } = validateAndFixKlingSettings(settingsToValidate as any);

    if (warnings.length > 0) {
      videoLogger.warn('Auto-corrected video settings:');
    }

    // Build request body based on type
    const requestBody: any = {
      duration: params.duration,
      mode: params.mode,
      cfg_scale,
    };

    // Add aspect ratio only if explicitly provided and not "original"
    if (aspectRatio && aspectRatio !== "original") {
      requestBody.aspect_ratio = params.aspect_ratio;
    }

    // Add type-specific parameters
    if (type === "text2video") {
      requestBody.prompt = prompt;
      if (negative_prompt) requestBody.negative_prompt = negative_prompt;
    } else if (type === "image2video") {
      requestBody.image = image;
      if (prompt) requestBody.prompt = prompt;
      if (negative_prompt) requestBody.negative_prompt = negative_prompt;
      if (image_tail) requestBody.image_tail = image_tail;
      if (static_mask) requestBody.static_mask = static_mask;
      if (dynamic_masks) requestBody.dynamic_masks = dynamic_masks;
    }

    // Determine API endpoint
    const endpoint = `${ENV.kling.apiUrl}/v1/videos/${type}`;

    videoLogger.debug('🎬 Starting Kling AI ${type}...', {
      duration: params.duration,
      aspectRatio: aspectRatio || "original",
      mode: params.mode,
    });

    try {
      // Create video generation task
      const createResponse = await fetchWithRetry(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.generateBearerToken()}`,
          },
          body: JSON.stringify(requestBody),
        },
        3, // maxRetries
        VIDEO_CONFIG.timeouts.apiCallMs
      );

      const createData = await createResponse.json();

      videoLogger.debug('📊 Kling API Create Response:', {
        ok: createResponse.ok,
        status: createResponse.status,
        code: createData.code,
        message: createData.message,
      });

      if (!createResponse.ok || createData.code !== 0) {
        const errorMessage = createData.message || `HTTP ${createResponse.status}: ${createResponse.statusText}`;
        const error = new Error(`Kling API Error: ${errorMessage} (HTTP ${createResponse.status}, Code: ${createData.code})`);
        videoLogger.error('Kling AI task creation failed:', error, {
          status: createResponse.status,
          code: createData.code,
          message: createData.message,
          data: JSON.stringify(createData),
        });
        throw error;
      }

      const taskId = createData.data.task_id;

      videoLogger.info('Kling AI task created: ${taskId}');

      return {
        task_id: taskId,
        status: "processing",
        message: `Video generation started. Poll GET /api/generate-video?task_id=${taskId}&model=payperwork-v1&type=${type} for status.`,
        provider: "kling",
        model: "payperwork-v1",
        type,
      };
    } catch (error) {
      videoLogger.error('Kling task creation failed:', error instanceof Error ? error : undefined, {
        type,
        endpoint,
      });
      throw error;
    }
  }

  async checkStatus(taskId: string, type: VideoType): Promise<VideoGenerationResponse> {
    // Validate type parameter
    if (!["text2video", "image2video"].includes(type)) {
      throw new Error(`Invalid type parameter: ${type}. Must be 'text2video' or 'image2video'`);
    }

    const endpoint = `${ENV.kling.apiUrl}/v1/videos/${type}/${taskId}`;

    videoLogger.debug('Checking Kling AI status for task: ${taskId}');

    try {
      const statusResponse = await fetchWithRetry(
        endpoint,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.generateBearerToken()}`,
          },
        },
        3, // maxRetries
        VIDEO_CONFIG.timeouts.apiCallMs
      );

      const statusData = await statusResponse.json();

      videoLogger.debug('📊 Kling API Response:', {
        ok: statusResponse.ok,
        status: statusResponse.status,
        code: statusData.code,
        message: statusData.message,
      });

      if (!statusResponse.ok || statusData.code !== 0) {
        const errorMessage = statusData.message || `HTTP ${statusResponse.status}: ${statusResponse.statusText}`;
        const error = new Error(`Kling API Error: ${errorMessage} (HTTP ${statusResponse.status}, Code: ${statusData.code})`);
        videoLogger.error('Kling API Error:', error, {
          status: statusResponse.status,
          code: statusData.code,
          message: statusData.message,
          data: JSON.stringify(statusData),
        });
        throw error;
      }

      return {
        task_id: taskId,
        status: statusData.data.task_status,
        videos: statusData.data.task_result?.videos || [],
        message: statusData.data.task_status_msg,
        provider: "kling",
        model: "payperwork-v1",
        type,
      };
    } catch (error) {
      videoLogger.error('Kling status check failed:', error instanceof Error ? error : undefined, {
        taskId,
        type,
        endpoint,
      });
      throw error;
    }
  }
}
