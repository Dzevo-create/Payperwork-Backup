# Architecture Separation Diagram

## Before: MIXED (Problematic)

```
┌─────────────────────────────────────────────────────────────┐
│                      ChatMessages.tsx                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  import { C1Component } from "@thesysai/genui-sdk"   │  │
│  │  import "@crayonai/react-ui/styles/index.css"        │  │
│  │                                                        │  │
│  │  {isSuperChatEnabled ? (                              │  │
│  │    <ThemeProvider>                                    │  │
│  │      <C1Component />    ← DIRECT C1 IMPORT ❌        │  │
│  │    </ThemeProvider>                                   │  │
│  │  ) : (                                                │  │
│  │    <ReactMarkdown />                                  │  │
│  │  )}                                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           │ Direct dependency                │
│                           ▼                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          @thesysai/genui-sdk (C1 SDK)                │  │
│  │              + 10+ peer dependencies                  │  │
│  │  (lowlight, hastscript, date-fns, katex, etc.)      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

PROBLEM:
- Standard chat DEPENDS on C1 SDK
- Build FAILS without C1 dependencies
- "Zum Chat" button BREAKS
- TIGHT COUPLING
```

## After: SEPARATED (Clean)

```
┌───────────────────────────────────────────────────────────────┐
│                    STANDARD CHAT LAYER                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              ChatMessages.tsx                           │  │
│  │  ┌───────────────────────────────────────────────────┐  │  │
│  │  │  import { C1Renderer } from "../C1Renderer"       │  │  │
│  │  │  NO C1 SDK IMPORTS ✅                              │  │  │
│  │  │                                                    │  │  │
│  │  │  {isSuperChatEnabled ? (                          │  │  │
│  │  │    <C1Renderer {...props} />  ← Interface only   │  │  │
│  │  │  ) : (                                            │  │  │
│  │  │    <ReactMarkdown>{content}</ReactMarkdown>       │  │  │
│  │  │  )}                                               │  │  │
│  │  └───────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                   │
│                            │ Loose coupling via abstraction    │
│                            ▼                                   │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                    ISOLATION LAYER                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              C1Renderer.tsx                             │  │
│  │  ┌───────────────────────────────────────────────────┐  │  │
│  │  │  // NO STATIC IMPORTS ✅                           │  │  │
│  │  │                                                    │  │  │
│  │  │  useEffect(() => {                                │  │  │
│  │  │    // Runtime dynamic import (client-side only)  │  │  │
│  │  │    const c1Module = await import(               │  │  │
│  │  │      "@thesysai/genui-sdk"                       │  │  │
│  │  │    );                                            │  │  │
│  │  │    setC1Component(() => c1Module.C1Component);  │  │  │
│  │  │    setThemeProvider(() => c1Module.ThemeProvider); │  │
│  │  │  }, []);                                         │  │  │
│  │  │                                                    │  │  │
│  │  │  if (error) return <ErrorMessage />              │  │  │
│  │  │  return <ThemeProvider><C1Component /></>        │  │  │
│  │  └───────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                   │
│                            │ Dynamic import (runtime only)     │
│                            ▼                                   │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                    SUPER CHAT LAYER (Optional)                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │          @thesysai/genui-sdk (C1 SDK)                  │  │
│  │              + 10+ peer dependencies                    │  │
│  │  (lowlight, hastscript, date-fns, katex, etc.)        │  │
│  │                                                         │  │
│  │  Loaded ONLY when:                                     │  │
│  │  1. Super Chat is toggled ✅                           │  │
│  │  2. C1Renderer component mounts ✅                     │  │
│  │  3. Runtime (not build time) ✅                        │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘

SOLUTION:
- Standard chat INDEPENDENT of C1 SDK ✅
- Build SUCCEEDS without C1 dependencies ✅
- "Zum Chat" button WORKS ✅
- LOOSE COUPLING ✅
```

## Dependency Flow Comparison

### Before (Tight Coupling)
```
ChatMessages.tsx
      ║ (static import)
      ║ ALWAYS REQUIRED ❌
      ▼
@thesysai/genui-sdk
      ║ (static imports)
      ║ ALWAYS REQUIRED ❌
      ▼
[10+ peer dependencies]
  - lowlight
  - hastscript
  - date-fns
  - katex
  - react-error-boundary
  - rehype-katex
  - remark-breaks
  - etc.

Result: Build fails if ANY dependency missing
```

### After (Loose Coupling)
```
ChatMessages.tsx
      ║ (interface only)
      ║ OPTIONAL ✅
      ▼
C1Renderer.tsx
      ║ (dynamic import)
      ║ RUNTIME ONLY ✅
      ▼
@thesysai/genui-sdk
      ║ (dynamic imports)
      ║ RUNTIME ONLY ✅
      ▼
[10+ peer dependencies]
  - lowlight
  - hastscript
  - date-fns
  - katex
  - etc.

Result: Build succeeds, loads on-demand at runtime
```

