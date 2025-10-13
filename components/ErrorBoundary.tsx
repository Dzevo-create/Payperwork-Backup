'use client';

import React, { Component, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Uncaught error in component tree', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Etwas ist schiefgelaufen
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  Technische Details anzeigen
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs overflow-auto max-h-48">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Erneut versuchen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Specialized Error Boundary for Chat Area
 */
export function ChatErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chat-Fehler</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Der Chat konnte nicht geladen werden. Bitte lade die Seite neu.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Specialized Error Boundary for Library
 */
export function LibraryErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Bibliothek-Fehler</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Die Bibliothek konnte nicht geladen werden. Bitte lade die Seite neu.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
