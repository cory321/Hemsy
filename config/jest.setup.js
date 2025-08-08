import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for Node.js environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill Request/Response for Node.js environment
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      this.url = input;
      this.init = init;
    }
  };
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.init = init;
    }
  };
}

// Mock Clerk for tests
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => Promise.resolve({ userId: 'test-user-id' })),
}));

// Mock email config and Resend for tests to avoid requiring real API keys
jest.mock('@/lib/config/email.config', () => {
  const mockResend = {
    emails: {
      send: jest
        .fn()
        .mockResolvedValue({ data: { id: 'mock-email-id' }, error: null }),
    },
  };

  const emailConfig = {
    sender: {
      address: 'test@threadfolio.com',
      name: 'Threadfolio Test',
      replyTo: undefined,
      get formatted() {
        return `${this.name} <${this.address}>`;
      },
    },
    features: {
      previewMode: true,
      enabled: false,
      logLevel: 'debug',
    },
    limits: { ratePerHour: 100 },
    urls: {
      app: 'http://localhost:3000',
      confirmation: 'http://localhost:3000/confirm',
    },
    dev: { overrideRecipient: 'test@threadfolio.com' },
  };

  return { resend: mockResend, emailConfig };
});

// Global test setup
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Ensure EMAIL_DEV_OVERRIDE is set in test env to avoid accidental real sends
process.env.EMAIL_DEV_OVERRIDE =
  process.env.EMAIL_DEV_OVERRIDE || 'cory321@gmail.com';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 'test_resend_key';

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia (guard for node environment without window)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock MUI App Router Cache Provider hooks for tests
jest.mock('@mui/material-nextjs/v14-appRouter', () => ({
  __esModule: true,
  AppRouterCacheProvider: ({ children }) => children,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
  useServerInsertedHTML: (cb) => cb?.(),
}));

// Mock Supabase browser client to avoid requiring env vars in tests
jest.mock('@/lib/supabase/client', () => {
  const chainableQuery = () => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
  });

  const channelMock = () => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
  });

  return {
    __esModule: true,
    createClient: jest.fn(() => ({
      from: jest.fn(() => chainableQuery()),
      channel: jest.fn(() => channelMock()),
      removeChannel: jest.fn(),
    })),
  };
});

// Mock server-side Supabase client factory used by server actions
jest.mock('@/lib/supabase/server', () => {
  const chainableQuery = () => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
  });

  return {
    __esModule: true,
    createClient: jest.fn(async () => ({
      from: jest.fn(() => chainableQuery()),
    })),
  };
});
