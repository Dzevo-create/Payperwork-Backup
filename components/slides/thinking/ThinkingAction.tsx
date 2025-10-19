/**
 * Thinking Action
 *
 * Single action within a thinking step.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Frontend Components
 */

'use client';

import React from 'react';
import { ThinkingAction as ThinkingActionType } from '@/types/slides';
import {
  Search,
  Globe,
  FileText,
  Terminal,
  Lightbulb,
  FileEdit,
  ScanSearch,
} from 'lucide-react';

interface ThinkingActionProps {
  action: ThinkingActionType;
}

export function ThinkingAction({ action }: ThinkingActionProps) {
  const ActionIcon =
    {
      searching: Search,
      browsing: Globe,
      creating_file: FileText,
      executing_command: Terminal,
      knowledge_recalled: Lightbulb,
      generating_slides: FileEdit,
      analyzing_content: ScanSearch,
    }[action.type] || FileText;

  return (
    <div className="flex items-start gap-2 text-sm">
      <ActionIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      <span className="text-muted-foreground">{action.text}</span>
    </div>
  );
}
