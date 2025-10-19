"use client";

import SlidesLayout from "@/components/slides/SlidesLayout";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">
          Something went wrong
        </h2>
        <p className="text-muted-foreground">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export default function SlidesPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SlidesLayout />
    </ErrorBoundary>
  );
}
