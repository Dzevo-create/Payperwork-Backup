# C1 Domain Reference - Complete Domain List

This document provides a quick reference for all 25 domains with their configurations.

---

## Domain Overview

| Category | Global | Swiss-Specific | **Total** |
|----------|--------|----------------|-----------|
| Base     | 13     | 10             | **23**    |
| Fallback | 1      | -              | **1**     |
| **Total**| **14** | **10**         | **24**    |

**Note:** We have 24 domains total (13 global + 10 Swiss + 1 general fallback)

---

## Global Domains (13)

### 1. Finance
- **ID:** `finance`
- **Icon:** TrendingUp (📈)
- **Description:** Stock analysis, market insights, financial metrics
- **Keywords:** stock, market, trading, portfolio, investment, ticker, earnings, revenue
- **Tools:** googleImage, companyLogo, webSearch
- **Priority:** 10
- **Use Cases:**
  - Stock analysis (e.g., "Analyze Tesla stock")
  - Market briefings (e.g., "Pre-market movers today")
  - Portfolio comparisons (e.g., "Compare AAPL vs MSFT")

### 2. Real Estate
- **ID:** `real-estate`
- **Icon:** Home (🏠)
- **Description:** Property listings, market trends, valuations
- **Keywords:** property, real estate, apartment, house, rent, buy, mortgage
- **Tools:** googleImage, webSearch
- **Priority:** 8
- **Use Cases:**
  - Property search (e.g., "Apartments for rent in New York")
  - Market analysis (e.g., "Real estate market trends 2025")
  - Investment guidance (e.g., "Is now a good time to buy?")

### 3. Construction
- **ID:** `construction`
- **Icon:** HardHat (👷)
- **Description:** Building projects, materials, contractors
- **Keywords:** construction, building, contractor, renovation, materials, architecture
- **Tools:** googleImage, webSearch
- **Priority:** 7
- **Use Cases:**
  - Project planning (e.g., "Kitchen renovation cost estimate")
  - Material selection (e.g., "Best flooring materials")
  - Contractor recommendations

### 4. AI & Technology
- **ID:** `ai-tech`
- **Icon:** Cpu (💻)
- **Description:** Tech trends, AI innovations, software development
- **Keywords:** AI, machine learning, technology, software, coding, programming, LLM
- **Tools:** googleImage, companyLogo, webSearch
- **Priority:** 9
- **Use Cases:**
  - Tech explanations (e.g., "How does GPT-4 work?")
  - Software recommendations (e.g., "Best React frameworks")
  - AI news and trends

### 5. Sports
- **ID:** `sports`
- **Icon:** Trophy (🏆)
- **Description:** Game results, player stats, team analysis
- **Keywords:** sports, game, player, team, match, score, championship
- **Tools:** googleImage, webSearch
- **Priority:** 7
- **Use Cases:**
  - Game analysis (e.g., "Lakers vs Celtics recap")
  - Player stats (e.g., "LeBron James career stats")
  - Sports betting insights (informational)

### 6. Travel
- **ID:** `travel`
- **Icon:** Plane (✈️)
- **Description:** Destinations, itineraries, travel tips
- **Keywords:** travel, vacation, hotel, flight, destination, tourism, trip
- **Tools:** googleImage, weather, webSearch
- **Priority:** 6
- **Use Cases:**
  - Trip planning (e.g., "7-day Japan itinerary")
  - Destination guides (e.g., "Best time to visit Bali")
  - Weather checks (e.g., "Paris weather this week")

### 7. Health & Wellness
- **ID:** `health`
- **Icon:** Heart (❤️)
- **Description:** Health tips, fitness, nutrition
- **Keywords:** health, fitness, nutrition, wellness, medical, exercise
- **Tools:** googleImage, webSearch
- **Priority:** 7
- **Use Cases:**
  - Fitness routines (e.g., "30-day abs workout")
  - Nutrition advice (e.g., "High-protein meal plan")
  - General wellness (e.g., "Benefits of meditation")
- **⚠️ Disclaimer:** "This is general wellness information only, not medical advice."

### 8. Business & Legal
- **ID:** `business-legal`
- **Icon:** Briefcase (💼)
- **Description:** Business strategy, legal advice, compliance
- **Keywords:** business, legal, law, contract, compliance, strategy, consulting
- **Tools:** companyLogo, webSearch
- **Priority:** 8
- **Use Cases:**
  - Business strategy (e.g., "How to scale a startup")
  - Legal concepts (e.g., "Explain terms of service")
  - Contract guidance (e.g., "Key elements of NDA")
