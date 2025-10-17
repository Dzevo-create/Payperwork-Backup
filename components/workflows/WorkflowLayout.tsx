'use client';

import React from 'react';

interface WorkflowLayoutProps {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  overlays?: React.ReactNode;
  className?: string;
}

/**
 * Generic workflow layout container
 * Provides flexible slot-based layout without any business logic
 *
 * Layout structure:
 * ┌─────────────────────────────────────────────┐
 * │  [sidebar]  │  [header (optional)]          │
 * │             ├───────────────────────────────┤
 * │             │  [leftPanel]  │  [rightPanel] │
 * │             │               │               │
 * └─────────────────────────────────────────────┘
 * [overlays (lightbox, modals, etc.)]
 */
export function WorkflowLayout({
  sidebar,
  header,
  leftPanel,
  rightPanel,
  overlays,
  className = '',
}: WorkflowLayoutProps) {
  return (
    <div className={`flex h-screen bg-zinc-950 text-white ${className}`}>
      {/* Sidebar (optional) */}
      {sidebar}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header (optional) */}
        {header && (
          <div className="flex-shrink-0 border-b border-white/10">
            {header}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-hidden">
          {/* Left Panel */}
          {leftPanel && (
            <div className="flex flex-col gap-4 overflow-y-auto">
              {leftPanel}
            </div>
          )}

          {/* Right Panel */}
          {rightPanel && (
            <div className="flex flex-col gap-4 overflow-y-auto">
              {rightPanel}
            </div>
          )}
        </div>
      </div>

      {/* Overlays (Lightbox, Modals, etc.) */}
      {overlays}
    </div>
  );
}
