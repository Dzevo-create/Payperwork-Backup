import type { VideoGenerationRequest, VideoGenerationResponse, VideoType } from "@/types/video";

/**
 * Abstract base class for video generation providers
 * All providers must implement these methods
 */
export abstract class VideoProvider {
  /**
   * Create a new video generation task
   */
  abstract createTask(req: VideoGenerationRequest): Promise<VideoGenerationResponse>;

  /**
   * Check the status of an existing video generation task
   */
  abstract checkStatus(taskId: string, type: VideoType): Promise<VideoGenerationResponse>;
}
