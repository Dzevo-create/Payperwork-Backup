"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface FurnishEmptyContextType {
  furnitureImages: string[];
  setFurnitureImages: (images: string[]) => void;
}

const FurnishEmptyContext = createContext<FurnishEmptyContextType | undefined>(undefined);

export function FurnishEmptyProvider({ children }: { children: ReactNode }) {
  const [furnitureImages, setFurnitureImages] = useState<string[]>([]);

  return (
    <FurnishEmptyContext.Provider value={{ furnitureImages, setFurnitureImages }}>
      {children}
    </FurnishEmptyContext.Provider>
  );
}

export function useFurnishEmptyContext() {
  const context = useContext(FurnishEmptyContext);
  if (!context) {
    throw new Error("useFurnishEmptyContext must be used within FurnishEmptyProvider");
  }
  return context;
}
