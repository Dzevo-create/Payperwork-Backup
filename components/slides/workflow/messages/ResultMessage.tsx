'use client';

import React from 'react';
import { SlidesMessage, SlidesMessageContent } from '@/types/slides';
import { CheckCircle, Download, Edit, Share2, AlertCircle } from 'lucide-react';
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

  const timeString = new Date(message.timestamp || Date.now()).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isError) {
    return (
      <div className="group flex flex-col items-start pl-12 sm:pl-16 md:pl-24 lg:pl-32">
        {/* Timestamp */}
        <div className="text-[10px] text-pw-black/40 mb-1 px-1 text-left">
          {timeString}
        </div>

        {/* Error Message Bubble */}
        <div className="max-w-3xl w-full px-4 sm:px-6 py-4 sm:py-5 bg-red-50 border border-red-200 text-pw-black shadow-sm rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <h3 className="font-semibold text-sm text-red-900">Fehler bei der Erstellung</h3>
          </div>
          <p className="text-sm text-red-800">{content.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col items-start pl-12 sm:pl-16 md:pl-24 lg:pl-32">
      {/* Timestamp */}
      <div className="text-[10px] text-pw-black/40 mb-1 px-1 text-left">
        {timeString}
      </div>

      {/* Success Message Bubble */}
      <div className="max-w-3xl w-full px-4 sm:px-6 py-4 sm:py-5 bg-white/90 border border-pw-black/10 text-pw-black shadow-sm rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-sm text-pw-black">
            Präsentation fertiggestellt!
          </h3>
        </div>
        <p className="text-sm text-pw-black/80 mb-4">
          Deine Präsentation mit {content?.slideCount || 0} Folien ist bereit.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleDownload} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Herunterladen
          </Button>
          <Button onClick={handleEdit} size="sm" variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Bearbeiten
          </Button>
          <Button onClick={handleShare} size="sm" variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Teilen
          </Button>
        </div>
      </div>
    </div>
  );
}
