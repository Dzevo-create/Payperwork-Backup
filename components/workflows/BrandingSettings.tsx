"use client";

import {
  Home,
  TreePine,
  RectangleHorizontal,
  Palette,
  Type,
  Sun,
  Sparkles,
  Zap,
  ChevronDown,
  Search
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { BrandingSettingsType } from "@/types/workflows/brandingSettings";

// Options Definitions
const SPACE_TYPES = [
  { value: "interior", label: "Interior" },
  { value: "exterior", label: "Exterior" },
] as const;

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 Landscape" },
  { value: "9:16", label: "9:16 Portrait" },
  { value: "1:1", label: "1:1 Quadrat" },
  { value: "4:3", label: "4:3 Classic" },
] as const;

const VENUE_TYPES = [
  { value: "retail", label: "Einzelhandel" },
  { value: "concert", label: "Konzert" },
  { value: "event", label: "Event" },
  { value: "wedding", label: "Hochzeit" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hotel" },
  { value: "office", label: "Büro" },
  { value: "exhibition", label: "Ausstellung" },
  { value: "club", label: "Club" },
  { value: "festival", label: "Festival" },
  { value: "cafe", label: "Café" },
  { value: "bar", label: "Bar" },
  { value: "gym", label: "Fitnessstudio" },
  { value: "spa", label: "Spa" },
  { value: "shop", label: "Geschäft" },
] as const;

// Popular Brands List
// Brands with Physical Stores / Flagship Stores
// Brands with Physical Stores / Flagship Stores
const BRANDS = [
  // Fashion & Sportswear
  { value: "nike", label: "Nike" },
  { value: "adidas", label: "Adidas" },
  { value: "puma", label: "Puma" },
  { value: "zara", label: "Zara" },
  { value: "hm", label: "H&M" },
  { value: "uniqlo", label: "Uniqlo" },
  { value: "gap", label: "Gap" },
  { value: "forever21", label: "Forever 21" },
  { value: "mango", label: "Mango" },
  { value: "pull-bear", label: "Pull&Bear" },

  // Luxury Fashion
  { value: "louis-vuitton", label: "Louis Vuitton" },
  { value: "gucci", label: "Gucci" },
  { value: "chanel", label: "Chanel" },
  { value: "hermes", label: "Hermès" },
  { value: "prada", label: "Prada" },
  { value: "dior", label: "Dior" },
  { value: "armani", label: "Armani" },
  { value: "versace", label: "Versace" },
  { value: "burberry", label: "Burberry" },
  { value: "cartier", label: "Cartier" },
  { value: "rolex", label: "Rolex" },
  { value: "tiffany", label: "Tiffany & Co." },

  // Food & Beverage
  { value: "mcdonalds", label: "McDonald's" },
  { value: "starbucks", label: "Starbucks" },
  { value: "subway", label: "Subway" },
  { value: "burgerking", label: "Burger King" },
  { value: "kfc", label: "KFC" },
  { value: "dunkin", label: "Dunkin'" },
  { value: "pizzahut", label: "Pizza Hut" },
  { value: "dominos", label: "Domino's" },
  { value: "tacobell", label: "Taco Bell" },
  { value: "hardrock", label: "Hard Rock Cafe" },

  // Retail & Home
  { value: "ikea", label: "IKEA" },
  { value: "apple", label: "Apple Store" },
  { value: "mediamarkt", label: "MediaMarkt" },
  { value: "saturn", label: "Saturn" },

  // Automotive (Dealerships/Showrooms)
  { value: "tesla", label: "Tesla" },
  { value: "bmw", label: "BMW" },
  { value: "mercedes", label: "Mercedes-Benz" },
  { value: "audi", label: "Audi" },
  { value: "porsche", label: "Porsche" },
  { value: "ferrari", label: "Ferrari" },
  { value: "lamborghini", label: "Lamborghini" },
  { value: "volkswagen", label: "Volkswagen" },

  // Beauty & Cosmetics
  { value: "sephora", label: "Sephora" },
  { value: "mac", label: "MAC Cosmetics" },
  { value: "lush", label: "Lush" },
  { value: "body-shop", label: "The Body Shop" },
  { value: "loreal", label: "L'Oréal" },

  // Sports & Outdoor
  { value: "decathlon", label: "Decathlon" },
  { value: "intersport", label: "Intersport" },
  { value: "north-face", label: "The North Face" },
  { value: "patagonia", label: "Patagonia" },

  // Hotel Chains
  { value: "hilton", label: "Hilton" },
  { value: "marriott", label: "Marriott" },
  { value: "hyatt", label: "Hyatt" },
  { value: "sheraton", label: "Sheraton" },
  { value: "intercontinental", label: "InterContinental" },
  { value: "radisson", label: "Radisson" },
  { value: "westin", label: "Westin" },
  { value: "four-seasons", label: "Four Seasons" },
  { value: "ritz-carlton", label: "Ritz-Carlton" },
  { value: "waldorf-astoria", label: "Waldorf Astoria" },
  { value: "peninsula", label: "The Peninsula" },
  { value: "mandarin-oriental", label: "Mandarin Oriental" },

  // Supermarkets
  { value: "rewe", label: "REWE" },
  { value: "edeka", label: "EDEKA" },
  { value: "aldi", label: "ALDI" },
  { value: "lidl", label: "LIDL" },
  { value: "kaufland", label: "Kaufland" },
] as const;

const RENDER_STYLES = [
  { value: "hyperrealistic", label: "Hyperrealistisch" },
  { value: "photorealistic", label: "Photorealistisch" },
  { value: "3d-render", label: "3D Render" },
  { value: "architectural-visualization", label: "Architekturvisualisierung" },
  { value: "concept-art", label: "Concept Art" },
] as const;

const TIME_OF_DAY = [
  { value: "morning", label: "Morgens" },
  { value: "midday", label: "Mittags" },
  { value: "afternoon", label: "Nachmittags" },
  { value: "evening", label: "Abends" },
  { value: "night", label: "Nachts" },
] as const;

// Removed SEASONS and WEATHER - not relevant for branded interior spaces

const QUALITY = [
  { value: "ultra", label: "Ultra" },
  { value: "high", label: "High" },
  { value: "standard", label: "Standard" },
] as const;

interface BrandingSettingsProps {
  settings: BrandingSettingsType;
  onSettingsChange: (settings: BrandingSettingsType) => void;
}

type DropdownType = "spaceType" | "aspect" | "venueType" | "brand" | "renderStyle" | "time" | "quality" | null;

/**
 * BrandingSettings Component
 *
 * Horizontal settings bar for Branding workflow
 * Features searchable brand dropdown and scrollable dropdowns for long lists
 */
export function BrandingSettings({ settings, onSettingsChange }: BrandingSettingsProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdown && !Object.values(dropdownRefs.current).some(ref => ref?.contains(e.target as Node))) {
        setOpenDropdown(null);
        setBrandSearchQuery(""); // Reset search when closing
      }
    };

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Auto-focus search input when brand dropdown opens
  useEffect(() => {
    if (openDropdown === "brand" && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [openDropdown]);

  // Filter brands based on search query
  const filteredBrands = BRANDS.filter(brand =>
    brand.label.toLowerCase().includes(brandSearchQuery.toLowerCase())
  );

  const getCurrentLabel = (type: string) => {
    switch (type) {
      case "spaceType":
        if (!settings.spaceType) return "Space Type";
        return settings.spaceType === "interior" ? "Interior" : "Exterior";
      case "aspect":
        return settings.aspectRatio || "Aspect Ratio";
      case "venueType":
        if (!settings.venueType) return "Art";
        const venueType = VENUE_TYPES.find(v => v.value === settings.venueType);
        return venueType?.label || "Art";
      case "brand":
        if (!settings.brandingText) return "Brand";
        const brand = BRANDS.find(b => b.value === settings.brandingText);
        return brand?.label || settings.brandingText || "Brand";
      case "renderStyle":
        if (!settings.renderStyle) return "Render-Stil";
        const renderStyle = RENDER_STYLES.find(s => s.value === settings.renderStyle);
        return renderStyle?.label || "Render-Stil";
      case "time":
        if (!settings.timeOfDay) return "Zeit";
        const time = TIME_OF_DAY.find(t => t.value === settings.timeOfDay);
        return time?.label || "Zeit";
      case "quality":
        if (!settings.quality) return "Qualität";
        return settings.quality === "ultra" ? "Ultra" : settings.quality === "high" ? "High" : "Std";
      default:
        return "";
    }
  };

  return (
    <div className="flex items-center justify-end gap-1 flex-wrap">
      {/* Space Type */}
      <div className="relative" ref={el => { dropdownRefs.current["spaceType"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "spaceType" ? null : "spaceType")}
          className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "spaceType" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          {!settings.spaceType ? (
            <Home className={`w-3 h-3 transition-colors ${openDropdown === "spaceType" ? "text-pw-accent" : "text-pw-black/40"}`} />
          ) : settings.spaceType === "interior" ? (
            <Home className={`w-3 h-3 transition-colors ${openDropdown === "spaceType" ? "text-pw-accent" : "text-pw-black/40"}`} />
          ) : (
            <TreePine className={`w-3 h-3 transition-colors ${openDropdown === "spaceType" ? "text-pw-accent" : "text-pw-black/40"}`} />
          )}
          <span className="text-[10px] font-medium text-pw-black/70">{getCurrentLabel("spaceType")}</span>
          <ChevronDown className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${openDropdown === "spaceType" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "spaceType" && (
          <div className="absolute bottom-full mb-2 left-0 w-44 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={() => {
                onSettingsChange({ ...settings, spaceType: null });
                setOpenDropdown(null);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-pw-black/10 ${
                settings.spaceType === null
                  ? "bg-pw-accent text-white font-medium"
                  : "text-pw-black/50 hover:bg-pw-black/5 italic"
              }`}
            >
              <span className="flex items-center gap-2">
                {settings.spaceType === null && <span className="text-xs">✓</span>}
                Default
              </span>
            </button>

            {SPACE_TYPES.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, spaceType: option.value });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.spaceType === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.spaceType === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Aspect Ratio */}
      <div className="relative" ref={el => { dropdownRefs.current["aspect"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "aspect" ? null : "aspect")}
          className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "aspect" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <RectangleHorizontal className={`w-3 h-3 transition-colors ${openDropdown === "aspect" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-[10px] font-medium text-pw-black/70">{getCurrentLabel("aspect")}</span>
          <ChevronDown className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${openDropdown === "aspect" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "aspect" && (
          <div className="absolute bottom-full mb-2 left-0 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={() => {
                onSettingsChange({ ...settings, aspectRatio: null });
                setOpenDropdown(null);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-pw-black/10 ${
                settings.aspectRatio === null
                  ? "bg-pw-accent text-white font-medium"
                  : "text-pw-black/50 hover:bg-pw-black/5 italic"
              }`}
            >
              <span className="flex items-center gap-2">
                {settings.aspectRatio === null && <span className="text-xs">✓</span>}
                Default
              </span>
            </button>

            {ASPECT_RATIOS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, aspectRatio: option.value });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.aspectRatio === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.aspectRatio === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Art/Venue Type - WITH SCROLL */}
      <div className="relative" ref={el => { dropdownRefs.current["venueType"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "venueType" ? null : "venueType")}
          className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "venueType" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Type className={`w-3 h-3 transition-colors ${openDropdown === "venueType" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-[10px] font-medium text-pw-black/70">{getCurrentLabel("venueType")}</span>
          <ChevronDown className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${openDropdown === "venueType" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "venueType" && (
          <div className="absolute bottom-full mb-2 right-0 w-52 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-pw-black/20 scrollbar-track-transparent">
            <button
              onClick={() => {
                onSettingsChange({ ...settings, venueType: null });
                setOpenDropdown(null);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-pw-black/10 sticky top-0 bg-white/95 backdrop-blur-xl z-10 ${
                settings.venueType === null
                  ? "bg-pw-accent text-white font-medium"
                  : "text-pw-black/50 hover:bg-pw-black/5 italic"
              }`}
            >
              <span className="flex items-center gap-2">
                {settings.venueType === null && <span className="text-xs">✓</span>}
                Default
              </span>
            </button>

            {VENUE_TYPES.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, venueType: option.value });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.venueType === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.venueType === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Branding/Brand - SEARCHABLE DROPDOWN WITH SCROLL */}
      <div className="relative" ref={el => { dropdownRefs.current["brand"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "brand" ? null : "brand")}
          className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "brand" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Palette className={`w-3 h-3 transition-colors ${openDropdown === "brand" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-[10px] font-medium text-pw-black/70">{getCurrentLabel("brand")}</span>
          <ChevronDown className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${openDropdown === "brand" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "brand" && (
          <div className="absolute bottom-full mb-2 right-0 w-64 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Search Input - Sticky at top */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl z-10 px-3 py-2 border-b border-pw-black/10">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-pw-black/5 rounded-lg">
                <Search className="w-3.5 h-3.5 text-pw-black/40" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={brandSearchQuery}
                  onChange={(e) => setBrandSearchQuery(e.target.value)}
                  placeholder="Suche Brand..."
                  className="flex-1 bg-transparent text-xs text-pw-black placeholder:text-pw-black/40 outline-none"
                />
              </div>
            </div>

            {/* Scrollable Brand List */}
            <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-pw-black/20 scrollbar-track-transparent">
              {/* Default Button */}
              <button
                onClick={() => {
                  onSettingsChange({ ...settings, brandingText: null });
                  setOpenDropdown(null);
                  setBrandSearchQuery("");
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-pw-black/10 ${
                  settings.brandingText === null
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/50 hover:bg-pw-black/5 italic"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.brandingText === null && <span className="text-xs">✓</span>}
                  Default
                </span>
              </button>

              {/* Show "Use [search query]" option if user typed something */}
              {brandSearchQuery.trim() && (
                <button
                  onClick={() => {
                    onSettingsChange({ ...settings, brandingText: brandSearchQuery.trim() });
                    setOpenDropdown(null);
                    setBrandSearchQuery("");
                  }}
                  className="w-full px-3 py-2 text-left text-xs transition-colors border-b border-pw-black/10 bg-pw-accent/5 hover:bg-pw-accent/10 text-pw-accent font-medium"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xs">↵</span>
                    Verwende "{brandSearchQuery.trim()}"
                  </span>
                </button>
              )}

              {/* Filtered Brands from List */}
              {filteredBrands.length > 0 ? (
                <>
                  {brandSearchQuery.trim() && (
                    <div className="px-3 py-1.5 text-[10px] font-medium text-pw-black/40 uppercase tracking-wider border-b border-pw-black/5">
                      Vorschläge
                    </div>
                  )}
                  {filteredBrands.map((brand) => (
                    <button
                      key={brand.value}
                      onClick={() => {
                        onSettingsChange({ ...settings, brandingText: brand.label });
                        setOpenDropdown(null);
                        setBrandSearchQuery("");
                      }}
                      className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                        settings.brandingText === brand.label
                          ? "bg-pw-accent text-white font-medium"
                          : "text-pw-black/70 hover:bg-pw-black/5"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {settings.brandingText === brand.label && <span className="text-xs">✓</span>}
                        {brand.label}
                      </span>
                    </button>
                  ))}
                </>
              ) : (
                !brandSearchQuery.trim() && (
                  <div className="px-3 py-4 text-center text-xs text-pw-black/40">
                    Tippe einen Brand-Namen ein...
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Render-Stil */}
      <div className="relative" ref={el => { dropdownRefs.current["renderStyle"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "renderStyle" ? null : "renderStyle")}
          className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "renderStyle" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Sparkles className={`w-3 h-3 transition-colors ${openDropdown === "renderStyle" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-[10px] font-medium text-pw-black/70">{getCurrentLabel("renderStyle")}</span>
          <ChevronDown className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${openDropdown === "renderStyle" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "renderStyle" && (
          <div className="absolute bottom-full mb-2 right-0 w-60 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={() => {
                onSettingsChange({ ...settings, renderStyle: null });
                setOpenDropdown(null);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-pw-black/10 ${
                settings.renderStyle === null
                  ? "bg-pw-accent text-white font-medium"
                  : "text-pw-black/50 hover:bg-pw-black/5 italic"
              }`}
            >
              <span className="flex items-center gap-2">
                {settings.renderStyle === null && <span className="text-xs">✓</span>}
                Default
              </span>
            </button>

            {RENDER_STYLES.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, renderStyle: option.value });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.renderStyle === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.renderStyle === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Time of Day */}
      <div className="relative" ref={el => { dropdownRefs.current["time"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "time" ? null : "time")}
          className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "time" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Sun className={`w-3 h-3 transition-colors ${openDropdown === "time" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-[10px] font-medium text-pw-black/70">{getCurrentLabel("time")}</span>
          <ChevronDown className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${openDropdown === "time" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "time" && (
          <div className="absolute bottom-full mb-2 right-0 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={() => {
                onSettingsChange({ ...settings, timeOfDay: null });
                setOpenDropdown(null);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-pw-black/10 ${
                settings.timeOfDay === null
                  ? "bg-pw-accent text-white font-medium"
                  : "text-pw-black/50 hover:bg-pw-black/5 italic"
              }`}
            >
              <span className="flex items-center gap-2">
                {settings.timeOfDay === null && <span className="text-xs">✓</span>}
                Default
              </span>
            </button>

            {TIME_OF_DAY.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, timeOfDay: option.value });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.timeOfDay === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.timeOfDay === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty Space Preservation Toggle */}
      <div className="relative group">
        <button
          onClick={() => {
            onSettingsChange({
              ...settings,
              preserveEmptySpace: !settings.preserveEmptySpace
            });
          }}
          className={`flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            settings.preserveEmptySpace ? "border-green-400/30 bg-green-50/30" : "border-pw-black/10"
          }`}
        >
          <RectangleHorizontal className={`w-3 h-3 transition-colors ${settings.preserveEmptySpace ? "text-green-600" : "text-pw-black/40"}`} />
          <span className="text-[10px] font-medium text-pw-black/70">
            {settings.preserveEmptySpace ? "Leer ✓" : "Füllen"}
          </span>
        </button>

        {/* Hover Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-white text-pw-black text-[10px] font-medium rounded-lg shadow-xl border border-pw-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[9999]">
          {settings.preserveEmptySpace
            ? "🔒 Leere Flächen BEIBEHALTEN - Minimalismus"
            : "✨ Leere Flächen FÜLLEN - Details hinzufügen"}
          <div className="absolute top-full right-4 -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" style={{ filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.1))' }}></div>
        </div>
      </div>

      {/* Quality */}
      <div className="relative" ref={el => { dropdownRefs.current["quality"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "quality" ? null : "quality")}
          className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "quality" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Zap className={`w-3 h-3 transition-colors ${openDropdown === "quality" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-[10px] font-medium text-pw-black/70">{getCurrentLabel("quality")}</span>
          <ChevronDown className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${openDropdown === "quality" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "quality" && (
          <div className="absolute bottom-full mb-2 right-0 w-52 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={() => {
                onSettingsChange({ ...settings, quality: null });
                setOpenDropdown(null);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-pw-black/10 ${
                settings.quality === null
                  ? "bg-pw-accent text-white font-medium"
                  : "text-pw-black/50 hover:bg-pw-black/5 italic"
              }`}
            >
              <span className="flex items-center gap-2">
                {settings.quality === null && <span className="text-xs">✓</span>}
                Default
              </span>
            </button>

            {QUALITY.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, quality: option.value });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.quality === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.quality === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Structure Fidelity Slider Card */}
      <div className="relative group">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border border-pw-black/10 hover:shadow transition-all min-w-[120px]">
          {/* Icon and Label */}
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-pw-black/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
            <span className="text-[10px] font-medium text-pw-black/70 whitespace-nowrap">
              {settings.structureFidelity ?? 100}%
            </span>
          </div>

          {/* Slider Track */}
          <div className="relative flex-1 h-1.5 bg-gradient-to-r from-orange-300 via-yellow-300 to-green-300 rounded-full shadow-inner">
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={settings.structureFidelity ?? 100}
              onChange={(e) => {
                onSettingsChange({
                  ...settings,
                  structureFidelity: parseInt(e.target.value)
                });
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {/* Thumb indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-pw-accent border border-white rounded-full shadow-md pointer-events-none transition-all group-hover:scale-125"
              style={{
                left: `${((settings.structureFidelity ?? 100) - 10) / 90 * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
        </div>

        {/* Hover Tooltip - white bg, black text, aligned to right to avoid cutoff */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-white text-pw-black text-[10px] font-medium rounded-lg shadow-xl border border-pw-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[9999]">
          {settings.structureFidelity === 100 && "🎯 Exakte Struktur - Nur Materialien ändern"}
          {settings.structureFidelity === 90 && "📐 Sehr hohe Treue - Minimale Abweichung"}
          {settings.structureFidelity === 80 && "🏗️ Hohe Treue - Gleiche Grundstruktur"}
          {settings.structureFidelity === 70 && "🎨 Medium-Hoch - Mehr Kreativität"}
          {settings.structureFidelity === 60 && "🖼️ Medium - Layout als Guide"}
          {settings.structureFidelity === 50 && "⚖️ Balanciert - 50/50 Mix"}
          {settings.structureFidelity === 40 && "🎭 Low-Medium - Größere Änderungen OK"}
          {settings.structureFidelity === 30 && "🌈 Niedrig - Nur Inspiration"}
          {settings.structureFidelity === 20 && "✨ Sehr niedrig - Maximum Kreativität"}
          {settings.structureFidelity === 10 && "💡 Inspiration - Komplette Freiheit"}
          {/* Arrow pointing down to the right */}
          <div className="absolute top-full right-4 -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" style={{ filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.1))' }}></div>
        </div>
      </div>
    </div>
  );
}
