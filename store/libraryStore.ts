import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LibraryItem, LibraryFilters, LibraryStore } from "@/types/library";

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      items: [],
      filters: {
        type: "all",
        sortBy: "newest",
      },
      unseenCount: 0,

      addItem: (itemData) => {
        const newItem: LibraryItem = {
          ...itemData,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          seen: false,
        };

        set((state) => {
          // Keep only last 30 items to prevent localStorage quota exceeded
          // base64 images are large (~500KB each), so lower limit needed
          const newItems = [newItem, ...state.items].slice(0, 30);
          const unseenCount = newItems.filter((i) => !i.seen).length;
          return { items: newItems, unseenCount };
        });
      },

      removeItem: (id) =>
        set((state) => {
          const items = state.items.filter((i) => i.id !== id);
          const unseenCount = items.filter((i) => !i.seen).length;
          return { items, unseenCount };
        }),

      markAsSeen: (id) =>
        set((state) => {
          const items = state.items.map((i) =>
            i.id === id ? { ...i, seen: true } : i
          );
          const unseenCount = items.filter((i) => !i.seen).length;
          return { items, unseenCount };
        }),

      markAllAsSeen: () =>
        set((state) => ({
          items: state.items.map((i) => ({ ...i, seen: true })),
          unseenCount: 0,
        })),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      clearAll: () => set({ items: [], unseenCount: 0 }),

      getFilteredItems: () => {
        const { items, filters } = get();
        let filtered = [...items];

        // Filter by type
        if (filters.type !== "all") {
          filtered = filtered.filter((item) => item.type === filters.type);
        }

        // Filter by search query
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (item) =>
              item.name.toLowerCase().includes(query) ||
              item.prompt?.toLowerCase().includes(query)
          );
        }

        // Sort
        filtered.sort((a, b) => {
          switch (filters.sortBy) {
            case "newest":
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case "oldest":
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case "name":
              return a.name.localeCompare(b.name);
            default:
              return 0;
          }
        });

        return filtered;
      },

      getUnseenByType: (type) => {
        const { items } = get();
        return items.filter((i) => i.type === type && !i.seen).length;
      },
    }),
    {
      name: "payperwork-library-storage",
      // Store everything including base64 images (localStorage has ~5-10MB limit)
      // The 30-item limit in addItem prevents localStorage quota exceeded
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            // QuotaExceededError - clear old items and retry
            console.warn("localStorage quota exceeded, clearing old items...");
            const state = value?.state;
            if (state?.items && Array.isArray(state.items)) {
              // Keep only last 20 items
              const reducedState = {
                ...state,
                items: state.items.slice(0, 20),
              };
              try {
                localStorage.setItem(name, JSON.stringify({ ...value, state: reducedState }));
              } catch (retryError) {
                console.error("Failed to save to localStorage even after reducing items");
              }
            }
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
