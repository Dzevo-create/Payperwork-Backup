/**
 * Slides Welcome Screen
 *
 * Welcome screen for slides workflow (centered, like ChatWelcome)
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

'use client';

import { Presentation } from 'lucide-react';

export function SlidesWelcome() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      {/* Icon/Logo */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Presentation className="w-10 h-10 text-primary" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-pw-black mb-3">
          Erstelle deine Präsentation
        </h1>

        <p className="text-pw-black/60 text-lg max-w-md mx-auto mb-8">
          Beschreibe dein Thema und ich erstelle eine professionelle Präsentation für dich.
        </p>

        <div className="text-sm text-pw-black/40 max-w-md mx-auto">
          <p className="mb-2">Du kannst auch:</p>
          <ul className="list-disc list-inside text-left space-y-1">
            <li>Dateien hochladen (PDFs, Bilder)</li>
            <li>Per Spracheingabe diktieren</li>
            <li>Format und Theme anpassen</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
