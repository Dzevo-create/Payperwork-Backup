"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useWebSocket } from "@/hooks/slides/useWebSocket";
import NewPresentationModal from "@/components/slides/NewPresentationModal";
import PresentationsList from "@/components/slides/PresentationsList";
import { Presentation } from "@/types/slides";

export default function SlidesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  // TODO: Get user ID from auth context
  const userId = null;

  // WebSocket for real-time updates
  useWebSocket(userId, {
    onPresentationReady: (data) => {
      toast({
        title: "Präsentation fertig!",
        description: "Deine Präsentation wurde erfolgreich erstellt.",
      });
      fetchPresentations();
    },
    onPresentationError: (data) => {
      toast({
        title: "Fehler",
        description: `Präsentation konnte nicht erstellt werden: ${data.error}`,
        variant: "destructive",
      });
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
    setIsLoading(true);
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

      setIsModalOpen(false);
      fetchPresentations();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Präsentation konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

      fetchPresentations();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Präsentation konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Presentations</h1>
          <p className="text-muted-foreground">
            Erstelle professionelle Präsentationen mit AI
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neue Präsentation
        </Button>
      </div>

      <PresentationsList
        presentations={presentations}
        onPresentationClick={(id) => router.push(`/slides/${id}`)}
        onPresentationDelete={handleDeletePresentation}
        isLoading={isFetching}
      />

      <NewPresentationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePresentation}
        isLoading={isLoading}
      />
    </div>
  );
}
