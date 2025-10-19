// ============================================
// Slides Feature - Constants
// Version: 1.0
// Date: 2025-10-19
// ============================================

import {
  PresentationFormat,
  PresentationTheme,
  SlideLayout
} from "@/types/slides";
import {
  Monitor,
  Square,
  FileText,
  LucideIcon
} from "lucide-react";

// ============================================
// Format Options
// ============================================

export interface FormatOption {
  value: PresentationFormat;
  label: string;
  description: string;
  dimensions: string;
  icon: LucideIcon;
  aspectRatio: number;
}

export const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: "16:9",
    label: "16:9 (Widescreen)",
    description: "Standard für Präsentationen",
    dimensions: "1920 × 1080 px",
    icon: Monitor,
    aspectRatio: 16 / 9,
  },
  {
    value: "4:3",
    label: "4:3 (Standard)",
    description: "Klassisches Format",
    dimensions: "1024 × 768 px",
    icon: Square,
    aspectRatio: 4 / 3,
  },
  {
    value: "A4",
    label: "A4 (Dokument)",
    description: "Für Drucken optimiert",
    dimensions: "210 × 297 mm",
    icon: FileText,
    aspectRatio: 210 / 297,
  },
];

// ============================================
// Theme Options (Shadcn UI Themes)
// ============================================

export interface ThemeOption {
  value: PresentationTheme;
  label: string;
  color: string;
  useCase: string;
  cssVariable: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "default",
    label: "Default",
    color: "#64748b",  // Slate
    useCase: "Professional, Business",
    cssVariable: "--theme-default",
  },
  {
    value: "red",
    label: "Red",
    color: "#ef4444",
    useCase: "Urgent, Sales",
    cssVariable: "--theme-red",
  },
  {
    value: "rose",
    label: "Rose",
    color: "#f43f5e",
    useCase: "Feminine, Creative",
    cssVariable: "--theme-rose",
  },
  {
    value: "orange",
    label: "Orange",
    color: "#f97316",
    useCase: "Energetic, Startup",
    cssVariable: "--theme-orange",
  },
  {
    value: "green",
    label: "Green",
    color: "#22c55e",
    useCase: "Nature, Finance",
    cssVariable: "--theme-green",
  },
  {
    value: "blue",
    label: "Blue",
    color: "#3b82f6",
    useCase: "Trust, Technology",
    cssVariable: "--theme-blue",
  },
  {
    value: "yellow",
    label: "Yellow",
    color: "#eab308",
    useCase: "Optimistic, Education",
    cssVariable: "--theme-yellow",
  },
  {
    value: "violet",
    label: "Violet",
    color: "#8b5cf6",
    useCase: "Luxury, Premium",
    cssVariable: "--theme-violet",
  },
];

// ============================================
// Layout Options
// ============================================

export interface LayoutOption {
  value: SlideLayout;
  label: string;
  description: string;
  icon: string;
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    value: "title_slide",
    label: "Title Slide",
    description: "Großer Titel + Untertitel (zentriert)",
    icon: "📊",
  },
  {
    value: "content",
    label: "Content",
    description: "Titel + Aufzählungspunkte",
    icon: "📝",
  },
  {
    value: "two_column",
    label: "Two Column",
    description: "Titel + Zwei Spalten",
    icon: "📑",
  },
  {
    value: "image",
    label: "Image",
    description: "Titel + Großes Bild",
    icon: "🖼️",
  },
  {
    value: "quote",
    label: "Quote",
    description: "Großes Zitat (zentriert)",
    icon: "💬",
  },
];

// ============================================
// Default Values
// ============================================

export const DEFAULT_PRESENTATION_FORMAT: PresentationFormat = "16:9";
export const DEFAULT_PRESENTATION_THEME: PresentationTheme = "default";
export const DEFAULT_SLIDE_LAYOUT: SlideLayout = "content";

// ============================================
// Limits & Validation
// ============================================

export const LIMITS = {
  // Prompt
  MIN_PROMPT_LENGTH: 10,
  MAX_PROMPT_LENGTH: 1000,

  // Slides
  MAX_SLIDES_PER_PRESENTATION: 50,
  MIN_SLIDES_PER_PRESENTATION: 1,

  // Presentations
  MAX_PRESENTATIONS_PER_USER_FREE: 5,
  MAX_PRESENTATIONS_PER_USER_PRO: 100,
  MAX_PRESENTATIONS_PER_USER_TEAM: 1000,

  // Content
  MAX_SLIDE_TITLE_LENGTH: 100,
  MAX_SLIDE_CONTENT_LENGTH: 5000,
  MAX_SPEAKER_NOTES_LENGTH: 1000,

  // Export
  MAX_EXPORT_FILE_SIZE_MB: 50,
};

