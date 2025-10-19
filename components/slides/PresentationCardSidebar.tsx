"use client";

import { Presentation } from "@/types/slides";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Trash2, FilePresentation } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PresentationCardSidebarProps {
  presentation: Presentation;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export default function PresentationCardSidebar({
  presentation,
  isSelected,
  onClick,
  onDelete,
}: PresentationCardSidebarProps) {
  const getStatusBadge = () => {
    switch (presentation.status) {
      case "ready":
        return <Badge variant="default" className="text-xs">Fertig</Badge>;
      case "generating":
        return (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            Lädt
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="gap-1 text-xs">
            <AlertCircle className="w-2.5 h-2.5" />
            Fehler
          </Badge>
        );
    }
  };

  const getThemeColor = () => {
    const themeColors: Record<string, string> = {
      default: "#64748b",
      red: "#ef4444",
      rose: "#f43f5e",
      orange: "#f97316",
      green: "#22c55e",
      blue: "#3b82f6",
      yellow: "#eab308",
      violet: "#8b5cf6",
    };
    return themeColors[presentation.theme] || themeColors.default;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent/50",
        isSelected && "bg-accent border-primary shadow-sm"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div
          className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${getThemeColor()}20` }}
        >
          <FilePresentation
            className="w-4 h-4"
            style={{ color: getThemeColor() }}
          />
        </div>
        {getStatusBadge()}
      </div>

      {/* Title */}
      <h4 className="font-medium text-sm line-clamp-2 mb-1">
        {presentation.title}
      </h4>

      {/* Prompt */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
        {presentation.prompt}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(presentation.created_at), {
            addSuffix: true,
            locale: de,
          })}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        <span>{presentation.format}</span>
        <span>•</span>
        <span className="capitalize">{presentation.theme}</span>
      </div>
    </div>
  );
}
