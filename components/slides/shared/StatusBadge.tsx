/**
 * Status Badge
 *
 * Shows status with appropriate color.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Frontend Components
 */

'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { GenerationStatus } from '@/types/slides';

interface StatusBadgeProps {
  status: GenerationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    idle: { label: 'Idle', variant: 'secondary' as const },
    thinking: { label: 'Thinking', variant: 'default' as const },
    generating: { label: 'Generating', variant: 'default' as const },
    completed: { label: 'Completed', variant: 'default' as const },
    error: { label: 'Error', variant: 'destructive' as const },
  };

  const { label, variant } = variants[status];

  return <Badge variant={variant}>{label}</Badge>;
}
