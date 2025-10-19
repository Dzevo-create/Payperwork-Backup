/**
 * Thinking Step Skeleton
 *
 * Loading placeholder for thinking steps.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Frontend Components
 */

'use client';

import React from 'react';

export function ThinkingStepSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-2 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-5 w-5 rounded-full bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}
