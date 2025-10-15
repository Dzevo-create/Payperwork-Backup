# C1 Multi-Domain Implementation Checklist

This checklist breaks down the implementation into actionable steps. Check off each item as you complete it.

---

## Phase 1: Foundation (Days 1-2)

### File Structure Setup
- [ ] Create `/lib/c1/` directory
- [ ] Create `/lib/c1/domains/` subdirectory
- [ ] Create `/lib/c1/tools/` subdirectory
- [ ] Create `/lib/c1/services/` subdirectory
- [ ] Create `/lib/c1/utils/` subdirectory
- [ ] Create `/types/c1.ts` file

### Domain Configuration
- [ ] Create `lib/c1/domains/domainConfig.ts`
  - [ ] Define `DomainCategory` type (25 domains)
  - [ ] Define `DomainConfig` interface
  - [ ] Implement `DOMAIN_REGISTRY` with all 25 domains
  - [ ] Implement helper functions (getDomainConfig, getAllDomains, etc.)
  - [ ] Add keywords for each domain
  - [ ] Map tools to each domain

- [ ] Create `lib/c1/domains/systemPrompts.ts`
  - [ ] Finance prompt (global)
  - [ ] Real Estate prompt (global)
  - [ ] Construction prompt (global)
  - [ ] AI/Tech prompt (global)
  - [ ] Sports prompt (global)
  - [ ] Travel prompt (global)
  - [ ] Health prompt (global)
  - [ ] Business/Legal prompt (global)
  - [ ] Education prompt (global)
  - [ ] Automotive prompt (global)
  - [ ] Creative prompt (global)
  - [ ] Food prompt (global)
  - [ ] General prompt (global)
  - [ ] Finance-CH prompt (Swiss)
  - [ ] Real Estate-CH prompt (Swiss)
  - [ ] Construction-CH prompt (Swiss)
  - [ ] Tech-CH prompt (Swiss)
  - [ ] Sports-CH prompt (Swiss)
  - [ ] Travel-CH prompt (Swiss)
  - [ ] Health-CH prompt (Swiss)
  - [ ] Business-CH prompt (Swiss)
  - [ ] Education-CH prompt (Swiss)
  - [ ] Automotive-CH prompt (Swiss)

- [ ] Create `lib/c1/domains/domainDetector.ts`
  - [ ] Implement `DomainDetector` class
  - [ ] Implement `detectDomain()` method with keyword matching
  - [ ] Implement Swiss domain boosting logic
  - [ ] Implement context continuity (previous domain)
  - [ ] Implement `getSuggestedDomains()` method
  - [ ] Add confidence scoring

- [ ] Create `lib/c1/domains/index.ts` (export barrel)

### Testing Domain Detection
- [ ] Test finance domain detection
- [ ] Test Swiss finance domain detection
- [ ] Test fallback to general domain
- [ ] Test context continuity
- [ ] Test Swiss domain boosting

---

## Phase 2: Backend API (Days 3-4)

### Tool Infrastructure
- [ ] Create `lib/c1/tools/utils/toolErrorHandler.ts`
- [ ] Create `lib/c1/tools/utils/toolValidator.ts`

### Migrate Existing Tools
- [ ] Create `lib/c1/tools/googleImage.ts` (copy from template)
- [ ] Create `lib/c1/tools/weather.ts` (copy from template)

### Add New Tools
- [ ] Create `lib/c1/tools/companyLogo.ts`
  - [ ] Research Clearbit or Brandfetch API
  - [ ] Implement logo search function
  - [ ] Add error handling
  - [ ] Add to tool registry

- [ ] Create `lib/c1/tools/webSearch.ts`
  - [ ] Copy from template if available
  - [ ] Otherwise implement Google Custom Search
  - [ ] Add error handling
  - [ ] Add to tool registry

- [ ] Create `lib/c1/tools/swissData.ts`
  - [ ] Implement basic Swiss data aggregation (web search with CH filter)
  - [ ] Plan for future API integrations
  - [ ] Add error handling
  - [ ] Add to tool registry

- [ ] Create `lib/c1/tools/index.ts` (export barrel)

### Domain Tools Mapping
- [ ] Create `lib/c1/domains/domainTools.ts`
  - [ ] Define `TOOL_REGISTRY`
  - [ ] Implement `getToolsForDomain()`
  - [ ] Test tool loading for each domain

### C1 API Route
- [ ] Create `app/api/c1/route.ts`
  - [ ] Set up Thesys OpenAI client
  - [ ] Implement message store (in-memory)
  - [ ] Implement POST handler
  - [ ] Parse request (prompt, threadId, selectedDomain, conversationHistory)
  - [ ] Implement domain detection logic
  - [ ] Load system prompt for domain
  - [ ] Load tools for domain
  - [ ] Call `runTools()` with streaming
  - [ ] Transform stream for client
  - [ ] Add response headers (X-C1-Domain, X-C1-Detection)
  - [ ] Add error handling
  - [ ] Add logging

### Services
- [ ] Create `lib/c1/services/thesysClient.ts` (optional wrapper)
- [ ] Create `lib/c1/services/messageStore.ts` (if separating logic)

