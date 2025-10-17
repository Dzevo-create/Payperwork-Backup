"use client";

import { useEffect, useState, useRef } from "react";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

function Toast({ message, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const duration = message.duration || 5000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      // Store exit animation timeout ref for cleanup
      exitTimeoutRef.current = setTimeout(() => onClose(message.id), 300); // Wait for animation
    }, duration);

    return () => {
      clearTimeout(timer);
      // Clean up exit animation timeout on unmount to prevent memory leaks
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, [message, onClose]);

  const handleClose = () => {
    // Clear any existing timeout before creating new one
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
    }

    setIsExiting(true);
    exitTimeoutRef.current = setTimeout(() => onClose(message.id), 300);
  };

  const getIcon = () => {
    switch (message.type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (message.type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "info":
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        ${getBgColor()}
        ${isExiting ? "animate-slide-out-right" : "animate-slide-in-right"}
        min-w-[320px] max-w-[420px]
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 text-sm text-pw-black">{message.message}</div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 text-pw-black/40 hover:text-pw-black/70 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastMessage[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast} onClose={onClose} />
        ))}
      </div>
    </div>
  );
}
