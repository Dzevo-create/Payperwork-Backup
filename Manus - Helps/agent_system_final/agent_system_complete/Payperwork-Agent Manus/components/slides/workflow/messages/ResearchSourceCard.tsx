/**
 * Research Source Card Component
 *
 * Displays research sources found by the Research Agent.
 * Shows title, URL, snippet, and relevance score.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

'use client';

import React from 'react';
import { ExternalLink, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

export interface ResearchSourceCardProps {
  title: string;
  url: string;
  snippet: string;
  relevance: number; // 0-1
  timestamp?: string;
  className?: string;
}

// ============================================
// Component
// ============================================

export function ResearchSourceCard({
  title,
  url,
  snippet,
  relevance,
  timestamp,
  className,
}: ResearchSourceCardProps) {
  const relevancePercent = Math.round(relevance * 100);
  const relevanceColor =
    relevance >= 0.8
      ? 'text-green-500'
      : relevance >= 0.5
      ? 'text-yellow-500'
      : 'text-gray-500';

  return (
    <div
      className={cn(
        'group p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-200',
        'animate-in fade-in slide-in-from-bottom-2',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        {/* Title */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 group-hover:underline"
        >
          {title}
        </a>

        {/* Relevance Badge */}
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap',
            'bg-muted'
          )}
        >
          <Star className={cn('w-3 h-3', relevanceColor)} fill="currentColor" />
          <span className={relevanceColor}>{relevancePercent}%</span>
        </div>
      </div>

      {/* Snippet */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
        {snippet}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        {/* URL */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors truncate"
        >
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{new URL(url).hostname}</span>
        </a>

        {/* Timestamp */}
        {timestamp && (
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// Compact Variant
// ============================================

export function ResearchSourceCardCompact({
  title,
  url,
  relevance,
  className,
}: Omit<ResearchSourceCardProps, 'snippet' | 'timestamp'>) {
  const relevancePercent = Math.round(relevance * 100);
  const relevanceColor =
    relevance >= 0.8
      ? 'text-green-500'
      : relevance >= 0.5
      ? 'text-yellow-500'
      : 'text-gray-500';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md border bg-card hover:bg-accent/50 transition-colors',
        'animate-in fade-in slide-in-from-left-2',
        className
      )}
    >
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <span className="text-xs flex-1 truncate">{title}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Star className={cn('w-3 h-3', relevanceColor)} fill="currentColor" />
        <span className={cn('text-xs', relevanceColor)}>{relevancePercent}%</span>
      </div>
    </a>
  );
}

// ============================================
// List Container
// ============================================

export function ResearchSourceList({
  sources,
  className,
}: {
  sources: ResearchSourceCardProps[];
  className?: string;
}) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="text-sm font-medium text-foreground mb-3">
        Research Sources ({sources.length})
      </div>
      {sources.map((source, index) => (
        <ResearchSourceCard key={index} {...source} />
      ))}
    </div>
  );
}

