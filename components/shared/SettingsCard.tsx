"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface SettingsCardProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  isOpen?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
}

export function SettingsCard({
  title,
  icon: Icon,
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  children,
  defaultOpen = true,
  collapsible = true,
  className = "",
}: SettingsCardProps) {
  // Internal state for uncontrolled mode
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    undefined
  );

  // Determine if component is controlled
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (!collapsible) return;

    if (isControlled) {
      controlledOnToggle?.();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContentHeight(entry.contentRect.height);
        }
      });

      resizeObserver.observe(contentRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  return (
    <div
      className={`border border-pw-black/10 rounded-xl bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-sm shadow-sm overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={!collapsible}
        aria-expanded={isOpen}
        aria-label={collapsible ? `Toggle ${title}` : title}
        className={`w-full flex items-center justify-between p-4 transition-colors ${
          collapsible
            ? "hover:bg-pw-black/5 cursor-pointer"
            : "cursor-default"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {Icon && (
            <Icon className="w-5 h-5 text-pw-accent" />
          )}
          <span className="font-semibold text-pw-black">{title}</span>
        </div>

        {collapsible && (
          <ChevronDown
            className={`w-4 h-4 text-pw-black/40 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {/* Content with smooth animation */}
      <div
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          height: isOpen ? contentHeight : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="p-4 pt-0 space-y-3">
          {children}
        </div>
      </div>
    </div>
  );
}

export interface SettingsGroupProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsGroup({
  label,
  description,
  children,
  className = "",
}: SettingsGroupProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="space-y-0.5">
        <label className="text-sm font-medium text-pw-black">
          {label}
        </label>
        {description && (
          <p className="text-xs text-pw-black/50">{description}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export interface SettingsRowProps {
  children: React.ReactNode;
  className?: string;
}

export function SettingsRow({ children, className = "" }: SettingsRowProps) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {children}
    </div>
  );
}
