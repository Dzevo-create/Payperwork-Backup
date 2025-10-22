/**
 * Zod Validation Middleware for Next.js API Routes
 *
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const body = await validateRequest(request, slidesPromptSchema);
 *   if ('error' in body) {
 *     return body.error;
 *   }
 *   // Use validated body.data
 * }
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { apiLogger } from "@/lib/logger";

/**
 * Validation result type
 */
type ValidationResult<T> = { data: T; error?: never } | { data?: never; error: NextResponse };

/**
 * Validate request body against a Zod schema
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      apiLogger.warn("Validation failed", {
        action: "validateRequest",
        errors: error.errors,
      });

      return {
        error: NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request body",
              details: error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
                code: err.code,
              })),
            },
          },
          { status: 400 }
        ),
      };
    }

    // Handle JSON parsing errors
    apiLogger.error("Request parsing failed", error, {
      action: "validateRequest",
    });

    return {
      error: NextResponse.json(
        {
          error: {
            code: "INVALID_JSON",
            message: "Invalid JSON in request body",
          },
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validated = schema.parse(params);
    return { data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      apiLogger.warn("Query validation failed", {
        action: "validateQuery",
        errors: error.errors,
      });

      return {
        error: NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid query parameters",
              details: error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
                code: err.code,
              })),
            },
          },
          { status: 400 }
        ),
      };
    }

    apiLogger.error("Query parsing failed", error, {
      action: "validateQuery",
    });

    return {
      error: NextResponse.json(
        {
          error: {
            code: "INVALID_QUERY",
            message: "Invalid query parameters",
          },
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate route parameters (e.g., /api/slides/[id])
 */
export function validateParams<T>(
  params: Record<string, string>,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    const validated = schema.parse(params);
    return { data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      apiLogger.warn("Params validation failed", {
        action: "validateParams",
        errors: error.errors,
      });

      return {
        error: NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid route parameters",
              details: error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
                code: err.code,
              })),
            },
          },
          { status: 400 }
        ),
      };
    }

    apiLogger.error("Params parsing failed", error, {
      action: "validateParams",
    });

    return {
      error: NextResponse.json(
        {
          error: {
            code: "INVALID_PARAMS",
            message: "Invalid route parameters",
          },
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate form data
 */
export async function validateFormData<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    const validated = schema.parse(data);
    return { data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      apiLogger.warn("Form data validation failed", {
        action: "validateFormData",
        errors: error.errors,
      });

      return {
        error: NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid form data",
              details: error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
                code: err.code,
              })),
            },
          },
          { status: 400 }
        ),
      };
    }

    apiLogger.error("Form data parsing failed", error, {
      action: "validateFormData",
    });

    return {
      error: NextResponse.json(
        {
          error: {
            code: "INVALID_FORM_DATA",
            message: "Invalid form data",
          },
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Safe parse - returns validated data or null (for non-critical validation)
 */
export function safeParse<T>(data: unknown, schema: z.ZodSchema<T>): T | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  apiLogger.debug("Safe parse failed", {
    errors: result.error.errors,
  });
  return null;
}
