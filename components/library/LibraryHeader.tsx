"use client";

import { Search, ChevronDown } from "lucide-react";
import { MediaType } from "@/types/library";

interface LibraryHeaderProps {
  selectedTab: MediaType | "all" | "favorites";
  onTabChange: (tab: MediaType | "all" | "favorites") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: "newest" | "oldest" | "name";
  onSortChange: (sort: "newest" | "oldest" | "name") => void;
  selectionMode: boolean;
  onToggleSelection: () => void;
  counts: {
    all: number;
    videos: number;
    images: number;
    favorites: number;
    unseenVideos: number;
    unseenImages: number;
  };
}

export function LibraryHeader({
  selectedTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  selectionMode,
  onToggleSelection,
  counts,
}: LibraryHeaderProps) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-pw-black/10">
      <h1 className="text-2xl font-semibold text-pw-black mb-6">Bibliothek</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => onTabChange("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedTab === "all"
              ? "bg-pw-black text-pw-white"
              : "bg-pw-light text-pw-black/60 hover:bg-pw-black/10"
          }`}
        >
          Alle ({counts.all})
        </button>
        <button
          onClick={() => onTabChange("video")}
          className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedTab === "video"
              ? "bg-pw-black text-pw-white"
              : "bg-pw-light text-pw-black/60 hover:bg-pw-black/10"
          }`}
        >
          Videos ({counts.videos})
          {counts.unseenVideos > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {counts.unseenVideos}
            </span>
          )}
        </button>
        <button
          onClick={() => onTabChange("image")}
          className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedTab === "image"
              ? "bg-pw-black text-pw-white"
              : "bg-pw-light text-pw-black/60 hover:bg-pw-black/10"
          }`}
        >
          Bilder ({counts.images})
          {counts.unseenImages > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {counts.unseenImages}
            </span>
          )}
        </button>
        <button
          onClick={() => onTabChange("favorites")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedTab === "favorites"
              ? "bg-pw-black text-pw-white"
              : "bg-pw-light text-pw-black/60 hover:bg-pw-black/10"
          }`}
        >
          Favoriten ({counts.favorites})
        </button>
      </div>

      {/* Search & Sort & Selection */}
      <div className="flex gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-black/40" />
          <input
            type="text"
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-pw-light rounded-full text-sm text-pw-black placeholder:text-pw-black/40 focus:outline-none focus:ring-2 focus:ring-pw-black/20"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as "newest" | "oldest" | "name")}
            className="appearance-none pl-4 pr-10 py-2 bg-pw-light rounded-full text-sm text-pw-black cursor-pointer focus:outline-none focus:ring-2 focus:ring-pw-black/20"
          >
            <option value="newest">Neueste</option>
            <option value="oldest">Älteste</option>
            <option value="name">Name</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-black/60 pointer-events-none" />
        </div>

        {/* Selection Mode Button */}
        <button
          onClick={onToggleSelection}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectionMode
              ? "bg-pw-black text-white hover:bg-pw-black/90"
              : "bg-pw-light text-pw-black/60 hover:bg-pw-black/10"
          }`}
        >
          {selectionMode ? "Abbrechen" : "Auswählen"}
        </button>
      </div>
    </div>
  );
}
