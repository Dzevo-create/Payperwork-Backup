"use client";

import { useEffect, useState } from "react";

/**
 * C1Renderer - Dynamically loads C1Component only when Super Chat is enabled
 *
 * This component acts as a clean separation layer between standard chat and Super Chat.
 * It uses runtime dynamic imports (not Next.js dynamic) to ensure C1 dependencies
 * are ONLY loaded when actually needed at runtime.
 *
 * Benefits:
 * - Standard chat can work completely independently of C1 dependencies
 * - No build errors when @thesysai/genui-sdk is missing or has missing peer deps
 * - Super Chat functionality is loaded on-demand at RUNTIME only
 * - Clean separation of concerns
 * - No webpack bundling issues
 */

interface C1RendererProps {
  c1Response: string;
  isStreaming?: boolean;
  updateMessage?: (newContent: string) => void;
  onAction?: (data: { llmFriendlyMessage: string }) => void;
}

export function C1Renderer(props: C1RendererProps) {
  const [C1Component, setC1Component] = useState<any>(null);
  const [ThemeProvider, setThemeProvider] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cssLoaded, setCssLoaded] = useState(false);

  useEffect(() => {
    // Only load C1 components on the client side at runtime
    if (typeof window === "undefined") return;

    let mounted = true;

    async function loadC1Components() {
      try {
        // Load CSS first (if not already loaded)
        if (!cssLoaded) {
          await import("@crayonai/react-ui/styles/index.css");
          if (mounted) setCssLoaded(true);
        }

        // Load C1 SDK components
        const c1Module = await import("@thesysai/genui-sdk");

        if (mounted) {
          setC1Component(() => c1Module.C1Component);
          setThemeProvider(() => c1Module.ThemeProvider);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("Failed to load C1 components:", err);
        if (mounted) {
          setError(err?.message || "Failed to load Super Chat");
          setIsLoading(false);
        }
      }
    }

    loadC1Components();

    return () => {
      mounted = false;
    };
  }, [cssLoaded]);

  // Check if content is incomplete (only check for placeholder message)
  // Content WITH <content> tags is valid and complete
  const isIncompleteContent =
    props.c1Response === "⏳ Generating interactive response..." ||
    props.c1Response === "" ||
    !props.c1Response;

  // Show loading for incomplete content or while loading SDK
  // NOTE: This should not be rendered since MessageContent already handles this case
  // But we keep it as a safety net
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-pw-black/60">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm">Lädt Super Chat Komponente...</span>
      </div>
    );
  }

  // Incomplete content should be handled by MessageContent component
  // If we reach here with incomplete content, it's an error in the flow
  if (isIncompleteContent) {
    console.warn("C1Renderer received incomplete content - this should be handled by MessageContent");
    return null;
  }

  // Error state
  if (error || !C1Component || !ThemeProvider) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">
          Super Chat ist nicht verfügbar. Bitte wechseln Sie zum Standard-Chat.
        </p>
        {error && (
          <p className="text-xs text-red-500 mt-1">Fehler: {error}</p>
        )}
      </div>
    );
  }

  // Success: Render C1Component with ThemeProvider
  const Component = C1Component;
  const Provider = ThemeProvider;

  // SIMPLE APPROACH: Extract content from <content>...</content> tags
  let contentToRender = props.c1Response;

  // If content has <content> tags, extract the inner content
  const match = props.c1Response.match(/<content>([\s\S]*?)<\/content>/);
  if (match) {
    contentToRender = match[1];
    console.log("🎯 C1Renderer extracted content from tags:", {
      originalLength: props.c1Response.length,
      extractedLength: contentToRender.length,
    });
  } else {
    console.log("⚠️ C1Renderer: No <content> tags found, using as-is");
  }

  // Unescape HTML entities that may have been escaped during storage/transmission
  const unescapedContent = contentToRender
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

  // Validate JSON before passing to C1Component
  try {
    // C1Component expects the content to be parseable JSON
    JSON.parse(unescapedContent);
  } catch (parseError) {
    console.error("❌ C1Renderer: Invalid JSON content:", parseError);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600 font-medium mb-2">
          Super Chat Rendering Error
        </p>
        <p className="text-xs text-red-500">
          The response format is invalid. Please try again.
        </p>
      </div>
    );
  }

  // Wrap back in <content> tags for C1Component (it expects this format)
  const c1Response = `<content>${unescapedContent}</content>`;

  return (
    <Provider>
      <Component
        c1Response={c1Response}
        isStreaming={props.isStreaming}
        updateMessage={props.updateMessage}
        onAction={props.onAction}
      />
    </Provider>
  );
}
