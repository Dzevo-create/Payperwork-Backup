"use client";

import { useEffect, useState } from "react";
import { chatLogger } from '@/lib/logger';

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

  useEffect(() => {
    // Only load C1 components on the client side at runtime
    if (typeof window === "undefined") return;

    let mounted = true;

    async function loadC1Components() {
      try {
        // Load C1 SDK components (CSS is bundled with the SDK)
        const c1Module = await import("@thesysai/genui-sdk");

        if (mounted) {
          setC1Component(() => c1Module.C1Component);
          setThemeProvider(() => c1Module.ThemeProvider);
          setIsLoading(false);
        }
      } catch (err) {
        chatLogger.error('Failed to load C1 components:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load Super Chat");
          setIsLoading(false);
        }
      }
    }

    loadC1Components();

    return () => {
      mounted = false;
    };
  }, []);

  // Check if content is incomplete (empty or very short)
  const isIncompleteContent =
    !props.c1Response ||
    props.c1Response === "" ||
    props.c1Response === "⏳ Generating interactive response...";

  // Show loading while SDK is loading OR content is incomplete
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

  // If streaming and content is incomplete, show loading
  if (props.isStreaming && isIncompleteContent) {
    return (
      <div className="flex items-center gap-2 text-pw-black/60">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm">Lädt Super Chat...</span>
      </div>
    );
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
  if (match && match[1]) {
    contentToRender = match[1];
    chatLogger.debug('C1Renderer extracted content from tags:', {
      originalLength: props.c1Response.length,
      extractedLength: contentToRender.length,
    });
  } else {
    chatLogger.warn('C1Renderer: No <content> tags found, using as-is');
  }

  // Unescape HTML entities that may have been escaped during storage/transmission
  const unescapedContent = contentToRender
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

  // Validate JSON before passing to C1Component
  // BUT: During streaming, content may be incomplete - only show error if NOT streaming
  try {
    // C1Component expects the content to be parseable JSON
    JSON.parse(unescapedContent);
  } catch (parseError) {
    // If streaming, just show loading - content is incomplete
    if (props.isStreaming) {
      return (
        <div className="flex items-center gap-2 text-pw-black/60">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm">Lädt Super Chat...</span>
        </div>
      );
    }

    // Not streaming but still invalid JSON - fallback to plain text rendering
    chatLogger.warn('C1Renderer: Content is not valid JSON, falling back to plain text', {
      error: parseError instanceof Error ? parseError.message : String(parseError),
      contentPreview: unescapedContent.substring(0, 100)
    });

    // Render as plain text with markdown-like formatting
    return (
      <div className="prose prose-sm max-w-none">
        <div className="whitespace-pre-wrap text-pw-black/90">
          {unescapedContent}
        </div>
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
