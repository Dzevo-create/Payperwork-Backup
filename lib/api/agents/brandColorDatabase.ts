/**
 * Brand Color Database
 *
 * Provides accurate brand colors and materials for popular brands
 * Used as fallback when GPT-5 Brand Intelligence fails
 */

export interface BrandInfo {
  brandName: string;
  primaryColors: string[];
  secondaryColors: string[];
  materials: string[];
  style: string;
  atmosphere: string;
}

/**
 * Database of known brand colors and characteristics
 */
export const BRAND_DATABASE: Record<string, BrandInfo> = {
  // Swiss Supermarkets
  "migros": {
    brandName: "Migros",
    primaryColors: ["bright orange (#FF6600)", "white"],
    secondaryColors: ["deep orange", "cream white"],
    materials: ["clean white surfaces", "orange accent panels", "modern laminate", "polished floors"],
    style: "modern, clean, welcoming Swiss supermarket aesthetic",
    atmosphere: "bright, organized, family-friendly shopping environment"
  },
  "coop": {
    brandName: "Coop",
    primaryColors: ["red (#E30613)", "white"],
    secondaryColors: ["dark red", "light gray"],
    materials: ["white surfaces", "red accent walls", "modern retail fixtures", "polished floors"],
    style: "contemporary Swiss retail design with bold red accents",
    atmosphere: "vibrant, welcoming, community-focused shopping space"
  },
  "aldi": {
    brandName: "Aldi",
    primaryColors: ["blue (#00549F)", "orange (#FF8200)", "white"],
    secondaryColors: ["navy blue", "light blue"],
    materials: ["clean white walls", "blue and orange signage", "efficient shelving systems"],
    style: "no-frills, efficient discount supermarket design",
    atmosphere: "practical, value-oriented, streamlined shopping experience"
  },
  "lidl": {
    brandName: "Lidl",
    primaryColors: ["blue (#0050AA)", "yellow (#FFED00)", "red (#EB001C)"],
    secondaryColors: ["navy blue", "bright yellow accents"],
    materials: ["clean surfaces", "colorful signage", "modern fixtures"],
    style: "bright, efficient European discount retail",
    atmosphere: "energetic, value-driven, organized"
  },

  // Luxury Fashion
  "rolex": {
    brandName: "Rolex",
    primaryColors: ["deep forest green (#006039)", "gold", "white"],
    secondaryColors: ["black", "silver", "cream"],
    materials: ["polished wood panels", "gold accents", "marble", "leather", "glass showcases"],
    style: "ultra-luxurious, prestigious, timeless elegance",
    atmosphere: "exclusive, sophisticated, high-end luxury environment"
  },
  "prada": {
    brandName: "Prada",
    primaryColors: ["black", "white", "Prada green (sage green)"],
    secondaryColors: ["gray", "cream"],
    materials: ["polished marble", "black lacquered surfaces", "velvet", "brass fixtures", "glass"],
    style: "minimalist Italian luxury with bold architectural elements",
    atmosphere: "sophisticated, avant-garde, high fashion"
  },
  "gucci": {
    brandName: "Gucci",
    primaryColors: ["Gucci red (#FF0000)", "forest green (#006341)", "gold"],
    secondaryColors: ["cream", "beige", "burgundy"],
    materials: ["luxurious velvet", "gold fixtures", "marble", "polished wood", "leather"],
    style: "opulent Italian maximalism with heritage elements",
    atmosphere: "bold, luxurious, eclectic high-end fashion"
  },
  "louis vuitton": {
    brandName: "Louis Vuitton",
    primaryColors: ["brown (#3E2723)", "gold", "cream"],
    secondaryColors: ["tan leather", "white"],
    materials: ["leather", "wood paneling", "gold hardware", "marble floors", "glass"],
    style: "classic French luxury with heritage craftsmanship",
    atmosphere: "timeless elegance, refined luxury, prestigious"
  },
  "hermes": {
    brandName: "Hermès",
    primaryColors: ["Hermès orange (#FF7F00)", "brown", "cream"],
    secondaryColors: ["tan", "gold", "white"],
    materials: ["fine leather", "wood panels", "orange boxes", "marble", "brass"],
    style: "understated French luxury with artisanal craftsmanship",
    atmosphere: "exclusive, refined, heritage luxury"
  },

  // Fast Food
  "mcdonalds": {
    brandName: "McDonald's",
    primaryColors: ["red (#DA291C)", "yellow (#FFC72C)"],
    secondaryColors: ["golden yellow", "white"],
    materials: ["glossy red panels", "yellow accents", "modern seating", "digital menu boards"],
    style: "bold, playful, globally recognized fast food aesthetic",
    atmosphere: "energetic, family-friendly, quick-service dining"
  },
  "burger king": {
    brandName: "Burger King",
    primaryColors: ["red (#D62300)", "yellow (#FDBD10)", "blue (#00A1E0)"],
    secondaryColors: ["orange", "brown"],
    materials: ["flame-grilled imagery", "bold signage", "modern fixtures"],
    style: "bold, flame-focused fast food branding",
    atmosphere: "energetic, competitive, flame-grilled experience"
  },
  "kfc": {
    brandName: "KFC",
    primaryColors: ["red (#E4002B)", "white"],
    secondaryColors: ["black", "gray"],
    materials: ["red panels", "white surfaces", "Colonel Sanders imagery"],
    style: "classic American fried chicken restaurant",
    atmosphere: "welcoming, Southern-inspired, family dining"
  },
  "subway": {
    brandName: "Subway",
    primaryColors: ["green (#00923F)", "yellow (#FFCF00)"],
    secondaryColors: ["white", "lime green"],
    materials: ["green tiles", "fresh ingredient displays", "clean surfaces"],
    style: "fresh, health-conscious fast casual",
    atmosphere: "clean, customizable, fresh food focus"
  },

  // Coffee Shops
  "starbucks": {
    brandName: "Starbucks",
    primaryColors: ["Starbucks green (#00704A)", "white"],
    secondaryColors: ["brown", "cream", "warm wood tones"],
    materials: ["reclaimed wood", "green accents", "comfortable seating", "warm lighting"],
    style: "modern coffeehouse with community focus",
    atmosphere: "cozy, welcoming, third-place experience"
  },
  "costa coffee": {
    brandName: "Costa Coffee",
    primaryColors: ["red (#E4002B)", "white"],
    secondaryColors: ["brown", "cream"],
    materials: ["warm wood", "red accents", "comfortable seating"],
    style: "British coffeehouse with Italian inspiration",
    atmosphere: "warm, inviting, relaxed coffee culture"
  },

  // Sportswear
  "nike": {
    brandName: "Nike",
    primaryColors: ["black", "white"],
    secondaryColors: ["orange", "red", "electric blue"],
    materials: ["concrete floors", "industrial fixtures", "LED displays", "glass"],
    style: "athletic, minimalist, performance-focused retail",
    atmosphere: "motivational, energetic, sport-inspired"
  },
  "adidas": {
    brandName: "Adidas",
    primaryColors: ["black", "white"],
    secondaryColors: ["three-stripe pattern", "green", "blue"],
    materials: ["industrial concrete", "white walls", "metal fixtures", "digital screens"],
    style: "sporty, street-inspired, German engineering aesthetic",
    atmosphere: "urban, athletic, innovative"
  },
  "under armour": {
    brandName: "Under Armour",
    primaryColors: ["black", "red (#C60C30)", "white"],
    secondaryColors: ["gray", "silver"],
    materials: ["dark industrial surfaces", "metal", "glass", "performance fabrics"],
    style: "tough, performance-driven athletic wear",
    atmosphere: "intense, competitive, athlete-focused"
  },

  // Technology & Electronics
  "apple": {
    brandName: "Apple",
    primaryColors: ["white", "silver", "space gray"],
    secondaryColors: ["black", "warm wood accents"],
    materials: ["polished glass", "brushed aluminum", "white stone tables", "wood floors"],
    style: "ultra-minimalist, high-tech, premium design",
    atmosphere: "clean, innovative, futuristic retail experience"
  },
  "microsoft": {
    brandName: "Microsoft",
    primaryColors: ["blue (#00A4EF)", "green (#7FBA00)", "yellow (#FFB900)", "red (#F25022)"],
    secondaryColors: ["gray", "white"],
    materials: ["clean white surfaces", "colorful accent panels", "digital displays"],
    style: "modern, colorful, tech-forward design",
    atmosphere: "innovative, accessible, collaborative"
  },
  "samsung": {
    brandName: "Samsung",
    primaryColors: ["blue (#1428A0)", "white"],
    secondaryColors: ["black", "silver"],
    materials: ["high-tech displays", "sleek metal", "glass", "LED lighting"],
    style: "modern Korean tech aesthetic",
    atmosphere: "innovative, high-tech, premium electronics"
  },

  // Furniture & Home
  "ikea": {
    brandName: "IKEA",
    primaryColors: ["blue (#0051BA)", "yellow (#FFDB00)"],
    secondaryColors: ["white", "birch wood", "gray"],
    materials: ["birch wood", "simple laminates", "colorful textiles", "clean surfaces"],
    style: "Scandinavian minimalism, functional design",
    atmosphere: "democratic, practical, self-assembly lifestyle"
  },
  "home depot": {
    brandName: "Home Depot",
    primaryColors: ["orange (#F96302)", "white"],
    secondaryColors: ["black", "gray"],
    materials: ["industrial shelving", "concrete floors", "orange signage"],
    style: "warehouse-style home improvement retail",
    atmosphere: "practical, DIY-focused, project-oriented"
  },

  // Automotive
  "bmw": {
    brandName: "BMW",
    primaryColors: ["blue (#1C69D4)", "white", "silver"],
    secondaryColors: ["black", "gray"],
    materials: ["polished concrete", "glass", "metal accents", "leather", "wood"],
    style: "German automotive luxury and precision",
    atmosphere: "sophisticated, performance-driven, engineered excellence"
  },
  "mercedes": {
    brandName: "Mercedes-Benz",
    primaryColors: ["silver", "black", "white"],
    secondaryColors: ["chrome", "dark gray"],
    materials: ["polished marble", "leather", "chrome", "glass", "dark wood"],
    style: "elegant German automotive luxury",
    atmosphere: "prestigious, refined, engineering excellence"
  },
  "tesla": {
    brandName: "Tesla",
    primaryColors: ["white", "black", "red"],
    secondaryColors: ["silver", "gray"],
    materials: ["clean white surfaces", "glass", "minimalist fixtures", "digital displays"],
    style: "futuristic, minimalist electric vehicle showroom",
    atmosphere: "innovative, sustainable, high-tech future"
  },

  // Hotels & Hospitality
  "hilton": {
    brandName: "Hilton",
    primaryColors: ["blue (#0057A1)", "white", "gold"],
    secondaryColors: ["cream", "tan"],
    materials: ["elegant wood paneling", "marble", "plush carpets", "brass fixtures"],
    style: "classic American hospitality luxury",
    atmosphere: "welcoming, comfortable, reliable luxury"
  },
  "marriott": {
    brandName: "Marriott",
    primaryColors: ["red (#A6192E)", "gold", "white"],
    secondaryColors: ["burgundy", "cream"],
    materials: ["rich wood", "marble", "elegant fabrics", "gold accents"],
    style: "timeless hospitality elegance",
    atmosphere: "sophisticated, professional, comfortable"
  }
};

/**
 * Get brand information from database
 * Case-insensitive lookup
 */
export function getBrandInfo(brandName: string): BrandInfo | null {
  const normalizedName = brandName.toLowerCase().trim();
  return BRAND_DATABASE[normalizedName] || null;
}

/**
 * Check if brand exists in database
 */
export function hasBrandInfo(brandName: string): boolean {
  return getBrandInfo(brandName) !== null;
}

/**
 * Get all available brand names
 */
export function getAllBrandNames(): string[] {
  return Object.values(BRAND_DATABASE).map(info => info.brandName);
}
