/**
 * Centralized Zod Validation Schemas
 *
 * All API input validation schemas in one place for consistency and reusability.
 */

import { z } from "zod";

// ============================================
// Common Schemas
// ============================================

export const uuidSchema = z.string().uuid("Invalid UUID format");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// ============================================
// Slides API Schemas
// ============================================

export const slidesSettingsSchema = z.object({
  format: z.enum(["16:9", "4:3"]).default("16:9"),
  theme: z.enum(["professional", "creative", "minimal"]).default("professional"),
  slideCount: z.number().int().min(1).max(50).default(10),
  enableResearch: z.boolean().default(false),
  researchDepth: z.enum(["standard", "deep"]).default("standard"),
});

export const slidesPromptSchema = z.object({
  prompt: z.string().min(3, "Prompt must be at least 3 characters").max(2000, "Prompt too long"),
  settings: slidesSettingsSchema.optional(),
});

export const slidesPipelineSchema = z.object({
  prompt: z.string().min(3, "Prompt must be at least 3 characters").max(2000, "Prompt too long"),
  userId: uuidSchema,
  format: z.enum(["16:9", "4:3"]).default("16:9"),
  theme: z.string().default("default"),
  slideCount: z
    .number()
    .int()
    .min(1, "Slide count must be at least 1")
    .max(50, "Slide count cannot exceed 50")
    .default(10),
  enableResearch: z.boolean().default(false),
  researchDepth: z.enum(["quick", "medium", "deep"]).default("medium"),
});

export const generateTopicsSchema = z.object({
  prompt: z.string().min(3).max(2000),
  slideCount: z.number().int().min(1).max(50),
  enableResearch: z.boolean().default(false),
});

export const topicSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  estimatedSlides: z.number().int().min(1),
  researchInsights: z.array(z.string()).optional(),
});

export const generateSlidesSchema = z.object({
  presentationId: uuidSchema,
  topics: z.array(topicSchema),
  theme: z.enum(["professional", "creative", "minimal"]),
});

// ============================================
// Chat API Schemas
// ============================================

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(50000),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
  model: z.string().default("claude-3-5-sonnet-20241022"),
  maxTokens: z.number().int().min(1).max(200000).default(4096),
  conversationId: uuidSchema.optional(),
  temperature: z.number().min(0).max(1).optional(),
});

// ============================================
// Image Generation Schemas
// ============================================

export const imageSizeSchema = z.enum([
  "1024x1024",
  "1024x768",
  "768x1024",
  "1280x720",
  "720x1280",
  "1920x1080",
  "1080x1920",
]);

export const imageModelSchema = z.enum([
  "flux-pro",
  "flux-dev",
  "flux-schnell",
  "flux-1.1-pro",
  "flux-realism",
]);

export const imageGenerationSchema = z.object({
  prompt: z.string().min(3, "Prompt too short").max(2000, "Prompt too long"),
  model: imageModelSchema.default("flux-pro"),
  size: imageSizeSchema.default("1024x1024"),
  numImages: z.number().int().min(1).max(4).default(1),
  guidance: z.number().min(1).max(20).default(7.5),
  seed: z.number().int().optional(),
  negativePrompt: z.string().max(1000).optional(),
});

export const imageEnhanceSchema = z.object({
  prompt: z.string().min(1).max(1000),
  style: z.enum(["photorealistic", "artistic", "illustration", "abstract"]).optional(),
  brandContext: z
    .object({
      colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
});

// ============================================
// Video Generation Schemas
// ============================================

export const videoGenerationSchema = z.object({
  prompt: z.string().min(3).max(2000),
  duration: z.number().int().min(1).max(30).default(5),
  resolution: z.enum(["1280x720", "1920x1080", "720x1280"]).default("1280x720"),
  fps: z.enum([24, 30, 60]).default(24),
  imageUrl: z.string().url().optional(),
  seed: z.number().int().optional(),
});

export const videoStatusSchema = z.object({
  taskId: uuidSchema,
});

// ============================================
// Branding API Schemas
// ============================================

export const brandingSchema = z.object({
  colors: z
    .array(z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"))
    .max(10)
    .optional(),
  fonts: z.array(z.string()).max(5).optional(),
  keywords: z.array(z.string()).max(20).optional(),
  logoUrl: z.string().url().optional(),
  voiceTone: z.enum(["professional", "casual", "formal", "friendly"]).optional(),
});

// ============================================
// Library API Schemas
// ============================================

export const libraryQuerySchema = paginationSchema.extend({
  type: z.enum(["images", "videos", "slides"]).optional(),
  search: z.string().max(200).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const deleteItemSchema = z.object({
  id: uuidSchema,
});

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = loginSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const updatePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// ============================================
// Type Exports (for TypeScript)
// ============================================

export type SlidesSettings = z.infer<typeof slidesSettingsSchema>;
export type SlidesPrompt = z.infer<typeof slidesPromptSchema>;
export type SlidesPipeline = z.infer<typeof slidesPipelineSchema>;
export type GenerateTopics = z.infer<typeof generateTopicsSchema>;
export type Topic = z.infer<typeof topicSchema>;
export type GenerateSlides = z.infer<typeof generateSlidesSchema>;

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export type ImageGeneration = z.infer<typeof imageGenerationSchema>;
export type ImageEnhance = z.infer<typeof imageEnhanceSchema>;

export type VideoGeneration = z.infer<typeof videoGenerationSchema>;
export type VideoStatus = z.infer<typeof videoStatusSchema>;

export type Branding = z.infer<typeof brandingSchema>;

export type LibraryQuery = z.infer<typeof libraryQuerySchema>;
export type DeleteItem = z.infer<typeof deleteItemSchema>;

export type Login = z.infer<typeof loginSchema>;
export type Signup = z.infer<typeof signupSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type UpdatePassword = z.infer<typeof updatePasswordSchema>;
