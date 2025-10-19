"use client";

import { Presentation, Sparkles, Zap, Layout } from "lucide-react";

export default function SlidesEmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-muted/20">
      <div className="text-center max-w-md space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Presentation className="w-10 h-10 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            AI-Powered Presentations
          </h2>
          <p className="text-muted-foreground">
            Create professional slide decks in seconds with AI
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-3 text-sm">
          <div className="flex items-start gap-3 text-left p-3 rounded-lg bg-background/50 border">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <div className="font-medium">Fast Generation</div>
              <div className="text-xs text-muted-foreground">
                AI creates slides from your description in seconds
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left p-3 rounded-lg bg-background/50 border">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Layout className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <div className="font-medium">Multiple Formats</div>
              <div className="text-xs text-muted-foreground">
                Choose from 16:9, 4:3, or A4 document formats
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left p-3 rounded-lg bg-background/50 border">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Presentation className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <div className="font-medium">Export Options</div>
              <div className="text-xs text-muted-foreground">
                Download as PDF, PPTX, or open in Manus Studio
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-4">
          <p className="text-sm text-muted-foreground">
            Select a presentation from the sidebar or click{" "}
            <span className="font-medium text-foreground">
              "New Presentation"
            </span>{" "}
            to get started
          </p>
        </div>
      </div>
    </div>
  );
}
