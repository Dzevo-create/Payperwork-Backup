/**
 * Presentations Section
 *
 * Shows list of presentations in the chat sidebar.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 4: Layout Integration
 */

'use client';

import React from 'react';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { useRouter } from 'next/navigation';
import { Presentation, Plus } from 'lucide-react';

interface PresentationItemProps {
  presentation: {
    id: string;
    prompt: string;
    status: string;
    created_at: string;
  };
  onClick: () => void;
}

function PresentationItem({ presentation, onClick }: PresentationItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500';
      case 'generating':
        return 'bg-blue-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const truncatePrompt = (prompt: string, maxLength: number = 30) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-2 hover:bg-pw-black/10 active:bg-pw-black/20 rounded-lg transition-all duration-200 flex items-start gap-2 group"
    >
      <div className={`w-2 h-2 rounded-full mt-1.5 ${getStatusColor(presentation.status)}`} />
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm text-pw-black/80 truncate group-hover:text-pw-black">
          {truncatePrompt(presentation.prompt)}
        </p>
        <p className="text-xs text-pw-black/50">
          {new Date(presentation.created_at).toLocaleDateString()}
        </p>
      </div>
    </button>
  );
}

export function PresentationsSection() {
  const presentations = useSlidesStore((state) => state.presentations);
  const router = useRouter();

  // Show only the 5 most recent presentations
  const recentPresentations = presentations.slice(0, 5);

  return (
    <div className="px-2 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <p className="text-xs text-pw-black/50 font-semibold uppercase tracking-wide">
          Presentations
        </p>
        <button
          onClick={() => router.push('/chat?workflow=slides')}
          className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          aria-label="New Presentation"
        >
          <Plus className="w-3 h-3" />
          <span>New</span>
        </button>
      </div>

      {/* Presentations List */}
      <div className="space-y-1">
        {recentPresentations.length === 0 ? (
          <div className="px-2 py-3 text-center">
            <Presentation className="w-8 h-8 mx-auto text-pw-black/30 mb-2" />
            <p className="text-xs text-pw-black/50">No presentations yet</p>
            <button
              onClick={() => router.push('/chat?workflow=slides')}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Create your first presentation
            </button>
          </div>
        ) : (
          recentPresentations.map((presentation) => (
            <PresentationItem
              key={presentation.id}
              presentation={presentation}
              onClick={() => router.push(`/chat?workflow=slides&id=${presentation.id}`)}
            />
          ))
        )}
      </div>

      {/* View All Link */}
      {presentations.length > 5 && (
        <div className="px-2 pt-1">
          <button
            onClick={() => router.push('/slides')}
            className="text-xs text-primary hover:underline"
          >
            View all ({presentations.length})
          </button>
        </div>
      )}
    </div>
  );
}