## Component Interaction Flow

### Standard Chat Mode (Default)
```
User clicks "Zum Chat"
      │
      ▼
ChatMessages.tsx
      │
      ├─ isSuperChatEnabled? NO
      │
      └─▶ Render <ReactMarkdown />
              │
              └─▶ Display standard markdown
                      ✅ NO C1 LOADING
                      ✅ FAST RENDER
                      ✅ SMALL BUNDLE
```

### Super Chat Mode (Toggled)
```
User toggles Super Chat ON
      │
      ▼
ChatMessages.tsx
      │
      ├─ isSuperChatEnabled? YES
      │
      └─▶ Render <C1Renderer />
              │
              └─▶ C1Renderer mounts
                      │
                      ├─ Show "Lädt Super Chat..."
                      │
                      ├─ await import("@thesysai/genui-sdk")
                      │       │
                      │       ├─ Success?
                      │       │     │
                      │       │     ├─ YES: Set components
                      │       │     │      └─▶ Render <ThemeProvider>
                      │       │     │              └─▶ Render <C1Component />
                      │       │     │                      ✅ INTERACTIVE UI
                      │       │     │
                      │       │     └─ NO: Set error
                      │       │            └─▶ Render <ErrorMessage />
                      │       │                    ❌ "Super Chat nicht verfügbar"
                      │       │
                      │       └─▶ Dynamic loading complete
```

## Build Time vs Runtime

### Build Time (webpack bundling)
```
BEFORE:
webpack analyzes ChatMessages.tsx
      │
      ├─ Finds: import { C1Component } from "@thesysai/genui-sdk"
      │
      ├─ Analyzes @thesysai/genui-sdk
      │
      ├─ Finds missing peer deps
      │
      └─▶ BUILD FAILS ❌

AFTER:
webpack analyzes ChatMessages.tsx
      │
      ├─ Finds: import { C1Renderer } from "../C1Renderer"
      │
      ├─ Analyzes C1Renderer.tsx
      │
      ├─ Finds: await import("@thesysai/genui-sdk")
      │       │
      │       └─ Dynamic import = separate chunk
      │
      ├─ webpack.config fallbacks:
      │       lowlight: false
      │       hastscript: false
      │       date-fns: false
      │
      └─▶ BUILD SUCCEEDS ✅
```

### Runtime (browser execution)
```
1. App loads
      │
      ├─ Main bundle (Standard Chat) ✅
      │     - Small size
      │     - Fast load
      │
      └─ C1 chunk (Super Chat) ⏸️
            - Not loaded yet
            - On-demand only

2. User toggles Super Chat
      │
      ├─ C1Renderer mounts
      │
      ├─ Dynamic import triggered
      │
      └─▶ C1 chunk loaded ✅
            - Larger size
            - Interactive UI
```

## Error Handling Flow

### C1 SDK Missing (Expected Scenario)
```
Standard Chat: "Zum Chat"
      │
      ├─ isSuperChatEnabled = false
      │
      └─▶ <ReactMarkdown />
              │
              └─▶ WORKS PERFECTLY ✅
                    No C1 needed

Super Chat: Toggled ON
      │
      ├─ isSuperChatEnabled = true
      │
      ├─ C1Renderer mounts
      │
      ├─ await import("@thesysai/genui-sdk")
      │       │
      │       └─▶ FAILS (not installed)
      │
      └─▶ Catches error
              │
              └─▶ Shows user message:
                    "Super Chat ist nicht verfügbar.
                     Bitte wechseln Sie zum Standard-Chat."

                    User can toggle back to Standard Chat ✅
```

### C1 SDK Installed (Full Feature)
```
Standard Chat: "Zum Chat"
      │
      └─▶ WORKS (same as above) ✅

Super Chat: Toggled ON
      │
      ├─ C1Renderer mounts
      │
      ├─ await import("@thesysai/genui-sdk")
      │       │
      │       └─▶ SUCCESS ✅
      │
      └─▶ Renders C1Component
              │
              └─▶ Interactive UI ✅
```

## Summary

### Key Separation Points

1. **Import Level**
   - Before: Static imports in ChatMessages ❌
   - After: Dynamic imports in C1Renderer ✅

2. **Dependency Level**
   - Before: ChatMessages depends on C1 SDK ❌
   - After: ChatMessages depends on interface ✅

3. **Build Level**
   - Before: Webpack bundles C1 SDK ❌
   - After: Webpack creates separate chunk ✅

4. **Runtime Level**
   - Before: C1 SDK always loaded ❌
   - After: C1 SDK loaded on-demand ✅

### Result: True Separation ✅

```
Standard Chat ──────────────────▶ Always Works
                                   (No C1 mixing)

Super Chat ──────────────────────▶ Optional Feature
                                   (Dynamic loading)

"Zum Chat" Button ────────────────▶ Never Breaks
                                   (Clean separation)
```
