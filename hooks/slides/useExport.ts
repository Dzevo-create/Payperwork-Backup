// ============================================
// Export Hook
// Version: 1.0
// Date: 2025-10-19
// ============================================

import { useState } from "react";
import { Presentation, Slide, ExportFormat } from "@/types/slides";
import { exportToPDF } from "@/lib/export/pdf-exporter";
import { exportToPPTX } from "@/lib/export/pptx-exporter";
import { useToast } from "@/hooks/useToast";

/**
 * Export hook
 *
 * @returns Export functions and state
 */
export function useExport() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  /**
   * Export presentation
   *
   * @param format - Export format (pdf or pptx)
   * @param presentation - Presentation metadata
   * @param slides - Array of slides
   * @param slideElements - Array of HTML elements (for PDF only)
   */
  const exportPresentation = async (
    format: ExportFormat,
    presentation: Presentation,
    slides: Slide[],
    slideElements?: HTMLElement[]
  ): Promise<void> => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      if (format === "pdf") {
        if (!slideElements || slideElements.length === 0) {
          throw new Error("Slide elements required for PDF export");
        }

        toast({
          title: "PDF wird erstellt...",
          description: `${slides.length} Slides werden exportiert`,
        });

        // Export to PDF
        await exportToPDF(presentation, slides, slideElements);

        setExportProgress(100);

        toast({
          title: "PDF erfolgreich erstellt!",
          description: "Der Download wurde gestartet.",
        });
      } else if (format === "pptx") {
        toast({
          title: "PPTX wird erstellt...",
          description: `${slides.length} Slides werden exportiert`,
        });

        // Export to PPTX
        await exportToPPTX(presentation, slides);

        setExportProgress(100);

        toast({
          title: "PPTX erfolgreich erstellt!",
          description: "Der Download wurde gestartet.",
        });
      }
    } catch (error) {
      console.error("Export failed:", error);

      toast({
        title: "Export fehlgeschlagen",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return {
    exportPresentation,
    isExporting,
    exportProgress,
  };
}
