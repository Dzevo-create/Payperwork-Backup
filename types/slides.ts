// ============================================
// Slides Feature - TypeScript Types
// Version: 1.0
// Date: 2025-10-19
// ============================================

/**
 * Presentation Format (Aspect Ratio)
 */
export type PresentationFormat = "16:9" | "4:3" | "A4";

/**
 * Presentation Theme (Shadcn UI Themes)
 */
export type PresentationTheme =
  | "default"  // Slate - Professional, Business
  | "red"      // Red - Urgent, Sales
  | "rose"     // Rose - Feminine, Creative
  | "orange"   // Orange - Energetic, Startup
  | "green"    // Green - Nature, Finance
  | "blue"     // Blue - Trust, Technology
  | "yellow"   // Yellow - Optimistic, Education
  | "violet";  // Violet - Luxury, Premium

/**
 * Presentation Status
 */
export type PresentationStatus =
  | "generating"  // Manus API is generating slides
  | "ready"       // Slides are ready to view/edit
  | "error";      // Generation failed

/**
 * Slide Layout Types
 */
export type SlideLayout =
  | "title_slide"   // Title + Subtitle (centered)
  | "content"       // Title + Bullet Points
  | "two_column"    // Title + Two Columns
  | "image"         // Title + Large Image
  | "quote";        // Large Quote (centered)

/**
 * Manus Task Status
 */
export type ManusTaskStatus =
  | "pending"    // Task created, waiting to start
  | "running"    // Task is being processed
  | "completed"  // Task finished successfully
  | "failed";    // Task failed

/**
 * Export Format
 */
export type ExportFormat = "pdf" | "pptx";

// ============================================
// Database Models (matches Supabase schema)
// ============================================

/**
 * Presentation (Database Model)
 *
 * Represents a presentation with metadata and settings.
 * Maps to the `presentations` table in Supabase.
 */
export interface Presentation {
  id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  prompt: string;
  format: PresentationFormat;
  theme: PresentationTheme;
  status: PresentationStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Slide (Database Model)
 *
 * Represents a single slide within a presentation.
 * Maps to the `slides` table in Supabase.
 */
export interface Slide {
  id: string;
  presentation_id: string;
  order_index: number;
  title: string;
  content: string;  // Markdown format
  layout: SlideLayout;
  background_color: string | null;
  background_image: string | null;
  speaker_notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Manus Task (Database Model)
 *
 * Tracks the status of a Manus API task.
 * Maps to the `manus_tasks` table in Supabase.
 */
export interface ManusTask {
  id: string;
  task_id: string;
  presentation_id: string;
  status: ManusTaskStatus;
  webhook_data: any;  // JSONB from Manus webhook
  created_at: string;
  updated_at: string;
}

// ============================================
// API Request/Response Types
// ============================================

/**
 * Create Presentation Request
 *
 * Payload for POST /api/slides/generate
 */
export interface CreatePresentationRequest {
  prompt: string;
  format: PresentationFormat;
  theme: PresentationTheme;
}

/**
 * Create Presentation Response
 *
 * Response from POST /api/slides/generate
 */
export interface CreatePresentationResponse {
  presentation_id: string;
  task_id: string;
  status: PresentationStatus;
  message?: string;
}

/**
 * Get Presentations Response
 *
 * Response from GET /api/slides
 */
export interface GetPresentationsResponse {
  presentations: Presentation[];
  total: number;
}

/**
 * Get Presentation Response
 *
 * Response from GET /api/slides/[id]
 */
export interface GetPresentationResponse {
  presentation: Presentation;
  slides: Slide[];
}

/**
 * Export Presentation Request
 *
 * Payload for POST /api/slides/export
 */
export interface ExportPresentationRequest {
  presentation_id: string;
  format: ExportFormat;
}

/**
 * Export Presentation Response
 *
 * Response from POST /api/slides/export
 */
export interface ExportPresentationResponse {
  download_url: string;
  filename: string;
  format: ExportFormat;
}

/**
 * Update Slide Request
 *
 * Payload for PATCH /api/slides/[id]/slides/[slideId]
 */
export interface UpdateSlideRequest {
  title?: string;
  content?: string;
  layout?: SlideLayout;
  background_color?: string | null;
  background_image?: string | null;
  speaker_notes?: string | null;
}

/**
 * Delete Presentation Request
 *
 * Payload for DELETE /api/slides/[id]
 */
export interface DeletePresentationRequest {
  presentation_id: string;
}

// ============================================
// Manus API Types
// ============================================

/**
 * Manus Webhook Event
 *
 * Payload received from Manus API webhook
 */
export interface ManusWebhookEvent {
  event_type: "task_started" | "task_updated" | "task_stopped";
  task_detail: {
    task_id: string;
    stop_reason?: "finish" | "error" | "cancelled";
    message?: string;
    attachments?: ManusAttachment[];
  };
}

/**
 * Manus Attachment
 *
 * File attachment from Manus API
 */
export interface ManusAttachment {
  file_name: string;
  file_type: string;
  file_url: string;
  content?: string;  // For text files (JSON, Markdown)
}

/**
 * Manus Slides Response
 *
 * Expected structure from Manus API
 */
export interface ManusSlidesResponse {
  slides: {
    title: string;
    content: string;
    layout: SlideLayout;
    background_color?: string;
    speaker_notes?: string;
  }[];
}

// ============================================
// Frontend Component Props
// ============================================

/**
 * New Presentation Modal Props
 */
export interface NewPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePresentationRequest) => void;
  isLoading?: boolean;
}

/**
 * Slide Editor Props
 */
export interface SlideEditorProps {
  presentation: Presentation;
  slides: Slide[];
  onSlideUpdate: (slideId: string, data: UpdateSlideRequest) => void;
  onSlideDelete: (slideId: string) => void;
  onSlideReorder: (fromIndex: number, toIndex: number) => void;
}

/**
 * Slide List Props
 */
export interface SlideListProps {
  slides: Slide[];
  currentSlideIndex: number;
  onSlideSelect: (index: number) => void;
  onSlideAdd: () => void;
}

/**
 * Slide Canvas Props
 */
export interface SlideCanvasProps {
  slide: Slide;
  theme: PresentationTheme;
  format: PresentationFormat;
  isEditable?: boolean;
  onUpdate?: (data: UpdateSlideRequest) => void;
}

/**
 * Theme Switcher Props
 */
export interface ThemeSwitcherProps {
  currentTheme: PresentationTheme;
  onThemeChange: (theme: PresentationTheme) => void;
}

/**
 * Export Button Props
 */
export interface ExportButtonProps {
  presentationId: string;
  format: ExportFormat;
  onExportStart?: () => void;
  onExportComplete?: (url: string) => void;
  onExportError?: (error: Error) => void;
}

// ============================================
// Utility Types
// ============================================

/**
 * Partial Slide (for updates)
 */
export type PartialSlide = Partial<Omit<Slide, 'id' | 'presentation_id' | 'created_at' | 'updated_at'>>;

/**
 * Partial Presentation (for updates)
 */
export type PartialPresentation = Partial<Omit<Presentation, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

/**
 * Presentation with Slides
 */
export interface PresentationWithSlides extends Presentation {
  slides: Slide[];
}

/**
 * Slide with Presentation
 */
export interface SlideWithPresentation extends Slide {
  presentation: Presentation;
}
