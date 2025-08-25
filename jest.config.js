import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/config/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/src/__tests__/e2e/',
  ],
  // Add timeout settings to prevent hanging tests
  testTimeout: 10000, // 10 seconds instead of default 5
  // Prevent tests from hanging on unhandled promises
  forceExit: true,
  detectOpenHandles: false,
  // Better error reporting
  verbose: false,
  // Exit early on test failure to prevent hanging
  bail: 1,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '@clerk/backend/dist/runtime/browser/crypto':
      '<rootDir>/src/lib/testing/__mocks__/crypto.js',
    isows: '<rootDir>/src/lib/testing/__mocks__/isows.js',
  },
  transformIgnorePatterns: ['node_modules/(?!(@supabase|@clerk|isows)/)'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*test*',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
