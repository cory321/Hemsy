# 🧪 Threadfolio V2 - Testing Guide

## 📋 Overview

This guide provides **specific examples and patterns** for writing tests in Threadfolio V2. All team members must follow these patterns to ensure consistent, comprehensive test coverage.

---

## 🎯 Testing Philosophy

### **Test-Driven Development (TDD)**

1. **Red**: Write a failing test first
2. **Green**: Write minimal code to pass the test
3. **Refactor**: Improve code while keeping tests green

### **Testing Pyramid**

```
         /\
        /  \  E2E Tests (Few, Slow, Expensive)
       /____\
      /      \  Integration Tests (Some, Medium)
     /________\
    /          \  Unit Tests (Many, Fast, Cheap)
   /__________\
```

---

## 🔧 Unit Testing Patterns

### **React Components (Jest + React Testing Library)**

```typescript
// src/components/ClientCard/ClientCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ClientCard } from './ClientCard'

describe('ClientCard', () => {
  const mockClient = {
    id: '1',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    phone_number: '+1234567890'
  }

  it('renders client information correctly', () => {
    render(<ClientCard client={mockClient} />)

    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('+1234567890')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn()
    render(<ClientCard client={mockClient} onEdit={mockOnEdit} />)

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))

    expect(mockOnEdit).toHaveBeenCalledWith(mockClient.id)
  })

  it('displays loading state when updating', () => {
    render(<ClientCard client={mockClient} isUpdating={true} />)

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit/i })).toBeDisabled()
  })
})
```

### **Server Actions (Jest)**

```typescript
// src/lib/actions/clients.test.ts
import { createClient } from './clients';
import { createMockSupabaseClient } from '../__mocks__/supabase';

// Mock Supabase client
jest.mock('../supabase', () => ({
	createClient: () => createMockSupabaseClient(),
}));

describe('createClient Server Action', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('creates client successfully with valid data', async () => {
		const clientData = {
			first_name: 'Jane',
			last_name: 'Doe',
			email: 'jane@example.com',
			phone_number: '+1234567890',
			shop_id: 'shop-123',
		};

		const mockInsert = jest.fn().mockResolvedValue({
			data: { id: 'client-456', ...clientData },
			error: null,
		});

		createMockSupabaseClient.mockReturnValue({
			from: () => ({
				insert: mockInsert,
			}),
		});

		const result = await createClient(clientData);

		expect(mockInsert).toHaveBeenCalledWith(clientData);
		expect(result.success).toBe(true);
		expect(result.data?.id).toBe('client-456');
	});

	it('handles validation errors', async () => {
		const invalidData = {
			first_name: '', // Empty name should fail validation
			last_name: 'Doe',
			email: 'invalid-email', // Invalid email format
			phone_number: '+1234567890',
			shop_id: 'shop-123',
		};

		const result = await createClient(invalidData);

		expect(result.success).toBe(false);
		expect(result.errors).toContain('First name is required');
		expect(result.errors).toContain('Invalid email format');
	});

	it('handles database errors gracefully', async () => {
		const mockInsert = jest.fn().mockResolvedValue({
			data: null,
			error: { message: 'Database connection failed' },
		});

		createMockSupabaseClient.mockReturnValue({
			from: () => ({
				insert: mockInsert,
			}),
		});

		const result = await createClient(validClientData);

		expect(result.success).toBe(false);
		expect(result.error).toBe('Failed to create client');
	});
});
```

### **Custom Hooks (Jest + React Testing Library)**

```typescript
// src/hooks/useClients.test.ts
import { renderHook, act } from '@testing-library/react';
import { useClients } from './useClients';

describe('useClients', () => {
	it('loads clients on mount', async () => {
		const { result } = renderHook(() => useClients('shop-123'));

		expect(result.current.loading).toBe(true);
		expect(result.current.clients).toEqual([]);

		// Wait for async operation
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current.loading).toBe(false);
		expect(result.current.clients.length).toBeGreaterThan(0);
	});

	it('handles errors gracefully', async () => {
		// Mock error scenario
		jest.spyOn(console, 'error').mockImplementation(() => {});

		const { result } = renderHook(() => useClients('invalid-shop'));

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current.error).toBeTruthy();
		expect(result.current.clients).toEqual([]);
	});
});
```

---

## 🔗 Integration Testing Patterns

### **Database Operations**

