import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { createClient } from "@supabase/supabase-js";

/**
 * CORS & Security Middleware
 *
 * Protects API routes from unauthorized cross-origin requests
 * and adds security headers to all responses.
 *
 * Features:
 * - CORS protection (only allowed origins can call the API)
 * - Security headers (XSS, Clickjacking protection)
 * - Preflight request handling (OPTIONS)
 * - Environment-based configuration
 */

/**
 * Get allowed origins based on environment
 */
function getAllowedOrigins(): string[] {
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (isDevelopment) {
    // Development: Allow localhost and ngrok tunnels
    return [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:3004",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:3002",
      "http://127.0.0.1:3003",
      "http://127.0.0.1:3004",
      // ngrok tunnel for webhooks
      "https://subdistichous-reynalda-bivoltine.ngrok-free.dev",
    ];
  }

  // Production: Only specific domains
  const productionOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
    : [];

  return [
    "https://payperwork.com",
    "https://www.payperwork.com",
    "https://payperwork.ai",
    "https://www.payperwork.ai",
    ...productionOrigins,
  ];
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // XSS protection (legacy browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

/**
 * Add CORS headers to response
 */
function addCorsHeaders(
  response: NextResponse,
  origin: string,
  allowCredentials: boolean = true
): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", origin);

  if (allowCredentials) {
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");

  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );

  response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  return response;
}

/**
 * Check if user is authenticated
 */
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error("Missing Supabase environment variables");
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get token from Authorization header or cookie
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      // Check cookies for session
      const cookies = request.cookies.getAll();
      const sessionCookie = cookies.find(
        (cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")
      );

      if (!sessionCookie) {
        return false;
      }
    }

    // Verify session
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Auth check error", error as Error);
    return false;
  }
}

/**
 * Middleware function
 */
export async function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();
  const pathname = request.nextUrl.pathname;

  // Protected routes that require authentication
  const protectedPaths = [
    "/api/chat",
    "/api/chat-c1",
    "/api/generate-image",
    "/api/generate-video",
    "/api/generate-runway-video",
    "/api/slides",
    "/api/upload",
    "/api/transcribe",
    "/api/branding",
    "/api/furnish-empty",
    "/api/sketch-to-render",
    "/api/style-transfer",
    "/api/render-to-cad",
  ];

  // Check if path requires authentication
  const requiresAuth = protectedPaths.some((path) => pathname.startsWith(path));

  // If route requires auth, check authentication
  if (requiresAuth && request.method !== "OPTIONS") {
    const authenticated = await isAuthenticated(request);

    if (!authenticated) {
      logger.warn("Unauthorized API access attempt", { path: pathname });
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }
  }

  // Handle preflight OPTIONS requests
  if (request.method === "OPTIONS") {
    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      let response: NextResponse<{ success: boolean }> = NextResponse.json(
        { success: true },
        { status: 200 }
      );
      response = addCorsHeaders(response, origin) as NextResponse<{ success: boolean }>;
      response = addSecurityHeaders(response) as NextResponse<{ success: boolean }>;
      return response;
    }

    // Blocked origin
    return NextResponse.json(
      { error: "Forbidden", message: "Origin not allowed" },
      { status: 403 }
    );
  }

  // For non-OPTIONS requests (GET, POST, etc.)
  // Check if origin header is present and allowed
  if (origin) {
    if (!allowedOrigins.includes(origin)) {
      logger.warn("Blocked request from unauthorized origin", { origin, component: "CORS" });
      return NextResponse.json(
        { error: "Forbidden", message: "Origin not allowed" },
        { status: 403 }
      );
    }

    // Origin is allowed - continue with CORS headers
    const response = NextResponse.next();
    addCorsHeaders(response, origin);
    addSecurityHeaders(response);
    return response;
  }

  // No origin header (same-origin request or direct API call)
  // Add security headers only
  const response = NextResponse.next();
  addSecurityHeaders(response);
  return response;
}

/**
 * Configure which routes the middleware applies to
 *
 * Currently protects all /api/* routes
 */
export const config = {
  matcher: [
    "/api/:path*", // All API routes
  ],
};
