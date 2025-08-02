# 🧪 Test Templates for Copy-Paste

## 📋 Quick Start Templates

Copy these templates and customize for your specific component/function:

---

## 🎯 Component Test Template

```typescript
// src/components/[ComponentName]/[ComponentName].test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { [ComponentName] } from './[ComponentName]'

// Mock any external dependencies
jest.mock('@/lib/hooks/use[HookName]', () => ({
  use[HookName]: () => ({
    data: mockData,
    loading: false,
    error: null,
  }),
}))

describe('[ComponentName]', () => {
  const defaultProps = {
    // Add your component's default props here
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<[ComponentName] {...defaultProps} />)

      // Test basic rendering
      expect(screen.getByRole('[role]')).toBeInTheDocument()
      expect(screen.getByText('[expected text]')).toBeInTheDocument()
    })

    it('renders loading state', () => {
      render(<[ComponentName] {...defaultProps} loading={true} />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('renders error state', () => {
      const errorMessage = 'Something went wrong'
      render(<[ComponentName] {...defaultProps} error={errorMessage} />)

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('handles button click', async () => {
      const mockOnClick = jest.fn()
      const user = userEvent.setup()

      render(<[ComponentName] {...defaultProps} onClick={mockOnClick} />)

      await user.click(screen.getByRole('button', { name: /[button text]/i }))

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('handles form submission', async () => {
      const mockOnSubmit = jest.fn()
      const user = userEvent.setup()

      render(<[ComponentName] {...defaultProps} onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/[input label]/i), 'test input')
      await user.click(screen.getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          // expected form data
        })
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<[ComponentName] {...defaultProps} />)

      expect(screen.getByRole('[role]')).toHaveAttribute('aria-label', '[expected label]')
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<[ComponentName] {...defaultProps} />)

      await user.tab()
      expect(screen.getByRole('button')).toHaveFocus()

      await user.keyboard('{Enter}')
      // Assert expected behavior
    })
  })

  describe('Responsive Design', () => {
    it('adapts to mobile viewport', () => {
      // Mock viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<[ComponentName] {...defaultProps} />)

      // Test mobile-specific behavior
    })
  })
})
```

---

## 🎯 Server Action Test Template

```typescript
// src/lib/actions/[actionName].test.ts
import { [actionName] } from './[actionName]'
import { createMockSupabaseClient } from '../__mocks__/supabase'

// Mock Supabase
jest.mock('../supabase', () => ({
  createClient: () => createMockSupabaseClient(),
}))

// Mock other dependencies
jest.mock('../auth', () => ({
  getCurrentUser: jest.fn(),
}))

describe('[actionName] Server Action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Success Cases', () => {
    it('processes valid input successfully', async () => {
      const validInput = {
        // Add valid input data
      }

      const mockDbResponse = {
        data: { id: 'generated-id', ...validInput },
        error: null,
      }

      createMockSupabaseClient().from().insert.mockResolvedValue(mockDbResponse)

      const result = await [actionName](validInput)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockDbResponse.data)
      expect(createMockSupabaseClient().from().insert).toHaveBeenCalledWith(validInput)
    })
  })

  describe('Validation', () => {
    it('rejects invalid input', async () => {
      const invalidInput = {
        // Add invalid input data
      }

      const result = await [actionName](invalidInput)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('[expected error message]')
    })

    it('requires authentication', async () => {
      const { getCurrentUser } = require('../auth')
      getCurrentUser.mockResolvedValue(null)

      const result = await [actionName]({})

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required')
    })
  })

  describe('Error Handling', () => {
    it('handles database errors gracefully', async () => {
      const mockDbError = {
        data: null,
        error: { message: 'Database connection failed' },
      }

      createMockSupabaseClient().from().insert.mockResolvedValue(mockDbError)

      const result = await [actionName]({})

      expect(result.success).toBe(false)
      expect(result.error).toBe('[expected error message]')
    })

    it('handles network timeouts', async () => {
      createMockSupabaseClient().from().insert.mockRejectedValue(
        new Error('Network timeout')
      )

      const result = await [actionName]({})

      expect(result.success).toBe(false)
      expect(result.error).toBe('Request timed out')
    })
  })

  describe('Business Logic', () => {
    it('enforces business rules', async () => {
      // Test specific business logic for your action
      const businessRuleViolation = {
        // Data that violates business rules
      }

      const result = await [actionName](businessRuleViolation)

      expect(result.success).toBe(false)
      expect(result.error).toContain('[business rule error]')
    })
  })
})
```

---

## 🎯 Custom Hook Test Template

```typescript
// src/hooks/use[HookName].test.ts
import { renderHook, act } from '@testing-library/react'
import { use[HookName] } from './use[HookName]'

// Mock dependencies
jest.mock('../lib/supabase', () => ({
  createClient: () => mockSupabaseClient,
}))

describe('use[HookName]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('returns initial state correctly', () => {
      const { result } = renderHook(() => use[HookName]())

      expect(result.current.data).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Data Fetching', () => {
    it('fetches data successfully', async () => {
      const mockData = [
        // Mock data structure
      ]

      mockSupabaseClient.from().select.mockResolvedValue({
        data: mockData,
        error: null,
      })

      const { result } = renderHook(() => use[HookName]())

      act(() => {
        result.current.fetchData()
      })

      expect(result.current.loading).toBe(true)

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBeNull()
    })

    it('handles fetch errors', async () => {
      const mockError = { message: 'Fetch failed' }

      mockSupabaseClient.from().select.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const { result } = renderHook(() => use[HookName]())

      await act(async () => {
        result.current.fetchData()
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.data).toBeNull()
      expect(result.current.error).toBe(mockError.message)
    })
  })

  describe('State Updates', () => {
    it('updates state correctly', async () => {
      const { result } = renderHook(() => use[HookName]())

      await act(async () => {
        result.current.updateState({ key: 'value' })
      })

      expect(result.current.data).toEqual({ key: 'value' })
    })
  })

  describe('Cleanup', () => {
    it('cleans up subscriptions on unmount', () => {
      const mockUnsubscribe = jest.fn()

      const { unmount } = renderHook(() => use[HookName]())

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })
})
```

