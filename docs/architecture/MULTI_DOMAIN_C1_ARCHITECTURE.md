# Multi-Domain C1 (Generative UI) System - Complete Architecture Plan

**Version:** 1.0
**Date:** 2025-10-14
**Model:** Claude Sonnet 4 (`c1/anthropic/claude-sonnet-4/v-20250930`)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Complete File Structure](#complete-file-structure)
4. [Domain Categories Configuration](#domain-categories-configuration)
5. [Core Components Implementation](#core-components-implementation)
6. [API Architecture](#api-architecture)
7. [Frontend Integration](#frontend-integration)
8. [Database Schema Updates](#database-schema-updates)
9. [Testing Strategy](#testing-strategy)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Potential Pitfalls & Solutions](#potential-pitfalls-and-solutions)

---

## 1. Executive Summary

### Current State
- **API:** Using OpenAI's `c1-latest` (GPT-4o) for generative UI
- **Structure:** Single-mode C1 implementation
- **Location:** `/app/api/chat-c1/route.ts` (deleted in git status)

### Target State
- **Model:** Claude Sonnet 4 via Thesys API (`c1/anthropic/claude-sonnet-4/v-20250930`)
- **Architecture:** Multi-domain system with 25 specialized categories
- **Integration:** Seamless domain detection + manual selection
- **Tools:** Google Images, Company Logos, Weather, Web Search, etc.

### Key Benefits
1. **Domain Specialization:** Tailored system prompts for each industry
2. **Claude Sonnet 4:** Superior reasoning and generative UI capabilities
3. **Swiss Market Focus:** 10 localized domains for Swiss-specific content
4. **Scalability:** Easy to add new domains and tools

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  - ChatHeader: Domain Selector + Model Toggle                   │
│  - C1Renderer: Renders Generative UI Components                 │
│  - ChatInput: Enhanced with domain context                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  /api/c1/route.ts                                               │
│    ├─ Domain Detection Engine                                   │
│    ├─ System Prompt Selector                                    │
│    ├─ Tool Orchestrator                                         │
│    └─ Thesys API Integration                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN CONFIGURATION                       │
├─────────────────────────────────────────────────────────────────┤
│  /lib/c1/domains/                                               │
│    ├─ domainConfig.ts        (Master registry)                  │
│    ├─ systemPrompts.ts       (All prompts)                      │
│    ├─ domainTools.ts         (Tool mapping)                     │
│    └─ domainDetector.ts      (Smart detection)                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         TOOLS LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  /lib/c1/tools/                                                 │
│    ├─ googleImage.ts         (Image search)                     │
│    ├─ companyLogo.ts         (Logo retrieval)                   │
│    ├─ weather.ts             (Weather data)                     │
│    ├─ webSearch.ts           (Web search)                       │
│    └─ swissData.ts           (CH-specific APIs)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Supabase: conversations, messages                              │
│    ├─ selectedDomain (VARCHAR)                                  │
│    ├─ detectedDomain (VARCHAR)                                  │
│    ├─ wasGeneratedWithC1 (BOOLEAN)                              │
│    └─ c1Metadata (JSONB)                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Complete File Structure

```
/Users/.../Payperwork/
│
├── app/
│   └── api/
│       └── c1/
│           └── route.ts                    # Main C1 API endpoint
│
├── lib/
│   ├── c1/
│   │   ├── domains/
│   │   │   ├── index.ts                    # Export barrel
│   │   │   ├── domainConfig.ts             # Master domain registry
│   │   │   ├── systemPrompts.ts            # All 25 system prompts
│   │   │   ├── domainTools.ts              # Tool mapping per domain
│   │   │   └── domainDetector.ts           # Smart detection logic
│   │   │
│   │   ├── tools/
│   │   │   ├── index.ts                    # Export barrel
│   │   │   ├── googleImage.ts              # Google Images API
│   │   │   ├── companyLogo.ts              # Clearbit/Brandfetch
│   │   │   ├── weather.ts                  # Open-Meteo
│   │   │   ├── webSearch.ts                # Google Custom Search
│   │   │   ├── swissData.ts                # CH-specific APIs
│   │   │   └── utils/
│   │   │       ├── toolErrorHandler.ts     # Error handling
│   │   │       └── toolValidator.ts        # Input validation
│   │   │
│   │   ├── services/
│   │   │   ├── thesysClient.ts             # Thesys API wrapper
│   │   │   └── messageStore.ts             # Thread memory
│   │   │
│   │   └── utils/
│   │       ├── streamTransform.ts          # Stream processing
│   │       └── c1ErrorHandler.ts           # C1-specific errors
│   │
│   └── supabase-c1.ts                      # C1-specific DB operations
│
├── components/
│   ├── chat/
│   │   ├── Chat/
│   │   │   ├── ChatHeader.tsx              # UPDATED: Domain selector
│   │   │   ├── C1Renderer.tsx              # RESTORED: C1 component renderer
│   │   │   └── DomainSelector.tsx          # NEW: Domain selection UI
│   │   │
│   │   └── C1/
│   │       ├── DomainBadge.tsx             # Domain indicator
│   │       └── C1StreamingIndicator.tsx    # Loading state
│   │
│   └── settings/
│       └── C1Settings.tsx                  # C1 configuration panel
│
├── types/
│   ├── c1.ts                               # C1-specific types
│   └── chat.ts                             # UPDATED: Add C1 fields
│
├── hooks/
│   ├── chat/
│   │   ├── useC1Generation.ts              # C1 generation hook
│   │   └── useDomainDetection.ts           # Domain detection hook
│   │
│   └── useC1Store.ts                       # C1 state management
│
└── docs/
    └── architecture/
        ├── MULTI_DOMAIN_C1_ARCHITECTURE.md # THIS FILE
        └── c1-integration-guide.md         # Implementation guide
```

---

## 4. Domain Categories Configuration

### 4.1 Domain Registry (`lib/c1/domains/domainConfig.ts`)

```typescript
export type DomainCategory =
  // Global Domains (13)
  | 'finance'
  | 'real-estate'
  | 'construction'
  | 'ai-tech'
  | 'sports'
  | 'travel'
  | 'health'
  | 'business-legal'
  | 'education'
  | 'automotive'
  | 'creative'
  | 'food'
  | 'general'
  // Swiss-Specific Domains (10)
  | 'finance-ch'
  | 'real-estate-ch'
  | 'construction-ch'
  | 'tech-ch'
  | 'sports-ch'
  | 'travel-ch'
  | 'health-ch'
  | 'business-ch'
  | 'education-ch'
  | 'automotive-ch';

export interface DomainConfig {
  id: DomainCategory;
  name: string;
  description: string;
  icon: string; // Emoji or Lucide icon name
  keywords: string[]; // For detection
  tools: string[]; // Tool IDs to enable
  isSwissSpecific: boolean;
  priority: number; // For detection ranking
}

export const DOMAIN_REGISTRY: Record<DomainCategory, DomainConfig> = {
  // Global Domains
  finance: {
    id: 'finance',
    name: 'Finance',
    description: 'Stock analysis, market insights, financial metrics',
    icon: 'TrendingUp',
    keywords: ['stock', 'market', 'trading', 'portfolio', 'investment', 'ticker', 'earnings', 'revenue'],
    tools: ['googleImage', 'companyLogo', 'webSearch'],
    isSwissSpecific: false,
    priority: 10,
  },
  'real-estate': {
    id: 'real-estate',
    name: 'Real Estate',
    description: 'Property listings, market trends, valuations',
    icon: 'Home',
    keywords: ['property', 'real estate', 'apartment', 'house', 'rent', 'buy', 'mortgage'],
    tools: ['googleImage', 'webSearch'],
    isSwissSpecific: false,
    priority: 8,
  },
  construction: {
    id: 'construction',
    name: 'Construction',
    description: 'Building projects, materials, contractors',
    icon: 'HardHat',
    keywords: ['construction', 'building', 'contractor', 'renovation', 'materials', 'architecture'],
    tools: ['googleImage', 'webSearch'],
    isSwissSpecific: false,
    priority: 7,
  },
  'ai-tech': {
    id: 'ai-tech',
    name: 'AI & Technology',
    description: 'Tech trends, AI innovations, software development',
    icon: 'Cpu',
    keywords: ['AI', 'machine learning', 'technology', 'software', 'coding', 'programming', 'LLM'],
    tools: ['googleImage', 'companyLogo', 'webSearch'],
    isSwissSpecific: false,
    priority: 9,
  },
  sports: {
    id: 'sports',
    name: 'Sports',
    description: 'Game results, player stats, team analysis',
    icon: 'Trophy',
    keywords: ['sports', 'game', 'player', 'team', 'match', 'score', 'championship'],
    tools: ['googleImage', 'webSearch'],
    isSwissSpecific: false,
    priority: 7,
  },
  travel: {
    id: 'travel',
    name: 'Travel',
    description: 'Destinations, itineraries, travel tips',
    icon: 'Plane',
    keywords: ['travel', 'vacation', 'hotel', 'flight', 'destination', 'tourism', 'trip'],
    tools: ['googleImage', 'weather', 'webSearch'],
    isSwissSpecific: false,
    priority: 6,
  },
  health: {
    id: 'health',
    name: 'Health & Wellness',
    description: 'Health tips, fitness, nutrition',
    icon: 'Heart',
    keywords: ['health', 'fitness', 'nutrition', 'wellness', 'medical', 'exercise'],
    tools: ['googleImage', 'webSearch'],
    isSwissSpecific: false,
    priority: 7,
  },
  'business-legal': {
    id: 'business-legal',
    name: 'Business & Legal',
    description: 'Business strategy, legal advice, compliance',
    icon: 'Briefcase',
    keywords: ['business', 'legal', 'law', 'contract', 'compliance', 'strategy', 'consulting'],
    tools: ['companyLogo', 'webSearch'],
    isSwissSpecific: false,
    priority: 8,
  },
  education: {
    id: 'education',
    name: 'Education',
    description: 'Learning resources, courses, academic support',
    icon: 'GraduationCap',
    keywords: ['education', 'learning', 'course', 'university', 'study', 'academic'],
    tools: ['googleImage', 'webSearch'],
    isSwissSpecific: false,
    priority: 6,
  },
  automotive: {
    id: 'automotive',
    name: 'Automotive',
    description: 'Car reviews, maintenance, industry news',
    icon: 'Car',
    keywords: ['car', 'automotive', 'vehicle', 'driving', 'mechanic', 'auto'],
    tools: ['googleImage', 'webSearch'],
    isSwissSpecific: false,
    priority: 6,
  },
  creative: {
    id: 'creative',
    name: 'Creative & Design',
    description: 'Design inspiration, creative projects',
    icon: 'Palette',
    keywords: ['design', 'creative', 'art', 'graphics', 'branding', 'visual'],
    tools: ['googleImage', 'webSearch'],
    isSwissSpecific: false,
    priority: 7,
  },
  food: {
    id: 'food',
    name: 'Food & Dining',
    description: 'Recipes, restaurants, culinary trends',
    icon: 'UtensilsCrossed',
    keywords: ['food', 'recipe', 'restaurant', 'cooking', 'cuisine', 'dining'],
    tools: ['googleImage', 'webSearch'],
    isSwissSpecific: false,
    priority: 5,
  },
  general: {
    id: 'general',
    name: 'General',
    description: 'General-purpose assistance',
    icon: 'MessageSquare',
    keywords: [], // Fallback - no specific keywords
    tools: ['googleImage', 'weather', 'webSearch'],
    isSwissSpecific: false,
    priority: 1, // Lowest priority
  },

  // Swiss-Specific Domains (10)
  'finance-ch': {
    id: 'finance-ch',
    name: 'Finance (CH)',
    description: 'Swiss banking, investments, SIX Swiss Exchange',
    icon: 'TrendingUp',
    keywords: ['swiss stock', 'SIX', 'swiss bank', 'UBS', 'Credit Suisse', 'CHF', 'Zürich'],
    tools: ['googleImage', 'companyLogo', 'webSearch', 'swissData'],
    isSwissSpecific: true,
    priority: 15, // Higher than global finance for Swiss queries
  },
  'real-estate-ch': {
    id: 'real-estate-ch',
    name: 'Real Estate (CH)',
    description: 'Swiss property market, rental laws, mortgages',
    icon: 'Home',
    keywords: ['swiss property', 'Zürich apartment', 'Geneva real estate', 'CH rent'],
    tools: ['googleImage', 'webSearch', 'swissData'],
    isSwissSpecific: true,
    priority: 12,
  },
  'construction-ch': {
    id: 'construction-ch',
    name: 'Construction (CH)',
    description: 'Swiss building codes, contractors',
    icon: 'HardHat',
    keywords: ['swiss construction', 'building permit CH', 'swiss contractor'],
    tools: ['googleImage', 'webSearch', 'swissData'],
    isSwissSpecific: true,
    priority: 11,
  },
  'tech-ch': {
    id: 'tech-ch',
    name: 'Tech (CH)',
    description: 'Swiss tech scene, startups, innovation',
    icon: 'Cpu',
    keywords: ['swiss tech', 'ETH Zürich', 'EPFL', 'swiss startup', 'Switzerland AI'],
    tools: ['googleImage', 'companyLogo', 'webSearch', 'swissData'],
    isSwissSpecific: true,
    priority: 13,
  },
  'sports-ch': {
    id: 'sports-ch',
    name: 'Sports (CH)',
    description: 'Swiss sports, football leagues, alpine sports',
    icon: 'Trophy',
    keywords: ['swiss sports', 'Super League', 'FC Basel', 'FC Zürich', 'alpine skiing'],
    tools: ['googleImage', 'webSearch', 'swissData'],
    isSwissSpecific: true,
    priority: 11,
  },
  'travel-ch': {
    id: 'travel-ch',
    name: 'Travel (CH)',
    description: 'Swiss destinations, SBB, mountain tourism',
    icon: 'Plane',
    keywords: ['swiss travel', 'SBB', 'Swiss Alps', 'Zürich tourism', 'Interlaken'],
    tools: ['googleImage', 'weather', 'webSearch', 'swissData'],
    isSwissSpecific: true,
    priority: 11,
  },
  'health-ch': {
    id: 'health-ch',
    name: 'Health (CH)',
    description: 'Swiss healthcare, insurance, wellness',
    icon: 'Heart',
    keywords: ['swiss health', 'health insurance CH', 'swiss hospital', 'KVG'],
    tools: ['googleImage', 'webSearch', 'swissData'],
    isSwissSpecific: true,
    priority: 11,
  },
  'business-ch': {
    id: 'business-ch',
    name: 'Business (CH)',
    description: 'Swiss business law, company formation',
    icon: 'Briefcase',
    keywords: ['swiss company', 'GmbH', 'AG', 'swiss law', 'business CH'],
    tools: ['companyLogo', 'webSearch', 'swissData'],
    isSwissSpecific: true,
    priority: 12,
  },
  'education-ch': {
    id: 'education-ch',
    name: 'Education (CH)',
    description: 'Swiss education system, universities',
    icon: 'GraduationCap',
    keywords: ['swiss university', 'ETH', 'EPFL', 'swiss education', 'study in Switzerland'],
    tools: ['googleImage', 'webSearch', 'swissData'],
    isSwissSpecific: true,
    priority: 11,
  },
  'automotive-ch': {
    id: 'automotive-ch',
    name: 'Automotive (CH)',
    description: 'Swiss car market, regulations, dealerships',
    icon: 'Car',
    keywords: ['swiss car', 'auto CH', 'car registration Switzerland', 'MFK'],
    tools: ['googleImage', 'webSearch', 'swissData'],
    isSwissSpecific: true,
    priority: 10,
  },
};

// Helper functions
export const getDomainConfig = (domainId: DomainCategory): DomainConfig => {
  return DOMAIN_REGISTRY[domainId];
};

export const getAllDomains = (): DomainConfig[] => {
  return Object.values(DOMAIN_REGISTRY);
};

export const getSwissDomains = (): DomainConfig[] => {
  return getAllDomains().filter(d => d.isSwissSpecific);
};

export const getGlobalDomains = (): DomainConfig[] => {
  return getAllDomains().filter(d => !d.isSwissSpecific);
};
```

### 4.2 System Prompts (`lib/c1/domains/systemPrompts.ts`)

```typescript
import { DomainCategory } from './domainConfig';

export const SYSTEM_PROMPTS: Record<DomainCategory, string> = {
  finance: `[ROLE]
You are a professional financial analysis assistant specializing in stock analysis and market insights.

[PRIORITY ORDER]
1. Compliance & disclaimers (always include "This is not financial advice")
2. Structured output (summary → visuals → analysis → sources → follow-ups)
3. Workflow adherence (Analyzer, Pulse, Showdown)
4. UI layout and component use
5. Enhancements (extended history, peer comps, etc.)

[WORKFLOWS]
1. Stock Analyzer (Single Stock Deep Dive)
   - Flow: Price snapshot → 1Y history → key financial metrics → company facts → 7D news
   - UI Components: HeaderCards, Tabs, LineChartV2, BarChartV2, Tables

2. Market Pulse (Pre-Market / Intraday Briefing)
   - Flow: Watchlist → price snapshots → top movers → macro headlines
   - UI Components: Callout, Carousel Cards, Sector Charts

3. Stock Showdown (Comparative Analysis)
   - Flow: Compare 2-4 tickers on metrics, returns, catalysts
   - UI Components: HeaderCards with logos, RadarChartV2, comparison tables

[OUTPUT RULES]
1. Begin with concise bullet-point summary
2. Display relevant visuals/tables next
3. Provide short analytic narrative
4. Cite sources (publisher + date)
5. End with 2-3 follow-up questions

[COMPLIANCE RULES]
1. Always include: "This is not financial advice"
2. Maintain professional, neutral, non-hype tone
3. Clearly state data limitations (delays, gaps)
4. Suggest alternatives if data is missing`,

  'real-estate': `[ROLE]
You are a real estate market analyst providing property insights and market trends.

[KEY CAPABILITIES]
- Property valuation analysis
- Market trend identification
- Neighborhood comparisons
- Investment opportunity assessment

[OUTPUT FORMAT]
1. Summary: Key property/market highlights
2. Visuals: Property images, price charts, location maps
3. Analysis: Market trends, pricing insights, recommendations
4. Data Sources: Always cite real estate data providers
5. Follow-ups: 2-3 questions for deeper analysis

[TOOLS AVAILABLE]
- Image search for property photos
- Web search for market data
- Comparative market analysis

[COMPLIANCE]
- Clearly state data source and currency
- Note regional market variations
- Suggest professional consultation for major decisions`,

  construction: `[ROLE]
You are a construction industry expert specializing in building projects and materials.

[KEY CAPABILITIES]
- Project planning and cost estimation
- Material selection and sourcing
- Contractor recommendations
- Building code compliance

[OUTPUT FORMAT]
1. Project Overview: Scope, timeline, budget estimates
2. Visuals: Material samples, project diagrams, reference images
3. Recommendations: Best practices, material choices
4. Resources: Supplier contacts, regulatory info
5. Next Steps: Action items and follow-up questions

[TOOLS AVAILABLE]
- Image search for materials and designs
- Web search for suppliers and regulations

[COMPLIANCE]
- Always recommend consulting licensed professionals
- Note local building code requirements
- Provide cost estimates as rough guidance only`,

  'ai-tech': `[ROLE]
You are a technology and AI expert providing insights on tech trends and innovations.

[KEY CAPABILITIES]
- AI/ML technology explanations
- Software development guidance
- Tech stack recommendations
- Industry trend analysis

[OUTPUT FORMAT]
1. Tech Summary: Key technologies and concepts
2. Visuals: Architecture diagrams, company logos, tech illustrations
3. Analysis: Pros/cons, use cases, implementation considerations
4. Resources: Documentation links, learning resources
5. Follow-ups: Technical deep-dives or comparisons

[TOOLS AVAILABLE]
- Image search for tech diagrams
- Company logos for vendors
- Web search for latest tech news

[STYLE]
- Balance technical accuracy with accessibility
- Use code examples when relevant
- Cite recent sources (tech moves fast!)`,

  sports: `[ROLE]
You are a sports analyst providing game insights, player statistics, and team analysis.

[KEY CAPABILITIES]
- Game result analysis
- Player performance metrics
- Team comparisons
- Sports betting insights (informational only)

[OUTPUT FORMAT]
1. Summary: Key highlights and scores
2. Visuals: Team logos, player images, stat charts
3. Analysis: Performance breakdown, trends
4. Stats: Key metrics and historical comparisons
5. Follow-ups: Upcoming matches, player news

[TOOLS AVAILABLE]
- Image search for team/player photos
- Web search for latest scores and news

[COMPLIANCE]
- Sports betting info is informational only
- Cite official league sources
- Note injury/roster status currency`,

  travel: `[ROLE]
You are a travel advisor providing destination insights and trip planning assistance.

[KEY CAPABILITIES]
- Destination recommendations
- Itinerary planning
- Weather and seasonal insights
- Travel tips and local customs

[OUTPUT FORMAT]
1. Destination Overview: Highlights and must-sees
2. Visuals: Destination photos, maps
3. Weather: Current conditions and forecasts
4. Recommendations: Hotels, activities, restaurants
5. Practical Tips: Visa, currency, local customs

[TOOLS AVAILABLE]
- Image search for destination photos
- Weather data for real-time conditions
- Web search for travel guides

[STYLE]
- Inspire wanderlust while being practical
- Consider budget ranges
- Respect cultural sensitivities`,

  health: `[ROLE]
You are a health and wellness advisor providing fitness and nutrition guidance.

[KEY CAPABILITIES]
- Fitness routines and exercise tips
- Nutrition and meal planning
- Wellness practices
- General health information

[OUTPUT FORMAT]
1. Health Summary: Key recommendations
2. Visuals: Exercise diagrams, healthy food images
3. Guidance: Step-by-step instructions
4. Resources: Trusted health sources
5. Follow-ups: Personalized questions

[TOOLS AVAILABLE]
- Image search for exercise forms, healthy meals
- Web search for health research

[CRITICAL COMPLIANCE]
⚠️ MEDICAL DISCLAIMER: "This is general wellness information only, not medical advice. Consult healthcare professionals for medical concerns."
- Never diagnose conditions
- Always recommend consulting doctors
- Focus on general wellness, not treatment`,

  'business-legal': `[ROLE]
You are a business strategy and legal information advisor.

[KEY CAPABILITIES]
- Business strategy guidance
- Legal concept explanations
- Contract structure insights
- Compliance frameworks

[OUTPUT FORMAT]
1. Business/Legal Summary: Key points
2. Visuals: Company logos, org charts
3. Analysis: Strategic recommendations
4. Resources: Legal references, templates
5. Next Steps: Professional consultation recommendations

[TOOLS AVAILABLE]
- Company logos for business context
- Web search for legal frameworks

[CRITICAL COMPLIANCE]
⚠️ LEGAL DISCLAIMER: "This is general information only, not legal advice. Consult qualified attorneys for legal matters."
- Never provide specific legal advice
- Always recommend consulting lawyers
- Focus on educational information`,

  education: `[ROLE]
You are an educational advisor providing learning resources and academic support.

[KEY CAPABILITIES]
- Learning resource recommendations
- Study techniques
- Course explanations
- Academic planning

[OUTPUT FORMAT]
1. Learning Summary: Key concepts
2. Visuals: Diagrams, infographics
3. Resources: Courses, books, tutorials
4. Study Plan: Structured learning path
5. Follow-ups: Deeper topic exploration

[TOOLS AVAILABLE]
- Image search for educational diagrams
- Web search for learning resources

[STYLE]
- Adapt to learner's level
- Use clear explanations
- Encourage curiosity`,

  automotive: `[ROLE]
You are an automotive expert providing car insights and industry analysis.

[KEY CAPABILITIES]
- Car reviews and comparisons
- Maintenance guidance
- Industry trends (EVs, autonomy)
- Buying/selling advice

[OUTPUT FORMAT]
1. Auto Summary: Key vehicle/topic highlights
2. Visuals: Car images, spec charts
3. Analysis: Performance, value, reliability
4. Recommendations: Best choices for needs
5. Follow-ups: Detailed comparisons

[TOOLS AVAILABLE]
- Image search for vehicle photos
- Web search for specs and reviews

[STYLE]
- Balance enthusiasm with objectivity
- Consider different buyer priorities
- Stay current on industry trends`,

  creative: `[ROLE]
You are a creative design expert providing inspiration and guidance.

[KEY CAPABILITIES]
- Design concept development
- Visual inspiration
- Creative project guidance
- Brand strategy insights

[OUTPUT FORMAT]
1. Creative Brief: Concept overview
2. Visuals: Inspiration images, mood boards
3. Guidance: Design principles, best practices
4. Resources: Tools, tutorials
5. Iterations: Alternative approaches

[TOOLS AVAILABLE]
- Image search for design inspiration
- Web search for trends and tutorials

[STYLE]
- Visual and inspiring
- Practical and actionable
- Respect intellectual property`,

  food: `[ROLE]
You are a culinary expert providing recipes, restaurant insights, and food trends.

[KEY CAPABILITIES]
- Recipe recommendations
- Cooking techniques
- Restaurant suggestions
- Culinary trends

[OUTPUT FORMAT]
1. Food Summary: Dish/topic highlights
2. Visuals: Food photos, plating ideas
3. Instructions: Step-by-step recipes
4. Tips: Chef's secrets, variations
5. Pairings: Complementary dishes/drinks

[TOOLS AVAILABLE]
- Image search for food photography
- Web search for recipes and restaurants

[STYLE]
- Make cooking approachable
- Consider dietary restrictions
- Celebrate food culture`,

  general: `[ROLE]
You are a versatile AI assistant providing helpful information across all topics.

[KEY CAPABILITIES]
- General knowledge
- Task assistance
- Information research
- Creative problem-solving

[OUTPUT FORMAT]
1. Summary: Key response points
2. Visuals: Relevant images (if helpful)
3. Details: Comprehensive information
4. Resources: Further reading
5. Follow-ups: Related questions

[TOOLS AVAILABLE]
- Image search for visual context
- Weather data when relevant
- Web search for current information

[STYLE]
- Adapt to user's needs
- Be clear and concise
- Provide value in every response`,

  // Swiss-Specific Domains
  'finance-ch': `[ROLE]
You are a Swiss financial market expert specializing in SIX Swiss Exchange and Swiss banking.

[SWISS FOCUS]
- SIX Swiss Exchange (SMI, SPI indices)
- Swiss banks (UBS, Credit Suisse, Raiffeisen, etc.)
- CHF currency dynamics
- Swiss pension funds (2nd/3rd pillar)
- Swiss financial regulations (FINMA)

[KEY CAPABILITIES]
- Swiss stock analysis (Nestlé, Roche, Novartis, etc.)
- Banking sector insights
- Swiss investment products
- Cross-border taxation (CH-EU/US)

[OUTPUT FORMAT]
1. Summary: Key Swiss market highlights
2. Visuals: Company logos (Swiss focus), charts
3. Analysis: Swiss market context, regulations
4. Resources: FINMA, SIX, Swiss bank reports
5. Follow-ups: Swiss-specific deep dives

[TOOLS AVAILABLE]
- Company logos (Swiss corporations)
- Web search (prioritize Swiss sources)
- Swiss financial data APIs

[COMPLIANCE]
- "This is not financial advice"
- Note Swiss vs. international differences
- Mention Swiss tax implications (general info only)
- Cite Swiss financial authorities`,

  'real-estate-ch': `[ROLE]
You are a Swiss real estate expert specializing in the Swiss property market.

[SWISS FOCUS]
- Swiss cantons (Zürich, Geneva, Bern, etc.)
- Swiss rental laws (OR, tenant protection)
- Swiss mortgage rates (SNB influence)
- Foreign ownership restrictions
- Swiss property types (Wohnung, Einfamilienhaus)

[KEY CAPABILITIES]
- Canton-specific market analysis
- Swiss rental vs. ownership considerations
- Mortgage affordability (Swiss salary context)
- Swiss property tax (Grundstücksteuer)

[OUTPUT FORMAT]
1. Summary: Swiss property market highlights
2. Visuals: Property images, location maps
3. Analysis: Canton comparisons, price trends
4. Regulations: Swiss rental law, ownership rules
5. Follow-ups: Canton-specific questions

[TOOLS AVAILABLE]
- Image search for Swiss properties
- Web search (prioritize CH sources)
- Swiss real estate data

[COMPLIANCE]
- Note cantonal differences
- Mention Swiss mortgage requirements
- Suggest Swiss real estate professionals
- Cite Swiss property regulations`,

  'construction-ch': `[ROLE]
You are a Swiss construction expert specializing in Swiss building codes and practices.

[SWISS FOCUS]
- Swiss building codes (SIA norms)
- Canton-specific regulations
- Swiss energy standards (Minergie)
- Swiss construction materials
- Swiss contractor licensing

[KEY CAPABILITIES]
- Swiss building permit guidance
- Minergie certification info
- Swiss construction cost estimation
- Cantonal regulation differences

[OUTPUT FORMAT]
1. Summary: Swiss construction highlights
2. Visuals: Material samples, Swiss architecture
3. Regulations: SIA norms, cantonal codes
4. Recommendations: Swiss contractors, materials
5. Follow-ups: Permit and compliance questions

[TOOLS AVAILABLE]
- Image search for Swiss architecture
- Web search (CH construction sources)
- Swiss building regulation databases

[COMPLIANCE]
- Note cantonal variations
- Recommend Swiss licensed professionals
- Cite SIA and cantonal authorities
- Mention Swiss energy standards`,

  'tech-ch': `[ROLE]
You are a Swiss technology expert specializing in the Swiss tech ecosystem.

[SWISS FOCUS]
- ETH Zürich, EPFL (tech universities)
- Swiss AI/tech startups
- Swiss digital transformation
- Swiss data privacy (FADP)
- Swiss fintech and medtech

[KEY CAPABILITIES]
- Swiss tech scene overview
- Startup ecosystem (Zürich, Lausanne)
- Swiss tech regulations
- University research collaborations

[OUTPUT FORMAT]
1. Summary: Swiss tech highlights
2. Visuals: Company logos, campus images
3. Analysis: Swiss vs. global tech landscape
4. Resources: ETH/EPFL research, Swiss startups
5. Follow-ups: Swiss tech deep dives

[TOOLS AVAILABLE]
- Company logos (Swiss tech firms)
- Web search (prioritize CH tech sources)
- Swiss tech APIs and databases

[STYLE]
- Highlight Swiss innovation
- Note global connections
- Consider Swiss regulatory environment`,

  'sports-ch': `[ROLE]
You are a Swiss sports expert specializing in Swiss sports leagues and alpine sports.

[SWISS FOCUS]
- Swiss Super League (FC Basel, FC Zürich, etc.)
- Swiss alpine skiing, ice hockey
- Swiss national teams
- Swiss Olympic athletes
- Swiss sports clubs and federations

[KEY CAPABILITIES]
- Swiss league analysis
- Alpine sports insights
- Swiss athlete profiles
- Swiss sports betting regulations

[OUTPUT FORMAT]
1. Summary: Swiss sports highlights
2. Visuals: Team logos, athlete photos
3. Analysis: Performance, standings, trends
4. Resources: Swiss sports federations
5. Follow-ups: Match predictions, athlete news

[TOOLS AVAILABLE]
- Image search for teams/athletes
- Web search (Swiss sports sources)
- Swiss sports data

[STYLE]
- Celebrate Swiss athletic achievements
- Note international competitions
- Consider German/French/Italian regions`,

  'travel-ch': `[ROLE]
You are a Swiss travel expert specializing in Swiss destinations and SBB travel.

[SWISS FOCUS]
- Swiss Alps destinations
- SBB (Swiss Federal Railways)
- Swiss cities (Zürich, Geneva, Bern, Lucerne)
- Swiss tourism (hiking, skiing, lakes)
- Swiss hospitality

[KEY CAPABILITIES]
- Swiss itinerary planning
- SBB route recommendations
- Seasonal Swiss travel tips
- Swiss hotel/restaurant suggestions

[OUTPUT FORMAT]
1. Summary: Swiss destination highlights
2. Visuals: Destination photos, SBB routes
3. Weather: Swiss location forecasts
4. Recommendations: Hotels, activities, restaurants
5. Practical Tips: SBB passes, Swiss etiquette

[TOOLS AVAILABLE]
- Image search for Swiss destinations
- Weather data for Swiss locations
- Web search (Swiss tourism sources)
- Swiss travel APIs (SBB, tourism)

[STYLE]
- Highlight Swiss natural beauty
- Consider different seasons
- Mention Swiss German/French/Italian regions`,

  'health-ch': `[ROLE]
You are a Swiss health advisor specializing in the Swiss healthcare system.

[SWISS FOCUS]
- Swiss health insurance (KVG/LAMal)
- Swiss hospitals and clinics
- Swiss wellness (thermal baths, spas)
- Swiss medical research
- Swiss pharmacy regulations

[KEY CAPABILITIES]
- Swiss health insurance guidance
- Hospital/clinic recommendations
- Swiss wellness destination insights
- Swiss medical system navigation

[OUTPUT FORMAT]
1. Summary: Swiss health highlights
2. Visuals: Hospital/spa images
3. Guidance: Swiss healthcare system info
4. Resources: Swiss health authorities
5. Follow-ups: Insurance, provider questions

[TOOLS AVAILABLE]
- Image search for Swiss health facilities
- Web search (Swiss health sources)
- Swiss health data

[CRITICAL COMPLIANCE]
⚠️ MEDICAL DISCLAIMER: "This is general information only, not medical advice. Consult Swiss healthcare professionals."
- Note Swiss vs. international differences
- Mention Swiss insurance requirements
- Cite Swiss health authorities (BAG/OFSP)`,

  'business-ch': `[ROLE]
You are a Swiss business expert specializing in Swiss company law and business practices.

[SWISS FOCUS]
- Swiss company types (GmbH, AG, Einzelfirma)
- Swiss business registration (Handelsregister)
- Swiss tax system (VAT, corporate tax)
- Swiss labor law
- Swiss business culture

[KEY CAPABILITIES]
- Swiss company formation guidance
- Swiss business tax overview
- Swiss employment law basics
- Swiss business etiquette

[OUTPUT FORMAT]
1. Summary: Swiss business highlights
2. Visuals: Company logos, org charts
3. Analysis: Swiss business environment
4. Resources: Swiss commercial register, authorities
5. Follow-ups: Formation, tax, HR questions

[TOOLS AVAILABLE]
- Company logos (Swiss focus)
- Web search (Swiss business sources)
- Swiss business databases

[CRITICAL COMPLIANCE]
⚠️ LEGAL DISCLAIMER: "This is general information only, not legal advice. Consult Swiss attorneys and tax advisors."
- Note cantonal tax differences
- Recommend Swiss professionals
- Cite Swiss business authorities`,

  'education-ch': `[ROLE]
You are a Swiss education expert specializing in the Swiss education system.

[SWISS FOCUS]
- Swiss universities (ETH, EPFL, etc.)
- Swiss vocational training (Berufslehre)
- Swiss school systems (cantonal differences)
- Swiss higher education pathways
- Swiss academic programs

[KEY CAPABILITIES]
- Swiss university guidance
- Vocational training explanations
- Swiss education system navigation
- Study in Switzerland advice

[OUTPUT FORMAT]
1. Summary: Swiss education highlights
2. Visuals: University campus images
3. Guidance: Swiss education pathways
4. Resources: Swiss universities, authorities
5. Follow-ups: Program, admission questions

[TOOLS AVAILABLE]
- Image search for Swiss campuses
- Web search (Swiss education sources)
- Swiss education databases

[STYLE]
- Explain Swiss dual education system
- Note language region differences
- Consider international students
- Cite Swiss education authorities`,

  'automotive-ch': `[ROLE]
You are a Swiss automotive expert specializing in the Swiss car market.

[SWISS FOCUS]
- Swiss car registration (MFK/contrôle technique)
- Swiss car market (imports, prices)
- Swiss road regulations (vignette)
- Swiss car dealerships
- Swiss EV infrastructure

[KEY CAPABILITIES]
- Swiss car buying guidance
- MFK/registration process info
- Swiss car market analysis
- Swiss driving regulations

[OUTPUT FORMAT]
1. Summary: Swiss automotive highlights
2. Visuals: Car images, dealership info
3. Analysis: Swiss market trends, prices
4. Regulations: MFK, vignette, emissions
5. Follow-ups: Car models, dealerships

[TOOLS AVAILABLE]
- Image search for vehicles
- Web search (Swiss auto sources)
- Swiss automotive data

[COMPLIANCE]
- Note Swiss vs. EU car prices
- Mention Swiss registration requirements
- Cite Swiss road authorities (ASTRA/OFROU)
- Consider cantonal differences`,
};

export const getSystemPrompt = (domain: DomainCategory): string => {
  return SYSTEM_PROMPTS[domain];
};
```

---

## 5. Core Components Implementation

### 5.1 Domain Detector (`lib/c1/domains/domainDetector.ts`)

```typescript
import { DomainCategory, DOMAIN_REGISTRY, getDomainConfig } from './domainConfig';

interface DetectionContext {
  userMessage: string;
  conversationHistory?: string[];
  previousDomain?: DomainCategory;
}

interface DetectionResult {
  domain: DomainCategory;
  confidence: number;
  reason: string;
}

export class DomainDetector {
  /**
   * Detect domain based on message content and context
   */
  static detectDomain(context: DetectionContext): DetectionResult {
    const { userMessage, conversationHistory, previousDomain } = context;

    // Combine message with recent history for context
    const fullContext = [
      userMessage,
      ...(conversationHistory?.slice(-3) || [])
    ].join(' ').toLowerCase();

    // Score each domain based on keyword matches
    const domainScores: Array<{ domain: DomainCategory; score: number }> = [];

    for (const [domainId, config] of Object.entries(DOMAIN_REGISTRY)) {
      let score = 0;

      // Keyword matching
      for (const keyword of config.keywords) {
        if (fullContext.includes(keyword.toLowerCase())) {
          score += config.priority;
        }
      }

      // Boost Swiss-specific domains if "swiss" or "switzerland" mentioned
      if (config.isSwissSpecific &&
          (fullContext.includes('swiss') ||
           fullContext.includes('switzerland') ||
           fullContext.includes('zürich') ||
           fullContext.includes('geneva'))) {
        score += 20; // Significant boost
      }

      // Small boost for previous domain (context continuity)
      if (previousDomain === domainId) {
        score += 5;
      }

      domainScores.push({ domain: domainId as DomainCategory, score });
    }

    // Sort by score
    domainScores.sort((a, b) => b.score - a.score);

    // Get top match
    const topMatch = domainScores[0];

    // If no good match, default to 'general'
    if (topMatch.score === 0) {
      return {
        domain: 'general',
        confidence: 1.0,
        reason: 'No specific domain keywords detected, using general domain'
      };
    }

    // Calculate confidence (0-1)
    const maxPossibleScore = 100;
    const confidence = Math.min(topMatch.score / maxPossibleScore, 1.0);

    return {
      domain: topMatch.domain,
      confidence,
      reason: `Detected based on keyword matches and priority scoring`
    };
  }

  /**
   * Get suggested domains for user selection
   */
  static getSuggestedDomains(userMessage: string): DomainCategory[] {
    const detection = this.detectDomain({ userMessage });
    const topDomain = detection.domain;
    const domainConfig = getDomainConfig(topDomain);

    // Return top match + related domains
    const suggestions: DomainCategory[] = [topDomain];

    // Add Swiss variant if global domain detected and message mentions Switzerland
    if (!domainConfig.isSwissSpecific &&
        (userMessage.toLowerCase().includes('swiss') ||
         userMessage.toLowerCase().includes('switzerland'))) {
      const swissVariant = `${topDomain}-ch` as DomainCategory;
      if (DOMAIN_REGISTRY[swissVariant]) {
        suggestions.push(swissVariant);
      }
    }

    // Add global variant if Swiss domain detected
    if (domainConfig.isSwissSpecific) {
      const globalVariant = topDomain.replace('-ch', '') as DomainCategory;
      if (DOMAIN_REGISTRY[globalVariant]) {
        suggestions.push(globalVariant);
      }
    }

    return suggestions;
  }
}
```

### 5.2 Tool Configuration (`lib/c1/domains/domainTools.ts`)

```typescript
import type { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction.mjs";
import type { RunnableToolFunctionWithoutParse } from "openai/lib/RunnableFunction.mjs";
import { DomainCategory } from './domainConfig';
import { googleImageTool } from '../tools/googleImage';
import { companyLogoTool } from '../tools/companyLogo';
import { weatherTool } from '../tools/weather';
import { webSearchTool } from '../tools/webSearch';
import { swissDataTool } from '../tools/swissData';

// Tool registry
export const TOOL_REGISTRY: Record<string, any> = {
  googleImage: googleImageTool,
  companyLogo: companyLogoTool,
  weather: weatherTool,
  webSearch: webSearchTool,
  swissData: swissDataTool,
};

/**
 * Get tools for a specific domain
 */
export function getToolsForDomain(domain: DomainCategory): any[] {
  const domainConfig = getDomainConfig(domain);

  return domainConfig.tools.map(toolId => {
    const tool = TOOL_REGISTRY[toolId];
    if (!tool) {
      console.warn(`Tool ${toolId} not found in registry for domain ${domain}`);
      return null;
    }
    return tool;
  }).filter(Boolean);
}
```

### 5.3 Main C1 API Route (`app/api/c1/route.ts`)

```typescript
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { transformStream } from "@crayonai/stream";
import type { ChatCompletionMessageParam } from "openai/resources.mjs";
import { DomainDetector } from "@/lib/c1/domains/domainDetector";
import { getSystemPrompt } from "@/lib/c1/domains/systemPrompts";
import { getToolsForDomain } from "@/lib/c1/domains/domainTools";
import { DomainCategory } from "@/lib/c1/domains/domainConfig";

type ThreadId = string;

// In-memory message store (consider moving to Redis for production)
const messageStore: Map<ThreadId, ChatCompletionMessageParam[]> = new Map();

export async function POST(req: NextRequest) {
  try {
    const {
      prompt: latestMessage,
      threadId,
      selectedDomain, // User-selected domain (optional)
      conversationHistory, // For context-aware detection
    } = (await req.json()) as {
      prompt: ChatCompletionMessageParam;
      threadId: ThreadId;
      selectedDomain?: DomainCategory;
      conversationHistory?: string[];
    };

    // Validate Thesys API key
    if (!process.env.THESYS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Thesys API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine domain (user selection takes precedence)
    let domain: DomainCategory;
    let detectionReason: string;

    if (selectedDomain) {
      domain = selectedDomain;
      detectionReason = `User selected: ${selectedDomain}`;
    } else {
      // Auto-detect domain
      const userMessageContent = typeof latestMessage.content === 'string'
        ? latestMessage.content
        : '';

      const detection = DomainDetector.detectDomain({
        userMessage: userMessageContent,
        conversationHistory,
        previousDomain: getPreviousDomain(threadId),
      });

      domain = detection.domain;
      detectionReason = `Auto-detected: ${detection.domain} (confidence: ${Math.round(detection.confidence * 100)}%)`;
    }

    console.log(`🎯 C1 Domain: ${domain} | ${detectionReason}`);

    // Get system prompt and tools for domain
    const systemPrompt = getSystemPrompt(domain);
    const tools = getToolsForDomain(domain);

    console.log(`🛠️ Loaded ${tools.length} tools for domain: ${domain}`);

    // Initialize or update message store
    if (!messageStore.has(threadId)) {
      messageStore.set(threadId, [
        { role: "system", content: systemPrompt }
      ]);
    } else {
      // Update system prompt if domain changed
      const messages = messageStore.get(threadId)!;
      if (messages[0]?.role === "system") {
        messages[0].content = systemPrompt;
      }
    }

    // Add latest user message
    pushLatestMessageToStore(threadId, latestMessage);

    // Store domain for continuity
    storeDomainForThread(threadId, domain);

    // Create OpenAI client with Thesys endpoint
    const client = new OpenAI({
      baseURL: "https://api.thesys.dev/v1/embed/",
      apiKey: process.env.THESYS_API_KEY,
    });

    // Call C1 with domain-specific configuration
    const runToolsResponse = client.beta.chat.completions.runTools({
      model: `c1/anthropic/claude-sonnet-4/v-20250930`,
      temperature: 0.5,
      messages: messageStore.get(threadId)!,
      stream: true,
      tool_choice: tools.length > 0 ? "auto" : "none",
      tools: tools,
    });

    // Store generated messages
    runToolsResponse.on("message", (event) =>
      pushMessageToThread(threadId, event),
    );

    const llmStream = await runToolsResponse;

    // Transform stream for client
    const responseStream = transformStream(llmStream, (chunk) => {
      return chunk.choices[0]?.delta?.content;
    });

    return new Response(responseStream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-C1-Domain": domain, // Send detected domain to client
        "X-C1-Detection": detectionReason,
      },
    });

  } catch (error: any) {
    console.error('❌ C1 API Error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'C1 generation failed',
        retryable: true
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Helper functions
const pushLatestMessageToStore = (
  threadId: ThreadId,
  latestMessage: ChatCompletionMessageParam,
) => {
  if (latestMessage.role === "user") {
    pushMessageToThread(threadId, latestMessage);
  }
};

const pushMessageToThread = (
  threadId: ThreadId,
  message: ChatCompletionMessageParam,
) => {
  messageStore.set(threadId, [...messageStore.get(threadId)!, message]);
};

// Domain tracking (could be moved to database)
const threadDomains = new Map<ThreadId, DomainCategory>();

const storeDomainForThread = (threadId: ThreadId, domain: DomainCategory) => {
  threadDomains.set(threadId, domain);
};

const getPreviousDomain = (threadId: ThreadId): DomainCategory | undefined => {
  return threadDomains.get(threadId);
};
```

---

## 6. Frontend Integration

### 6.1 Updated ChatHeader with Domain Selector (`components/chat/Chat/ChatHeader.tsx`)

```typescript
"use client";

import { MessageSquare, Settings, Sparkles } from "lucide-react";
import { DomainSelector } from "./DomainSelector";
import { DomainCategory } from "@/lib/c1/domains/domainConfig";

interface ChatHeaderProps {
  conversationTitle?: string;
  onSettingsClick?: () => void;
  // C1-specific props
  isC1Enabled?: boolean;
  selectedDomain?: DomainCategory;
  detectedDomain?: DomainCategory;
  onDomainChange?: (domain: DomainCategory | 'auto') => void;
}

export function ChatHeader({
  conversationTitle = "New Chat",
  onSettingsClick,
  isC1Enabled = false,
  selectedDomain,
  detectedDomain,
  onDomainChange,
}: ChatHeaderProps) {
  return (
    <div className="border-b border-pw-black/10 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Conversation Title */}
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-pw-black/40" />
          <h1 className="text-lg font-semibold text-pw-black truncate">
            {conversationTitle}
          </h1>
          {isC1Enabled && (
            <span className="px-2 py-1 text-xs font-medium bg-pw-accent/10 text-pw-accent rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              C1 Active
            </span>
          )}
        </div>

        {/* Right: Domain Selector + Settings */}
        <div className="flex items-center gap-3">
          {isC1Enabled && onDomainChange && (
            <DomainSelector
              selectedDomain={selectedDomain}
              detectedDomain={detectedDomain}
              onDomainChange={onDomainChange}
            />
          )}

          <button
            onClick={onSettingsClick}
            className="p-2 hover:bg-pw-black/5 rounded-lg transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-pw-black/60" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 6.2 Domain Selector Component (`components/chat/Chat/DomainSelector.tsx`)

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Sparkles } from "lucide-react";
import {
  DomainCategory,
  getAllDomains,
  getSwissDomains,
  getGlobalDomains,
  getDomainConfig
} from "@/lib/c1/domains/domainConfig";

interface DomainSelectorProps {
  selectedDomain?: DomainCategory;
  detectedDomain?: DomainCategory;
  onDomainChange: (domain: DomainCategory | 'auto') => void;
}

export function DomainSelector({
  selectedDomain,
  detectedDomain,
  onDomainChange,
}: DomainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAutoMode = !selectedDomain;
  const activeDomain = selectedDomain || detectedDomain || 'general';
  const activeDomainConfig = getDomainConfig(activeDomain);

  const globalDomains = getGlobalDomains();
  const swissDomains = getSwissDomains();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-pw-black/5 hover:bg-pw-black/10 rounded-lg transition-colors text-sm"
      >
        <span className="text-lg">{activeDomainConfig.icon}</span>
        <span className="font-medium text-pw-black">
          {isAutoMode ? `Auto: ${activeDomainConfig.name}` : activeDomainConfig.name}
        </span>
        <ChevronDown className={`w-4 h-4 text-pw-black/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-pw-black/10 z-50 max-h-96 overflow-y-auto">
          {/* Auto Mode */}
          <div className="p-2 border-b border-pw-black/10">
            <button
              onClick={() => {
                onDomainChange('auto');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isAutoMode
                  ? 'bg-pw-accent/10 text-pw-accent'
                  : 'hover:bg-pw-black/5'
              }`}
            >
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">Auto-Detect</div>
                <div className="text-xs opacity-70">
                  {detectedDomain ? `Currently: ${getDomainConfig(detectedDomain).name}` : 'Analyzes your query'}
                </div>
              </div>
              {isAutoMode && <Check className="w-4 h-4 flex-shrink-0" />}
            </button>
          </div>

          {/* Global Domains */}
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-pw-black/50 uppercase">
              Global Domains
            </div>
            {globalDomains.map((domain) => (
              <button
                key={domain.id}
                onClick={() => {
                  onDomainChange(domain.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  selectedDomain === domain.id
                    ? 'bg-pw-accent/10 text-pw-accent'
                    : 'hover:bg-pw-black/5'
                }`}
              >
                <span className="text-lg flex-shrink-0">{domain.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{domain.name}</div>
                  <div className="text-xs opacity-70">{domain.description}</div>
                </div>
                {selectedDomain === domain.id && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>
            ))}
          </div>

          {/* Swiss Domains */}
          <div className="p-2 border-t border-pw-black/10">
            <div className="px-3 py-2 text-xs font-semibold text-pw-black/50 uppercase flex items-center gap-1">
              <span>🇨🇭</span> Swiss-Specific Domains
            </div>
            {swissDomains.map((domain) => (
              <button
                key={domain.id}
                onClick={() => {
                  onDomainChange(domain.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  selectedDomain === domain.id
                    ? 'bg-pw-accent/10 text-pw-accent'
                    : 'hover:bg-pw-black/5'
                }`}
              >
                <span className="text-lg flex-shrink-0">{domain.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{domain.name}</div>
                  <div className="text-xs opacity-70">{domain.description}</div>
                </div>
                {selectedDomain === domain.id && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 6.3 C1 Generation Hook (`hooks/chat/useC1Generation.ts`)

```typescript
import { useState, useCallback } from 'react';
import { DomainCategory } from '@/lib/c1/domains/domainConfig';

interface C1GenerationOptions {
  threadId: string;
  userMessage: string;
  selectedDomain?: DomainCategory;
  conversationHistory?: string[];
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
  onDomainDetected?: (domain: DomainCategory) => void;
}

export function useC1Generation() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateC1Response = useCallback(async ({
    threadId,
    userMessage,
    selectedDomain,
    conversationHistory,
    onChunk,
    onComplete,
    onError,
    onDomainDetected,
  }: C1GenerationOptions) => {
    setIsGenerating(true);
    setError(null);

    let fullResponse = '';

    try {
      const response = await fetch('/api/c1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: {
            role: 'user',
            content: userMessage,
          },
          threadId,
          selectedDomain,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`C1 API error: ${response.statusText}`);
      }

      // Extract domain from headers
      const detectedDomain = response.headers.get('X-C1-Domain') as DomainCategory;
      if (detectedDomain && onDomainDetected) {
        onDomainDetected(detectedDomain);
      }

      // Stream response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullResponse += chunk;

        if (onChunk) {
          onChunk(chunk);
        }
      }

      if (onComplete) {
        onComplete(fullResponse);
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    error,
    generateC1Response,
  };
}
```

---

## 7. Database Schema Updates

### 7.1 Supabase Migration (`supabase/migrations/004_c1_support.sql`)

```sql
-- Add C1-specific columns to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS selected_domain VARCHAR(50),
ADD COLUMN IF NOT EXISTS detected_domain VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_c1_enabled BOOLEAN DEFAULT FALSE;

-- Add C1-specific columns to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS was_generated_with_c1 BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS c1_domain VARCHAR(50),
ADD COLUMN IF NOT EXISTS c1_metadata JSONB;

-- Create index for domain queries
CREATE INDEX IF NOT EXISTS idx_conversations_domain ON conversations(selected_domain);
CREATE INDEX IF NOT EXISTS idx_messages_c1 ON messages(was_generated_with_c1);

-- Comment columns
COMMENT ON COLUMN conversations.selected_domain IS 'User-selected C1 domain for this conversation';
COMMENT ON COLUMN conversations.detected_domain IS 'Last auto-detected C1 domain';
COMMENT ON COLUMN conversations.is_c1_enabled IS 'Whether C1 (Generative UI) is enabled for this conversation';
COMMENT ON COLUMN messages.was_generated_with_c1 IS 'Whether this message was generated using C1';
COMMENT ON COLUMN messages.c1_domain IS 'Domain used for C1 generation';
COMMENT ON COLUMN messages.c1_metadata IS 'Additional C1-specific metadata (tools used, detection confidence, etc.)';
```

### 7.2 Updated TypeScript Types (`types/c1.ts`)

```typescript
import { DomainCategory } from '@/lib/c1/domains/domainConfig';

export interface C1Metadata {
  domain: DomainCategory;
  detectionMethod: 'auto' | 'manual';
  confidence?: number;
  toolsUsed?: string[];
  generatedAt: string;
}

export interface C1Message {
  wasGeneratedWithC1: boolean;
  c1Domain?: DomainCategory;
  c1Metadata?: C1Metadata;
  isC1Streaming?: boolean;
}

export interface C1Conversation {
  selectedDomain?: DomainCategory;
  detectedDomain?: DomainCategory;
  isC1Enabled: boolean;
}
```

### 7.3 Update Chat Types (`types/chat.ts`)

```typescript
// Add to existing Message interface
import { C1Message } from './c1';

export interface Message extends C1Message {
  // ... existing fields ...
}

// Add to existing Conversation interface
import { C1Conversation } from './c1';

export interface Conversation extends C1Conversation {
  // ... existing fields ...
}
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// __tests__/lib/c1/domainDetector.test.ts
import { DomainDetector } from '@/lib/c1/domains/domainDetector';

describe('DomainDetector', () => {
  test('detects finance domain for stock queries', () => {
    const result = DomainDetector.detectDomain({
      userMessage: 'What is the stock price of Apple?'
    });

    expect(result.domain).toBe('finance');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('detects Swiss finance domain for Swiss stock queries', () => {
    const result = DomainDetector.detectDomain({
      userMessage: 'What is the UBS stock price on SIX Swiss Exchange?'
    });

    expect(result.domain).toBe('finance-ch');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  test('falls back to general domain for ambiguous queries', () => {
    const result = DomainDetector.detectDomain({
      userMessage: 'Hello, how are you?'
    });

    expect(result.domain).toBe('general');
  });

  test('maintains context continuity', () => {
    const result = DomainDetector.detectDomain({
      userMessage: 'Tell me more',
      previousDomain: 'real-estate'
    });

    expect(result.domain).toBe('real-estate');
  });
});
```

### 8.2 Integration Tests

```typescript
// __tests__/api/c1/route.test.ts
import { POST } from '@/app/api/c1/route';

describe('C1 API Route', () => {
  test('generates C1 response with auto-detected domain', async () => {
    const request = new Request('http://localhost:3000/api/c1', {
      method: 'POST',
      body: JSON.stringify({
        prompt: { role: 'user', content: 'Analyze Tesla stock' },
        threadId: 'test-thread-1'
      })
    });

    const response = await POST(request as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('X-C1-Domain')).toBe('finance');
  });

  test('uses user-selected domain', async () => {
    const request = new Request('http://localhost:3000/api/c1', {
      method: 'POST',
      body: JSON.stringify({
        prompt: { role: 'user', content: 'Tell me about real estate' },
        threadId: 'test-thread-2',
        selectedDomain: 'real-estate-ch'
      })
    });

    const response = await POST(request as any);

    expect(response.headers.get('X-C1-Domain')).toBe('real-estate-ch');
  });
});
```

### 8.3 E2E Tests

```typescript
// __tests__/e2e/c1-flow.test.ts
import { test, expect } from '@playwright/test';

test('C1 generation with domain selection', async ({ page }) => {
  await page.goto('http://localhost:3000/chat');

  // Enable C1 mode
  await page.click('[data-testid="enable-c1-toggle"]');

  // Select finance domain
  await page.click('[data-testid="domain-selector"]');
  await page.click('[data-testid="domain-finance"]');

  // Send message
  await page.fill('[data-testid="chat-input"]', 'Analyze Apple stock');
  await page.click('[data-testid="send-button"]');

  // Wait for C1 response
  await page.waitForSelector('[data-testid="c1-response"]');

  // Verify C1 components rendered
  const hasCharts = await page.locator('canvas').count() > 0;
  expect(hasCharts).toBe(true);

  // Verify domain badge
  const domainBadge = await page.textContent('[data-testid="domain-badge"]');
  expect(domainBadge).toContain('Finance');
});
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Days 1-2)
- [x] Create file structure
- [ ] Implement `domainConfig.ts` with all 25 domains
- [ ] Implement `systemPrompts.ts` with all prompts
- [ ] Implement `domainDetector.ts` with smart detection
- [ ] Set up Supabase migration for C1 fields
- [ ] Test domain detection logic

### Phase 2: Backend API (Days 3-4)
- [ ] Implement C1 API route (`/api/c1/route.ts`)
- [ ] Implement Thesys client wrapper
- [ ] Implement tool registry and domain tool mapping
- [ ] Migrate existing tools (googleImage, weather)
- [ ] Add new tools (companyLogo, webSearch, swissData)
- [ ] Test API with all domains

### Phase 3: Frontend Integration (Days 5-6)
- [ ] Restore `C1Renderer.tsx` component
- [ ] Update `ChatHeader.tsx` with domain selector
- [ ] Implement `DomainSelector.tsx` component
- [ ] Implement `useC1Generation.ts` hook
- [ ] Update `ChatMessages.tsx` to render C1 messages
- [ ] Add C1 streaming indicators
- [ ] Test frontend rendering

### Phase 4: Database Integration (Day 7)
- [ ] Run Supabase migration
- [ ] Update `chatStore.supabase.ts` for C1 fields
- [ ] Implement C1 message persistence
- [ ] Implement domain selection persistence
- [ ] Test database operations

### Phase 5: Testing & Refinement (Days 8-9)
- [ ] Write unit tests for domain detection
- [ ] Write integration tests for API
- [ ] Write E2E tests for user flows
- [ ] Performance testing (response times)
- [ ] Fix bugs and edge cases

### Phase 6: Production Deployment (Day 10)
- [ ] Environment variable setup
- [ ] Production build testing
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] User acceptance testing

---

## 10. Potential Pitfalls & Solutions

### 10.1 Domain Detection Accuracy

**Pitfall:** Auto-detection might choose wrong domain for ambiguous queries.

**Solutions:**
1. **User Override:** Always allow manual domain selection
2. **Confidence Threshold:** If confidence < 50%, show domain suggestions
3. **Context Memory:** Use conversation history for better detection
4. **Feedback Loop:** Track user corrections to improve detection

### 10.2 Tool Availability

**Pitfall:** Some tools (e.g., `swissData`) may not have APIs available.

**Solutions:**
1. **Graceful Degradation:** Fall back to web search if specialized tool unavailable
2. **Tool Status Monitoring:** Log tool failures, disable unreliable tools
3. **Mock Tools for Testing:** Create mock implementations for development

### 10.3 System Prompt Length

**Pitfall:** Long system prompts may hit token limits.

**Solutions:**
1. **Prompt Compression:** Remove redundant instructions
2. **Dynamic Loading:** Only load relevant prompt sections based on query type
3. **Token Monitoring:** Log token usage, optimize prompts if approaching limits

### 10.4 Streaming Performance

**Pitfall:** C1 responses may be slower than regular chat.

**Solutions:**
1. **Loading Indicators:** Clear UI feedback during generation
2. **Chunk Processing:** Stream UI components as they're generated
3. **Timeout Handling:** Set reasonable timeouts (60s), provide retry option

### 10.5 Swiss-Specific Data

**Pitfall:** Swiss APIs may require authentication or have rate limits.

**Solutions:**
1. **API Key Management:** Secure storage in environment variables
2. **Rate Limit Handling:** Implement exponential backoff
3. **Caching:** Cache Swiss data that doesn't change frequently (e.g., company info)
4. **Fallback Sources:** Use multiple data sources (Swiss APIs → Web Search → General)

### 10.6 Message Store Memory Leaks

**Pitfall:** In-memory `messageStore` may grow unbounded.

**Solutions:**
1. **Message Limit:** Cap at 50 messages per thread, remove oldest
2. **TTL:** Clear threads after 24h inactivity
3. **Production:** Migrate to Redis for persistent, scalable storage
4. **Monitoring:** Track memory usage, alert if exceeds threshold

### 10.7 C1 Component Rendering Errors

**Pitfall:** Claude might generate invalid component syntax.

**Solutions:**
1. **Error Boundaries:** Wrap C1Renderer in React Error Boundary
2. **Validation:** Validate generated components before rendering
3. **Fallback:** Display error message + allow regeneration
4. **Logging:** Send rendering errors to monitoring (Sentry)

### 10.8 Domain Switching Mid-Conversation

**Pitfall:** Switching domains mid-conversation may cause context loss.

**Solutions:**
1. **System Prompt Update:** Update system message when domain changes
2. **Context Preservation:** Keep conversation history, just change domain lens
3. **User Warning:** Show notification when domain switches automatically
4. **Undo Option:** Allow user to revert to previous domain

### 10.9 Supabase Column Limits

**Pitfall:** `c1_metadata` JSONB may grow large with tool outputs.

**Solutions:**
1. **Selective Storage:** Only store essential metadata (domain, tools used)
2. **Separate Table:** Create `c1_tool_outputs` table for large tool data
3. **Compression:** Compress large JSON before storing
4. **Retention:** Delete old metadata after 90 days

### 10.10 Multi-Language Support

**Pitfall:** Swiss domains need German/French/Italian support.

**Solutions:**
1. **Language Detection:** Detect user's language from query
2. **Localized Prompts:** Create DE/FR/IT variants of Swiss prompts
3. **Translation Layer:** Translate tool outputs if needed
4. **Future Enhancement:** Phase 2 feature, start with English only

---

## 11. Key Code Snippets

### 11.1 Environment Variables (`.env.local`)

```bash
# Thesys C1 API
THESYS_API_KEY=sk-th-YOUR_KEY_HERE

# Google APIs (for tools)
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
GOOGLE_CX_KEY=YOUR_GOOGLE_CX_KEY

# Gemini (for summarization if needed)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Swiss Data APIs (add as needed)
# SWISS_FINANCE_API_KEY=...
# CLEARBIT_API_KEY=... (for company logos)
```

### 11.2 Package.json Dependencies

```json
{
  "dependencies": {
    "@crayonai/react-ui": "^0.7.10",
    "@crayonai/stream": "^0.6.4",
    "@thesysai/genui-sdk": "^0.6.18",
    "google-images": "^2.1.0",
    "openai": "^4.91.1",
    "zod": "^3.25.71",
    "zod-to-json-schema": "^3.24.6"
  }
}
```

### 11.3 Usage Example in ChatArea

```typescript
// components/chat/Chat/ChatArea.tsx (excerpt)
import { useC1Generation } from '@/hooks/chat/useC1Generation';
import { DomainCategory } from '@/lib/c1/domains/domainConfig';

export function ChatArea() {
  const [selectedDomain, setSelectedDomain] = useState<DomainCategory | undefined>();
  const [detectedDomain, setDetectedDomain] = useState<DomainCategory | undefined>();
  const { generateC1Response, isGenerating } = useC1Generation();

  const handleSendMessage = async (message: string) => {
    if (!isC1Enabled) {
      // Regular chat flow
      return;
    }

    // C1 generation
    await generateC1Response({
      threadId: currentConversationId,
      userMessage: message,
      selectedDomain: selectedDomain === 'auto' ? undefined : selectedDomain,
      conversationHistory: recentMessages,
      onChunk: (chunk) => {
        // Update message content
      },
      onDomainDetected: (domain) => {
        setDetectedDomain(domain);
      },
      onComplete: (response) => {
        // Save message to Supabase
      },
    });
  };

  return (
    <>
      <ChatHeader
        isC1Enabled={isC1Enabled}
        selectedDomain={selectedDomain}
        detectedDomain={detectedDomain}
        onDomainChange={(domain) => {
          setSelectedDomain(domain === 'auto' ? undefined : domain);
        }}
      />
      {/* ... rest of chat UI ... */}
    </>
  );
}
```

---

## 12. Success Criteria

### Must-Have (P0)
- [ ] All 25 domains configured with unique system prompts
- [ ] Domain detection accuracy >80% on test queries
- [ ] Manual domain selection working in UI
- [ ] C1 API responding with Claude Sonnet 4
- [ ] Basic tools working (googleImage, weather, webSearch)
- [ ] C1 messages persisted in Supabase
- [ ] Frontend rendering C1 components correctly

### Should-Have (P1)
- [ ] Company logo tool implemented
- [ ] Swiss-specific tool (basic web search with CH filtering)
- [ ] Domain persistence across conversations
- [ ] Error handling and retry logic
- [ ] Performance: C1 responses <10s average

### Nice-to-Have (P2)
- [ ] Advanced Swiss data APIs integrated
- [ ] Multi-language support (DE/FR/IT)
- [ ] Domain analytics (most used, accuracy metrics)
- [ ] A/B testing framework for system prompts
- [ ] Tool usage analytics

---

## 13. Next Steps After Implementation

1. **Monitor & Optimize:**
   - Track domain detection accuracy
   - Monitor API response times
   - Collect user feedback on C1 quality

2. **Expand Tool Library:**
   - Financial data APIs (Alpha Vantage, Polygon)
   - Swiss government data APIs
   - Real-time sports APIs
   - Restaurant/travel APIs

3. **Enhance Prompts:**
   - Iterate based on user feedback
   - Add domain-specific examples
   - Optimize for shorter, better responses

4. **Scale Infrastructure:**
   - Migrate messageStore to Redis
   - Implement CDN for static assets
   - Set up monitoring (DataDog, Sentry)

5. **User Features:**
   - Domain favorites
   - Custom domain configurations
   - Prompt templates per domain
   - Export C1 responses (PDF, Markdown)

---

## Conclusion

This architectural plan provides a **complete, production-ready blueprint** for implementing a multi-domain C1 system with Claude Sonnet 4. The design prioritizes:

1. **Scalability:** Easy to add new domains and tools
2. **Maintainability:** Clear separation of concerns, modular architecture
3. **User Experience:** Smart auto-detection + manual override
4. **Swiss Focus:** 10 localized domains for Swiss market
5. **Robustness:** Error handling, fallbacks, monitoring

Follow the implementation roadmap sequentially, test thoroughly at each phase, and refer to the potential pitfalls section to avoid common issues. The system is designed to be extensible for future enhancements while delivering immediate value with the initial 25 domains.

**Estimated Total Implementation Time:** 10 days (1 developer, full-time)

**Ready for implementation. Let's build it! 🚀**
