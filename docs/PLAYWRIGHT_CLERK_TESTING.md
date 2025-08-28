# Playwright E2E Testing with Clerk Authentication

This document explains how to run end-to-end tests with Clerk authentication in the Threadfolio V2 application.

## Overview

We use Clerk's Testing Tokens feature to bypass authentication during E2E tests. This allows tests to access protected routes and test authenticated user flows without going through the actual sign-in process.

## Setup Requirements

### 1. Install Dependencies

The required package is already installed:

```bash
npm install --save-dev @clerk/testing
```

### 2. Environment Variables

You need to set the following environment variables to enable authenticated testing:

```bash
# Required for Clerk testing
CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here

# Optional: Set base URL for tests
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

#### Getting Your Keys

1. Go to the [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **API Keys**
4. Copy your **Publishable Key** and **Secret Key**

#### Setting Environment Variables

**Option 1: Local Testing (.env.test.local)**

Create a `.env.test.local` file in the root directory:

```bash
# .env.test.local
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Option 2: Command Line**

Run tests with environment variables:

```bash
CLERK_PUBLISHABLE_KEY=pk_test_... CLERK_SECRET_KEY=sk_test_... npm run test:e2e
```

**Option 3: GitHub Actions (CI/CD)**

In your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add new repository secrets:
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

Then in your workflow file:

```yaml
- name: Run E2E tests
  env:
    CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY }}
    CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
  run: npm run test:e2e
```

## Running Tests

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run Tests with UI Mode

```bash
npm run test:e2e:ui
```

### Run Specific Test File

```bash
npx playwright test src/__tests__/e2e/authenticated-flows.test.ts
```

### Debug Mode

```bash
npx playwright test --debug
```

## Test Structure

### Helper Functions

Located in `src/__tests__/e2e/helpers/clerk-auth.helper.ts`:

- `setupAuthenticatedPage(page)` - Sets up a page with authentication
- `isClerkTestingConfigured()` - Checks if environment variables are set
- `navigateToProtectedRoute(page, route)` - Navigates to protected routes
- `isAuthenticated(page)` - Checks authentication status
- `getCurrentUserId(page)` - Gets the current user ID

### Example Test

```typescript
import { test, expect } from '@playwright/test';
import {
  setupAuthenticatedPage,
  navigateToProtectedRoute,
} from './helpers/clerk-auth.helper';

test('access protected dashboard', async ({ page }) => {
  // Setup authentication
  await setupAuthenticatedPage(page);

  // Navigate to protected route
  await navigateToProtectedRoute(page, '/dashboard');

  // Test your authenticated features
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
});
```

## What Gets Tested

The testing setup allows you to:

1. **Access Protected Routes**: Test pages that require authentication
2. **Test User Flows**: Complete workflows like creating clients, orders, etc.
3. **API Endpoints**: Test protected API routes with authentication
4. **Navigation**: Test navigation between protected pages
5. **Mobile Views**: Test responsive design with authentication
6. **Sign Out**: Test logout functionality

## Troubleshooting

### Tests Skip with "Clerk testing not configured"

**Solution**: Ensure environment variables are set correctly:

```bash
echo $CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY
```

### Authentication Fails in Tests

**Possible causes**:

1. Invalid or expired API keys
2. Keys from wrong environment (dev vs. production)
3. Network issues connecting to Clerk

**Solution**: Verify keys in Clerk Dashboard and ensure you're using the correct environment.

### Tests Timeout on Protected Routes

**Solution**: Increase timeout in test or Playwright config:

```typescript
await page.goto('/dashboard', { timeout: 30000 });
```

### "Clerk is not defined" Error

**Solution**: Ensure `waitForAuthReady(page)` is called before accessing Clerk:

```typescript
await waitForAuthReady(page);
const userId = await getCurrentUserId(page);
```

## Best Practices

1. **Always Check Configuration**: Use `isClerkTestingConfigured()` to skip tests when not configured
2. **Setup Authentication Early**: Call `setupAuthenticatedPage()` in `beforeEach` hooks
3. **Clean Up**: Clear authentication state between tests if needed
4. **Use Helpers**: Leverage the helper functions for consistency
5. **Parallel Testing**: Tests run in parallel by default, ensure they don't interfere

## Security Notes

⚠️ **IMPORTANT**:

- Never commit API keys to version control
- Use environment variables or secrets management
- Use test/development keys for testing, not production keys
- In CI/CD, use encrypted secrets

## Additional Resources

- [Clerk Testing Documentation](https://clerk.com/docs/testing/playwright/overview)
- [Playwright Documentation](https://playwright.dev)
- [Clerk Dashboard](https://dashboard.clerk.com)

## Next Steps

1. Set up your environment variables
2. Run the example tests to verify setup
3. Write tests for your specific features
4. Add tests to CI/CD pipeline

## Support

If you encounter issues:

1. Check this documentation
2. Review test output and error messages
3. Check Clerk Dashboard for API key status
4. Consult Clerk and Playwright documentation
