# 🚀 Quick Start Guide - Agent System

## Installation & Setup (5 Minuten)

### 1. Dateien kopieren

Alle erstellten Dateien sind bereits in deinem Repo unter:
```
/home/ubuntu/Payperwork-Backup/
```

### 2. Dependencies prüfen

Stelle sicher, dass diese Packages installiert sind:
```bash
npm install zustand socket.io socket.io-client lucide-react
```

### 3. Types erweitern

Füge neue Message Types zu `types/slides.ts` hinzu:

```typescript
export type SlidesMessageType =
  | 'user'
  | 'thinking'
  | 'topics'
  | 'generation'
  | 'result'
  | 'tool_action'
  | 'agent_thinking'      // NEU
  | 'research_source'     // NEU
  | 'agent_insight';      // NEU
```

### 4. UI Components importieren

In deiner Slides Page:

```tsx
import { AgentDashboard } from '@/components/slides/workflow/AgentDashboard';

export default function SlidesPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div>...</div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Agent Dashboard */}
        <div className="p-4">
          <AgentDashboard />
        </div>
        
        {/* Messages */}
        <SlidesMessages />
      </div>
      
      {/* Input */}
      <div>...</div>
    </div>
  );
}
```

---

## Erste Präsentation generieren

### 1. Starte Dev Server
```bash
npm run dev
```

### 2. Öffne Slides
```
http://localhost:3000/slides
```

### 3. Generiere Präsentation
- Gib Topic ein: "Künstliche Intelligenz"
- Klicke "Generate"
- Beobachte die Agents in Aktion! 🤖

---

## Was du sehen wirst

### 1. **Agent Thinking Messages** 💭
```
🔍 Research Agent
Currently researching "Künstliche Intelligenz" to gather 
comprehensive and accurate information...
```

### 2. **Research Sources** 📚
```
⭐ 95% | Wikipedia - Artificial Intelligence
en.wikipedia.org/wiki/Artificial_intelligence
Artificial intelligence (AI) is intelligence demonstrated...
```

### 3. **Agent Status Cards** 📊
```
┌─────────────────────┐
│ 🔍 Research         │
│ Working             │
│ Researching sources │
│ ████████░░ 80%      │
└─────────────────────┘
```

### 4. **Pipeline Progress** 🎯
```
[✓ Research] → [● Topics] → [○ Content] → [○ Quality]
Overall Progress: 25%
```

---

## API Endpoint nutzen

### POST `/api/slides/workflow/pipeline`

```bash
curl -X POST http://localhost:3000/api/slides/workflow/pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Künstliche Intelligenz",
    "slideCount": 10,
    "userId": "test-user",
    "enableResearch": true
  }'
```

**Response:**
```json
{
  "success": true,
  "presentationId": "pres_123",
  "topics": [...],
  "slides": [...],
  "metadata": {
    "qualityScore": 92,
    "totalTime": 53000,
    "phaseTimes": {
      "research": 15000,
      "topicGeneration": 8000,
      "contentGeneration": 25000,
      "preProduction": 5000
    }
  }
}
```

---

## Debugging

### Console Logs

Öffne Browser DevTools → Console:

```
🤖 ResearchAgent thinking: Currently researching...
🚀 ResearchAgent started researching
🔍 ResearchAgent found source: Wikipedia - AI
✅ ResearchAgent completed researching
📊 ResearchAgent status: completed
```

### React DevTools

1. Installiere React DevTools Extension
2. Öffne DevTools → Components
3. Suche nach `useSlidesStore`
4. Inspiziere State:
   - `agentStatus`
   - `researchSources`
   - `pipelineProgress`

### Network Tab

WebSocket Messages:
```
WS → agent:thinking:step
WS → agent:source:found
WS → agent:action:update
WS → agent:status:change
```

---

## Häufige Fehler

### ❌ "Cannot read property 'thinking' of undefined"

**Problem:** AgentEventEmitter nicht initialisiert

**Lösung:**
```typescript
if (context) {
  this.agentEmitter = new AgentEventEmitter(context.userId);
}
```

### ❌ "Socket not connected"

**Problem:** WebSocket nicht verbunden

**Lösung:**
1. Prüfe Socket Server läuft
2. Prüfe User ist authentifiziert
3. Prüfe `useSlidesSocket` Hook ist aktiv

### ❌ "Components not rendering"

**Problem:** Message Types nicht erweitert

**Lösung:**
Füge neue Types zu `SlidesMessages.tsx` hinzu (bereits gemacht!)

---

## Nächste Schritte

### ✅ Was funktioniert
- ResearchAgent mit Agent Events
- TopicAgent mit Agent Events
- UI Components
- WebSocket Integration
- Store Management

### 🔄 Was noch zu tun ist
1. **ContentGenerationPhase erweitern**
   - Agent Events hinzufügen
   - Progress Updates

2. **PreProductionPhase erweitern**
   - QualityAgent Events
   - Insight Generation

3. **DesignerAgent implementieren**
   - Layout-Generierung
   - Visual Design Events

4. **Testing**
   - Unit Tests
   - Integration Tests
   - E2E Tests

---

## Support

Bei Fragen oder Problemen:

1. **README lesen**: `/AGENT_SYSTEM_README.md`
2. **Code inspizieren**: Alle Dateien sind gut dokumentiert
3. **Console checken**: Viele Debug-Logs vorhanden
4. **DevTools nutzen**: React & Network Tabs

---

**Viel Erfolg!** 🎉

