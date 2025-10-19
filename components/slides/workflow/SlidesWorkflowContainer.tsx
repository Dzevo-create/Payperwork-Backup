/**
 * Slides Workflow Container (Chat-based, 1:1 wie ChatInput)
 *
 * Main container for slides workflow:
 * - Welcome screen when empty (centered)
 * - Messages area when has messages (scrollable)
 * - ChatInput at bottom (EXACTLY like in chat, with Settings button integrated)
 * - Preview panel on right (conditional, after approval)
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 4: ChatInput Integration (1:1)
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { useUser } from '@/hooks/useUser';
import { SlidesWelcome } from './SlidesWelcome';
import { SlidesMessages } from './SlidesMessages';
import { SlidesPreviewPanel } from '../preview/SlidesPreviewPanel';
import { SlidesComputerPanel } from '../computer/SlidesComputerPanel';
import { AgentStatusIndicator } from '../AgentStatusIndicator';
import { Settings, Mic, Send, Plus, Monitor } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FORMAT_OPTIONS, THEME_OPTIONS } from '@/constants/slides';
import { PresentationFormat, PresentationTheme } from '@/types/slides';

export function SlidesWorkflowContainer() {
  const messages = useSlidesStore((state) => state.messages);
  const showPreview = useSlidesStore((state) => state.showPreview);
  const currentPrompt = useSlidesStore((state) => state.currentPrompt);
  const setCurrentPrompt = useSlidesStore((state) => state.setCurrentPrompt);
  const generationStatus = useSlidesStore((state) => state.generationStatus);
  const addMessage = useSlidesStore((state) => state.addMessage);
  const setGenerationStatus = useSlidesStore((state) => state.setGenerationStatus);
  const format = useSlidesStore((state) => state.format);
  const setFormat = useSlidesStore((state) => state.setFormat);
  const theme = useSlidesStore((state) => state.theme);
  const setTheme = useSlidesStore((state) => state.setTheme);
  const setCurrentTopics = useSlidesStore((state) => state.setCurrentTopics);

  // NEW: Phase 2 - Computer Panel
  const toolHistory = useSlidesStore((state) => state.toolHistory);
  const showComputerPanel = useSlidesStore((state) => state.showComputerPanel);
  const toggleComputerPanel = useSlidesStore((state) => state.toggleComputerPanel);

  // Final Slides (for Computer Panel)
  const finalSlides = useSlidesStore((state) => state.finalSlides);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentPrompt]);

  // Removed polling - using WebSocket updates from webhook handler instead

  const handleSendMessage = async () => {
    if (!currentPrompt.trim()) return;

    const message = currentPrompt.trim();

    // Store prompt BEFORE clearing input
    const setStoredCurrentPrompt = useSlidesStore.getState().setCurrentPrompt;
    setStoredCurrentPrompt(message);

    setCurrentPrompt('');

    // Add user message
    addMessage({
      id: `msg-user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    setGenerationStatus('thinking');

    // Call API to generate topics
    try {
      // Get userId from useUser hook
      const { user } = useUser();
      const userId = user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Step 1: Generate AI acknowledgment message
      const ackResponse = await fetch('/api/slides/workflow/generate-acknowledgment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: message }),
      });

      const ackData = await ackResponse.json();
      const acknowledgment = ackData.acknowledgment || 'Okay, ich erstelle dir einen Vorschlag für die Präsentation.';

      // Add AI-generated thinking message
      addMessage({
        id: `msg-thinking-${Date.now()}`,
        type: 'thinking',
        content: acknowledgment,
        timestamp: new Date().toISOString(),
      });

      // Step 2: Generate topics
      const response = await fetch('/api/slides/workflow/generate-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: message, format, theme, userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate topics');
      }

      const data = await response.json();

      // Store presentationId when we get it back
      if (data.success && data.presentationId) {
        const setStoredPresentationId = useSlidesStore.getState().setCurrentPresentationId;
        setStoredPresentationId(data.presentationId);
        console.log('✅ Topic generation started, presentationId:', data.presentationId);

        // Display topics immediately (no WebSocket needed)
        if (data.topics && Array.isArray(data.topics) && data.topics.length > 0) {
          // Store topics in store (for TopicsMessage to access)
          setCurrentTopics(data.topics);

          addMessage({
            id: `msg-topics-${Date.now()}`,
            type: 'topics',
            content: data.topics,
            timestamp: new Date().toISOString(),
          });
          setGenerationStatus('idle');
        }
      }
    } catch (error) {
      console.error('Error generating topics:', error);

      // Add error message
      addMessage({
        id: `msg-error-${Date.now()}`,
        type: 'result',
        content: {
          error: error instanceof Error ? error.message : 'Failed to generate topics',
        },
        timestamp: new Date().toISOString(),
      });

      setGenerationStatus('error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
    console.log('Mic clicked');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasMessages = messages.length > 0;
  const isGenerating =
    generationStatus === 'thinking' || generationStatus === 'generating';
  const isDisabled = !currentPrompt.trim() || isGenerating;

  return (
    <div className="w-full h-full flex gap-6 overflow-hidden">
      {/* Messages Area (left/center) */}
      <div
        className={`flex flex-col ${showPreview || showComputerPanel ? 'flex-1' : 'w-full'} overflow-hidden`}
      >
        {/* Welcome or Messages */}
        {!hasMessages ? (
          <SlidesWelcome />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <SlidesMessages />
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Agent Status Indicator */}
        {hasMessages && (
          <div className="px-3 sm:px-4 md:px-6">
            <div className="max-w-3xl mx-auto">
              <AgentStatusIndicator />
            </div>
          </div>
        )}

        {/* ChatInput (1:1 EXACT COPY from Chat) */}
        <div className="px-3 sm:px-4 md:px-6 py-4 bg-transparent">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col gap-2 px-3 py-2 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-lg border border-pw-black/10 rounded-2xl shadow-lg transition-all focus-within:ring-2 focus-within:ring-pw-accent/50 relative">

              {/* Main Input Row */}
              <div className="flex items-center gap-2">

                {/* Plus Button (Settings Dropdown) */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
                    disabled={isGenerating}
                    className="flex-shrink-0 p-2 hover:bg-pw-black/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Einstellungen"
                  >
                    <Plus className="w-4 h-4 text-pw-black/60" />
                  </button>

                  {/* Settings Dropdown */}
                  {showDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-pw-black/10 py-2 z-50">
                      <div className="px-4 py-2 border-b border-pw-black/10">
                        <h4 className="font-semibold text-sm text-pw-black">Einstellungen</h4>
                      </div>

                      <div className="px-4 py-3 space-y-3">
                        {/* Format */}
                        <div className="space-y-1.5">
                          <Label htmlFor="format" className="text-xs text-pw-black/70">Format</Label>
                          <Select
                            value={format}
                            onValueChange={(v) => {
                              setFormat(v as PresentationFormat);
                              setShowDropdown(false);
                            }}
                            disabled={isGenerating}
                          >
                            <SelectTrigger id="format" className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FORMAT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="text-xs">
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Theme */}
                        <div className="space-y-1.5">
                          <Label htmlFor="theme" className="text-xs text-pw-black/70">Theme</Label>
                          <Select
                            value={theme}
                            onValueChange={(v) => {
                              setTheme(v as PresentationTheme);
                              setShowDropdown(false);
                            }}
                            disabled={isGenerating}
                          >
                            <SelectTrigger id="theme" className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {THEME_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="text-xs">
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={currentPrompt}
                  onChange={(e) => setCurrentPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Was soll deine Präsentation beinhalten?"
                  className="flex-1 bg-transparent text-sm text-pw-black placeholder:text-pw-black/40 resize-none outline-none min-h-[20px] max-h-[150px] py-1.5"
                  rows={1}
                  disabled={isGenerating}
                />

                {/* Mic Button */}
                <button
                  onClick={handleMicClick}
                  disabled={isGenerating}
                  className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 animate-pulse"
                      : "hover:bg-pw-black/5"
                  }`}
                  aria-label={isRecording ? "Aufnahme stoppen" : "Spracheingabe"}
                >
                  <Mic className={`w-4 h-4 ${isRecording ? "text-white" : "text-pw-black/60"}`} />
                </button>

                {/* Settings Button (as Type button alternative) */}
                <button
                  onClick={toggleDropdown}
                  disabled={isGenerating}
                  className="flex-shrink-0 p-2 hover:bg-pw-black/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Einstellungen"
                  title="Einstellungen"
                >
                  <Settings className="w-4 h-4 text-pw-black/60" />
                </button>

                {/* NEW: Phase 2 - Computer Panel Toggle Button */}
                <button
                  onClick={toggleComputerPanel}
                  className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                    showComputerPanel
                      ? "bg-pw-accent text-pw-black"
                      : "hover:bg-pw-black/5 text-pw-black/60"
                  }`}
                  aria-label="Computer Panel"
                  title={showComputerPanel ? "Computer Panel schließen" : "Computer Panel öffnen"}
                >
                  <Monitor className="w-4 h-4" />
                  {toolHistory.length > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-pw-accent rounded-full"></span>
                  )}
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={isDisabled}
                  className="flex-shrink-0 p-2 bg-pw-accent hover:bg-pw-accent/90 disabled:bg-pw-black/10 disabled:cursor-not-allowed rounded-lg transition-all hover:scale-105 disabled:hover:scale-100"
                  aria-label="Senden"
                >
                  <Send className="w-4 h-4 text-pw-black" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Panel (right side, conditional) */}
      {showPreview && (
        <div className="w-96 flex-shrink-0">
          <SlidesPreviewPanel />
        </div>
      )}

      {/* Slides Computer Panel (right side, conditional) - BREITER! */}
      {finalSlides.length > 0 && (
        <div className="flex-1 min-w-[500px] max-w-[700px] flex-shrink-0">
          <SlidesComputerPanel
            slides={finalSlides}
            isGenerating={false}
            format={format}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
}