```typescript
// src/__tests__/integration/clients.test.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/actions/clients';

describe('Clients Integration Tests', () => {
	let supabase: ReturnType<typeof createSupabaseClient>;

	beforeAll(() => {
		supabase = createSupabaseClient(
			process.env.SUPABASE_TEST_URL!,
			process.env.SUPABASE_TEST_ANON_KEY!
		);
	});

	afterEach(async () => {
		// Clean up test data
		await supabase.from('clients').delete().eq('email', 'test@example.com');
	});

	it('creates client and stores in database', async () => {
		const clientData = {
			first_name: 'Test',
			last_name: 'User',
			email: 'test@example.com',
			phone_number: '+1234567890',
			shop_id: 'test-shop-id',
		};

		const result = await createClient(clientData);

		expect(result.success).toBe(true);

		// Verify in database
		const { data } = await supabase
			.from('clients')
			.select('*')
			.eq('email', 'test@example.com')
			.single();

		expect(data.first_name).toBe('Test');
		expect(data.last_name).toBe('User');
	});
});
```

### **Authentication Flow**

```typescript
// src/__tests__/integration/auth.test.ts
import { signIn, signOut } from '@/lib/auth';

describe('Authentication Integration', () => {
	it('handles sign in flow', async () => {
		const result = await signIn({
			email: 'test@example.com',
			password: 'testpassword',
		});

		expect(result.success).toBe(true);
		expect(result.user).toBeDefined();
		expect(result.user?.email).toBe('test@example.com');
	});

	it('creates user record in Supabase after Clerk sign in', async () => {
		// Test that ensureUser() creates the user record
		const clerkUser = {
			id: 'clerk_user_123',
			email: 'test@example.com',
			firstName: 'Test',
			lastName: 'User',
		};

		const result = await ensureUser(clerkUser);

		expect(result.success).toBe(true);

		// Verify user exists in Supabase
		const { data } = await supabase
			.from('users')
			.select('*')
			.eq('clerk_user_id', 'clerk_user_123')
			.single();

		expect(data.email).toBe('test@example.com');
	});
});
```

---

## 🎭 End-to-End Testing Patterns

### **Playwright E2E Tests**

```typescript
// src/__tests__/e2e/client-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Client Management', () => {
	test.beforeEach(async ({ page }) => {
		// Sign in as test user
		await page.goto('/sign-in');
		await page.fill('[data-testid="email"]', 'test@threadfolio.com');
		await page.fill('[data-testid="password"]', 'testpassword');
		await page.click('[data-testid="sign-in-button"]');
		await page.waitForURL('/dashboard');
	});

	test('creates a new client successfully', async ({ page }) => {
		// Navigate to clients page
		await page.click('[data-testid="nav-clients"]');
		await expect(page).toHaveURL('/clients');

		// Click add client button
		await page.click('[data-testid="add-client-button"]');

		// Fill out client form
		await page.fill('[data-testid="first-name"]', 'Jane');
		await page.fill('[data-testid="last-name"]', 'Doe');
		await page.fill('[data-testid="email"]', 'jane.doe@example.com');
		await page.fill('[data-testid="phone"]', '+1234567890');

		// Submit form
		await page.click('[data-testid="save-client"]');

		// Verify success
		await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
		await expect(page.locator('text=Jane Doe')).toBeVisible();
	});

	test('handles validation errors', async ({ page }) => {
		await page.click('[data-testid="nav-clients"]');
		await page.click('[data-testid="add-client-button"]');

		// Submit empty form
		await page.click('[data-testid="save-client"]');

		// Check validation errors
		await expect(page.locator('text=First name is required')).toBeVisible();
		await expect(page.locator('text=Email is required')).toBeVisible();
	});

	test('works on mobile viewport', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		await page.click('[data-testid="nav-clients"]');

		// Verify mobile layout
		await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
		await expect(page.locator('[data-testid="client-grid"]')).toHaveCSS(
			'grid-template-columns',
			'1fr'
		);
	});
});
```

### **Performance Testing**

```typescript
// src/__tests__/e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Requirements', () => {
	test('dashboard loads within 2 seconds', async ({ page }) => {
		const startTime = Date.now();

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		const loadTime = Date.now() - startTime;
		expect(loadTime).toBeLessThan(2000); // <2s requirement from PRD
	});

	test('handles slow network gracefully', async ({ page }) => {
		// Simulate slow 3G
		await page.context().route('**/*', (route) => {
			setTimeout(() => route.continue(), 1000); // 1s delay
		});

		await page.goto('/dashboard');

		// Should show loading states
		await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();

		// Eventually loads
		await expect(
			page.locator('[data-testid="dashboard-content"]')
		).toBeVisible();
	});
});
```