// ============================================
// Error Messages
// ============================================

export const ERROR_MESSAGES = {
  // Prompt
  PROMPT_TOO_SHORT: `Prompt muss mindestens ${LIMITS.MIN_PROMPT_LENGTH} Zeichen lang sein`,
  PROMPT_TOO_LONG: `Prompt darf maximal ${LIMITS.MAX_PROMPT_LENGTH} Zeichen lang sein`,

  // Presentations
  MAX_PRESENTATIONS_REACHED: "Maximale Anzahl an Präsentationen erreicht",
  PRESENTATION_NOT_FOUND: "Präsentation nicht gefunden",
  PRESENTATION_NOT_READY: "Präsentation wird noch generiert",

  // Slides
  MAX_SLIDES_REACHED: `Maximale Anzahl an Slides (${LIMITS.MAX_SLIDES_PER_PRESENTATION}) erreicht`,
  SLIDE_NOT_FOUND: "Slide nicht gefunden",

  // Export
  EXPORT_FAILED: "Export fehlgeschlagen",
  EXPORT_FILE_TOO_LARGE: `Export-Datei zu groß (max. ${LIMITS.MAX_EXPORT_FILE_SIZE_MB} MB)`,

  // Manus API
  MANUS_API_ERROR: "Fehler bei der AI-Generierung",
  MANUS_TASK_FAILED: "AI-Generierung fehlgeschlagen",

  // Generic
  UNKNOWN_ERROR: "Ein unbekannter Fehler ist aufgetreten",
  UNAUTHORIZED: "Nicht autorisiert",
};

// ============================================
// Success Messages
// ============================================

export const SUCCESS_MESSAGES = {
  PRESENTATION_CREATED: "Präsentation wird erstellt...",
  PRESENTATION_UPDATED: "Präsentation aktualisiert",
  PRESENTATION_DELETED: "Präsentation gelöscht",
  SLIDE_CREATED: "Slide erstellt",
  SLIDE_UPDATED: "Slide aktualisiert",
  SLIDE_DELETED: "Slide gelöscht",
  EXPORT_STARTED: "Export wird vorbereitet...",
  EXPORT_COMPLETE: "Export erfolgreich",
};

// ============================================
// Manus API Configuration
// ============================================

export const MANUS_CONFIG = {
  BASE_URL: "https://api.manus.ai/v1",
  WEBHOOK_PATH: "/api/slides/manus-webhook",
  TASK_MODE: "agent",
  AGENT_PROFILE: "quality",

  // Prompt Template
  PROMPT_TEMPLATE: `Erstelle eine professionelle Präsentation im JSON-Format basierend auf dem folgenden Thema: {{input}}

Das JSON sollte folgende Struktur haben:
{
  "slides": [
    {
      "title": "Slide-Titel",
      "content": "Slide-Inhalt (Markdown)",
      "layout": "title_slide" | "content" | "two_column" | "image" | "quote",
      "speaker_notes": "Notizen für den Sprecher (optional)"
    }
  ]
}

Wichtig:
- Erstelle 5-10 Slides
- Verwende Markdown für Formatierung
- Wähle passende Layouts
- Füge Speaker Notes hinzu
- Strukturiere logisch (Intro → Content → Conclusion)`,
};

// ============================================
// WebSocket Events
// ============================================

export const WEBSOCKET_EVENTS = {
  // Client → Server
  AUTHENTICATE: "authenticate",

  // Server → Client
  PRESENTATION_READY: "presentation_ready",
  PRESENTATION_ERROR: "presentation_error",
  SLIDE_UPDATED: "slide_updated",

  // Connection
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",
};

// ============================================
// Routes
// ============================================

export const SLIDES_ROUTES = {
  // Pages
  LIST: "/slides",
  NEW: "/slides/new",
  EDITOR: (id: string) => `/slides/${id}`,

  // API
  API_BASE: "/api/slides",
  API_GENERATE: "/api/slides/generate",
  API_EXPORT: "/api/slides/export",
  API_WEBHOOK: "/api/slides/manus-webhook",
  API_DETAIL: (id: string) => `/api/slides/${id}`,
  API_SLIDE: (presentationId: string, slideId: string) =>
    `/api/slides/${presentationId}/slides/${slideId}`,
};
