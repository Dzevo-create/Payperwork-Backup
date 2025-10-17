/**
 * Setup sanity test
 * Verifies that the Jest testing infrastructure is working correctly
 */

describe('Jest Setup', () => {
  it('should run a basic test', () => {
    expect(true).toBe(true);
  });

  it('should have access to Jest matchers', () => {
    expect(1 + 1).toBe(2);
    expect([1, 2, 3]).toHaveLength(3);
    expect({ name: 'test' }).toHaveProperty('name');
  });

  it('should have access to jest-dom matchers', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    document.body.appendChild(div);
    expect(div).toBeInTheDocument();
    expect(div).toHaveTextContent('Hello World');
    document.body.removeChild(div);
  });

  it('should mock navigator.clipboard', async () => {
    await navigator.clipboard.writeText('test');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test');
  });

  it('should have proper environment setup', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
    expect(window.matchMedia).toBeDefined();
  });
});
