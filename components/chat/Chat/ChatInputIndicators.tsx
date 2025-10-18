/**
 * ChatInputIndicators Component
 *
 * Displays status indicators and reply preview for ChatInput.
 * Shows transcribing status, uploading status, and reply-to message.
 */

'use client';

import { Loader2, Reply, X } from 'lucide-react';
import { Message } from '@/types/chat';
import { UI_TEXT, STYLE_CLASSES, formatReplyPreviewText } from '@/config/chatInput';

interface ChatInputIndicatorsProps {
  isTranscribing: boolean;
  isUploading: boolean;
  replyTo?: Message;
  onCancelReply?: () => void;
}

export function ChatInputIndicators({
  isTranscribing,
  isUploading,
  replyTo,
  onCancelReply,
}: ChatInputIndicatorsProps) {
  return (
    <>
      {/* Transcribing Indicator */}
      {isTranscribing && (
        <div className={STYLE_CLASSES.indicator}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{UI_TEXT.transcribing}</span>
        </div>
      )}

      {/* Uploading Indicator */}
      {isUploading && (
        <div className={STYLE_CLASSES.indicator}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{UI_TEXT.uploading}</span>
        </div>
      )}

      {/* Reply Preview */}
      {replyTo && (
        <div className={STYLE_CLASSES.replyPreview}>
          <Reply className="w-3.5 h-3.5 text-pw-black/40 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-pw-black/50 truncate">
              {formatReplyPreviewText(replyTo)}
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="flex-shrink-0 p-0.5 hover:bg-pw-black/10 rounded transition-colors"
            aria-label={UI_TEXT.replyPreview.cancelLabel}
          >
            <X className="w-3 h-3 text-pw-black/40" />
          </button>
        </div>
      )}
    </>
  );
}
