import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (isDevelopment) {
    // Development: Allow localhost
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3003',
      'http://127.0.0.1:3004',
    ];
  }

  // Production: Only specific domains
  const productionOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [];

  return [
    'https://payperwork.com',
    'https://www.payperwork.com',
    'https://payperwork.ai',
    'https://www.payperwork.ai',
    ...productionOrigins,
  ];
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // XSS protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

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
  response.headers.set('Access-Control-Allow-Origin', origin);

  if (allowCredentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );

  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin'
  );

  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return response;
}

/**
 * Middleware function
 */
export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      let response: NextResponse<{ success: boolean }> = NextResponse.json({ success: true }, { status: 200 });
      response = addCorsHeaders(response, origin) as NextResponse<{ success: boolean }>;
      response = addSecurityHeaders(response) as NextResponse<{ success: boolean }>;
      return response;
    }

    // Blocked origin
    return NextResponse.json(
      { error: 'Forbidden', message: 'Origin not allowed' },
      { status: 403 }
    );
  }

  // For non-OPTIONS requests (GET, POST, etc.)
  // Check if origin header is present and allowed
  if (origin) {
    if (!allowedOrigins.includes(origin)) {
      console.log(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      return NextResponse.json(
        { error: 'Forbidden', message: 'Origin not allowed' },
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
    '/api/:path*', // All API routes
  ],
};
