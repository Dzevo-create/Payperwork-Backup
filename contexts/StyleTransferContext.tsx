"use client";

import { createContext, useContext, ReactNode } from "react";

// Minimal context - Style-Transfer doesn't need special state like furniture images
interface StyleTransferContextType {
  // Placeholder for future features
}

const StyleTransferContext = createContext<StyleTransferContextType | undefined>(undefined);

export function StyleTransferProvider({ children }: { children: ReactNode }) {
  return (
    <StyleTransferContext.Provider value={{}}>
      {children}
    </StyleTransferContext.Provider>
  );
}

export function useStyleTransferContext() {
  const context = useContext(StyleTransferContext);
  if (!context) {
    throw new Error("useStyleTransferContext must be used within StyleTransferProvider");
  }
  return context;
}
