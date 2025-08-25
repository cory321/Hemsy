/**
 * Stripe configuration optimized for card-present transactions
 * Used by seamstresses processing payments in-person
 */

import type {
  StripeElementsOptions,
  StripeCardElementOptions,
} from '@stripe/stripe-js';

/**
 * Stripe Elements options for card-present transactions
 * Disables Link and other customer-facing features
 */
export const cardPresentElementsOptions: StripeElementsOptions = {
  // Appearance customization for POS environment
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#1976d2',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Ideal Sans, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
    rules: {
      '.Input': {
        fontSize: '18px', // Larger for better visibility
        padding: '12px',
      },
      '.Label': {
        fontSize: '16px',
        fontWeight: '500',
      },
    },
  },
  // Disable customer-facing features
  loader: 'auto',
  // Don't collect customer information
  mode: 'payment',
};

/**
 * Card Element options for POS environment
 */
export const cardPresentCardOptions: StripeCardElementOptions = {
  style: {
    base: {
      fontSize: '18px',
      color: '#424770',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: '#aab7c4',
      },
      iconColor: '#666EE8',
    },
    invalid: {
      iconColor: '#e25950',
      color: '#e25950',
    },
    complete: {
      iconColor: '#13ce66',
    },
  },
  // Card-present specific options
  hidePostalCode: false, // Keep for fraud protection
  disableLink: true, // Disable Link completely
  iconStyle: 'solid' as const,
};

/**
 * Payment Intent creation options for card-present
 */
export const cardPresentPaymentIntentOptions = {
  // No redirects in POS environment
  automatic_payment_methods: {
    enabled: true,
    allow_redirects: 'never' as const,
  },

  // Card-specific settings
  capture_method: 'automatic' as const, // Move to PaymentIntent level
  payment_method_options: {
    card: {
      request_three_d_secure: 'automatic' as const,
    },
  },

  // Metadata to identify card-present transactions
  metadata: {
    payment_context: 'card_present_merchant_assisted',
    merchant_present: 'true',
    pos_type: 'seamstress_shop',
  },

  // Statement descriptor for card payments (only suffix is supported)
  // Must contain at least one Latin character (a-z, A-Z)
  statement_descriptor_suffix: 'SHOP', // Will appear as "* SHOP" on customer's statement
};

/**
 * Recommended Stripe initialization for card-present
 */
export const stripeInitOptions = {
  // Don't include Link or other beta features
  betas: [] as string[],

  // Locale for better UX
  locale: 'en' as const,

  // API version
  apiVersion: '2023-10-16' as const,
};

/**
 * Security recommendations for card-present transactions
 */
export const securityGuidelines = {
  // Never store card data
  storeCardData: false,

  // Always use HTTPS
  requireHttps: true,

  // Session timeout (15 minutes)
  sessionTimeoutMs: 15 * 60 * 1000,

  // Clear sensitive data after transaction
  clearDataAfterTransaction: true,

  // Log transactions for audit
  logTransactions: true,
} as const;

/**
 * User experience recommendations
 */
export const uxRecommendations = {
  // Show clear payment amount
  displayAmount: true,

  // Show processing state
  showProcessingState: true,

  // Timeout for user action (2 minutes)
  userActionTimeoutMs: 2 * 60 * 1000,

  // Clear success message duration (5 seconds)
  successMessageDurationMs: 5 * 1000,

  // Auto-clear form after successful payment
  autoClearForm: true,
} as const;
