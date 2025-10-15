/**
 * Global Error Suppression
 *
 * Suppresses known third-party library warnings that we cannot fix directly.
 * This file is imported in layout.tsx to run on client-side.
 */

if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  // Errors/warnings to suppress
  const suppressPatterns = [
    /button.*cannot be a descendant of.*button/i,
    /cannot.*nested.*button/i,
    /hydration error/i,
  ];

  const shouldSuppress = (message: string): boolean => {
    return suppressPatterns.some(pattern => pattern.test(message));
  };

  // Override console.error
  console.error = function(...args: any[]) {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalError.apply(console, args);
    }
  };

  // Override console.warn
  console.warn = function(...args: any[]) {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalWarn.apply(console, args);
    }
  };
}
