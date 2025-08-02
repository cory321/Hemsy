// Jest type declarations
/* eslint-disable no-unused-vars */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveStyle(style: string | Record<string, unknown>): R;
    }
  }
}

export {};
