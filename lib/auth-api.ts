/**
 * API Authentication Helpers
 *
 * Utilities for authenticating and authorizing API requests.
 * Use these helpers in your API routes to ensure secure access.
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

/**
 * Get authenticated user from request
 *
 * @param request - The Next.js request object
 * @returns The authenticated user or null if not authenticated
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const user = await getAuthUser(request);
 *
 *   if (!user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *
 *   // User is authenticated, proceed with request
 *   const userId = user.id;
 * }
 * ```
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error("Missing Supabase environment variables");
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      // Try to get session from cookies
      const cookieHeader = request.headers.get("cookie");
      if (!cookieHeader) {
        return null;
      }

      // Parse cookies
      const cookies = Object.fromEntries(
        cookieHeader.split("; ").map((cookie) => {
          const [key, value] = cookie.split("=");
          return [key, value];
        })
      );

      // Find Supabase auth token
      const authTokenKey = Object.keys(cookies).find(
        (key) => key.startsWith("sb-") && key.endsWith("-auth-token")
      );

      if (!authTokenKey) {
        return null;
      }
    }

    // Verify session
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn("Invalid or expired auth token", { error: error?.message });
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name,
    };
  } catch (error) {
    logger.error("Auth user check error", error as Error);
    return null;
  }
}

/**
 * Require authenticated user
 *
 * Throws an error if user is not authenticated.
 * Use this in API routes where authentication is mandatory.
 *
 * @param request - The Next.js request object
 * @returns The authenticated user
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   try {
 *     const user = await requireAuth(request);
 *     // User is authenticated, proceed with request
 *     const userId = user.id;
 *   } catch (error) {
 *     return NextResponse.json(
 *       { error: 'Unauthorized', message: error.message },
 *       { status: 401 }
 *     );
 *   }
 * }
 * ```
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getAuthUser(request);

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * Check if user owns a resource
 *
 * Verifies that the authenticated user is the owner of a specific resource.
 * Use this to prevent unauthorized access to other users' data.
 *
 * @param request - The Next.js request object
 * @param resourceUserId - The user ID of the resource owner
 * @returns True if user owns the resource, false otherwise
 *
 * @example
 * ```typescript
 * export async function DELETE(
 *   request: NextRequest,
 *   { params }: { params: { id: string } }
 * ) {
 *   const user = await requireAuth(request);
 *
 *   // Get resource from database
 *   const resource = await db.getResource(params.id);
 *
 *   if (!resource) {
 *     return NextResponse.json({ error: 'Not found' }, { status: 404 });
 *   }
 *
 *   // Check ownership
 *   const isOwner = await checkResourceOwnership(request, resource.user_id);
 *
 *   if (!isOwner) {
 *     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 *   }
 *
 *   // User owns the resource, proceed with deletion
 *   await db.deleteResource(params.id);
 * }
 * ```
 */
export async function checkResourceOwnership(
  request: NextRequest,
  resourceUserId: string
): Promise<boolean> {
  const user = await getAuthUser(request);

  if (!user) {
    return false;
  }

  return user.id === resourceUserId;
}
