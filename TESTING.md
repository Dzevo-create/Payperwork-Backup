# Testing Documentation

## Overview

This project uses Jest and React Testing Library for testing, configured to work with Next.js 15, React 19, and TypeScript.

## Testing Infrastructure

### Dependencies Installed

All testing dependencies have been installed as devDependencies:

- **jest** (v30.2.0) - JavaScript testing framework
- **@testing-library/react** (v16.3.0) - React component testing utilities (React 19 compatible)
- **@testing-library/jest-dom** (v6.9.1) - Custom Jest matchers for DOM assertions
- **@testing-library/user-event** (v14.6.1) - User interaction simulation
- **jest-environment-jsdom** (v30.2.0) - DOM environment for Jest
- **@types/jest** (v30.0.0) - TypeScript types for Jest

### Configuration Files

#### jest.config.ts
Main Jest configuration file with:
- Next.js 15 integration via `next/jest.js`
- TypeScript support
- Module path aliases (`@/*`)
- CSS and image file mocking
- Coverage reporting configuration
- jsdom test environment

#### jest.setup.ts
Global test setup file that includes:
- `@testing-library/jest-dom` matchers
- Mock implementations for:
  - `IntersectionObserver`
  - `ResizeObserver`
  - `window.matchMedia`
  - `navigator.clipboard`

#### Mock Files
- `__mocks__/styleMock.js` - Handles CSS imports
- `__mocks__/fileMock.js` - Handles image/file imports

## Running Tests

### Available Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (automatically re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Output

All tests are currently passing:
- **3 test suites**
- **33 tests total**
- **100% passing rate**

## Test Examples

### 1. Setup Test (`__tests__/setup.test.ts`)

Basic sanity checks to verify the testing infrastructure:
- Jest is working correctly
- Jest matchers are available
- jest-dom matchers are working
- Environment mocks (clipboard, window, document) are set up

### 2. Hook Test (`__tests__/hooks/useMessageActions.test.ts`)

Comprehensive tests for the `useMessageActions` hook covering:
- Initial state verification
- Copy functionality with clipboard mock
- Edit state management
- Save and cancel operations
- Complete workflow integration tests

**Test Coverage:**
- 12 individual test cases
- Edge cases (empty content, missing callbacks)
- Timer-based functionality (auto-reset after 2 seconds)

### 3. Component Test (`__tests__/components/MessageBubble.test.tsx`)

Tests for the `MessageBubble` component including:
- Rendering for user and assistant messages
- Styling application
- Edit mode behavior
- Message content display
- C1 message handling
- Streaming message identification
- DOM ID generation

**Test Coverage:**
- 16 individual test cases
- Mocked child components for isolation
- Type safety with TypeScript

## Writing New Tests

### Test File Structure

```typescript
import { render, screen } from '@testing-library/react';
import { ComponentName } from '@/path/to/component';

describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Feature Group', () => {
    it('should do something specific', () => {
      // Arrange
      const props = { /* ... */ };

      // Act
      render(<ComponentName {...props} />);

      // Assert
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });
});
```

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useYourHook } from '@/hooks/useYourHook';

describe('useYourHook', () => {
  it('should handle state changes', () => {
    const { result } = renderHook(() => useYourHook());

    act(() => {
      result.current.someFunction();
    });

    expect(result.current.someState).toBe(expectedValue);
  });
});
```

### Mocking Modules

```typescript
// Mock an entire module
jest.mock('@/path/to/module', () => ({
  exportedFunction: jest.fn(() => 'mocked return value'),
}));

// Mock specific components
jest.mock('@/components/SomeComponent', () => ({
  SomeComponent: () => <div>Mocked Component</div>,
}));
```

## Best Practices

1. **Test Organization**
   - Group related tests using `describe` blocks
   - Use descriptive test names with `it('should ...')`
   - Clear mocks between tests with `beforeEach(() => jest.clearAllMocks())`

2. **Component Testing**
   - Mock child components to isolate the component under test
   - Test user-facing behavior, not implementation details
   - Use `screen.getByRole`, `screen.getByLabelText` for accessibility

3. **Hook Testing**
   - Use `renderHook` from `@testing-library/react`
   - Wrap state changes in `act()`
   - Test edge cases and error conditions

4. **Assertions**
   - Use specific matchers (`toHaveTextContent` vs `toBe`)
   - Check for both presence and absence of elements
   - Verify callbacks with `toHaveBeenCalledWith`

5. **Coverage**
   - Aim for high coverage but focus on critical paths
   - Don't test implementation details
   - Test error handling and edge cases

## Troubleshooting

### Common Issues

**Issue:** Tests fail with module resolution errors
**Solution:** Check that `@/*` paths in `jest.config.ts` match `tsconfig.json`

**Issue:** Component tests fail with "X is not defined"
**Solution:** Check `jest.setup.ts` for missing global mocks

**Issue:** Async tests are flaky
**Solution:** Use `waitFor` from `@testing-library/react` for async operations

**Issue:** Timer-based tests don't work
**Solution:** Use `jest.useFakeTimers()` and `jest.advanceTimersByTime()`

### Getting Help

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing/jest)

## Next Steps

To expand test coverage:

1. Add tests for API routes in `app/api/`
2. Test workflow components in `components/workflows/`
3. Add integration tests for complete user flows
4. Set up E2E testing with Playwright or Cypress
5. Add visual regression testing for UI components

## Notes

- All tests run in a jsdom environment (not a real browser)
- Next.js features like `next/image` and `next/link` are automatically mocked
- Environment variables can be mocked in `jest.setup.ts`
- The warning about multiple lockfiles can be ignored or resolved by setting `outputFileTracingRoot` in `next.config.js`