### Testing Backend
- [ ] Test API with auto-detected domain
- [ ] Test API with user-selected domain
- [ ] Test tool invocation
- [ ] Test streaming response
- [ ] Test error handling
- [ ] Test domain in response headers

---

## Phase 3: Frontend Integration (Days 5-6)

### Type Definitions
- [ ] Create `types/c1.ts`
  - [ ] Define `C1Metadata` interface
  - [ ] Define `C1Message` interface
  - [ ] Define `C1Conversation` interface

- [ ] Update `types/chat.ts`
  - [ ] Extend `Message` with `C1Message`
  - [ ] Extend `Conversation` with `C1Conversation`

### C1 Components
- [ ] Restore `components/chat/C1Renderer.tsx` (from backup or template)
  - [ ] Test rendering basic C1 components
  - [ ] Add error boundary
  - [ ] Add loading state

- [ ] Create `components/chat/Chat/DomainSelector.tsx`
  - [ ] Implement dropdown UI
  - [ ] Add auto-detect mode
  - [ ] Add global domains section
  - [ ] Add Swiss domains section
  - [ ] Add domain icons and descriptions
  - [ ] Add selected state styling
  - [ ] Add click-outside-to-close
  - [ ] Test on desktop and mobile

- [ ] Create `components/chat/C1/DomainBadge.tsx`
  - [ ] Display current domain icon + name
  - [ ] Show auto-detected vs manual selection
  - [ ] Add tooltip with domain description

- [ ] Create `components/chat/C1/C1StreamingIndicator.tsx`
  - [ ] Show "Generating with C1..." message
  - [ ] Add animated sparkles or loading dots
  - [ ] Display detected domain during generation

### Update Existing Components
- [ ] Update `components/chat/Chat/ChatHeader.tsx`
  - [ ] Add `isC1Enabled` prop
  - [ ] Add `selectedDomain` and `detectedDomain` props
  - [ ] Add `onDomainChange` callback
  - [ ] Integrate `DomainSelector` component
  - [ ] Add C1 active badge
  - [ ] Test UI layout

- [ ] Update `components/chat/Chat/ChatMessages.tsx`
  - [ ] Check `message.wasGeneratedWithC1` flag
  - [ ] Render `C1Renderer` for C1 messages
  - [ ] Render `ReactMarkdown` for regular messages
  - [ ] Add domain badge to C1 messages
  - [ ] Test rendering both message types

- [ ] Update `components/chat/Chat/ChatArea.tsx`
  - [ ] Add C1 state management
  - [ ] Integrate `useC1Generation` hook
  - [ ] Handle domain selection changes
  - [ ] Pass domain props to ChatHeader
  - [ ] Test full chat flow

### Hooks
- [ ] Create `hooks/chat/useC1Generation.ts`
  - [ ] Implement `generateC1Response()` function
  - [ ] Handle streaming response
  - [ ] Extract domain from headers
  - [ ] Call callbacks (onChunk, onComplete, onError, onDomainDetected)
  - [ ] Add error state
  - [ ] Add loading state

- [ ] Create `hooks/useDomainDetection.ts` (optional, for client-side suggestions)

### Testing Frontend
- [ ] Test C1 message rendering
- [ ] Test domain selector UI
- [ ] Test domain selection persistence
- [ ] Test auto-detection feedback
- [ ] Test streaming indicators
- [ ] Test error states

---

## Phase 4: Database Integration (Day 7)

### Supabase Migration
- [ ] Create `supabase/migrations/004_c1_support.sql`
  - [ ] Add `selected_domain` to conversations
  - [ ] Add `detected_domain` to conversations
  - [ ] Add `is_c1_enabled` to conversations
  - [ ] Add `was_generated_with_c1` to messages
  - [ ] Add `c1_domain` to messages
  - [ ] Add `c1_metadata` (JSONB) to messages
  - [ ] Create indexes
  - [ ] Add column comments

- [ ] Run migration on local Supabase
- [ ] Verify schema changes

### Supabase Operations
- [ ] Update `lib/supabase-chat.ts`
  - [ ] Update `createConversation()` to include C1 fields
  - [ ] Update `updateConversation()` to support C1 fields
  - [ ] Update `createMessage()` to include C1 fields
  - [ ] Update `updateMessage()` to support C1 metadata
  - [ ] Test CRUD operations

- [ ] Update `store/chatStore.supabase.ts`
  - [ ] Add C1 fields to state
  - [ ] Update `addMessage()` to persist C1 data
  - [ ] Update `updateMessage()` to preserve C1 flags
  - [ ] Update `setCurrentConversationId()` to load C1 settings
  - [ ] Test state persistence

### Testing Database
- [ ] Test conversation creation with C1 enabled
- [ ] Test message creation with C1 metadata
- [ ] Test domain persistence across page reloads
- [ ] Test conversation switching with C1 data
- [ ] Verify no data loss

---

## Phase 5: Testing & Refinement (Days 8-9)

### Unit Tests
- [ ] Write tests for `DomainDetector`
  - [ ] Test keyword matching
  - [ ] Test Swiss domain boosting
  - [ ] Test context continuity
  - [ ] Test fallback to general