- **⚠️ Disclaimer:** "This is general information only, not legal advice."

### 9. Education
- **ID:** `education`
- **Icon:** GraduationCap (🎓)
- **Description:** Learning resources, courses, academic support
- **Keywords:** education, learning, course, university, study, academic
- **Tools:** googleImage, webSearch
- **Priority:** 6
- **Use Cases:**
  - Course recommendations (e.g., "Best online ML courses")
  - Study techniques (e.g., "How to study for exams")
  - University guidance (e.g., "Top CS programs")

### 10. Automotive
- **ID:** `automotive`
- **Icon:** Car (🚗)
- **Description:** Car reviews, maintenance, industry news
- **Keywords:** car, automotive, vehicle, driving, mechanic, auto
- **Tools:** googleImage, webSearch
- **Priority:** 6
- **Use Cases:**
  - Car reviews (e.g., "2025 Tesla Model 3 review")
  - Maintenance tips (e.g., "How to change oil")
  - Industry trends (e.g., "EV market outlook")

### 11. Creative & Design
- **ID:** `creative`
- **Icon:** Palette (🎨)
- **Description:** Design inspiration, creative projects
- **Keywords:** design, creative, art, graphics, branding, visual
- **Tools:** googleImage, webSearch
- **Priority:** 7
- **Use Cases:**
  - Design inspiration (e.g., "Modern logo designs")
  - Project guidance (e.g., "How to create a brand identity")
  - Creative trends (e.g., "2025 UI/UX trends")

### 12. Food & Dining
- **ID:** `food`
- **Icon:** UtensilsCrossed (🍴)
- **Description:** Recipes, restaurants, culinary trends
- **Keywords:** food, recipe, restaurant, cooking, cuisine, dining
- **Tools:** googleImage, webSearch
- **Priority:** 5
- **Use Cases:**
  - Recipes (e.g., "Classic carbonara recipe")
  - Restaurant recommendations (e.g., "Best Italian in NYC")
  - Culinary techniques (e.g., "How to sous vide")

### 13. General
- **ID:** `general`
- **Icon:** MessageSquare (💬)
- **Description:** General-purpose assistance
- **Keywords:** *(none - fallback)*
- **Tools:** googleImage, weather, webSearch
- **Priority:** 1
- **Use Cases:**
  - Catch-all for ambiguous queries
  - General conversation
  - Queries that don't fit other domains

---

## Swiss-Specific Domains (10)

### 14. Finance (CH)
- **ID:** `finance-ch`
- **Icon:** TrendingUp (📈 🇨🇭)
- **Description:** Swiss banking, investments, SIX Swiss Exchange
- **Keywords:** swiss stock, SIX, swiss bank, UBS, Credit Suisse, CHF, Zürich
- **Tools:** googleImage, companyLogo, webSearch, swissData
- **Priority:** 15 (higher than global finance)
- **Swiss Focus:**
  - SIX Swiss Exchange (SMI, SPI)
  - Swiss banks (UBS, Credit Suisse, Raiffeisen)
  - Swiss pension funds (2nd/3rd pillar)
  - FINMA regulations

### 15. Real Estate (CH)
- **ID:** `real-estate-ch`
- **Icon:** Home (🏠 🇨🇭)
- **Description:** Swiss property market, rental laws, mortgages
- **Keywords:** swiss property, Zürich apartment, Geneva real estate, CH rent
- **Tools:** googleImage, webSearch, swissData
- **Priority:** 12
- **Swiss Focus:**
  - Cantonal markets (Zürich, Geneva, Bern)
  - Swiss rental laws (OR)
  - Swiss mortgage rates (SNB)
  - Foreign ownership restrictions

### 16. Construction (CH)
- **ID:** `construction-ch`
- **Icon:** HardHat (👷 🇨🇭)
- **Description:** Swiss building codes, contractors
- **Keywords:** swiss construction, building permit CH, swiss contractor
- **Tools:** googleImage, webSearch, swissData
- **Priority:** 11
- **Swiss Focus:**
  - SIA norms
  - Cantonal building codes
  - Minergie certification
  - Swiss contractor licensing

