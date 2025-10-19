// ============================================
// Tool Action Message Component (Phase 1 - Manus Mirroring)
// Displays AI tool usage (Search, Browse, Python, etc.)
// Date: 2025-10-19
// ============================================

"use client";

import { ToolAction, ToolSearchResult, ToolBrowseResult, ToolPythonResult } from "@/types/slides";
import { Search, Globe, Code, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface ToolActionMessageProps {
  toolAction: ToolAction;
}

export function ToolActionMessage({ toolAction }: ToolActionMessageProps) {
  const { type, status, input, result, error, duration } = toolAction;

  // Get icon and color based on tool type
  const getToolIcon = () => {
    switch (type) {
      case "search":
        return <Search className="w-4 h-4" />;
      case "browse":
        return <Globe className="w-4 h-4" />;
      case "python":
        return <Code className="w-4 h-4" />;
      case "bash":
        return <FileText className="w-4 h-4" />;
      case "file":
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getToolLabel = () => {
    switch (type) {
      case "search":
        return "Google Suche";
      case "browse":
        return "Webseite durchsuchen";
      case "python":
        return "Python ausführen";
      case "bash":
        return "Bash Befehl";
      case "file":
        return "Datei Operation";
      default:
        return "Tool";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "running":
        return <Loader2 className="w-3 h-3 animate-spin text-blue-600" />;
      case "completed":
        return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case "failed":
        return <XCircle className="w-3 h-3 text-red-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case "running":
        return "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200";
      case "completed":
        return "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200";
      case "failed":
        return "bg-gradient-to-br from-red-50 to-rose-50 border-red-200";
    }
  };

  return (
    <div className={`max-w-3xl w-full border rounded-lg px-4 py-3 shadow-sm ${getBackgroundColor()}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-pw-black/80">
          {getToolIcon()}
          <span>{getToolLabel()}</span>
        </div>
        {getStatusIcon()}
        {duration && status === "completed" && (
          <span className="text-xs text-pw-black/50 ml-auto">
            {duration}ms
          </span>
        )}
      </div>

      {/* Input */}
      <div className="text-sm text-pw-black/70 mb-2">
        <span className="font-medium">Input: </span>
        <span className="text-pw-black/60">{input}</span>
      </div>

      {/* Result */}
      {status === "completed" && result && (
        <div className="mt-3 pt-3 border-t border-pw-black/10">
          {type === "search" && Array.isArray(result) && (
            <SearchResults results={result as ToolSearchResult[]} />
          )}
          {type === "browse" && !Array.isArray(result) && (
            <BrowseResult result={result as ToolBrowseResult} />
          )}
          {type === "python" && !Array.isArray(result) && (
            <PythonResult result={result as ToolPythonResult} />
          )}
        </div>
      )}

      {/* Error */}
      {status === "failed" && error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
          <span className="font-medium">Fehler: </span>
          {error}
        </div>
      )}
    </div>
  );
}

// ============================================
// Result Components
// ============================================

function SearchResults({ results }: { results: ToolSearchResult[] }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-pw-black/60 mb-2">
        {results.length} Ergebnisse gefunden
      </div>
      {results.slice(0, 3).map((result, index) => (
        <div
          key={index}
          className="p-2 bg-white border border-pw-black/10 rounded hover:border-pw-accent/30 transition-colors"
        >
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            {result.title}
          </a>
          <div className="text-xs text-pw-black/50 mt-1">{result.snippet}</div>
          <div className="text-xs text-pw-black/40 mt-1 truncate">{result.url}</div>
        </div>
      ))}
      {results.length > 3 && (
        <div className="text-xs text-pw-black/50 text-center pt-1">
          +{results.length - 3} weitere Ergebnisse
        </div>
      )}
    </div>
  );
}

function BrowseResult({ result }: { result: ToolBrowseResult }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-pw-black/60 mb-1">Webseite geladen</div>
      <div className="p-2 bg-white border border-pw-black/10 rounded">
        <div className="text-sm font-medium text-blue-600 mb-1">{result.title}</div>
        <div className="text-xs text-pw-black/40 mb-2 truncate">{result.url}</div>
        <div className="text-xs text-pw-black/60 line-clamp-3">{result.content}</div>
      </div>
    </div>
  );
}

function PythonResult({ result }: { result: ToolPythonResult }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-pw-black/60 mb-1">Python Code</div>

      {/* Code */}
      <div className="p-2 bg-gray-900 text-gray-100 rounded font-mono text-xs overflow-x-auto">
        <pre>{result.code}</pre>
      </div>

      {/* Output */}
      {result.output && (
        <div>
          <div className="text-xs font-medium text-pw-black/60 mb-1">Output</div>
          <div className="p-2 bg-white border border-pw-black/10 rounded font-mono text-xs overflow-x-auto">
            <pre className="text-green-700">{result.output}</pre>
          </div>
        </div>
      )}

      {/* Error */}
      {result.error && (
        <div>
          <div className="text-xs font-medium text-red-600 mb-1">Error</div>
          <div className="p-2 bg-red-50 border border-red-200 rounded font-mono text-xs overflow-x-auto">
            <pre className="text-red-700">{result.error}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