---

## 🎯 E2E Test Template

```typescript
// src/__tests__/e2e/[feature-name].spec.ts
import { test, expect } from '@playwright/test';

test.describe('[Feature Name]', () => {
	test.beforeEach(async ({ page }) => {
		// Set up authentication
		await page.goto('/sign-in');
		await page.fill('[data-testid="email"]', 'test@threadfolio.com');
		await page.fill('[data-testid="password"]', 'testpassword');
		await page.click('[data-testid="sign-in-button"]');
		await page.waitForURL('/dashboard');
	});

	test.describe('Happy Path', () => {
		test('completes main user flow', async ({ page }) => {
			// Navigate to feature
			await page.click('[data-testid="nav-[feature]"]');
			await expect(page).toHaveURL('/[feature]');

			// Interact with feature
			await page.click('[data-testid="primary-action"]');

			// Fill form if needed
			await page.fill('[data-testid="input-field"]', 'test value');

			// Submit
			await page.click('[data-testid="submit-button"]');

			// Verify success
			await expect(
				page.locator('[data-testid="success-message"]')
			).toBeVisible();
			await expect(page.locator('text=[expected result]')).toBeVisible();
		});
	});

	test.describe('Error Handling', () => {
		test('displays validation errors', async ({ page }) => {
			await page.goto('/[feature]');

			// Submit without required fields
			await page.click('[data-testid="submit-button"]');

			// Check validation errors
			await expect(page.locator('text=[validation error]')).toBeVisible();
			await expect(page.locator('[data-testid="error-alert"]')).toBeVisible();
		});

		test('handles server errors gracefully', async ({ page }) => {
			// Mock server error
			await page.route('**/api/[endpoint]', (route) => {
				route.fulfill({
					status: 500,
					body: JSON.stringify({ error: 'Server error' }),
				});
			});

			await page.goto('/[feature]');
			await page.click('[data-testid="submit-button"]');

			await expect(page.locator('text=Something went wrong')).toBeVisible();
		});
	});

	test.describe('Mobile Experience', () => {
		test('works on mobile viewport', async ({ page }) => {
			await page.setViewportSize({ width: 375, height: 667 });

			await page.goto('/[feature]');

			// Test mobile-specific behavior
			await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
			await expect(
				page.locator('[data-testid="desktop-sidebar"]')
			).not.toBeVisible();
		});
	});

	test.describe('Accessibility', () => {
		test('supports keyboard navigation', async ({ page }) => {
			await page.goto('/[feature]');

			// Tab through interactive elements
			await page.keyboard.press('Tab');
			await expect(page.locator(':focus')).toHaveAttribute(
				'data-testid',
				'first-interactive'
			);

			await page.keyboard.press('Tab');
			await expect(page.locator(':focus')).toHaveAttribute(
				'data-testid',
				'second-interactive'
			);

			// Activate with Enter/Space
			await page.keyboard.press('Enter');
			// Assert expected behavior
		});
	});

	test.describe('Performance', () => {
		test('loads within performance budget', async ({ page }) => {
			const startTime = Date.now();

			await page.goto('/[feature]');
			await page.waitForLoadState('networkidle');

			const loadTime = Date.now() - startTime;
			expect(loadTime).toBeLessThan(2000); // <2s requirement
		});
	});
});
```

---

## 🎯 Mock Templates

### **Supabase Mock**

```typescript
// src/lib/__mocks__/supabase.ts
export const createMockSupabaseClient = () => ({
	from: jest.fn(() => ({
		select: jest.fn().mockReturnThis(),
		insert: jest.fn().mockReturnThis(),
		update: jest.fn().mockReturnThis(),
		delete: jest.fn().mockReturnThis(),
		eq: jest.fn().mockReturnThis(),
		in: jest.fn().mockReturnThis(),
		order: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		single: jest.fn(),
	})),
	auth: {
		getUser: jest.fn(),
		signInWithPassword: jest.fn(),
		signOut: jest.fn(),
	},
});
```

### **Next.js Router Mock**

```typescript
// src/__mocks__/next/navigation.ts
export const useRouter = () => ({
	push: jest.fn(),
	replace: jest.fn(),
	back: jest.fn(),
	forward: jest.fn(),
	refresh: jest.fn(),
	prefetch: jest.fn(),
});

export const useSearchParams = () => new URLSearchParams();
export const usePathname = () => '/test-path';
```

---

## 🎯 Quick Copy Commands

### **Create Component Test**

```bash
# Copy the component test template
cp TEST_TEMPLATE.md src/components/YourComponent/YourComponent.test.tsx
# Then customize for your component
```

### **Create Action Test**

```bash
# Copy the server action test template
cp TEST_TEMPLATE.md src/lib/actions/yourAction.test.ts
# Then customize for your action
```

### **Run Tests During Development**

```bash
# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testNamePattern="YourComponent"

# Run with coverage
npm run test:coverage
```

---

## ✅ Pre-Commit Checklist

Before committing any code:

- [ ] All tests pass (`npm test`)
- [ ] Coverage meets threshold (80%+)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Accessibility tests pass (`npm run test:a11y`)
- [ ] Mobile viewport tested
- [ ] Performance requirements met

---

_Copy these templates and customize them for your specific features!_
