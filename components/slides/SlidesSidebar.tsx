"use client";

import { Presentation } from "@/types/slides";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Loader2, Presentation as PresentationIcon } from "lucide-react";
import PresentationCardSidebar from "./PresentationCardSidebar";

interface SlidesSidebarProps {
  presentations: Presentation[];
  selectedPresentationId: string | null;
  onSelectPresentation: (id: string) => void;
  onNewPresentation: () => void;
  onDeletePresentation: (id: string) => void;
  isLoading?: boolean;
}

export default function SlidesSidebar({
  presentations,
  selectedPresentationId,
  onSelectPresentation,
  onNewPresentation,
  onDeletePresentation,
  isLoading = false,
}: SlidesSidebarProps) {
  return (
    <div className="w-80 border-r bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center gap-2">
          <PresentationIcon className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">Presentations</h2>
        </div>
        <Button
          onClick={onNewPresentation}
          className="w-full"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Presentation
        </Button>
      </div>

      {/* Presentations List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : presentations.length === 0 ? (
          <div className="p-6 text-center">
            <PresentationIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No presentations yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "New Presentation" to create one
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {presentations.map((presentation) => (
              <PresentationCardSidebar
                key={presentation.id}
                presentation={presentation}
                isSelected={presentation.id === selectedPresentationId}
                onClick={() => onSelectPresentation(presentation.id)}
                onDelete={() => onDeletePresentation(presentation.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
