"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import SlideEditor from "@/components/slides/SlideEditor";
import { Presentation, Slide } from "@/types/slides";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export default function SlideEditorPage() {
  const params = useParams();
  const presentationId = params.id as string;
  const { toast } = useToast();

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPresentation();
  }, [presentationId]);

  const fetchPresentation = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/slides/${presentationId}`);
      const data = await response.json();

      if (data.success) {
        setPresentation(data.data.presentation);
        setSlides(data.data.slides);
      } else {
        toast({
          title: "Fehler",
          description: "Präsentation konnte nicht geladen werden.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch presentation:", error);
      toast({
        title: "Fehler",
        description: "Präsentation konnte nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlideUpdate = async (slideId: string, data: Partial<Slide>) => {
    try {
      const response = await fetch(
        `/api/slides/${presentationId}/slides/${slideId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update slide");
      }

      // Update local state
      setSlides((prevSlides) =>
        prevSlides.map((slide) =>
          slide.id === slideId ? { ...slide, ...data } : slide
        )
      );

      toast({
        title: "Gespeichert",
        description: "Änderungen wurden gespeichert.",
      });
    } catch (error) {
      console.error("Failed to update slide:", error);
      toast({
        title: "Fehler",
        description: "Änderungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const handleSlideDelete = async (slideId: string) => {
    try {
      const response = await fetch(
        `/api/slides/${presentationId}/slides/${slideId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete slide");
      }

      toast({
        title: "Gelöscht",
        description: "Slide wurde gelöscht.",
      });

      fetchPresentation();
    } catch (error) {
      console.error("Failed to delete slide:", error);
      toast({
        title: "Fehler",
        description: "Slide konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: "pdf" | "pptx") => {
    // TODO: Implement export (Phase 9)
    toast({
      title: "Export",
      description: `Export als ${format.toUpperCase()} wird in Phase 9 implementiert.`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Präsentation nicht gefunden</h1>
          <p className="text-muted-foreground">
            Die angeforderte Präsentation existiert nicht.
          </p>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Keine Slides</h1>
          <p className="text-muted-foreground">
            Diese Präsentation hat noch keine Slides.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SlideEditor
      presentation={presentation}
      slides={slides}
      onSlideUpdate={handleSlideUpdate}
      onSlideDelete={handleSlideDelete}
      onExport={handleExport}
    />
  );
}