### 17. Tech (CH)
- **ID:** `tech-ch`
- **Icon:** Cpu (💻 🇨🇭)
- **Description:** Swiss tech scene, startups, innovation
- **Keywords:** swiss tech, ETH Zürich, EPFL, swiss startup, Switzerland AI
- **Tools:** googleImage, companyLogo, webSearch, swissData
- **Priority:** 13
- **Swiss Focus:**
  - ETH Zürich, EPFL research
  - Swiss startup ecosystem
  - Swiss data privacy (FADP)
  - Swiss fintech/medtech

### 18. Sports (CH)
- **ID:** `sports-ch`
- **Icon:** Trophy (🏆 🇨🇭)
- **Description:** Swiss sports, football leagues, alpine sports
- **Keywords:** swiss sports, Super League, FC Basel, FC Zürich, alpine skiing
- **Tools:** googleImage, webSearch, swissData
- **Priority:** 11
- **Swiss Focus:**
  - Swiss Super League
  - Alpine skiing, ice hockey
  - Swiss national teams
  - Swiss Olympic athletes

### 19. Travel (CH)
- **ID:** `travel-ch`
- **Icon:** Plane (✈️ 🇨🇭)
- **Description:** Swiss destinations, SBB, mountain tourism
- **Keywords:** swiss travel, SBB, Swiss Alps, Zürich tourism, Interlaken
- **Tools:** googleImage, weather, webSearch, swissData
- **Priority:** 11
- **Swiss Focus:**
  - Swiss Alps destinations
  - SBB (Swiss Federal Railways)
  - Swiss cities (Zürich, Geneva, Bern, Lucerne)
  - Swiss hospitality

### 20. Health (CH)
- **ID:** `health-ch`
- **Icon:** Heart (❤️ 🇨🇭)
- **Description:** Swiss healthcare, insurance, wellness
- **Keywords:** swiss health, health insurance CH, swiss hospital, KVG
- **Tools:** googleImage, webSearch, swissData
- **Priority:** 11
- **Swiss Focus:**
  - Swiss health insurance (KVG/LAMal)
  - Swiss hospitals and clinics
  - Swiss wellness (thermal baths)
  - BAG/OFSP health authority
- **⚠️ Disclaimer:** "This is general information only, not medical advice. Consult Swiss healthcare professionals."

### 21. Business (CH)
- **ID:** `business-ch`
- **Icon:** Briefcase (💼 🇨🇭)
- **Description:** Swiss business law, company formation
- **Keywords:** swiss company, GmbH, AG, swiss law, business CH
- **Tools:** companyLogo, webSearch, swissData
- **Priority:** 12
- **Swiss Focus:**
  - Swiss company types (GmbH, AG, Einzelfirma)
  - Handelsregister (commercial register)
  - Swiss tax system (VAT, corporate)
  - Swiss labor law
- **⚠️ Disclaimer:** "This is general information only, not legal advice. Consult Swiss attorneys and tax advisors."

### 22. Education (CH)
- **ID:** `education-ch`
- **Icon:** GraduationCap (🎓 🇨🇭)
- **Description:** Swiss education system, universities
- **Keywords:** swiss university, ETH, EPFL, swiss education, study in Switzerland
- **Tools:** googleImage, webSearch, swissData
- **Priority:** 11
- **Swiss Focus:**
  - Swiss universities (ETH, EPFL, etc.)
  - Vocational training (Berufslehre)
  - Cantonal school systems
  - Swiss higher education pathways

### 23. Automotive (CH)
- **ID:** `automotive-ch`
- **Icon:** Car (🚗 🇨🇭)
- **Description:** Swiss car market, regulations, dealerships
- **Keywords:** swiss car, auto CH, car registration Switzerland, MFK
- **Tools:** googleImage, webSearch, swissData
- **Priority:** 10
- **Swiss Focus:**
  - MFK/contrôle technique
  - Swiss car market (imports, prices)
  - Vignette and road regulations
  - Swiss EV infrastructure
  - ASTRA/OFROU (road authority)

---

## Domain Selection Strategy

### Auto-Detection Logic

```
1. Extract keywords from user message
2. Score each domain based on keyword matches
3. Boost Swiss domains if "swiss" or "switzerland" mentioned
4. Add continuity bonus for previous domain
5. Select highest-scoring domain
6. Fall back to 'general' if no matches
```

