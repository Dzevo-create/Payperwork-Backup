# C1 Multi-Domain System - Quick Start Guide

This guide helps you get started quickly with implementing the C1 multi-domain system.

---

## 1. Prerequisites

### Required API Keys
Add these to your `.env.local`:

```bash
# Thesys C1 API (Claude Sonnet 4)
THESYS_API_KEY=sk-th-YOUR_KEY_HERE

# Google Custom Search (for images and web search)
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
GOOGLE_CX_KEY=YOUR_GOOGLE_CX_KEY

# Optional: Gemini for summarization
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Optional: Company logo APIs (add when implementing)
# CLEARBIT_API_KEY=...
# BRANDFETCH_API_KEY=...
```

### Install Dependencies
```bash
npm install @crayonai/react-ui@^0.7.10 @crayonai/stream@^0.6.4 @thesysai/genui-sdk@^0.6.18
```

---

## 2. Quick Implementation Steps

### Step 1: Create Domain Configuration (30 minutes)

Create `/lib/c1/domains/domainConfig.ts`:

```typescript
export type DomainCategory = 'finance' | 'real-estate' | 'general' | 'finance-ch' | 'real-estate-ch';
// ... add all 25 domains

export interface DomainConfig {
  id: DomainCategory;
  name: string;
  description: string;
  icon: string;
  keywords: string[];
  tools: string[];
  isSwissSpecific: boolean;
  priority: number;
}

export const DOMAIN_REGISTRY: Record<DomainCategory, DomainConfig> = {
  finance: {
    id: 'finance',
    name: 'Finance',
    description: 'Stock analysis and market insights',
    icon: 'TrendingUp',
    keywords: ['stock', 'market', 'trading', 'portfolio'],
    tools: ['googleImage', 'companyLogo', 'webSearch'],
    isSwissSpecific: false,
    priority: 10,
  },
  // ... add remaining 24 domains
};
```

**Full code:** See `MULTI_DOMAIN_C1_ARCHITECTURE.md` Section 4.1

---

### Step 2: Create System Prompts (1 hour)

Create `/lib/c1/domains/systemPrompts.ts`:

```typescript
import { DomainCategory } from './domainConfig';

export const SYSTEM_PROMPTS: Record<DomainCategory, string> = {
  finance: `[ROLE]
You are a professional financial analysis assistant...`,

  'finance-ch': `[ROLE]
You are a Swiss financial market expert...`,

  // ... add remaining 23 prompts
};
```

**Full prompts:** See `MULTI_DOMAIN_C1_ARCHITECTURE.md` Section 4.2

---

### Step 3: Create Domain Detector (45 minutes)

Create `/lib/c1/domains/domainDetector.ts`:

```typescript
import { DomainCategory, DOMAIN_REGISTRY } from './domainConfig';

export class DomainDetector {
  static detectDomain(context: { userMessage: string; previousDomain?: DomainCategory }) {
    const { userMessage, previousDomain } = context;
    const lowerMessage = userMessage.toLowerCase();

    // Score each domain
    const domainScores: Array<{ domain: DomainCategory; score: number }> = [];

    for (const [domainId, config] of Object.entries(DOMAIN_REGISTRY)) {
      let score = 0;

      // Keyword matching
      for (const keyword of config.keywords) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          score += config.priority;
        }
      }

      // Boost Swiss domains
      if (config.isSwissSpecific && (lowerMessage.includes('swiss') || lowerMessage.includes('switzerland'))) {
        score += 20;
      }

      // Context continuity
      if (previousDomain === domainId) {
        score += 5;
      }

      domainScores.push({ domain: domainId as DomainCategory, score });
    }

    domainScores.sort((a, b) => b.score - a.score);

    return domainScores[0]?.domain || 'general';
  }
}
```

**Full code:** See `MULTI_DOMAIN_C1_ARCHITECTURE.md` Section 5.1

---

### Step 4: Create C1 API Route (1 hour)

Create `/app/api/c1/route.ts`:

