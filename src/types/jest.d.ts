// Jest type declarations

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveStyle(style: string | Record<string, unknown>): R;
    }
  }
}

export {};
