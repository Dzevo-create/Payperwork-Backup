import { NextRequest, NextResponse } from "next/server";
import RunwayML, { TaskFailedError } from "@runwayml/sdk";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { apiLogger } from '@/lib/logger';

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

if (!RUNWAY_API_KEY) {
  apiLogger.error('RUNWAY_API_KEY is not set');
}

// Helper function to detect aspect ratio from image URL
async function detectAspectRatio(imageUrl: string): Promise<string> {
  try {
    // Fetch image to get dimensions
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Simple image dimension detection
    // For JPEG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) break;

        const marker = buffer[offset + 1];
        const length = (buffer[offset + 2] << 8) + buffer[offset + 3];

        // SOF markers
        if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
          const height = (buffer[offset + 5] << 8) + buffer[offset + 6];
          const width = (buffer[offset + 7] << 8) + buffer[offset + 8];
          return selectRunwayRatio(width, height);
        }

        offset += length + 2;
      }
    }

    // For PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return selectRunwayRatio(width, height);
    }

    // Default fallback
    return "1280:720";
  } catch (error) {
    apiLogger.error('[Runway] Error detecting aspect ratio:', error);
    return "1280:720"; // Default landscape
  }
}

// Select the best Runway ratio based on image dimensions
function selectRunwayRatio(width: number, height: number): string {
  const aspectRatio = width / height;

  // Square (ratio close to 1:1)
  if (aspectRatio >= 0.95 && aspectRatio <= 1.05) {
    return "960:960";
  }

  // Portrait (height > width)
  if (aspectRatio < 1) {
    // 9:16 (0.5625) - closer to 720:1280
    if (aspectRatio <= 0.65) {
      return "720:1280";
    }
    // 4:5 (0.8) - closer to 832:1104
    return "832:1104";
  }

  // Landscape (width > height)
  // 16:9 (1.777) - standard landscape
  if (aspectRatio >= 1.7 && aspectRatio <= 1.8) {
    return "1280:720";
  }
  // Ultra-wide (> 2:1) - 1584:672 (2.357)
  if (aspectRatio > 2.0) {
    return "1584:672";
  }
  // 4:3 or 5:4 - 1104:832 (1.327)
  if (aspectRatio >= 1.2 && aspectRatio <= 1.4) {
    return "1104:832";
  }

  // Default to 16:9 landscape
  return "1280:720";
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, prompt, cameraMovement } = await req.json();

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

    // Detect aspect ratio from image
    const aspectRatio = await detectAspectRatio(imageUrl);
    apiLogger.debug('[Runway] Detected aspect ratio:');

    // Build the prompt text
    let promptText = prompt || "";
    if (cameraMovement && cameraMovement !== "none") {
      promptText = `${promptText}. Camera movement: ${cameraMovement}`.trim();
    }

    apiLogger.debug('[Runway] Starting video generation:', {
      imageUrl: imageUrl.substring(0, 100),
      promptText,
      aspectRatio,
    });

    // Create image-to-video task using gen4_turbo (fastest model)
    const task = await client.imageToVideo
      .create({
        model: "gen4_turbo",
        promptImage: imageUrl,
        promptText: promptText || "A dynamic scene with natural movement",
        ratio: aspectRatio as any,
        duration: 5, // 5 seconds
      })
      .waitForTaskOutput({
        timeout: 5 * 60 * 1000, // 5 minutes timeout
      });

    apiLogger.debug('[Runway] Video generation completed:');

    if (!task.output || task.output.length === 0) {
      throw new Error("No video output received from Runway");
    }

    const videoUrl = task.output[0];

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
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
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

    apiLogger.info('[Runway] Video uploaded successfully:');

    return NextResponse.json({
      success: true,
      videoUrl: publicUrl,
      taskId: task.id,
      aspectRatio,
    });
  } catch (error: any) {
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
