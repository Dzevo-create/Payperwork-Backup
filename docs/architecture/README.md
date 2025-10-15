# C1 Multi-Domain Architecture Documentation

This directory contains the complete architecture documentation for the multi-domain C1 (Generative UI) system with Claude Sonnet 4.

---

## 📋 Documentation Index

### 1. **C1_IMPLEMENTATION_SUMMARY.md** ⭐ START HERE
**Purpose:** Executive overview and getting started guide
**Read Time:** 5 minutes
**Key Content:**
- What has been created
- System overview
- Implementation options (MVP vs Full)
- Next steps and recommendations

👉 **Start here if you're new to this project**

---

### 2. **MULTI_DOMAIN_C1_ARCHITECTURE.md**
**Purpose:** Complete technical architecture
**Read Time:** 30 minutes
**Key Content:**
- Detailed system architecture
- Complete file structure
- Full code implementations for all components
- 25 domain configurations with system prompts
- Tool integration guide
- Database schema
- Testing strategy
- 10 potential pitfalls with solutions

👉 **Your main reference during implementation**

---

### 3. **C1_IMPLEMENTATION_CHECKLIST.md**
**Purpose:** Step-by-step implementation guide
**Read Time:** 10 minutes
**Key Content:**
- 6 implementation phases
- Checkbox format for tracking progress
- Time estimates per task
- Quick reference for file paths
- Success metrics

👉 **Use this to track your implementation progress**

---

### 4. **C1_QUICK_START_GUIDE.md**
**Purpose:** Quick reference and code snippets
**Read Time:** 15 minutes
**Key Content:**
- 8 implementation steps with code
- Testing procedures
- Common issues & solutions
- MVP approach (3 domains in 7 hours)
- Time breakdown

👉 **Quick reference while coding**

---

### 5. **C1_DOMAIN_REFERENCE.md**
**Purpose:** Complete domain catalog
**Read Time:** 20 minutes
**Key Content:**
- All 24 domains with full details
- Keywords, tools, priorities
- Swiss-specific focus areas
- Domain selection strategy
- Tool mapping summary

👉 **Domain lookup during implementation**

---

## 🚀 Quick Navigation

### I want to...

**Understand what this project is about:**
→ Read `C1_IMPLEMENTATION_SUMMARY.md`

**Start implementing:**
→ Read `C1_QUICK_START_GUIDE.md` (MVP approach)

**See the full architecture:**
→ Read `MULTI_DOMAIN_C1_ARCHITECTURE.md`

**Track my progress:**
→ Use `C1_IMPLEMENTATION_CHECKLIST.md`

**Look up a specific domain:**
→ Check `C1_DOMAIN_REFERENCE.md`

**Find code snippets:**
→ Both `C1_QUICK_START_GUIDE.md` and `MULTI_DOMAIN_C1_ARCHITECTURE.md`

---

## 📊 Project Statistics

- **Total Domains:** 24 (13 global + 10 Swiss + 1 general)
- **System Prompts:** 24 unique prompts
- **Tools:** 5 integrated (googleImage, companyLogo, weather, webSearch, swissData)
- **Files to Create:** ~20 core files
- **Files to Update:** ~5 existing files
- **Database Changes:** 6 new columns
- **Implementation Time (Full):** 10 days
- **Implementation Time (MVP):** 7 hours

---

## 🎯 Implementation Approaches

### MVP (Recommended)
- **Time:** 7 hours
- **Domains:** 3 (finance, finance-ch, general)
- **Goal:** Validate architecture quickly
- **Next Step:** Expand to 24 domains if successful

### Full Implementation
- **Time:** 10 days
- **Domains:** All 24 domains
- **Goal:** Complete feature set from day 1
- **Next Step:** Deploy to production

---

## 📁 Key Files to Create

```
Priority 1 (Core):
✓ lib/c1/domains/domainConfig.ts
✓ lib/c1/domains/systemPrompts.ts
✓ lib/c1/domains/domainDetector.ts
✓ app/api/c1/route.ts
✓ components/chat/Chat/DomainSelector.tsx
✓ hooks/chat/useC1Generation.ts

Priority 2 (Tools):
✓ lib/c1/tools/googleImage.ts
✓ lib/c1/tools/weather.ts
✓ lib/c1/tools/companyLogo.ts
✓ lib/c1/tools/webSearch.ts
✓ lib/c1/tools/swissData.ts

Priority 3 (Integration):
✓ types/c1.ts
✓ supabase/migrations/004_c1_support.sql
✓ components/chat/C1Renderer.tsx (restore from backup)
```

---

## 🔧 Prerequisites

### Required API Keys
```bash
THESYS_API_KEY=sk-th-...    # Claude Sonnet 4 via Thesys
GOOGLE_API_KEY=...          # Google Custom Search
GOOGLE_CX_KEY=...           # Google Custom Search Engine ID
```

