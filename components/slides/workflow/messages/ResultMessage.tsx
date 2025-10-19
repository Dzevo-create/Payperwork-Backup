'use client';

import React from 'react';
import { SlidesMessage, SlidesMessageContent } from '@/types/slides';
import { Bot, CheckCircle, Download, Edit, Share2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ResultMessageProps {
  message: SlidesMessage;
}

export function ResultMessage({ message }: ResultMessageProps) {
  const content = message.content as SlidesMessageContent;
  const isError = !!content?.error;

  const handleDownload = async () => {
    if (!content?.presentationId) return;

    try {
      const response = await fetch(`/api/slides/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentation_id: content.presentationId,
          format: 'pptx',
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const data = await response.json();
      window.open(data.download_url, '_blank');
    } catch (error) {
      console.error('Error downloading presentation:', error);
    }
  };

  const handleEdit = () => {
    if (!content?.presentationId) return;
    // TODO: Navigate to edit view
    console.log('Edit presentation:', content.presentationId);
  };

  const handleShare = () => {
    if (!content?.presentationId) return;
    // TODO: Open share modal
    console.log('Share presentation:', content.presentationId);
  };

  if (isError) {
    return (
      <div className="flex gap-3 items-start">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-destructive" />
        </div>
        <div className="flex-1">
          <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
            <h3 className="font-semibold mb-2 text-sm text-destructive">Generation Failed</h3>
            <p className="text-sm text-destructive/80">{content.error}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
        <CheckCircle className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <h3 className="font-semibold mb-2 text-sm text-green-900 dark:text-green-100">
            Presentation Complete!
          </h3>
          <p className="text-sm text-green-800 dark:text-green-200 mb-4">
            Your presentation with {content?.slideCount || 0} slides is ready.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleDownload} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleEdit} size="sm" variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button onClick={handleShare} size="sm" variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
