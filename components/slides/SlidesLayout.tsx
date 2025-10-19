"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { useWebSocket } from "@/hooks/slides/useWebSocket";
import { Presentation } from "@/types/slides";
import SlidesSidebar from "./SlidesSidebar";
import SlidesMainContainer from "./SlidesMainContainer";
import SlidesPreviewPanel from "./SlidesPreviewPanel";

export default function SlidesLayout() {
  const { toast } = useToast();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [selectedPresentationId, setSelectedPresentationId] = useState<
    string | null
  >(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // TODO: Get user ID from auth context
  const userId = null;

  // WebSocket for real-time updates
  useWebSocket(userId, {
    onPresentationReady: (data) => {
      toast({
        title: "Präsentation fertig!",
        description: "Deine Präsentation wurde erfolgreich erstellt.",
      });
      setIsGenerating(false);
      fetchPresentations();
    },
    onPresentationError: (data) => {
      toast({
        title: "Fehler",
        description: `Präsentation konnte nicht erstellt werden: ${data.error}`,
        variant: "destructive",
      });
      setIsGenerating(false);
      fetchPresentations();
    },
  });

  // Fetch presentations
  const fetchPresentations = async () => {
    try {
      setIsFetching(true);
      const response = await fetch("/api/slides");
      const data = await response.json();

      if (data.success) {
        setPresentations(data.data.presentations);
      }
    } catch (error) {
      console.error("Failed to fetch presentations:", error);
      toast({
        title: "Fehler",
        description: "Präsentationen konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchPresentations();
  }, []);

  // Create presentation
  const handleCreatePresentation = async (data: any) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/slides/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create presentation");

      const result = await response.json();

      toast({
        title: "Präsentation wird erstellt",
        description: "Du wirst benachrichtigt, wenn sie fertig ist.",
      });

      setIsCreatingNew(false);
      fetchPresentations();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Präsentation konnte nicht erstellt werden.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  // Delete presentation
  const handleDeletePresentation = async (id: string) => {
    try {
      const response = await fetch(`/api/slides/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete presentation");

      toast({
        title: "Gelöscht",
        description: "Präsentation wurde erfolgreich gelöscht.",
      });

      // If deleted presentation was selected, clear selection
      if (selectedPresentationId === id) {
        setSelectedPresentationId(null);
      }

      fetchPresentations();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Präsentation konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  // Select presentation
  const handleSelectPresentation = (id: string) => {
    setSelectedPresentationId(id);
    setIsCreatingNew(false);
  };

  // Start creating new presentation
  const handleNewPresentation = () => {
    setIsCreatingNew(true);
    setSelectedPresentationId(null);
  };

  // Cancel creating new presentation
  const handleCancelNew = () => {
    setIsCreatingNew(false);
  };

  // Get selected presentation
  const selectedPresentation = presentations.find(
    (p) => p.id === selectedPresentationId
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left: Sidebar */}
      <SlidesSidebar
        presentations={presentations}
        selectedPresentationId={selectedPresentationId}
        onSelectPresentation={handleSelectPresentation}
        onNewPresentation={handleNewPresentation}
        onDeletePresentation={handleDeletePresentation}
        isLoading={isFetching}
      />

      {/* Middle: Main Container */}
      <SlidesMainContainer
        isCreatingNew={isCreatingNew}
        selectedPresentation={selectedPresentation}
        onCreatePresentation={handleCreatePresentation}
        onCancelNew={handleCancelNew}
        isGenerating={isGenerating}
      />

      {/* Right: Preview Panel (only when presentation is selected) */}
      {selectedPresentation && selectedPresentation.status === "ready" && (
        <SlidesPreviewPanel presentation={selectedPresentation} />
      )}
    </div>
  );
}
