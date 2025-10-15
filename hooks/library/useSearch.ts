import { useState, useEffect, useCallback } from "react";

export interface SearchResult<T> {
  item: T;
  matchIndex: number;
}

interface UseSearchOptions<T> {
  items: T[];
  searchFields: (item: T) => string[]; // Fields to search in
  limit?: number;
}

export function useSearch<T>({ items, searchFields, limit = 50 }: UseSearchOptions<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult<T>[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const searchResults: SearchResult<T>[] = [];

    items.forEach((item) => {
      const fields = searchFields(item);

      for (const field of fields) {
        const matchIndex = field.toLowerCase().indexOf(query);

        if (matchIndex !== -1) {
          searchResults.push({
            item,
            matchIndex,
          });
          break; // Only add item once even if multiple fields match
        }
      }
    });

    setResults(searchResults.slice(0, limit));
  }, [searchQuery, items, searchFields, limit]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setResults([]);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    results,
    clearSearch,
  };
}