```typescript
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { transformStream } from "@crayonai/stream";
import { DomainDetector } from "@/lib/c1/domains/domainDetector";
import { getSystemPrompt } from "@/lib/c1/domains/systemPrompts";
import { getToolsForDomain } from "@/lib/c1/domains/domainTools";

const messageStore = new Map();

export async function POST(req: NextRequest) {
  const { prompt, threadId, selectedDomain } = await req.json();

  // Detect or use selected domain
  const domain = selectedDomain || DomainDetector.detectDomain({
    userMessage: prompt.content,
  });

  // Load system prompt and tools
  const systemPrompt = getSystemPrompt(domain);
  const tools = getToolsForDomain(domain);

  // Initialize message store
  if (!messageStore.has(threadId)) {
    messageStore.set(threadId, [{ role: "system", content: systemPrompt }]);
  }

  messageStore.get(threadId).push(prompt);

  // Call Thesys API
  const client = new OpenAI({
    baseURL: "https://api.thesys.dev/v1/embed/",
    apiKey: process.env.THESYS_API_KEY,
  });

  const response = client.beta.chat.completions.runTools({
    model: "c1/anthropic/claude-sonnet-4/v-20250930",
    messages: messageStore.get(threadId),
    tools,
    stream: true,
  });

  response.on("message", (msg) => messageStore.get(threadId).push(msg));

  const stream = await response;
  const transformed = transformStream(stream, (chunk) => chunk.choices[0]?.delta?.content);

  return new Response(transformed as any, {
    headers: {
      "Content-Type": "text/event-stream",
      "X-C1-Domain": domain,
    },
  });
}
```

**Full code:** See `MULTI_DOMAIN_C1_ARCHITECTURE.md` Section 5.3

---

### Step 5: Create Domain Selector UI (1 hour)

Create `/components/chat/Chat/DomainSelector.tsx`:

```typescript
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DomainCategory, getAllDomains } from "@/lib/c1/domains/domainConfig";

export function DomainSelector({ selectedDomain, onDomainChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const domains = getAllDomains();

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)}>
        {selectedDomain || 'Auto'}
        <ChevronDown />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white shadow-lg rounded-lg">
          <button onClick={() => onDomainChange('auto')}>Auto-Detect</button>
          {domains.map(domain => (
            <button key={domain.id} onClick={() => onDomainChange(domain.id)}>
              {domain.icon} {domain.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Full code:** See `MULTI_DOMAIN_C1_ARCHITECTURE.md` Section 6.2

---

### Step 6: Update ChatHeader (30 minutes)

Update `/components/chat/Chat/ChatHeader.tsx`:

```typescript
import { DomainSelector } from './DomainSelector';

export function ChatHeader({ isC1Enabled, selectedDomain, onDomainChange }) {
  return (
    <div className="border-b px-4 py-3 flex justify-between">
      <h1>Chat</h1>
      {isC1Enabled && (
        <DomainSelector
          selectedDomain={selectedDomain}
          onDomainChange={onDomainChange}
        />
      )}
    </div>
  );
}
```

---

### Step 7: Create C1 Generation Hook (45 minutes)

Create `/hooks/chat/useC1Generation.ts`:

```typescript
import { useState } from 'react';

export function useC1Generation() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateC1Response = async ({ threadId, userMessage, selectedDomain, onChunk, onDomainDetected }) => {
    setIsGenerating(true);

    const response = await fetch('/api/c1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: { role: 'user', content: userMessage },
        threadId,
        selectedDomain,
      }),
    });

    const domain = response.headers.get('X-C1-Domain');
    onDomainDetected?.(domain);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      onChunk(chunk);
    }

    setIsGenerating(false);
  };

  return { isGenerating, generateC1Response };
}
```

**Full code:** See `MULTI_DOMAIN_C1_ARCHITECTURE.md` Section 6.3

---

### Step 8: Run Database Migration (15 minutes)

Create `/supabase/migrations/004_c1_support.sql`:

```sql
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS selected_domain VARCHAR(50),
ADD COLUMN IF NOT EXISTS detected_domain VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_c1_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS was_generated_with_c1 BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS c1_domain VARCHAR(50),
ADD COLUMN IF NOT EXISTS c1_metadata JSONB;

