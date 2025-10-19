/**
 * Prompt Generator Modal
 *
 * Modal for structured prompt generation with:
 * - Topic/Theme input
 * - Design guidelines (CI/Brand colors)
 * - Target audience
 * - File uploads (images, PDFs for context)
 * - Format & Theme settings
 * - AI-powered prompt generation
 *
 * @author Payperwork Team
 * @date 2025-10-20
 */

'use client';

import { useState, useRef } from 'react';
import { X, Upload, Loader2, Sparkles } from 'lucide-react';
import { PresentationFormat, PresentationTheme } from '@/types/slides';

interface PromptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (generatedPrompt: string) => void;
  currentFormat: PresentationFormat;
  currentTheme: PresentationTheme;
}

export function PromptGeneratorModal({
  isOpen,
  onClose,
  onGenerate,
  currentFormat,
  currentTheme,
}: PromptGeneratorModalProps) {
  const [topic, setTopic] = useState('');
  const [designGuidelines, setDesignGuidelines] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [brandColors, setBrandColors] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert('Bitte gib ein Thema ein!');
      return;
    }

    setIsGenerating(true);

    try {
      // Build structured input for Claude
      const structuredInput = {
        topic,
        designGuidelines,
        targetAudience,
        brandColors,
        additionalNotes,
        format: currentFormat,
        theme: currentTheme,
        files: uploadedFiles.map((f) => ({ name: f.name, type: f.type, size: f.size })),
      };

      // Call API to generate optimized prompt
      const response = await fetch('/api/slides/workflow/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(structuredInput),
      });

      const data = await response.json();

      if (data.success && data.generatedPrompt) {
        onGenerate(data.generatedPrompt);
        onClose();
        // Reset form
        setTopic('');
        setDesignGuidelines('');
        setTargetAudience('');
        setBrandColors('');
        setAdditionalNotes('');
        setUploadedFiles([]);
      } else {
        alert('Fehler beim Generieren des Prompts');
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      alert('Fehler beim Generieren des Prompts');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-pw-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-pw-black/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pw-accent" />
            <h2 className="text-lg font-semibold text-pw-black">Prompt Generator</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-pw-black/5 rounded-lg transition-colors"
            aria-label="Schließen"
          >
            <X className="w-5 h-5 text-pw-black/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Topic */}
          <div className="space-y-2">
            <label htmlFor="topic" className="text-sm font-medium text-pw-black">
              Thema der Präsentation <span className="text-red-500">*</span>
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="z.B. Moderne Webentwicklung mit React"
              className="w-full px-4 py-2 border border-pw-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-pw-accent/50 text-sm"
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <label htmlFor="audience" className="text-sm font-medium text-pw-black">
              Zielgruppe
            </label>
            <input
              id="audience"
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="z.B. Entwickler, Manager, Studierende"
              className="w-full px-4 py-2 border border-pw-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-pw-accent/50 text-sm"
            />
          </div>

          {/* Design Guidelines */}
          <div className="space-y-2">
            <label htmlFor="design" className="text-sm font-medium text-pw-black">
              Design-Vorgaben
            </label>
            <textarea
              id="design"
              value={designGuidelines}
              onChange={(e) => setDesignGuidelines(e.target.value)}
              placeholder="z.B. Modern, minimalistisch, viele Bilder, wenig Text"
              rows={3}
              className="w-full px-4 py-2 border border-pw-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-pw-accent/50 text-sm resize-none"
            />
          </div>

          {/* Brand Colors */}
          <div className="space-y-2">
            <label htmlFor="colors" className="text-sm font-medium text-pw-black">
              Firmen-CI / Brand-Farben
            </label>
            <input
              id="colors"
              type="text"
              value={brandColors}
              onChange={(e) => setBrandColors(e.target.value)}
              placeholder="z.B. #FF6B00, #000000, Weiß, Blau"
              className="w-full px-4 py-2 border border-pw-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-pw-accent/50 text-sm"
            />
            <p className="text-xs text-pw-black/50">Hex-Codes, Farbnamen oder Beschreibungen</p>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium text-pw-black">
              Weitere Hinweise
            </label>
            <textarea
              id="notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="z.B. Technische Details, wichtige Keywords, spezielle Anforderungen"
              rows={3}
              className="w-full px-4 py-2 border border-pw-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-pw-accent/50 text-sm resize-none"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-pw-black">
              Dateien (Bilder, PDFs für Kontext)
            </label>
            <div className="border-2 border-dashed border-pw-black/20 rounded-lg p-4 hover:border-pw-accent/50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 text-sm text-pw-black/60 hover:text-pw-black transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Dateien hochladen</span>
              </button>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2 mt-3">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-pw-black/5 rounded-lg px-3 py-2"
                  >
                    <span className="text-xs text-pw-black/70 truncate">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-pw-black/10 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-pw-black/60" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Settings Info */}
          <div className="bg-pw-accent/10 rounded-lg p-4 space-y-1">
            <p className="text-xs font-medium text-pw-black/70">Aktuelle Einstellungen:</p>
            <p className="text-xs text-pw-black/60">
              Format: <span className="font-medium">{currentFormat}</span> • Theme:{' '}
              <span className="font-medium">{currentTheme}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-pw-black/10 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-sm font-medium text-pw-black/70 hover:bg-pw-black/5 rounded-lg transition-colors disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="px-6 py-2 bg-pw-accent hover:bg-pw-accent/90 disabled:bg-pw-black/10 disabled:cursor-not-allowed text-sm font-medium text-pw-black rounded-lg transition-all hover:scale-105 disabled:hover:scale-100 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generiert...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Prompt generieren</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