### Required Dependencies
```bash
npm install @crayonai/react-ui@^0.7.10
npm install @crayonai/stream@^0.6.4
npm install @thesysai/genui-sdk@^0.6.18
```

### Template Reference
```
/template-c1-next/src/app/api/chat/
```

---

## 🎨 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   USER INTERFACE                    │
│  DomainSelector + ChatHeader + C1Renderer           │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                   API LAYER                         │
│  /api/c1 → Domain Detection → Tool Loading          │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                THESYS C1 API                        │
│  Claude Sonnet 4 + System Prompt + Tools            │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              STREAMING RESPONSE                     │
│  Transform → UI Components → Database Sync           │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Strategy

### Unit Tests
- Domain detection (80%+ accuracy target)
- Tool functionality
- Domain configuration

### Integration Tests
- C1 API endpoint
- Database operations
- Streaming responses

### E2E Tests
- Domain selection flow
- Message generation
- Domain switching
- Error handling

---

## 🚨 Common Pitfalls (Documented)

The architecture documentation includes solutions for:

1. **Domain Detection Accuracy** → Manual override + confidence thresholds
2. **Tool Availability** → Graceful fallback strategies
3. **System Prompt Length** → Compression techniques
4. **Streaming Performance** → Loading indicators + timeout handling
5. **Swiss-Specific Data** → API key management + caching
6. **Message Store Memory** → TTL + Redis migration plan
7. **C1 Component Rendering** → Error boundaries + validation
8. **Domain Switching** → Context preservation
9. **Database Limits** → Selective storage + compression
10. **Multi-Language Support** → Phase 2 enhancement

---

## 📈 Success Metrics

- [x] Architecture design complete
- [ ] All 24 domains implemented
- [ ] Domain detection accuracy >80%
- [ ] C1 response time <10s average
- [ ] All tools working correctly
- [ ] Zero critical bugs in production
- [ ] User satisfaction with C1 quality

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **C1 Model:** Claude Sonnet 4 (`c1/anthropic/claude-sonnet-4/v-20250930`)
- **C1 Provider:** Thesys API (https://api.thesys.dev)
- **UI Components:** @crayonai/react-ui, @thesysai/genui-sdk
- **Database:** Supabase (PostgreSQL)
- **Streaming:** @crayonai/stream
- **State Management:** Zustand (existing)

---

## 📞 Support & Resources

### Internal Resources
- Template: `/template-c1-next/`
- Current Chat API: `/app/api/chat/route.ts`
- Chat Store: `/store/chatStore.supabase.ts`

### External Resources
- [Thesys Docs](https://docs.thesys.dev/)
- [Claude API Docs](https://docs.anthropic.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Crayon UI Docs](https://ui.crayon.ai/)

---

## 🎯 Recommended Reading Order

### For Quick Implementation (MVP)
1. `C1_IMPLEMENTATION_SUMMARY.md` (overview)
2. `C1_QUICK_START_GUIDE.md` (steps 1-8)
3. `C1_IMPLEMENTATION_CHECKLIST.md` (track progress)

### For Full Understanding
1. `C1_IMPLEMENTATION_SUMMARY.md` (overview)
2. `MULTI_DOMAIN_C1_ARCHITECTURE.md` (complete architecture)
3. `C1_DOMAIN_REFERENCE.md` (domain details)
4. `C1_IMPLEMENTATION_CHECKLIST.md` (implementation plan)
5. `C1_QUICK_START_GUIDE.md` (code reference)

---

## ✅ Architecture Completion Status

**Status:** ✅ Complete and ready for implementation

**What's Ready:**
- [x] System architecture designed
- [x] All 24 domains configured
- [x] System prompts written
- [x] Domain detection logic designed
- [x] Tool integration planned
- [x] Database schema designed
- [x] Frontend components planned
- [x] Testing strategy defined
- [x] Implementation roadmap created
- [x] Code snippets provided
- [x] Pitfalls documented with solutions

**What's Next:**
- [ ] Start implementation (follow checklist)
- [ ] Test and iterate
- [ ] Deploy to production

---

## 📝 Version History

- **v1.0** (2025-10-14): Initial architecture complete
  - 24 domains defined
  - Complete implementation plan
  - All documentation created

---

## 🚀 Let's Build!

You have everything you need to implement this system successfully:

1. **Clear Architecture** → MULTI_DOMAIN_C1_ARCHITECTURE.md
2. **Step-by-Step Plan** → C1_IMPLEMENTATION_CHECKLIST.md
3. **Code Snippets** → C1_QUICK_START_GUIDE.md
4. **Domain Reference** → C1_DOMAIN_REFERENCE.md
5. **Risk Mitigation** → All docs include troubleshooting

**Recommended Start:** MVP approach (7 hours, 3 domains)

**Good luck with the implementation! 🎉**
