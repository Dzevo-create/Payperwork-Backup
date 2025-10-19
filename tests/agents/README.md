# Agent Tests - Modular Structure

Clean, focused test files for the Multi-Agent System.

## Structure

```
tests/agents/
├── browser-tool/          # PlaywrightBrowserTool tests
│   ├── basic.spec.ts     # Basic page fetching
│   ├── screenshots.spec.ts # Screenshot generation
│   ├── (pdf.spec.ts)      # PDF generation
│   ├── (metadata.spec.ts) # Metadata extraction
│   └── (actions.spec.ts)  # Interactive actions
├── agents/                # Agent integration tests
│   ├── (content-writer.spec.ts)
│   ├── (research.spec.ts)
│   └── (coordinator.spec.ts)
└── workflows/             # E2E workflow tests
    ├── (presentation.spec.ts)
    └── (custom.spec.ts)
```

## Legacy Files (to be migrated)

- `playwright-browser-tool.spec.ts` (400+ lines) → Split into browser-tool/*
- `agents-integration.spec.ts` (350+ lines) → Split into agents/*
- `workflows-e2e.spec.ts` (350+ lines) → Split into workflows/*

## Benefits

**Modularity:**
- Each file tests one specific feature
- 50-100 lines per file (vs 350-400+)
- Easy to find and run specific tests

**Maintainability:**
- Focused test scopes
- Clear test purposes
- Independent test suites

**Performance:**
- Run specific test suites only
- Faster test execution
- Parallel test running

## Run Tests

```bash
# Run all tests
npx playwright test tests/agents/

# Run specific suite
npx playwright test tests/agents/browser-tool/

# Run specific file
npx playwright test tests/agents/browser-tool/basic.spec.ts

# Run with UI
npx playwright test tests/agents/ --ui
```

## Status

- ✅ browser-tool/basic.spec.ts
- ✅ browser-tool/screenshots.spec.ts
- 🚧 Remaining files to be created
- 🚧 Legacy files to be removed after migration
