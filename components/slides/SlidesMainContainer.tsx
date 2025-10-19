"use client";

import { Presentation } from "@/types/slides";
import NewPresentationPrompt from "./NewPresentationPrompt";
import SlidesEmptyState from "./SlidesEmptyState";
import SlideEditor from "./SlideEditor";

interface SlidesMainContainerProps {
  isCreatingNew: boolean;
  selectedPresentation: Presentation | undefined;
  onCreatePresentation: (data: any) => void;
  onCancelNew: () => void;
  isGenerating: boolean;
}

export default function SlidesMainContainer({
  isCreatingNew,
  selectedPresentation,
  onCreatePresentation,
  onCancelNew,
  isGenerating,
}: SlidesMainContainerProps) {
  // Show New Presentation Prompt
  if (isCreatingNew) {
    return (
      <NewPresentationPrompt
        onSubmit={onCreatePresentation}
        onCancel={onCancelNew}
        isLoading={isGenerating}
      />
    );
  }

  // Show Slides Editor if presentation is selected
  if (selectedPresentation) {
    return <SlideEditor presentationId={selectedPresentation.id} />;
  }

  // Show Empty State (no selection)
  return <SlidesEmptyState />;
}
