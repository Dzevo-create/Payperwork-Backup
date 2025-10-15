import { useState, useRef, useEffect, useCallback } from "react";

interface UseDropdownMenuReturn {
  showDropdown: boolean;
  dropdownRef: React.RefObject<HTMLDivElement>;
  toggleDropdown: () => void;
  closeDropdown: () => void;
  setShowDropdown: (show: boolean) => void;
}

/**
 * Custom hook for managing dropdown menu state and click-outside behavior
 * Handles dropdown visibility and auto-closing when clicking outside
 */
export function useDropdownMenu(): UseDropdownMenuReturn {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = useCallback(() => {
    setShowDropdown((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setShowDropdown(false);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        closeDropdown();
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown, closeDropdown]);

  return {
    showDropdown,
    dropdownRef,
    toggleDropdown,
    closeDropdown,
    setShowDropdown,
  };
}
