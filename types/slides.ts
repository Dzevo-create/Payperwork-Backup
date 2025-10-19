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

// ============================================
// NEW: Thinking Display Types (Phase 1)
// Added: 2025-10-19
// ============================================

/**
 * Thinking Action Type
 *
 * Represents the type of action the AI is performing during slide generation
 */
export type ThinkingActionType =
  | "searching"           // AI is searching for information
  | "browsing"            // AI is browsing a webpage
  | "creating_file"       // AI is creating a file
  | "executing_command"   // AI is executing a command
  | "knowledge_recalled"  // AI is recalling knowledge
  | "generating_slides"   // AI is generating slides
  | "analyzing_content";  // AI is analyzing content

/**
 * Thinking Step Status
 *
 * Represents the current status of a thinking step
 */
export type ThinkingStepStatus =
  | "pending"    // Step is waiting to start
  | "running"    // Step is currently executing
  | "completed"  // Step finished successfully
  | "failed";    // Step failed with error

/**
 * Thinking Action
 *
 * Represents a single action within a thinking step (e.g., a search query, file creation)
 */
export interface ThinkingAction {
  id: string;
  type: ThinkingActionType;
  text: string;  // Description of the action (e.g., "Searching for Apple's history...")
  timestamp?: string;  // Optional: ISO timestamp when the action occurred
}

/**
 * Thinking Step
 *
 * Represents a major step in the AI's reasoning process
 * Each step can contain multiple actions and has its own status
 */
export interface ThinkingStep {
  id: string;
  title: string;  // e.g., "Research Apple information and gather content"
  status: ThinkingStepStatus;
  description?: string;  // e.g., "Currently researching to gather content..."
  actions: ThinkingAction[];  // Sub-actions within this step
  result?: string;  // Summary after completion (e.g., "Reviewed Wikipedia and recent sources...")
  startedAt?: string;  // ISO timestamp when step started
  completedAt?: string;  // ISO timestamp when step completed
}

// ============================================
// NEW: Generation Status Types (Phase 1)
// ============================================

/**
 * Generation Status
 *
 * Overall status of the slide generation workflow
 */
export type GenerationStatus =
  | "idle"        // No generation in progress
  | "thinking"    // AI is in reasoning/planning phase
  | "generating"  // AI is actively generating slides
  | "completed"   // Generation finished successfully
  | "error";      // Generation failed

/**
 * Live Preview Slide
 *
 * Type alias for slides shown in the live preview panel
 * (Same as Slide, but kept separate for semantic clarity)
 */
export type LivePreviewSlide = Slide;

// ============================================
// NEW: WebSocket Event Types (Phase 1)
// ============================================

/**
 * WebSocket Event: Thinking Step Update
 *
 * Sent from server when a thinking step is created or updated
 */
export interface WSThinkingStepUpdate {
  event: "thinking:step:update";
  data: ThinkingStep;
}

/**
 * WebSocket Event: Slide Preview Update
 *
 * Sent from server when a new slide is generated and ready for preview
 */
export interface WSSlidePreviewUpdate {
  event: "slide:preview:update";
  data: LivePreviewSlide;
}

/**
 * WebSocket Event: Generation Status Update
 *
 * Sent from server when the overall generation status changes
 */
export interface WSGenerationStatusUpdate {
  event: "generation:status";
  data: {
    presentationId: string;
    status: GenerationStatus;
    message?: string;
  };
}

/**
 * WebSocket Event: Generation Error
 *
 * Sent from server when generation fails
 */
export interface WSGenerationError {
  event: "generation:error";
  data: {
    presentationId: string;
    error: string;
    step?: string;  // Which step failed
  };
}

/**
 * WebSocket Event: Generation Completed
 *
 * Sent from server when slide generation is fully complete
 */
export interface WSGenerationCompleted {
  event: "generation:completed";
  data: {
    presentationId: string;
    presentation: Presentation;
    slides: Slide[];
  };
}

/**
 * Union type for all WebSocket events related to slides workflow
 */
export type WSEvent =
  | WSThinkingStepUpdate
  | WSSlidePreviewUpdate
  | WSGenerationStatusUpdate
  | WSGenerationError
  | WSGenerationCompleted;

// ============================================
// NEW: Chat-based Workflow Types
// Added: 2025-10-19
// ============================================

/**
 * Slides Message Type
 *
 * Represents the type of message in the chat-based workflow
 */
export type SlidesMessageType =
  | "user"             // User's prompt/question
  | "thinking"         // AI is thinking (loading state)
  | "topics"           // AI generated slide topics (awaiting approval)
  | "generation"       // AI is generating slides (progress updates)
  | "result"           // Final result with actions
  | "tool_action"      // AI tool usage (Search, Browse, Python, etc.)
  | "agent_thinking"   // Agent thinking step (Manus AI style)
  | "agent_insight"    // Agent insight/finding
  | "research_source"; // Research source found

/**
 * Slides Message
 *
 * Represents a single message in the slides workflow chat interface
 */
export interface SlidesMessage {
  id: string;
  type: SlidesMessageType;
  content: string | string[] | SlidesMessageContent | ToolAction;
  timestamp: string;
  approved?: boolean;  // For topics messages
}

/**
 * Slides Message Content
 *
 * Extended content for result messages
 */
export interface SlidesMessageContent {
  presentationId?: string;
  slideCount?: number;
  topics?: string[];
  progress?: number;
  error?: string;
}

