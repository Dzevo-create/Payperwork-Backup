"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class LibraryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Library Error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-pw-light">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-xl font-semibold text-pw-black mb-2">
              Etwas ist schiefgelaufen
            </h2>

            <p className="text-pw-black/60 text-sm mb-6">
              Die Bibliothek konnte nicht geladen werden. Bitte versuche es erneut.
            </p>

            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-xs text-pw-black/40 cursor-pointer hover:text-pw-black/60">
                  Technische Details
                </summary>
                <pre className="mt-2 p-3 bg-pw-light rounded text-xs text-pw-black/60 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-pw-black text-white rounded-full hover:bg-pw-black/90 transition-all mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
