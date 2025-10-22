"use client";

import React from "react";
import { SlidesMessage, SlidesMessageContent } from "@/types/slides";
import { CheckCircle, Download, Edit, Share2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { logger } from "@/lib/logger";

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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentation_id: content.presentationId,
          format: "pptx",
        }),
      });

      if (!response.ok) throw new Error("Export failed");

      const data = await response.json();
      window.open(data.download_url, "_blank");
    } catch (error) {
      console.error("Error downloading presentation:", error);
    }
  };

  const handleEdit = () => {
    if (!content?.presentationId) return;
    // TODO: Navigate to edit view
    logger.info("Edit presentation:", { value: content.presentationId });
  };

  const handleShare = () => {
    if (!content?.presentationId) return;
    // TODO: Open share modal
    logger.info("Share presentation:", { value: content.presentationId });
  };

  const timeString = new Date(message.timestamp || Date.now()).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isError) {
    return (
      <div className="group flex flex-col items-start pl-12 sm:pl-16 md:pl-24 lg:pl-32">
        {/* Timestamp */}
        <div className="text-pw-black/40 mb-1 px-1 text-left text-[10px]">{timeString}</div>

        {/* Error Message Bubble */}
        <div className="w-full max-w-3xl rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-pw-black shadow-sm sm:px-6 sm:py-5">
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <h3 className="text-sm font-semibold text-red-900">Fehler bei der Erstellung</h3>
          </div>
          <p className="text-sm text-red-800">{content.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col items-start pl-12 sm:pl-16 md:pl-24 lg:pl-32">
      {/* Timestamp */}
      <div className="text-pw-black/40 mb-1 px-1 text-left text-[10px]">{timeString}</div>

      {/* Success Message Bubble */}
      <div className="border-pw-black/10 w-full max-w-3xl rounded-2xl border bg-white/90 px-4 py-4 text-pw-black shadow-sm sm:px-6 sm:py-5">
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h3 className="text-sm font-semibold text-pw-black">Präsentation fertiggestellt!</h3>
        </div>
        <p className="text-pw-black/80 mb-4 text-sm">
          Deine Präsentation mit {content?.slideCount || 0} Folien ist bereit.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleDownload} size="sm">
            <Download className="mr-2 h-4 w-4" />
            Herunterladen
          </Button>
          <Button onClick={handleEdit} size="sm" variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Bearbeiten
          </Button>
          <Button onClick={handleShare} size="sm" variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Teilen
          </Button>
        </div>
      </div>
    </div>
  );
}
