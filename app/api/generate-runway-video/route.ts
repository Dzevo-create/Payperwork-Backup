import { NextRequest, NextResponse } from "next/server";
import RunwayML, { TaskFailedError } from "@runwayml/sdk";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { apiLogger } from '@/lib/logger';
import sharp from 'sharp';

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

if (!RUNWAY_API_KEY) {
  apiLogger.error('RUNWAY_API_KEY is not set');
}

// Parse Runway ratio string to actual ratio number
function parseRunwayRatio(ratioStr: string): number {
  const [w, h] = ratioStr.split(':').map(Number);
  if (!w || !h) {
    throw new Error(`Invalid ratio string: ${ratioStr}`);
  }
  return w / h;
}

// Select the best Runway ratio based on image aspect ratio
// Runway ONLY accepts these specific pixel ratios (as of latest API):
// 1280:720, 720:1280, 1104:832, 832:1104, 960:960, 1584:672
// NOTE: 1584:672 = 2.357 which is > 2.0, so it gets rejected despite being in the list
// Safe ratios: 1280:720 (1.778), 720:1280 (0.5625), 1104:832 (1.327), 832:1104 (0.754), 960:960 (1.0)
function selectRunwayRatio(aspectRatio: number): string {
  apiLogger.debug('[Runway] Selecting ratio for aspect ratio:', { aspectRatio: aspectRatio.toFixed(3) });

  // Square (close to 1:1)
  if (aspectRatio >= 0.95 && aspectRatio <= 1.05) {
    return "960:960"; // 1.0
  }

  // Portrait (height > width)
  if (aspectRatio < 1) {
    // Very tall portrait - use 720:1280 (0.5625)
    if (aspectRatio <= 0.65) {
      return "720:1280";
    }
    // Medium portrait - use 832:1104 (0.754)
    return "832:1104";
  }

  // Landscape (width > height)

  // Wide landscape - use 1280:720 (1.778) - widest safe ratio
  if (aspectRatio >= 1.5) {
    return "1280:720";
  }

  // Medium landscape - use 1104:832 (1.327)
  return "1104:832";
}

/**
 * Process image to match Runway's aspect ratio requirements
 * Downloads image, crops/resizes to target ratio, and uploads to Supabase
 * Returns the processed image URL and selected ratio
 */