CREATE INDEX idx_conversations_domain ON conversations(selected_domain);
CREATE INDEX idx_messages_c1 ON messages(was_generated_with_c1);
```

Run migration:
```bash
# Local development
supabase migration up

# Or via Supabase dashboard: SQL Editor → paste → run
```

---

## 3. Testing Your Implementation

### Test Domain Detection

```bash
# In browser console:
const message = "What is Apple's stock price?";
fetch('/api/c1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: { role: 'user', content: message },
    threadId: 'test-123'
  })
}).then(r => console.log('Domain:', r.headers.get('X-C1-Domain')));
```

Expected output: `Domain: finance`

### Test Swiss Domain Detection

```bash
const message = "UBS stock on SIX Swiss Exchange";
// Expected domain: finance-ch
```

### Test Manual Domain Selection

```bash
const message = "Tell me about houses";
fetch('/api/c1', {
  method: 'POST',
  body: JSON.stringify({
    prompt: { role: 'user', content: message },
    threadId: 'test-123',
    selectedDomain: 'real-estate-ch'
  })
});
// Expected domain: real-estate-ch (manual override)
```

---

## 4. Common Issues & Solutions

### Issue: "Thesys API key not configured"
**Solution:** Check `.env.local` has `THESYS_API_KEY=sk-th-...`

### Issue: Tools not loading
**Solution:** Verify `domainTools.ts` has correct tool imports and `TOOL_REGISTRY` is populated

### Issue: Domain detection always returns 'general'
**Solution:** Check `domainConfig.ts` has keywords populated for each domain

### Issue: C1 components not rendering
**Solution:** Verify `C1Renderer.tsx` is imported and used in `ChatMessages.tsx`

### Issue: Database errors
**Solution:** Run migration: `supabase migration up`

---

## 5. Next Steps

Once basic implementation is working:

1. **Add Remaining Domains:** Complete all 25 system prompts
2. **Implement Tools:** Add `companyLogo.ts`, `webSearch.ts`, `swissData.ts`
3. **Polish UI:** Improve domain selector styling, add tooltips
4. **Add Tests:** Write unit tests for domain detection
5. **Monitor Performance:** Track response times, optimize slow prompts

---

## 6. Reference Architecture Diagram

```
User Input → Domain Detection → System Prompt Selection → Tool Loading → Thesys API → Stream Response → UI Rendering
     ↓              ↓                     ↓                    ↓              ↓              ↓              ↓
"Apple stock"   finance          Finance Prompt      [googleImage,      Claude          "Analyzing      C1 Charts
                                                      companyLogo]      Sonnet 4         Apple..."       + Tables
```

---

## 7. Time Estimate Breakdown

| Task | Time |
|------|------|
| Domain Config | 30 min |
| System Prompts (5 domains) | 1 hour |
| Domain Detector | 45 min |
| C1 API Route | 1 hour |
| Domain Selector UI | 1 hour |
| ChatHeader Update | 30 min |
| C1 Generation Hook | 45 min |
| Database Migration | 15 min |
| Testing | 1 hour |
| **Total (MVP)** | **~7 hours** |

**Full 25 domains:** Add 2 hours for remaining system prompts

---

## 8. Minimal Viable Implementation (3 Domains)

To get started quickly, implement these 3 domains first:

1. **finance** - Most common use case
2. **finance-ch** - Swiss variant
3. **general** - Fallback

This lets you test the full flow with minimal effort (3 prompts vs 25).

---

## 9. Resources

- **Full Architecture:** `MULTI_DOMAIN_C1_ARCHITECTURE.md`
- **Implementation Checklist:** `C1_IMPLEMENTATION_CHECKLIST.md`
- **Template Reference:** `/template-c1-next/src/app/api/chat/`
- **Thesys Docs:** https://docs.thesys.dev/
- **Supabase Docs:** https://supabase.com/docs

---

**Ready to start? Begin with Step 1 and work through sequentially!** 🚀
