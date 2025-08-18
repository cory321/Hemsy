import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for Node.js environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Ensure Fetch API globals exist for Next.js route handlers and libraries
try {
  const {
    fetch: undiciFetch,
    Headers: UndiciHeaders,
    Request: UndiciRequest,
    Response: UndiciResponse,
    FormData: UndiciFormData,
    File: UndiciFile,
  } = require('undici');

  if (typeof global.fetch === 'undefined') global.fetch = undiciFetch;
  if (typeof global.Headers === 'undefined') global.Headers = UndiciHeaders;
  if (typeof global.Request === 'undefined') global.Request = UndiciRequest;
  if (typeof global.Response === 'undefined') global.Response = UndiciResponse;
  if (typeof global.FormData === 'undefined') global.FormData = UndiciFormData;
  if (typeof global.File === 'undefined') global.File = UndiciFile;
} catch (_e) {
  // Fallback minimal fetch stub if undici isn't available
  if (typeof global.fetch === 'undefined') {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
    }));
  }
}

// Mock Clerk for tests
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => Promise.resolve({ userId: 'test-user-id' })),
  currentUser: jest.fn(() =>
    Promise.resolve({
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
    })
  ),
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

// Mock Next.js server-side utilities and cache
jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn) => fn),
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}));

// Mock next/headers for server components
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
  headers: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));