async function processImageForRunway(imageUrl: string): Promise<{ processedUrl: string; ratio: string }> {
  try {
    apiLogger.info('[Runway] Processing image:', { url: imageUrl.substring(0, 100) });

    // Fetch the original image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get image metadata
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not determine image dimensions');
    }

    const originalWidth = metadata.width;
    const originalHeight = metadata.height;
    const originalAspectRatio = originalWidth / originalHeight;

    apiLogger.info('[Runway] Original image dimensions:', {
      width: originalWidth,
      height: originalHeight,
      aspectRatio: originalAspectRatio.toFixed(3),
    });

    // Select the best Runway ratio
    const targetRatioStr = selectRunwayRatio(originalAspectRatio);
    const targetRatio = parseRunwayRatio(targetRatioStr);

    apiLogger.info('[Runway] Selected ratio:', {
      ratioStr: targetRatioStr,
      ratioValue: targetRatio.toFixed(3),
    });

    // Calculate target dimensions
    let targetWidth: number;
    let targetHeight: number;

    if (originalAspectRatio > targetRatio) {
      // Image is wider than target - crop width
      targetHeight = originalHeight;
      targetWidth = Math.round(targetHeight * targetRatio);
    } else {
      // Image is taller than target - crop height
      targetWidth = originalWidth;
      targetHeight = Math.round(targetWidth / targetRatio);
    }

    // Ensure dimensions don't exceed original
    targetWidth = Math.min(targetWidth, originalWidth);
    targetHeight = Math.min(targetHeight, originalHeight);

    apiLogger.info('[Runway] Target dimensions:', {
      width: targetWidth,
      height: targetHeight,
      aspectRatio: (targetWidth / targetHeight).toFixed(3),
    });

    // Crop image from center
    const processedBuffer = await image
      .extract({
        left: Math.floor((originalWidth - targetWidth) / 2),
        top: Math.floor((originalHeight - targetHeight) / 2),
        width: targetWidth,
        height: targetHeight,
      })
      .jpeg({ quality: 95 }) // High quality JPEG
      .toBuffer();

    // Upload processed image to Supabase
    const fileName = `runway-processed-${Date.now()}.jpg`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("images")
      .upload(fileName, processedBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload processed image: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("images").getPublicUrl(fileName);

    apiLogger.info('[Runway] Processed image uploaded:', { url: publicUrl });

    return {
      processedUrl: publicUrl,
      ratio: targetRatioStr,
    };
  } catch (error) {
    apiLogger.error('[Runway] Error processing image:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, prompt, cameraMovement, duration = 5 } = await req.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    if (!RUNWAY_API_KEY) {
      return NextResponse.json(
        { error: "Runway API key not configured" },
        { status: 500 }
      );
    }

    // Initialize Runway client
    const client = new RunwayML({ apiKey: RUNWAY_API_KEY });

    // Process image to match Runway's aspect ratio requirements
    const { processedUrl, ratio } = await processImageForRunway(imageUrl);

    // Build the prompt text
    let promptText = prompt || "";
    if (cameraMovement && cameraMovement !== "none") {
      promptText = `${promptText}. Camera movement: ${cameraMovement}`.trim();
    }

    apiLogger.info('[Runway] Starting video generation:', {
      originalImageUrl: imageUrl.substring(0, 100),
      processedImageUrl: processedUrl.substring(0, 100),
      promptText,
      ratio,
      duration,
    });

    // Create image-to-video task using gen4_turbo (fastest model)
    const task = await client.imageToVideo
      .create({
        model: "gen4_turbo",
        promptImage: processedUrl, // Use processed/cropped image
        promptText: promptText || "A dynamic scene with natural movement",
        ratio: ratio as any,
        duration: duration as 5 | 10, // User-selected duration
      })
      .waitForTaskOutput({
        timeout: 5 * 60 * 1000, // 5 minutes timeout
      });

    apiLogger.info('[Runway] Video generation completed');

    if (!task.output || task.output.length === 0) {
      throw new Error("No video output received from Runway");
    }

    const videoUrl = task.output[0];
    if (!videoUrl) {
      throw new Error("No video URL in task output");
    }

    // Download the video from Runway's temporary URL
    apiLogger.info('[Runway] Downloading video from URL', { url: videoUrl });
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const videoBlob = new Uint8Array(videoBuffer);

    // Upload to Supabase
    const fileName = `runway-${Date.now()}-${task.id}.mp4`;
    const filePath = fileName; // Just the filename, bucket already contains 'videos'

    apiLogger.info('[Runway] Uploading to Supabase:');
    const { error: uploadError } = await supabaseAdmin.storage
      .from("videos")
      .upload(filePath, videoBlob, {
        contentType: "video/mp4",
        upsert: false,
      });

    if (uploadError) {
      apiLogger.error('[Runway] Supabase upload error:');
      throw new Error(`Failed to upload video: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("videos").getPublicUrl(filePath);

    apiLogger.info('[Runway] Video uploaded successfully:', { publicUrl });

    return NextResponse.json({
      success: true,
      videoUrl: publicUrl,
      taskId: task.id,
      aspectRatio: ratio,
      processedImageUrl: processedUrl,
    });
  } catch (error) {
    apiLogger.error('[Runway] Error:', error);

    if (error instanceof TaskFailedError) {
      return NextResponse.json(
        {
          error: "Video generation failed",
          details: error.taskDetails,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || "Failed to generate video",
      },
      { status: 500 }
    );
  }
}
