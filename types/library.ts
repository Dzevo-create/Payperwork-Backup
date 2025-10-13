export type MediaType = "video" | "image";

export interface LibraryItem {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  name: string;
  prompt?: string;
  model?: string; // "Kling AI", "Sora 2", "DALL-E", etc.
  createdAt: string; // ISO string for serialization
  messageId?: string; // Reference to chat message
  conversationId?: string; // Reference to conversation
  seen: boolean; // For badge counter
  isFavorite?: boolean; // For favorites/star feature
  metadata?: {
    duration?: string;
    aspectRatio?: string;
    resolution?: string;
  };
}

export interface LibraryFilters {
  type: MediaType | "all" | "favorites";
  sortBy: "newest" | "oldest" | "name";
  searchQuery?: string;
}

export interface LibraryStore {
  items: LibraryItem[];
  filters: LibraryFilters;
  unseenCount: number;
  isLoading?: boolean;

  // Actions
  loadItems?: () => Promise<void>; // Optional for Supabase version
  loadMoreItems?: () => Promise<number | undefined>; // For infinite scroll
  addItem: (item: Omit<LibraryItem, "id" | "createdAt" | "seen">) => void | Promise<void>;
  removeItem: (id: string) => void | Promise<void>;
  renameItem: (id: string, newName: string) => void | Promise<void>;
  toggleFavorite: (id: string) => void | Promise<void>;
  markAsSeen: (id: string) => void | Promise<void>;
  markAllAsSeen: () => void | Promise<void>;
  setFilters: (filters: Partial<LibraryFilters>) => void;
  clearAll: () => void | Promise<void>;

  // Computed
  getFilteredItems: () => LibraryItem[];
  getUnseenByType: (type: MediaType) => number;
}
