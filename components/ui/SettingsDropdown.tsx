"use client";

import { ChevronDown, Search } from "lucide-react";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import type { LucideIcon } from "lucide-react";

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
}

interface SettingsDropdownProps<T extends string> {
  /** Icon to display (from lucide-react) */
  icon: LucideIcon;
  /** Dropdown options */
  options: readonly DropdownOption<T>[];
  /** Current value */
  value: T | null;
  /** onChange callback */
  onChange: (value: T | null) => void;
  /** Placeholder text when value is null */
  placeholder: string;
  /** Always show title instead of selected value (default: false) */
  alwaysShowTitle?: boolean;
  /** Enable search functionality (default: false) */
  searchable?: boolean;
  /** Additional className for the container */
  className?: string;
  /** Dropdown alignment (default: "left") */
  align?: "left" | "right";
  /** Enable scrolling for long lists (default: false) */
  scrollable?: boolean;
  /** Max height for scrollable dropdown (default: "20rem") */
  maxHeight?: string;
  /** Custom icon mapping based on value */
  getIcon?: (value: T | null) => LucideIcon;
}

/**
 * SettingsDropdown Component
 *
 * Reusable dropdown component for workflow settings
 *
 * Features:
 * - Click-outside-to-close
 * - Optional search functionality
 * - Custom icons
 * - Scrollable for long lists
 * - Default option (null value)
 * - TypeScript generics for type safety
 *
 * @example
 * ```tsx
 * <SettingsDropdown
 *   icon={Home}
 *   options={SPACE_TYPES}
 *   value={settings.spaceType}
 *   onChange={(v) => updateSetting("spaceType", v)}
 *   placeholder="Space Type"
 * />
 * ```
 */
export function SettingsDropdown<T extends string>({
  icon: Icon,
  options,
  value,
  onChange,
  placeholder,
  alwaysShowTitle = false,
  searchable = false,
  className = "",
  align = "left",
  scrollable = false,
  maxHeight = "20rem",
  getIcon,
}: SettingsDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<"left" | "right">(align);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Auto-adjust dropdown position to prevent clipping (useLayoutEffect = before paint, no flicker)
  useLayoutEffect(() => {
    if (isOpen && dropdownMenuRef.current) {
      const rect = dropdownMenuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const dropdownWidth = rect.width;

      // Check if dropdown would overflow on the right side
      if (align === "left") {
        // Dropdown is left-aligned, check if it overflows on the right
        if (rect.right > viewportWidth) {
          setDropdownPosition("right");
        } else {
          setDropdownPosition("left");
        }
      } else {
        // Dropdown is right-aligned, check if it overflows on the left
        if (rect.left < 0) {
          setDropdownPosition("left");
        } else {
          setDropdownPosition("right");
        }
      }
    } else {
      // Reset to default when closed
      setDropdownPosition(align);
    }
  }, [isOpen, align]);

  // Filter options based on search query
  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  // Get current label
  const getCurrentLabel = () => {
    if (alwaysShowTitle) return placeholder; // Always show title if requested
    if (value === null) return placeholder; // Show placeholder when Default is selected
    const option = options.find((opt) => opt.value === value);
    return option?.label || value; // Return custom value if not found in options
  };

  // Get current icon (use custom mapper or default)
  const CurrentIcon = getIcon ? getIcon(value) : Icon;

  // Handle option selection
  const handleSelect = (newValue: T | null) => {
    onChange(newValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
          isOpen ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
        }`}
      >
        <CurrentIcon
          className={`w-3 h-3 transition-colors ${
            isOpen ? "text-pw-accent" : "text-pw-black/40"
          }`}
        />
        <span className="text-[10px] font-medium text-pw-black/70">
          {getCurrentLabel()}
        </span>
        <ChevronDown
          className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownMenuRef}
          className={`absolute bottom-full mb-2 ${
            dropdownPosition === "right" ? "right-0" : "left-0"
          } min-w-[11rem] max-w-[16rem] bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150`}
        >
          {/* Search Input (if searchable) */}
          {searchable && (
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl z-10 px-3 py-2 border-b border-pw-black/10">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-pw-black/5 rounded-lg">
                <Search className="w-3.5 h-3.5 text-pw-black/40" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      handleSelect(searchQuery.trim() as T);
                    }
                  }}
                  placeholder="Suche..."
                  className="flex-1 bg-transparent text-xs text-pw-black placeholder:text-pw-black/40 outline-none"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div
            className={scrollable ? "max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-pw-black/20 scrollbar-track-transparent" : ""}
            style={scrollable ? { maxHeight: maxHeight } : {}}
          >
            {/* Default Option */}
            <button
              onClick={() => handleSelect(null)}
              className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-pw-black/10 ${
                searchable ? "" : "sticky top-0 bg-white/95 backdrop-blur-xl z-10"
              } ${
                value === null
                  ? "bg-pw-black/5 text-pw-black/70 font-medium italic"
                  : "text-pw-black/50 hover:bg-pw-black/5 italic"
              }`}
            >
              <span className="flex items-center gap-2">
                {value === null && <span className="text-xs">✓</span>}
                Standard
              </span>
            </button>

            {/* Show "Use [search query]" option for searchable dropdowns */}
            {searchable && searchQuery.trim() && (
              <button
                onClick={() => handleSelect(searchQuery.trim() as T)}
                className="w-full px-3 py-2 text-left text-xs transition-colors border-b border-pw-black/10 bg-pw-accent/5 hover:bg-pw-accent/10 text-pw-accent font-medium"
              >
                <span className="flex items-center gap-2">
                  <span className="text-xs">↵</span>
                  Verwende "{searchQuery.trim()}"
                </span>
              </button>
            )}

            {/* Filtered Options */}
            {filteredOptions.length > 0 ? (
              <>
                {searchable && searchQuery.trim() && (
                  <div className="px-3 py-1.5 text-[10px] font-medium text-pw-black/40 uppercase tracking-wider border-b border-pw-black/5">
                    Vorschläge
                  </div>
                )}
                {filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      value === option.value
                        ? "bg-pw-accent text-white font-medium"
                        : "text-pw-black/70 hover:bg-pw-black/5"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {value === option.value && <span className="text-xs">✓</span>}
                      {option.label}
                    </span>
                  </button>
                ))}
              </>
            ) : (
              !searchQuery.trim() && (
                <div className="px-3 py-4 text-center text-xs text-pw-black/40">
                  Keine Optionen verfügbar
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