### Manual Selection

Users can override auto-detection by selecting a domain from the UI:
- **Auto Mode:** Uses detection algorithm
- **Manual Mode:** Uses selected domain regardless of query

### Swiss Domain Priority

When Swiss keywords detected, Swiss domains are prioritized:
- **Global Finance Priority:** 10
- **Swiss Finance Priority:** 15 (50% boost)

This ensures Swiss-specific queries get Swiss-focused responses.

---

## Tool Mapping Summary

| Tool | Domains Using It |
|------|------------------|
| **googleImage** | All except business-legal, business-ch |
| **companyLogo** | finance, ai-tech, business-legal, finance-ch, tech-ch, business-ch |
| **weather** | travel, general, travel-ch |
| **webSearch** | All domains |
| **swissData** | All Swiss-specific domains (finance-ch through automotive-ch) |

---

## System Prompt Structure

Each domain's system prompt follows this structure:

```
[ROLE]
- Who the AI is (e.g., "professional financial analyst")
- Domain specialization

[SWISS FOCUS] (Swiss domains only)
- Swiss-specific topics
- Swiss institutions/regulations

[KEY CAPABILITIES]
- What the AI can do
- Domain-specific skills

[OUTPUT FORMAT]
1. Summary
2. Visuals
3. Analysis
4. Resources
5. Follow-ups

[TOOLS AVAILABLE]
- List of enabled tools

[COMPLIANCE RULES] (if applicable)
- Disclaimers (finance, health, legal)
- Tone guidelines
- Data source requirements

[STYLE] (optional)
- Communication style
- Tone preferences
```

---

## Domain Statistics

### By Priority (Detection Importance)
- **Priority 15:** finance-ch (highest)
- **Priority 13:** tech-ch
- **Priority 12:** real-estate-ch, business-ch
- **Priority 11:** construction-ch, sports-ch, travel-ch, health-ch, education-ch
- **Priority 10:** finance, automotive-ch
- **Priority 9:** ai-tech
- **Priority 8:** real-estate, business-legal
- **Priority 7:** construction, sports, health, creative
- **Priority 6:** travel, education, automotive
- **Priority 5:** food
- **Priority 1:** general (fallback)

### By Tool Count
- **4 tools:** finance-ch, tech-ch (most comprehensive)
- **3 tools:** finance, ai-tech, travel, travel-ch, general
- **2 tools:** Most other domains
- **1 tool:** business-ch (specialized)

### By Complexity (Prompt Length)
- **High Complexity:** finance, finance-ch (detailed workflows)
- **Medium Complexity:** real-estate, construction, ai-tech
- **Low Complexity:** food, general (simpler guidance)

---

## Domain Expansion Roadmap

### Phase 1 (Current): 24 Domains
- 13 global + 10 Swiss + 1 general

### Phase 2 (Future): Additional Global Domains
- Entertainment (movies, music, gaming)
- Science (physics, chemistry, biology)
- E-commerce (shopping, product reviews)
- Social Media (trends, strategies)

### Phase 3 (Future): More Swiss Domains
- swiss-politics (Swiss government, voting)
- swiss-culture (Swiss traditions, languages)
- swiss-environment (Swiss nature, sustainability)

### Phase 4 (Future): Localization
- German-speaking (DE)
- French-speaking (FR)
- Italian-speaking (IT)

---

## Quick Domain Lookup

**Finance queries:** Use `finance` or `finance-ch`
- "Stock price of..." → finance
- "UBS stock on SIX..." → finance-ch

**Property queries:** Use `real-estate` or `real-estate-ch`
- "Apartments in NYC..." → real-estate
- "Zürich rental market..." → real-estate-ch

**Tech queries:** Use `ai-tech` or `tech-ch`
- "How does ChatGPT work..." → ai-tech
- "ETH Zürich AI research..." → tech-ch

**General queries:** Use `general`
- "Hello, how are you?" → general
- "Tell me a joke" → general

---

## Reference Links

- **Full Architecture:** `MULTI_DOMAIN_C1_ARCHITECTURE.md`
- **Implementation Checklist:** `C1_IMPLEMENTATION_CHECKLIST.md`
- **Quick Start Guide:** `C1_QUICK_START_GUIDE.md`

---

**This reference covers all 24 domains. Use it as a quick lookup during implementation!** 📚
