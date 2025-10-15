"use client";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "Wie kann ich helfen?",
  description = "Starten Sie eine neue Konversation, indem Sie eine Nachricht unten eingeben.",
}: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-semibold text-pw-black mb-3">{title}</h2>
        <p className="text-sm text-pw-black/60">{description}</p>
      </div>
    </div>
  );
}
