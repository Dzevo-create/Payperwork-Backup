# C1 Generative UI - Experimental Setup 🧪

## Überblick

Du hast jetzt eine **saubere, abgetrennte Architektur** für C1 Generative UI Tests:

```
✅ Original Chat (unverändert)
✅ C1 Chat (experimentell, separat)
✅ Feature Flag System (einfach umschalten)
✅ Mock-Implementation (sofort testbar)
```

**Status**: Mock-Modus aktiv (funktioniert mit Standard-OpenAI als Fallback)

---

## Architektur-Übersicht

### Ordnerstruktur

```
/app
├── /api
│   ├── /chat (ORIGINAL - bleibt unverändert)
│   │   └── route.ts
│   └── /chat-c1 (C1 VARIANTE)
│       └── route.ts
├── /chat
│   └── page.tsx (Feature-Flag-Router)
/components
├── /chat (ORIGINAL - bleibt unverändert)
│   ├── ChatLayout.tsx
│   ├── Chat/ChatArea.tsx
│   └── Chat/ChatMessages.tsx
└── /chat-c1 (C1 VARIANTE)
    ├── ChatLayoutC1.tsx
    ├── Chat/ChatAreaC1.tsx
    └── Chat/ChatMessagesC1.tsx
/lib
└── feature-flags.ts (Feature-Flag-System)
```

### Was ist neu?

1. **Feature Flags** (`lib/feature-flags.ts`)
   - `USE_C1_CHAT`: false = Original, true = C1
   - `SHOW_C1_TOGGLE`: Zeigt Badge im UI

2. **C1 Components** (`components/chat-c1/`)
   - Separate Kopie für C1-Tests
   - Verwendet `/api/chat-c1` Endpoint
   - Zeigt Mock-Banner

3. **C1 API Route** (`app/api/chat-c1/route.ts`)
   - Mock mit Standard-OpenAI (bis C1 SDK installiert)
   - Bereit für echte C1-Integration

---

## Wie du es benutzt

### Option 1: Original Chat (Standard)

**Nichts tun** - alles läuft wie bisher.

```typescript
// lib/feature-flags.ts
USE_C1_CHAT: false // ← Standard
```

Gehe zu `/chat` → Original Chat wird geladen

---

### Option 2: C1 Chat aktivieren (Experimental)

1. **Feature Flag umschalten**:
   ```typescript
   // lib/feature-flags.ts
   USE_C1_CHAT: true // ← C1 aktivieren
   ```

2. **Page neu laden**:
   ```
   Gehe zu /chat → C1 Chat wird geladen
   ```

3. **Test durchführen**:
   - Chat normal nutzen
   - Mock-Banner erscheint oben
   - Funktioniert wie Original (weil Mock-Modus)

---

### Option 3: Beide parallel testen (A/B Test)

1. **Toggle Badge aktivieren**:
   ```typescript
   // lib/feature-flags.ts
   SHOW_C1_TOGGLE: true // ← Zeigt Badge im Header
   ```

2. **C1Toggle importieren** (optional):
   ```tsx
   // components/chat/Chat/ChatHeader.tsx
   import { C1Toggle } from "./C1Toggle";

   // Im Header rechts hinzufügen:
   <C1Toggle />
   ```

3. **Zwischen Varianten wechseln**:
   - Feature Flag umschalten
   - Page neu laden
   - Badge zeigt aktive Variante

---

## C1 SDK Aktivierung (Wenn bereit)

### Schritt 1: C1 Account erstellen

1. Gehe zu [console.thesys.dev](https://console.thesys.dev)
2. Registriere Account
3. Hole API Key ($10 free credits)

### Schritt 2: API Key hinzufügen

```bash
# .env.local
THESYS_API_KEY=dein_api_key_hier
```

### Schritt 3: SDK installieren

```bash
# Fix npm cache first (falls Fehler)
sudo chown -R $(whoami) ~/.npm

# Install mit legacy peer deps (wegen Zustand v5)
npm install @thesysai/genui-sdk --legacy-peer-deps
```

### Schritt 4: API Route aktivieren

```typescript
// app/api/chat-c1/route.ts

// UNCOMMENT THIS:
const c1Client = new OpenAI({
  apiKey: process.env.THESYS_API_KEY,
  baseURL: "https://api.thesys.dev/v1/embed",
});

// IN POST FUNCTION, REPLACE:
const stream = await c1Client.chat.completions.create({
  model: "c1/anthropic/claude-sonnet-4/v-20250617", // C1 model
  messages: messages,
  stream: true,
});
```

### Schritt 5: React Component aktivieren

```tsx
// components/chat-c1/Chat/ChatMessagesC1.tsx

// ADD IMPORT:
import { C1Component } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";

// REPLACE:
<div className="whitespace-pre-wrap break-words">
  {message.content}
</div>

// WITH:
<C1Component c1Response={message.c1Data} />
```

### Schritt 6: Testen

1. Feature Flag auf `true` setzen
2. `/chat` öffnen
3. Message senden
4. **Erwarte**: Dynamische UI-Komponenten statt Text

---

## Rollback (Zurück zu Original)

**Falls C1 nicht gefällt:**

```typescript
// lib/feature-flags.ts
USE_C1_CHAT: false // ← Zurück zu Original
```

Reload page → Original Chat ist wieder aktiv.

**Keine Code-Changes notwendig!** 🎉

---

## Nächste Schritte

### Jetzt (Sofort testbar):
- [x] Feature Flag auf `true` setzen
- [x] C1 Mock-Modus testen
- [x] Zwischen Original/C1 wechseln

### Später (Wenn C1 SDK ready):
- [ ] C1 Account erstellen
- [ ] API Key holen
- [ ] SDK installieren
- [ ] API Route aktivieren
- [ ] Components aktivieren
- [ ] A/B Tests durchführen

### Bei Gefallen:
- [ ] Feature Flag permanent auf `true`
- [ ] Original-Ordner archivieren (nicht löschen!)
- [ ] C1 als Standard setzen

### Bei Nicht-Gefallen:
- [ ] Feature Flag auf `false`
- [ ] `/components/chat-c1` Ordner löschen
- [ ] `/app/api/chat-c1` Ordner löschen
- [ ] Original bleibt unverändert

---

## FAQ

**Q: Wird Original Chat verändert?**
A: Nein! Original ist 100% unverändert. C1 ist komplett separat.

**Q: Funktioniert C1 jetzt schon?**
A: Ja, im Mock-Modus (verwendet Standard-OpenAI). Für echte C1-Features: SDK installieren.

**Q: Kann ich beide parallel nutzen?**
A: Ja! Toggle Badge zeigt aktive Variante. Wechsel per Feature Flag.

**Q: Was wenn C1 nicht gefällt?**
A: Feature Flag auf `false` → Original ist wieder da. Keine Code-Changes nötig.

**Q: Brauche ich C1 SDK jetzt?**
A: Nein. Mock-Modus funktioniert ohne SDK. Installiere später wenn du bereit bist.

---

## Support

**C1 Docs**: [docs.thesys.dev](https://docs.thesys.dev)
**C1 Playground**: [console.thesys.dev/playground](https://console.thesys.dev/playground)
**C1 Demo**: [demo.thesys.dev](https://demo.thesys.dev)

Bei Fragen: Check `lib/feature-flags.ts` für aktuellen Status.
