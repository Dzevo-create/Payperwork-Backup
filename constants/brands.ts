import { DropdownOption } from "@/components/ui/SettingsDropdown";

/**
 * Brand Constants for Branding Workflow
 *
 * Comprehensive list of 104 major brands with physical stores/flagship locations
 * Organized by category for easy maintenance
 */

export const BRANDS = [
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
] as const satisfies readonly DropdownOption[];

export type BrandValue = (typeof BRANDS)[number]["value"];
