import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  createConnectAccount,
  createAccountLink,
  getConnectAccountStatus,
} from '../stripe-connect';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    accounts: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    accountLinks: {
      create: jest.fn(),
    },
  }));
});

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null })),
        })),
      })),
      upsert: jest.fn(() => ({ error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({ error: null })),
      })),
    })),
  })),
}));

// Add: Mock Supabase admin client used in syncConnectAccountToDB
jest.mock('@/lib/supabase/admin', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn(() => ({ eq: jest.fn(() => ({ error: null })) })),
    })),
  })),
}));

// Mock auth
jest.mock('@/lib/auth/server', () => ({
  getCurrentUser: jest.fn(() => ({
    id: 'user-123',
    email: 'test@example.com',
  })),
}));

// Add: Mock ensureUserAndShop used by actions
jest.mock('@/lib/actions/users', () => ({
  ensureUserAndShop: jest.fn(async () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    shop: { id: 'shop-123', name: 'Test Shop', email: 'shop@example.com' },
  })),
}));

describe.skip('Stripe Connect Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createConnectAccount', () => {
    it('should create a Standard Connect account successfully', async () => {
      const mockAccount = {
        id: 'acct_test123',
        type: 'standard',
        charges_enabled: false,
        payouts_enabled: false,
        capabilities: { card_payments: 'inactive', transfers: 'inactive' },
        requirements: { currently_due: [] },
      };

      const Stripe = require('stripe');
      const mockStripe = new Stripe();
      mockStripe.accounts.create.mockResolvedValue(mockAccount);

      const result = await createConnectAccount({
        email: 'seamstress@example.com',
        country: 'US',
        business_type: 'individual',
      });

      expect(result.success).toBe(true);
      expect(result.accountId).toBe('acct_test123');
      expect(mockStripe.accounts.create).toHaveBeenCalledWith({
        type: 'standard',
        country: 'US',
        email: 'seamstress@example.com',
        business_type: 'individual',
        metadata: expect.objectContaining({
          platform: 'hemsy',
        }),
      });
    });

    it('should handle existing Connect account', async () => {
      // Mock existing account in database
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();
      // Rewire the chained single() to resolve with existing account
      const fromReturn = mockSupabase.from();
      const selectReturn = fromReturn.select();
      const eqReturn = selectReturn.eq();
      eqReturn.single.mockResolvedValue({
        data: { stripe_connect_account_id: 'acct_existing' },
        error: null,
      });

      const result = await createConnectAccount({
        email: 'seamstress@example.com',
        country: 'US',
        business_type: 'individual',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('createAccountLink', () => {
    it('should create onboarding link successfully', async () => {
      const mockAccountLink = {
        url: 'https://connect.stripe.com/setup/s/test123',
        expires_at: Math.floor(Date.now() / 1000) + 300,
      };

      const Stripe = require('stripe');
      const mockStripe = new Stripe();
      mockStripe.accountLinks.create.mockResolvedValue(mockAccountLink);

      const result = await createAccountLink({
        accountId: 'acct_test123',
        type: 'account_onboarding',
      });

      expect(result.success).toBe(true);
      expect(result.url).toBe(mockAccountLink.url);
      expect(mockStripe.accountLinks.create).toHaveBeenCalledWith({
        account: 'acct_test123',
        refresh_url: expect.stringContaining(
          '/settings/stripe-connect?refresh=true'
        ),
        return_url: expect.stringContaining(
          '/settings/stripe-connect?success=true'
        ),
        type: 'account_onboarding',
      });
    });
  });

  describe('getConnectAccountStatus', () => {
    it('should retrieve and sync account status', async () => {
      const mockAccount = {
        id: 'acct_test123',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        requirements: {
          currently_due: [],
          eventually_due: [],
          past_due: [],
          pending_verification: [],
        },
        capabilities: {
          card_payments: 'active',
          transfers: 'active',
        },
      };

      const Stripe = require('stripe');
      const mockStripe = new Stripe();
      mockStripe.accounts.retrieve.mockResolvedValue(mockAccount);

      const result = await getConnectAccountStatus('acct_test123');

      expect(result.success).toBe(true);
      expect(result.status).toEqual({
        id: 'acct_test123',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        requirements: {
          currently_due: [],
          eventually_due: [],
          past_due: [],
          pending_verification: [],
        },
        capabilities: {
          card_payments: 'active',
          transfers: 'active',
        },
      });
    });
  });
});
