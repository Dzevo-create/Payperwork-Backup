# Test Suite Documentation

## Quick Start

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- __tests__/lib/api-error-handler.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should validate"
```

---

## Test Structure

### Directory Organization
```
__tests__/
├── api/              # API route tests
├── components/       # React component tests
├── hooks/            # React hook tests
├── integration/      # Integration tests
├── lib/              # Library/core logic tests
├── utils/            # Utility function tests
└── setup.test.ts     # Test environment verification
```

---

## Test Categories

### 1. API Route Tests
Test API endpoints for workflows:
- `branding-api.test.ts` - Branding generation endpoint
- `sketch-to-render-api.test.ts` - Sketch-to-render endpoint

**Coverage:**
- Request validation
- Error handling
- Rate limiting
- API key validation
- Response format

### 2. Utility Function Tests
Test helper functions and utilities:
- `api-error-handler.test.ts` - Error handling and responses
- `supabaseHelpers.test.ts` - Database helpers
- `rate-limit.test.ts` - Rate limiting logic
- `textUtils.test.ts` - Text processing
- `dateUtils.test.ts` - Date formatting and manipulation
- `validation.test.ts` - Input validation
- `imageCache.test.ts` - Image caching logic

### 3. Hook Tests
Test React hooks:
- `useMessageActions.test.ts` - Message actions
- `useWorkflowGeneration.test.ts` - Workflow generation utilities

### 4. Component Tests
Test React components:
- `ErrorBoundary.test.tsx` - Error boundary
- `MessageBubble.test.tsx` - Message bubble component

### 5. Integration Tests
Test end-to-end workflows:
- `workflow-generation.test.ts` - Complete workflow execution

---

## Writing New Tests

### Test File Template
```typescript
/**
 * Feature Name Tests
 * Description of what this test file covers
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Import the code to test
import { functionToTest } from '@/path/to/module';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
    jest.clearAllMocks();
  });

  describe('Subfeature', () => {
    it('should handle success case', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle error case', () => {
      // Test error scenarios
      expect(() => functionToTest('')).toThrow();
    });
  });
});
```

### Testing Best Practices

1. **Follow AAA Pattern**
   - Arrange: Set up test data
   - Act: Execute the function/action
   - Assert: Verify the results

2. **Test One Thing Per Test**
   - Each test should verify a single behavior
   - Keep tests focused and simple

3. **Use Descriptive Names**
   - Test names should describe what they test
   - Use "should" statements (e.g., "should validate email format")

4. **Mock External Dependencies**
   - Mock API calls, database queries, external services
   - Keep tests fast and isolated

5. **Clean Up After Tests**
   - Use beforeEach/afterEach for setup/cleanup
   - Clear mocks between tests

6. **Test Edge Cases**
   - Empty strings, null, undefined
   - Boundary conditions
   - Invalid inputs

---

## Common Testing Patterns

### Mocking Modules
```typescript
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));
```

### Mocking Async Functions
```typescript
const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' }),
  })
);

global.fetch = mockFetch as any;
```

### Testing React Hooks
```typescript
import { renderHook, act } from '@testing-library/react';

it('should update state', () => {
  const { result } = renderHook(() => useCustomHook());

  act(() => {
    result.current.updateValue('new value');
  });

  expect(result.current.value).toBe('new value');
});
```

### Testing React Components
```typescript
import { render, screen } from '@testing-library/react';

it('should render component', () => {
  render(<MyComponent title="Test" />);

  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### Testing Async Operations
```typescript
it('should fetch data', async () => {
  const promise = fetchData();

  await expect(promise).resolves.toEqual({ data: 'test' });
});
```

---

## Debugging Tests

### Run Single Test
```bash
npm test -- __tests__/lib/api-error-handler.test.ts
```

### Run Tests in Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Show Console Logs
```bash
npm test -- --verbose
```

### Update Snapshots
```bash
npm test -- -u
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

---

## Coverage Requirements

### Current Coverage
- **API Routes:** 80%+ coverage
- **Utilities:** 90%+ coverage
- **Hooks:** 75%+ coverage
- **Components:** 70%+ coverage

### Viewing Coverage
```bash
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/coverage-summary.json` - JSON summary

---

## Troubleshooting

### Tests Failing Locally
1. Clear Jest cache: `npm test -- --clearCache`
2. Delete node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check Node version: `node --version` (should be 18+)

### Tests Passing Locally but Failing in CI
1. Check environment variables
2. Verify Node version matches
3. Check for timezone differences in date tests
4. Ensure all dependencies are in package.json

### Slow Tests
1. Use `jest.setTimeout()` for async tests
2. Mock external API calls
3. Use `--maxWorkers=50%` to limit parallel execution

### Memory Issues
```bash
node --max-old-space-size=4096 node_modules/.bin/jest
```

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Test Maintenance

### When to Update Tests
- When changing functionality
- When fixing bugs (add regression tests)
- When refactoring code
- When adding new features

### Code Review Checklist
- [ ] Tests cover happy path
- [ ] Tests cover error cases
- [ ] Tests cover edge cases
- [ ] Tests are isolated and independent
- [ ] Tests have descriptive names
- [ ] Mocks are properly cleaned up
- [ ] No console errors or warnings
- [ ] Coverage meets requirements

---

**Last Updated:** October 18, 2025
