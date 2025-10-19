"use client";

import { Presentation, PresentationsListProps } from "@/types/slides";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Presentation as PresentationIcon,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export default function PresentationsList({
  presentations,
  onPresentationClick,
  onPresentationDelete,
  isLoading = false,
}: PresentationsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (presentations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <PresentationIcon className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Keine Präsentationen</h3>
        <p className="text-muted-foreground mb-4">
          Erstelle deine erste Präsentation mit AI
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {presentations.map((presentation) => (
        <PresentationCard
          key={presentation.id}
          presentation={presentation}
          onClick={() => onPresentationClick(presentation.id)}
          onDelete={() => onPresentationDelete(presentation.id)}
        />
      ))}
    </div>
  );
}

function PresentationCard({
  presentation,
  onClick,
  onDelete,
}: {
  presentation: Presentation;
  onClick: () => void;
  onDelete: () => void;
}) {
  const getStatusBadge = () => {
    switch (presentation.status) {
      case "ready":
        return <Badge variant="default">Fertig</Badge>;
      case "generating":
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Wird erstellt
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
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
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <div onClick={onClick}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
              style={{ backgroundColor: `${getThemeColor()}20` }}
            >
              <PresentationIcon
                className="w-5 h-5"
                style={{ color: getThemeColor() }}
              />
            </div>
            {getStatusBadge()}
          </div>
          <CardTitle className="line-clamp-2">{presentation.title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {presentation.prompt}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{presentation.format}</span>
            <span>•</span>
            <span className="capitalize">{presentation.theme}</span>
          </div>
        </CardContent>
      </div>

      <CardFooter className="flex justify-between">
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
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