---

## ♿ Accessibility Testing Patterns

### **Automated A11y Testing**

```typescript
// src/__tests__/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Compliance', () => {
	test('client management page meets WCAG 2.1 AA', async ({ page }) => {
		await page.goto('/clients');

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('keyboard navigation works correctly', async ({ page }) => {
		await page.goto('/clients');

		// Tab through interactive elements
		await page.keyboard.press('Tab');
		await expect(page.locator(':focus')).toHaveAttribute(
			'data-testid',
			'add-client-button'
		);

		await page.keyboard.press('Tab');
		await expect(page.locator(':focus')).toHaveAttribute(
			'data-testid',
			'search-input'
		);

		// Enter key activates buttons
		await page.keyboard.press('Enter');
		await expect(page.locator('[data-testid="client-form"]')).toBeVisible();
	});

	test('screen reader announcements work', async ({ page }) => {
		await page.goto('/clients');

		// Check ARIA labels and roles
		await expect(page.locator('main')).toHaveAttribute(
			'aria-label',
			'Client Management'
		);
		await expect(
			page.locator('[data-testid="add-client-button"]')
		).toHaveAttribute('aria-describedby', 'add-client-description');
	});
});
```

---

## 📦 Test Setup & Configuration

### **Jest Configuration (`jest.config.js`)**

```javascript
module.exports = {
	preset: 'next/jest',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	testEnvironment: 'jest-environment-jsdom',
	collectCoverageFrom: [
		'src/**/*.{js,jsx,ts,tsx}',
		'!src/**/*.d.ts',
		'!src/**/*.stories.{js,jsx,ts,tsx}',
		'!src/**/__tests__/**',
	],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},
	moduleNameMapping: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
};
```

### **Test Setup (`jest.setup.js`)**

```javascript
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: jest.fn(),
		replace: jest.fn(),
		back: jest.fn(),
	}),
	useSearchParams: () => new URLSearchParams(),
	usePathname: () => '/test-path',
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
	useUser: () => ({
		user: {
			id: 'test-user-id',
			email: 'test@example.com',
		},
	}),
	useAuth: () => ({
		isSignedIn: true,
		userId: 'test-user-id',
	}),
}));

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));
```

### **Playwright Configuration (`playwright.config.ts`)**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './src/__tests__/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',
	use: {
		baseURL: 'http://localhost:3000',
		trace: 'on-first-retry',
	},
	projects: [
		// Desktop browsers
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},
		// Mobile browsers (critical for mobile-first PWA)
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] },
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] },
		},
	],
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:3000',
		reuseExistingServer: !process.env.CI,
	},
});
```

---

## 🚀 CI/CD Integration

### **GitHub Actions Test Workflow**

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.17.1'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Run accessibility tests
        run: npm run test:a11y

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
```

---

## ✅ Testing Checklist Template

Copy this checklist for every feature:

### **🎯 [Feature Name] Testing Checklist**

#### **Unit Tests:**

- [ ] Component renders correctly with default props
- [ ] Component handles all prop variations
- [ ] User interactions trigger correct callbacks
- [ ] Loading and error states display properly
- [ ] Server Action handles valid input
- [ ] Server Action validates input correctly
- [ ] Server Action handles database errors
- [ ] Custom hooks work with different inputs

#### **Integration Tests:**

- [ ] Database operations work end-to-end
- [ ] Authentication integration works
- [ ] External API integrations work
- [ ] Error boundaries catch and handle errors

#### **E2E Tests:**

- [ ] Happy path user flow works
- [ ] Form validation displays errors
- [ ] Mobile responsive layout works
- [ ] Keyboard navigation works
- [ ] Performance meets requirements (<2s)

#### **Accessibility Tests:**

- [ ] Automated axe-core scan passes
- [ ] Keyboard navigation works
- [ ] Screen reader announcements work
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Focus management works correctly

#### **Coverage:**

- [ ] Unit test coverage >80%
- [ ] All critical paths covered
- [ ] Edge cases tested
- [ ] Error scenarios tested

---

## 🎯 Remember

> **"A feature is not done until it's thoroughly tested!"**

Every line of code should have corresponding test coverage. No exceptions!

---

_For questions about testing patterns, refer to this guide or ask the team lead._
