import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';

/**
 * Global setup for Playwright tests with Clerk authentication.
 * This setup obtains a Testing Token that will be used by all tests.
 *
 * IMPORTANT: Requires the following environment variables:
 * - CLERK_PUBLISHABLE_KEY: Your Clerk publishable key
 * - CLERK_SECRET_KEY: Your Clerk secret key (keep secure!)
 *
 * For CI environments (like GitHub Actions), store these as secrets.
 */

// Setup must be run serially, necessary for fully parallel Playwright configs
setup.describe.configure({ mode: 'serial' });

setup('global Clerk setup', async () => {
  // Check for required environment variables
  const requiredVars = ['CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'];
  const missingVars = requiredVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    console.warn(`
      ⚠️  Missing required environment variables for Clerk testing:
      ${missingVars.map((v) => `   - ${v}`).join('\n')}
      
      To enable authenticated E2E tests, please set these variables.
      Tests requiring authentication will be skipped.
    `);
    return;
  }

  try {
    // Set up Clerk testing token for all tests
    await clerkSetup();
    console.log('✅ Clerk testing token obtained successfully');
  } catch (error) {
    console.error('❌ Failed to set up Clerk testing:', error);
    // Don't throw - let tests decide how to handle missing auth
  }
});
