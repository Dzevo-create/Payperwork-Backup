import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";
import { apiRateLimiter, getClientId } from "@/lib/rate-limit";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);

  try {
    // API Key validation
    const keyValidation = validateApiKeys(['supabase']);
    if (!keyValidation.valid) {
      return keyValidation.errorResponse!;
    }

    // Content-Type validation
    if (!validateContentType(req)) {
      return handleApiError(
        new Error('Content-Type must be application/json'),
        'upload-chat-image-api'
      );
    }

    // Rate limiting
    const rateLimitResult = apiRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    const { base64Data, fileName, mimeType } = await req.json();

    if (!base64Data || !fileName) {
      return NextResponse.json(
        { error: "Missing base64Data or fileName" },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from("chat-images")
      .upload(`${Date.now()}-${fileName}`, buffer, {
        contentType: mimeType || "image/png",
        upsert: false,
      });

    if (error) {
      apiLogger.error("Failed to upload image to Supabase", error);
      return NextResponse.json(
        { error: "Failed to upload image", details: error.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("chat-images")
      .getPublicUrl(data.path);

    apiLogger.info("Image uploaded to Supabase successfully", {
      path: data.path,
      url: publicUrlData.publicUrl,
    });

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: data.path,
    });
  } catch (error) {
    return handleApiError(error, 'upload-chat-image-api');
  }
}
