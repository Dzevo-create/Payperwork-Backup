"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

export interface SettingsDropdownProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<DropdownOption<T>>;
  onChange: (value: T) => void;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  dropdownWidth?: string;
  showCheckmark?: boolean;
  placement?: "top" | "bottom";
}

export function SettingsDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
  icon: Icon,
  dropdownWidth = "w-56",
  showCheckmark = true,
  placement = "top",
}: SettingsDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;

        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            const selectedOption = options[focusedIndex];
            if (selectedOption) {
              handleSelect(selectedOption.value);
            }
          }
          break;

        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          buttonRef.current?.focus();
          break;

        case "Tab":
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, focusedIndex, options]);

  // Auto-scroll focused item into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && menuRef.current) {
      const focusedElement = menuRef.current.children[
        focusedIndex
      ] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [focusedIndex, isOpen]);

  const handleSelect = (selectedValue: T) => {
    onChange(selectedValue);
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Find current selection index
      const currentIndex = options.findIndex((opt) => opt.value === value);
      setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
    } else {
      setFocusedIndex(-1);
    }
  };

  const currentOption = options.find((opt) => opt.value === value);
  const positionClasses =
    placement === "top"
      ? "bottom-full mb-2"
      : "top-full mt-2";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border transition-all ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:shadow cursor-pointer"
        } ${
          isOpen
            ? "border-pw-accent/20 shadow-sm"
            : "border-pw-black/10"
        }`}
      >
        {Icon && (
          <Icon
            className={`w-3.5 h-3.5 transition-colors ${
              isOpen ? "text-pw-accent" : "text-pw-black/40"
            }`}
          />
        )}
        <span className="text-xs font-medium text-pw-black/70">
          {currentOption?.icon || label}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-pw-black/40 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label={label}
          className={`absolute ${positionClasses} right-0 ${dropdownWidth} bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 max-h-64 overflow-y-auto`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = index === focusedIndex;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-pw-accent text-white font-medium"
                    : isFocused
                    ? "bg-pw-black/10 text-pw-black"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {showCheckmark && isSelected && (
                    <span className="text-xs">✓</span>
                  )}
                  {option.icon && <span>{option.icon}</span>}
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