- [ ] Write tests for domain configuration
  - [ ] Test all 25 domains are defined
  - [ ] Test helper functions
  - [ ] Test tool mappings

- [ ] Write tests for tool functions
  - [ ] Test googleImage tool
  - [ ] Test weather tool
  - [ ] Test webSearch tool
  - [ ] Test error handling

### Integration Tests
- [ ] Write tests for C1 API route
  - [ ] Test auto-detection
  - [ ] Test manual selection
  - [ ] Test streaming response
  - [ ] Test error handling
  - [ ] Test header population

- [ ] Write tests for Supabase operations
  - [ ] Test C1 field persistence
  - [ ] Test conversation CRUD
  - [ ] Test message CRUD

### E2E Tests
- [ ] Write Playwright tests
  - [ ] Test domain selection flow
  - [ ] Test C1 message generation
  - [ ] Test domain switching
  - [ ] Test error recovery
  - [ ] Test mobile responsiveness

### Performance Testing
- [ ] Measure C1 response times
- [ ] Test with concurrent requests
- [ ] Test memory usage (message store)
- [ ] Optimize slow operations

### Bug Fixes
- [ ] Fix domain detection issues
- [ ] Fix UI bugs
- [ ] Fix streaming errors
- [ ] Fix database sync issues

---

## Phase 6: Production Deployment (Day 10)

### Environment Setup
- [ ] Add `THESYS_API_KEY` to production .env
- [ ] Add `GOOGLE_API_KEY` to production .env
- [ ] Add `GOOGLE_CX_KEY` to production .env
- [ ] Add `GEMINI_API_KEY` to production .env (if using)
- [ ] Verify all API keys are valid

### Database Migration
- [ ] Run Supabase migration on production
- [ ] Verify schema changes
- [ ] Test production database access

### Build & Deploy
- [ ] Run `npm run build` locally
- [ ] Fix any build errors
- [ ] Test production build locally (`npm run start`)
- [ ] Deploy to Vercel/production server
- [ ] Verify deployment succeeded

### Monitoring Setup
- [ ] Set up error monitoring (Sentry or similar)
- [ ] Set up API monitoring (response times, error rates)
- [ ] Set up database monitoring (query performance)
- [ ] Create alerts for critical errors

### Post-Deployment Testing
- [ ] Test all 25 domains in production
- [ ] Test tool invocations in production
- [ ] Test domain detection accuracy
- [ ] Test Supabase persistence
- [ ] Monitor error logs

### User Acceptance Testing
- [ ] Internal team testing
- [ ] Beta user testing (if applicable)
- [ ] Collect feedback
- [ ] Iterate on issues

---

## Post-Launch Checklist

### Documentation
- [ ] Update README with C1 usage instructions
- [ ] Document domain selection guidelines
- [ ] Document tool usage
- [ ] Create user guide for C1 features

### Monitoring
- [ ] Track domain detection accuracy
- [ ] Monitor API response times
- [ ] Track tool usage statistics
- [ ] Monitor error rates

### Optimization
- [ ] Analyze slow prompts, optimize
- [ ] Identify underperforming domains
- [ ] Optimize tool performance
- [ ] Reduce token usage if needed

### Future Enhancements
- [ ] Plan Swiss API integrations
- [ ] Plan multi-language support
- [ ] Plan domain analytics dashboard
- [ ] Plan custom domain configurations

---

## Quick Reference: File Paths

```
Key Files to Create:
- lib/c1/domains/domainConfig.ts
- lib/c1/domains/systemPrompts.ts
- lib/c1/domains/domainDetector.ts
- lib/c1/domains/domainTools.ts
- lib/c1/tools/googleImage.ts
- lib/c1/tools/weather.ts
- lib/c1/tools/companyLogo.ts
- lib/c1/tools/webSearch.ts
- lib/c1/tools/swissData.ts
- app/api/c1/route.ts
- components/chat/Chat/DomainSelector.tsx
- components/chat/C1Renderer.tsx (restore)
- hooks/chat/useC1Generation.ts
- types/c1.ts
- supabase/migrations/004_c1_support.sql

Key Files to Update:
- types/chat.ts
- components/chat/Chat/ChatHeader.tsx
- components/chat/Chat/ChatMessages.tsx
- components/chat/Chat/ChatArea.tsx
- store/chatStore.supabase.ts
- lib/supabase-chat.ts
- .env.local
```

---

## Estimated Time Per Phase

- **Phase 1 (Foundation):** 2 days
- **Phase 2 (Backend):** 2 days
- **Phase 3 (Frontend):** 2 days
- **Phase 4 (Database):** 1 day
- **Phase 5 (Testing):** 2 days
- **Phase 6 (Deployment):** 1 day

**Total:** 10 days (single developer, full-time)

---

## Success Metrics

- [ ] All 25 domains implemented
- [ ] Domain detection accuracy >80%
- [ ] C1 response time <10s average
- [ ] All tools working correctly
- [ ] Zero critical bugs in production
- [ ] User satisfaction with C1 quality

---

**Good luck with the implementation! Check off each item as you go.** 🚀
