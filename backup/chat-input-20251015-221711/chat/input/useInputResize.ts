import { useRef, useCallback } from "react";

interface UseInputResizeReturn {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  resizeTextarea: (element: HTMLTextAreaElement) => void;
  resetTextarea: () => void;
}

/**
 * Custom hook for managing textarea auto-resize functionality
 * Handles dynamic height adjustment based on content
 */
export function useInputResize(
  calculateHeight: (scrollHeight: number, maxHeight: number) => number,
  maxHeight: number
): UseInputResizeReturn {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = useCallback(
    (element: HTMLTextAreaElement) => {
      element.style.height = "auto";
      element.style.height = calculateHeight(element.scrollHeight, maxHeight) + "px";
    },
    [calculateHeight, maxHeight]
  );

  const resetTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, []);

  return {
    textareaRef,
    resizeTextarea,
    resetTextarea,
  };
}
