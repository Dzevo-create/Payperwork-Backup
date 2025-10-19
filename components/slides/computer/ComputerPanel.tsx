/**
 * Computer Panel - Payperwork AI Tool Activity Display
 *
 * Inspired by Manus.im "Computer" tab - shows all AI tool usage in a dedicated panel.
 *
 * Features:
 * - Tool history display (all tool actions)
 * - Filter by tool type (Search, Browse, Python, All)
 * - Filter by status (All, Running, Completed, Failed)
 * - Collapsible tool results
 * - Real-time updates via WebSocket
 * - Empty state when no tools used yet
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 2: Manus Mirroring - Computer Panel
 */

'use client';

import React, { useState, useMemo } from 'react';
import { ToolAction, ToolType, ToolActionStatus } from '@/types/slides';
import { Search, Globe, Code, Terminal, FileText, ChevronDown, ChevronUp, Monitor } from 'lucide-react';

interface ComputerPanelProps {
  toolActions: ToolAction[];
  isOpen?: boolean;
  onClose?: () => void;
}

export function ComputerPanel({ toolActions, isOpen = true, onClose }: ComputerPanelProps) {
  const [filterType, setFilterType] = useState<ToolType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ToolActionStatus | 'all'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Filter tool actions
  const filteredActions = useMemo(() => {
    return toolActions.filter((action) => {
      const typeMatch = filterType === 'all' || action.type === filterType;
      const statusMatch = filterStatus === 'all' || action.status === filterStatus;
      return typeMatch && statusMatch;
    });
  }, [toolActions, filterType, filterStatus]);

  // Toggle expanded state
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // Get tool icon
  const getToolIcon = (type: ToolType) => {
    switch (type) {
      case 'search':
        return <Search className="w-4 h-4" />;
      case 'browse':
        return <Globe className="w-4 h-4" />;
      case 'python':
        return <Code className="w-4 h-4" />;
      case 'bash':
        return <Terminal className="w-4 h-4" />;
      case 'file':
        return <FileText className="w-4 h-4" />;
    }
  };

  // Get tool label
  const getToolLabel = (type: ToolType) => {
    switch (type) {
      case 'search':
        return 'Google Suche';
      case 'browse':
        return 'Webseite';
      case 'python':
        return 'Python';
      case 'bash':
        return 'Bash';
      case 'file':
        return 'Datei';
    }
  };

  // Get status badge
  const getStatusBadge = (status: ToolActionStatus) => {
    switch (status) {
      case 'running':
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            Läuft...
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            Fertig
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            Fehler
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-white border-l border-pw-black/10">
      {/* Header */}
      <div className="px-4 py-3 border-b border-pw-black/10 bg-gradient-to-r from-pw-black/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-pw-accent" />
            <h2 className="text-lg font-semibold text-pw-black">Payperwork Computer</h2>
          </div>
          <div className="text-xs text-pw-black/60">
            {filteredActions.length} {filteredActions.length === 1 ? 'Tool' : 'Tools'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-pw-black/10 space-y-2">
        {/* Type Filter */}
        <div>
          <label className="text-xs font-medium text-pw-black/70 mb-1 block">Tool Type</label>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                filterType === 'all'
                  ? 'bg-pw-accent text-pw-black font-medium'
                  : 'bg-pw-black/5 text-pw-black/60 hover:bg-pw-black/10'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setFilterType('search')}
              className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                filterType === 'search'
                  ? 'bg-pw-accent text-pw-black font-medium'
                  : 'bg-pw-black/5 text-pw-black/60 hover:bg-pw-black/10'
              }`}
            >
              <Search className="w-3 h-3" />
              Suche
            </button>
            <button
              onClick={() => setFilterType('browse')}
              className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                filterType === 'browse'
                  ? 'bg-pw-accent text-pw-black font-medium'
                  : 'bg-pw-black/5 text-pw-black/60 hover:bg-pw-black/10'
              }`}
            >
              <Globe className="w-3 h-3" />
              Web
            </button>
            <button
              onClick={() => setFilterType('python')}
              className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                filterType === 'python'
                  ? 'bg-pw-accent text-pw-black font-medium'
                  : 'bg-pw-black/5 text-pw-black/60 hover:bg-pw-black/10'
              }`}
            >
              <Code className="w-3 h-3" />
              Code
            </button>
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-xs font-medium text-pw-black/70 mb-1 block">Status</label>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                filterStatus === 'all'
                  ? 'bg-pw-accent text-pw-black font-medium'
                  : 'bg-pw-black/5 text-pw-black/60 hover:bg-pw-black/10'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setFilterStatus('running')}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                filterStatus === 'running'
                  ? 'bg-pw-accent text-pw-black font-medium'
                  : 'bg-pw-black/5 text-pw-black/60 hover:bg-pw-black/10'
              }`}
            >
              Läuft
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                filterStatus === 'completed'
                  ? 'bg-pw-accent text-pw-black font-medium'
                  : 'bg-pw-black/5 text-pw-black/60 hover:bg-pw-black/10'
              }`}
            >
              Fertig
            </button>
            <button
              onClick={() => setFilterStatus('failed')}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                filterStatus === 'failed'
                  ? 'bg-pw-accent text-pw-black font-medium'
                  : 'bg-pw-black/5 text-pw-black/60 hover:bg-pw-black/10'
              }`}
            >
              Fehler
            </button>
          </div>
        </div>
      </div>

      {/* Tool List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredActions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Monitor className="w-16 h-16 text-pw-black/20 mb-4" />
            <h3 className="text-sm font-medium text-pw-black/60 mb-2">
              {toolActions.length === 0 ? 'Noch keine Tools verwendet' : 'Keine Tools gefunden'}
            </h3>
            <p className="text-xs text-pw-black/40 max-w-xs">
              {toolActions.length === 0
                ? 'Wenn die AI Tools verwendet (Suche, Web-Browsing, Code), erscheinen sie hier.'
                : 'Versuche andere Filter zu verwenden.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredActions.map((action) => {
              const isExpanded = expandedIds.has(action.id);
              const hasResult = action.result || action.error;

              return (
                <div
                  key={action.id}
                  className="border border-pw-black/10 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Tool Header */}
                  <button
                    onClick={() => hasResult && toggleExpanded(action.id)}
                    className={`w-full px-3 py-2 flex items-center gap-2 text-left ${
                      hasResult ? 'cursor-pointer hover:bg-pw-black/5' : 'cursor-default'
                    }`}
                  >
                    <div className="flex-shrink-0 text-pw-black/60">{getToolIcon(action.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-pw-black">{getToolLabel(action.type)}</span>
                        {getStatusBadge(action.status)}
                        {action.duration && action.status === 'completed' && (
                          <span className="text-xs text-pw-black/40">{action.duration}ms</span>
                        )}
                      </div>
                      <p className="text-xs text-pw-black/60 truncate">{action.input}</p>
                    </div>
                    {hasResult && (
                      <div className="flex-shrink-0 text-pw-black/40">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    )}
                  </button>

                  {/* Tool Result (Collapsible) */}
                  {hasResult && isExpanded && (
                    <div className="px-3 py-2 border-t border-pw-black/10 bg-pw-black/[0.02]">
                      {action.error ? (
                        <div className="text-xs text-red-600 font-mono bg-red-50 p-2 rounded">
                          {action.error}
                        </div>
                      ) : action.result ? (
                        <div className="text-xs text-pw-black/70">
                          {/* Search Results */}
                          {action.type === 'search' && Array.isArray(action.result) && (
                            <div className="space-y-2">
                              {action.result.slice(0, 3).map((result: any, idx: number) => (
                                <div key={idx} className="p-2 bg-white rounded border border-pw-black/10">
                                  <a
                                    href={result.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-medium text-blue-600 hover:underline block mb-1"
                                  >
                                    {result.title}
                                  </a>
                                  <p className="text-xs text-pw-black/60">{result.snippet}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Browse Result */}
                          {action.type === 'browse' && typeof action.result === 'object' && 'content' in action.result && (
                            <div className="p-2 bg-white rounded border border-pw-black/10">
                              <a
                                href={action.result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-blue-600 hover:underline block mb-1"
                              >
                                {action.result.title || action.result.url}
                              </a>
                              <p className="text-xs text-pw-black/60 line-clamp-3">
                                {action.result.content?.substring(0, 200)}...
                              </p>
                            </div>
                          )}

                          {/* Python Result */}
                          {action.type === 'python' && typeof action.result === 'object' && 'code' in action.result && (
                            <div className="space-y-2">
                              <div className="p-2 bg-gray-900 rounded text-gray-100 font-mono text-xs overflow-x-auto">
                                <pre>{action.result.code}</pre>
                              </div>
                              {action.result.output && (
                                <div className="p-2 bg-green-50 rounded font-mono text-xs overflow-x-auto">
                                  <pre className="text-green-700">{action.result.output}</pre>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Generic Result */}
                          {!['search', 'browse', 'python'].includes(action.type) && (
                            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(action.result, null, 2)}</pre>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
