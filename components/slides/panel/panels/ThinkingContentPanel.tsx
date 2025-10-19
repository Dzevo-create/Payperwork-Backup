/**
 * Thinking Content Panel
 *
 * Shows AI reasoning/thinking steps.
 *
 * @author Payperwork Team
 * @date 2025-10-20
 */

'use client';

import React from 'react';
import { Brain, CheckCircle, Loader2 } from 'lucide-react';

interface ThinkingStep {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  timestamp?: string;
}

interface ThinkingContentPanelProps {
  steps: ThinkingStep[];
  isGenerating?: boolean;
}

export function ThinkingContentPanel({ steps, isGenerating = false }: ThinkingContentPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Content - Thinking Steps */}
      <div className="flex-1 overflow-y-auto p-4">
        {steps.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Brain className="w-16 h-16 text-pw-black/20 mb-4" />
            <h3 className="text-sm font-medium text-pw-black/60 mb-2">
              {isGenerating ? 'AI überlegt...' : 'Keine Denkschritte'}
            </h3>
            <p className="text-xs text-pw-black/40 max-w-xs">
              {isGenerating
                ? 'Die AI plant die Schritte für deine Anfrage.'
                : 'Denkschritte der AI erscheinen hier während der Generierung.'}
            </p>
          </div>
        ) : (
          // All Thinking Steps Vertical
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="border border-pw-black/10 rounded-lg p-4 bg-white shadow-sm"
              >
                {/* Step Header */}
                <div className="flex items-start gap-3 mb-2">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : step.status === 'in_progress' ? (
                      <Loader2 className="w-5 h-5 text-pw-accent animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-pw-black/20" />
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-pw-black/40">
                        Schritt {index + 1}
                      </span>
                      {step.status === 'in_progress' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                          Läuft...
                        </span>
                      )}
                      {step.status === 'completed' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          Fertig
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-pw-black mb-2">{step.title}</h3>
                    <p className="text-xs text-pw-black/60 leading-relaxed">{step.content}</p>
                  </div>
                </div>

                {/* Timestamp */}
                {step.timestamp && (
                  <div className="text-xs text-pw-black/40 mt-2 pt-2 border-t border-pw-black/5">
                    {new Date(step.timestamp).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