/**
 * Topic
 *
 * Represents a single slide topic with order, title, and description
 */
export interface Topic {
  order: number;
  title: string;
  description: string;
}

/**
 * Topics Generation Request
 *
 * Request payload for generating slide topics
 */
export interface GenerateTopicsRequest {
  prompt: string;
  format: PresentationFormat;
  theme: PresentationTheme;
}

/**
 * Topics Generation Response
 *
 * Response from topic generation API
 */
export interface GenerateTopicsResponse {
  success: boolean;
  topics: Topic[];
  messageId: string;
}

/**
 * Approve Topics Request
 *
 * Request payload for approving topics and starting generation
 */
export interface ApproveTopicsRequest {
  topics: Topic[];
  format: PresentationFormat;
  theme: PresentationTheme;
  presentationId?: string;
}

/**
 * Regenerate Topics Request
 *
 * Request payload for regenerating topics
 */
export interface RegenerateTopicsRequest {
  prompt: string;
  format: PresentationFormat;
  theme: PresentationTheme;
}

/**
 * WebSocket Event: Topics Generated
 *
 * Sent from server when topics are ready
 */
export interface WSTopicsGenerated {
  event: "topics:generated";
  data: {
    topics: Topic[];
    messageId: string;
  };
}

// ============================================
// NEW: Tool Use Display Types (Phase 1 - Manus Mirroring)
// Added: 2025-10-19
// ============================================

/**
 * Tool Type
 *
 * The type of tool the AI is using
 */
export type ToolType =
  | "search"      // Google Search
  | "browse"      // Web browsing
  | "python"      // Python execution
  | "bash"        // Bash command
  | "file";       // File operations

/**
 * Tool Action Status
 *
 * Status of a tool action
 */
export type ToolActionStatus =
  | "running"     // Tool is executing
  | "completed"   // Tool finished successfully
  | "failed";     // Tool failed with error

/**
 * Tool Search Result
 *
 * Result from a search tool
 */
export interface ToolSearchResult {
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
}

/**
 * Tool Browse Result
 *
 * Result from browsing a webpage
 */
export interface ToolBrowseResult {
  url: string;
  title: string;
  content: string;  // Extracted text content
  html?: string;    // Optional: full HTML
  screenshot?: string;  // Optional: screenshot URL
}

/**
 * Tool Python Result
 *
 * Result from Python code execution
 */
export interface ToolPythonResult {
  code: string;
  output: string;
  error?: string;
  stdout?: string;
  stderr?: string;
}

/**
 * Tool File Result
 *
 * Result from file operations
 */
export interface ToolFileResult {
  filename: string;
  content: string;
  operation: "read" | "write" | "create" | "delete";
}

/**
 * Tool Action Result
 *
 * Generic result from any tool action
 */
export type ToolActionResult =
  | ToolSearchResult[]
  | ToolBrowseResult
  | ToolPythonResult
  | ToolFileResult;

/**
 * Tool Action
 *
 * Represents a tool being used by the AI
 */
export interface ToolAction {
  id: string;
  type: ToolType;
  status: ToolActionStatus;
  input: string;  // Input to the tool (e.g., search query, URL, code)
  result?: ToolActionResult;  // Result from the tool
  error?: string;  // Error message if failed
  timestamp: string;  // ISO timestamp
  duration?: number;  // Execution time in milliseconds
}

/**
 * Tool Action Message
 *
 * Message type for displaying tool usage in the chat
 */
export interface ToolActionMessage extends SlidesMessage {
  type: "tool_action";
  content: ToolAction;
}

/**
 * WebSocket Event: Tool Action Started
 *
 * Sent when AI starts using a tool
 */
export interface WSToolActionStarted {
  event: "tool:action:started";
  data: {
    toolAction: ToolAction;
    messageId: string;
  };
}

/**
 * WebSocket Event: Tool Action Completed
 *
 * Sent when tool finishes execution
 */
export interface WSToolActionCompleted {
  event: "tool:action:completed";
  data: {
    toolAction: ToolAction;
    messageId: string;
  };
}

/**
 * WebSocket Event: Tool Action Failed
 *
 * Sent when tool fails
 */
export interface WSToolActionFailed {
  event: "tool:action:failed";
  data: {
    toolAction: ToolAction;
    messageId: string;
    error: string;
  };
}

// ============================================
// Agent System Types (Manus AI Integration)
// Added: 2025-10-19
// ============================================

/**
 * Agent Type
 */
export type AgentType =
  | 'ResearchAgent'
  | 'TopicAgent'
  | 'ContentAgent'
  | 'DesignerAgent'
  | 'QualityAgent'
  | 'OrchestratorAgent';

/**
 * Agent Status
 */
export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'working'
  | 'waiting'
  | 'completed'
  | 'error';

/**
 * Agent State
 */
export interface AgentState {
  agent: AgentType;
  status: AgentStatus;
  currentAction?: string;
  progress?: number;
  startTime?: string;
  endTime?: string;
}

/**
 * Agent Insight
 */
export interface AgentInsight {
  agent: AgentType;
  insight: string;
  confidence: number;
  timestamp: string;
}

/**
 * Research Source (from ResearchAgent)
 */
export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
  timestamp: string;
}

/**
 * Pipeline Progress (4 Phases)
 */
export interface PipelineProgress {
  currentPhase: 'research' | 'topics' | 'content' | 'quality' | null;
  completedPhases: Array<'research' | 'topics' | 'content' | 'quality'>;
  overallProgress: number; // 0-100
}
