import { create } from 'zustand';
import { LibraryItem, LibraryFilters, LibraryStore } from '@/types/library';
import * as supabaseLibrary from '@/lib/supabase-library';

export const useLibraryStore = create<LibraryStore>()((set, get) => ({
  items: [],
  filters: {
    type: 'all',
    sortBy: 'newest',
  },
  unseenCount: 0,
  isLoading: false,

  // Load items from Supabase on app start
  loadItems: async () => {
    set({ isLoading: true });
    const items = await supabaseLibrary.fetchLibraryItems(0, 50);
    const unseenCount = items.filter((i) => !i.seen).length;
    set({ items, unseenCount, isLoading: false });
  },

  // Load more items (for infinite scroll)
  loadMoreItems: async () => {
    const { items, isLoading } = get();
    if (isLoading) return;

    set({ isLoading: true });
    const newItems = await supabaseLibrary.fetchLibraryItems(items.length, 50);

    if (newItems.length > 0) {
      const allItems = [...items, ...newItems];
      const unseenCount = allItems.filter((i) => !i.seen).length;
      set({ items: allItems, unseenCount, isLoading: false });
      return newItems.length;
    }

    set({ isLoading: false });
    return 0;
  },

  // Add item (compatible with old API)
  addItem: async (itemData) => {
    console.log('📚 Adding to library (Supabase):', itemData);

    // Save to Supabase (will upload base64 if needed)
    const newItem = await supabaseLibrary.addLibraryItem(itemData);

    if (newItem) {
      // Add to local state
      set((state) => {
        const items = [newItem, ...state.items];
        const unseenCount = items.filter((i) => !i.seen).length;
        return { items, unseenCount };
      });
    } else {
      console.error('❌ Failed to add item to library - addLibraryItem returned null');
      throw new Error('Failed to add item to library');
    }
  },

  // Remove item
  removeItem: async (id) => {
    // Optimistically remove from UI
    set((state) => {
      const items = state.items.filter((item) => item.id !== id);
      const unseenCount = items.filter((i) => !i.seen).length;
      return { items, unseenCount };
    });

    // Delete from Supabase (also deletes file)
    await supabaseLibrary.deleteLibraryItem(id);
  },

  // Rename item
  renameItem: async (id, newName) => {
    // Optimistically update UI
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, name: newName } : item
      ),
    }));

    // Update in Supabase
    await supabaseLibrary.renameLibraryItem(id, newName);
  },

  // Toggle favorite
  toggleFavorite: async (id) => {
    // Optimistically update UI
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      ),
    }));

    // Get the new state and update in Supabase
    const item = get().items.find((i) => i.id === id);
    if (item) {
      await supabaseLibrary.toggleFavoriteItem(id, item.isFavorite || false);
    }
  },

  // Mark as seen
  markAsSeen: async (id) => {
    // Optimistically update UI
    set((state) => {
      const items = state.items.map((item) =>
        item.id === id ? { ...item, seen: true } : item
      );
      const unseenCount = items.filter((i) => !i.seen).length;
      return { items, unseenCount };
    });

    // Update in Supabase
    await supabaseLibrary.markItemAsSeen(id);
  },

  // Mark all as seen
  markAllAsSeen: async () => {
    const { items } = get();

    // Optimistically update UI
    set({
      items: items.map((i) => ({ ...i, seen: true })),
      unseenCount: 0,
    });

    // Update each item in Supabase
    await Promise.all(
      items.filter((i) => !i.seen).map((i) => supabaseLibrary.markItemAsSeen(i.id))
    );
  },

  // Set filters
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  // Clear all items
  clearAll: async () => {
    // Clear UI
    set({ items: [], unseenCount: 0 });

    // Clear from Supabase
    await supabaseLibrary.clearLibrary();
  },

  // Get filtered items (compatible with old API)
  getFilteredItems: () => {
    const { items, filters } = get();
    let filtered = [...items];

    // Filter by type
    if (filters.type === 'favorites') {
      filtered = filtered.filter((item) => item.isFavorite);
    } else if (filters.type !== 'all') {
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
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  },

  // Get unseen count by type
  getUnseenByType: (type) => {
    const { items } = get();
    return items.filter((i) => i.type === type && !i.seen).length;
  },
}));
