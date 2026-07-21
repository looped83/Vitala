// Type augmentation so `expect(...).toHaveNoViolations()` (from vitest-axe) is
// recognised by TypeScript. See src/test/a11y.test.tsx.
import 'vitest';

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
