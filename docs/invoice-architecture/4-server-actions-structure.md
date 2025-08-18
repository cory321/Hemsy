# Server Actions Structure for Invoice Management

_Last updated: January 2025_

## Overview

This document defines the comprehensive Server Actions architecture for Threadfolio's Invoice Management feature, following Next.js 15+ App Router patterns with a focus on type safety, error handling, and transaction integrity.

## Table of Contents

1. [Server Actions Architecture](#server-actions-architecture)
2. [Invoice Actions](#invoice-actions)
3. [Payment Actions](#payment-actions)
4. [Payment Link Actions](#payment-link-actions)
5. [Settings Actions](#settings-actions)
6. [Email Actions](#email-actions)
7. [Reporting Actions](#reporting-actions)
8. [Shared Utilities](#shared-utilities)
9. [Testing Patterns](#testing-patterns)

## Server Actions Architecture

### Core Principles

1. **Type Safety**: Full TypeScript with Zod validation
2. **Error Handling**: Consistent error patterns with user-friendly messages
3. **Authorization**: Shop-level access control on all actions
4. **Transactions**: Database operations wrapped in transactions
5. **Audit Trail**: All modifications logged for compliance

### Base Action Pattern

```typescript
// lib/actions/base.ts
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createServerAction<TInput, TOutput>(
  inputSchema: z.ZodSchema<TInput>,
  handler: (input: TInput, context: ActionContext) => Promise<TOutput>
): Promise<(input: TInput) => Promise<ActionResult<TOutput>>> {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    try {
      // Validate input
      const validatedInput = inputSchema.parse(input);

      // Get context
      const user = await getCurrentUser();
      if (!user) {
        return { success: false, error: 'Unauthorized' };
      }

      const supabase = createClient();
      const context: ActionContext = {
        userId: user.id,
        supabase,
      };

      // Execute handler
      const data = await handler(validatedInput, context);
      return { success: true, data };
    } catch (error) {
      console.error('Server action error:', error);

      if (error instanceof z.ZodError) {
        return { success: false, error: 'Invalid input data' };
      }

      if (error instanceof ActionError) {
        return { success: false, error: error.message };
      }

      return { success: false, error: 'An unexpected error occurred' };
    }
  };
}

export class ActionError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ActionError';
  }
}

interface ActionContext {
  userId: string;
  supabase: ReturnType<typeof createClient>;
}
```

## Invoice Actions

### Create Invoice

```typescript
// lib/actions/invoices.ts
'use server';

import { z } from 'zod';
import { createServerAction, ActionError } from './base';
import { InvoiceGenerator } from '@/lib/services/invoice/generator';
import type { Invoice } from '@/types';

const createInvoiceSchema = z.object({
  orderId: z.string().uuid(),
});

export const createInvoice = createServerAction(
  createInvoiceSchema,
  async ({ orderId }, { userId, supabase }) => {
    // Verify order ownership
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        *,
        shop:shops!inner(id, owner_user_id),
        client:clients!inner(*),
        garments!inner(
          *,
          garment_services(*, service:services(*))
        )
      `
      )
      .eq('id', orderId)
      .eq('shop.owner_user_id', userId)
      .single();

    if (orderError || !order) {
      throw new ActionError('Order not found');
    }

    // Check for existing unpaid invoice
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .single();

    if (existingInvoice) {
      throw new ActionError('Order already has an unpaid invoice');
    }

    // Calculate total
    const generator = new InvoiceGenerator();
    const invoiceData = await generator.generateFromOrder(order);

    // Create invoice in transaction
    const { data: invoice, error: invoiceError } = await supabase.rpc(
      'create_invoice_with_number',
      {
        p_shop_id: order.shop_id,
        p_order_id: orderId,
        p_client_id: order.client_id,
        p_amount_cents: invoiceData.amount_cents,
        p_line_items: invoiceData.line_items,
        p_description: invoiceData.description,
      }
    );

    if (invoiceError) {
      throw new ActionError('Failed to create invoice');
    }

    // Log creation
    await supabase.from('invoice_status_history').insert({
      invoice_id: invoice.id,
      new_status: 'pending',
      changed_by: userId,
      reason: 'Invoice created',
    });

    return invoice as Invoice;
  }
);
```

### Update Invoice Status

```typescript
const updateInvoiceStatusSchema = z.object({
  invoiceId: z.string().uuid(),
  status: z.enum(['pending', 'paid', 'cancelled']),
  reason: z.string().optional(),
});

export const updateInvoiceStatus = createServerAction(
  updateInvoiceStatusSchema,
  async ({ invoiceId, status, reason }, { userId, supabase }) => {
    // Get current invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, shop:shops!inner(owner_user_id)')
      .eq('id', invoiceId)
      .eq('shop.owner_user_id', userId)
      .single();

    if (error || !invoice) {
      throw new ActionError('Invoice not found');
    }

    // Validate status transition
    if (invoice.status === 'paid' && status !== 'paid') {
      throw new ActionError('Cannot change status of paid invoice');
    }

    if (invoice.status === 'cancelled') {
      throw new ActionError('Cannot change status of cancelled invoice');
    }

    // Update status
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', invoiceId);

    if (updateError) {
      throw new ActionError('Failed to update invoice status');
    }

    // Log status change
    await supabase.from('invoice_status_history').insert({
      invoice_id: invoiceId,
      previous_status: invoice.status,
      new_status: status,
      changed_by: userId,
      reason: reason || `Status changed to ${status}`,
    });

    return { ...invoice, status };
  }
);
```

### Get Invoice Details

```typescript
const getInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
});

export const getInvoice = createServerAction(
  getInvoiceSchema,
  async ({ invoiceId }, { userId, supabase }) => {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(
        `
        *,
        shop:shops!inner(id, name, owner_user_id),
        order:orders!inner(*),
        client:clients!inner(*),
        payments(*),
        payment_links(*)
      `
      )
      .eq('id', invoiceId)
      .eq('shop.owner_user_id', userId)
      .single();

    if (error || !invoice) {
      throw new ActionError('Invoice not found');
    }

    return invoice;
  }
);
```

### List Invoices

```typescript
const listInvoicesSchema = z.object({
  shopId: z.string().uuid().optional(),
  status: z.enum(['all', 'pending', 'paid', 'cancelled']).optional(),
  clientId: z.string().uuid().optional(),
  dateRange: z
    .object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    })
    .optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

export const listInvoices = createServerAction(
  listInvoicesSchema,
  async (
    { status, clientId, dateRange, page, pageSize },
    { userId, supabase }
  ) => {
    let query = supabase
      .from('invoices')
      .select(
        `
        *,
        client:clients!inner(first_name, last_name),
        order:orders!inner(id)
      `,
        { count: 'exact' }
      )
      .eq('shop.owner_user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: invoices, error, count } = await query;

    if (error) {
      throw new ActionError('Failed to fetch invoices');
    }

    return {
      invoices: invoices || [],
      totalCount: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
);
```

## Payment Actions

### Process Stripe Payment

```typescript
// lib/actions/payments.ts
'use server';

import { z } from 'zod';
import { createServerAction, ActionError } from './base';
import { PaymentIntentService } from '@/lib/services/stripe/payment-intents';

const processStripePaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  paymentMethodId: z.string().optional(),
  savePaymentMethod: z.boolean().default(false),
});

export const processStripePayment = createServerAction(
  processStripePaymentSchema,
  async (
    { invoiceId, paymentMethodId, savePaymentMethod },
    { userId, supabase }
  ) => {
    // Get invoice with validation
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, shop:shops!inner(*)')
      .eq('id', invoiceId)
      .eq('shop.owner_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (!invoice) {
      throw new ActionError('Invoice not found or already paid');
    }

    // Check shop has Stripe enabled
    const { data: settings } = await supabase
      .from('shop_settings')
      .select('stripe_enabled')
      .eq('shop_id', invoice.shop_id)
      .single();

    if (!settings?.stripe_enabled) {
      throw new ActionError('Stripe payments are not enabled for this shop');
    }

    // Create or retrieve payment intent
    const paymentService = new PaymentIntentService();
    let paymentIntent;

    // Check for existing payment record
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('stripe_payment_intent_id')
      .eq('invoice_id', invoiceId)
      .eq('payment_method', 'stripe')
      .eq('status', 'pending')
      .single();

    if (existingPayment?.stripe_payment_intent_id) {
      // Retrieve existing intent
      paymentIntent = await paymentService.retrievePaymentIntent(
        existingPayment.stripe_payment_intent_id
      );
    } else {
      // Create new payment intent
      paymentIntent = await paymentService.createPaymentIntent(invoice);

      // Record payment attempt
      await supabase.from('payments').insert({
        invoice_id: invoiceId,
        payment_method: 'stripe',
        amount_cents: invoice.amount_cents,
        status: 'pending',
        stripe_payment_intent_id: paymentIntent.id,
        stripe_metadata: {
          client_secret: paymentIntent.client_secret,
        },
      });
    }

    // Return client secret for frontend confirmation
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }
);
```

### Record Manual Payment

```typescript
const recordManualPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  paymentMethod: z.enum(['cash', 'external_pos']),
  externalReference: z.string().optional(),
  notes: z.string().optional(),
});

export const recordManualPayment = createServerAction(
  recordManualPaymentSchema,
  async (
    { invoiceId, paymentMethod, externalReference, notes },
    { userId, supabase }
  ) => {
    // Validate invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, shop:shops!inner(owner_user_id)')
      .eq('id', invoiceId)
      .eq('shop.owner_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (!invoice) {
      throw new ActionError('Invoice not found or already paid');
    }

    // Check payment method enabled
    const { data: settings } = await supabase
      .from('shop_settings')
      .select('cash_enabled, external_pos_enabled')
      .eq('shop_id', invoice.shop_id)
      .single();

    if (paymentMethod === 'cash' && !settings?.cash_enabled) {
      throw new ActionError('Cash payments are not enabled');
    }

    if (paymentMethod === 'external_pos' && !settings?.external_pos_enabled) {
      throw new ActionError('External POS payments are not enabled');
    }

    // Process payment in transaction
    const { error } = await supabase.rpc('process_manual_payment', {
      p_invoice_id: invoiceId,
      p_payment_method: paymentMethod,
      p_amount_cents: invoice.amount_cents,
      p_external_reference: externalReference,
      p_notes: notes,
      p_user_id: userId,
    });

    if (error) {
      throw new ActionError('Failed to record payment');
    }

    // Send receipt email
    await sendInvoiceReceipt(invoiceId);

    return { success: true };
  }
);
```

### Cancel Payment

```typescript
const cancelPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  reason: z.string(),
});

export const cancelPayment = createServerAction(
  cancelPaymentSchema,
  async ({ paymentId, reason }, { userId, supabase }) => {
    // Get payment with validation
    const { data: payment } = await supabase
      .from('payments')
      .select(
        `
        *,
        invoice:invoices!inner(
          id,
          shop:shops!inner(owner_user_id)
        )
      `
      )
      .eq('id', paymentId)
      .eq('invoice.shop.owner_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (!payment) {
      throw new ActionError('Payment not found or cannot be cancelled');
    }

    // Cancel Stripe payment intent if applicable
    if (
      payment.payment_method === 'stripe' &&
      payment.stripe_payment_intent_id
    ) {
      const paymentService = new PaymentIntentService();
      await paymentService.cancelPaymentIntent(
        payment.stripe_payment_intent_id
      );
    }

    // Update payment status
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        notes: reason,
      })
      .eq('id', paymentId);

    if (error) {
      throw new ActionError('Failed to cancel payment');
    }

    return { success: true };
  }
);
```

## Payment Link Actions

### Generate Payment Link

```typescript
// lib/actions/payment-links.ts
'use server';

import { z } from 'zod';
import { createServerAction, ActionError } from './base';
import { PaymentLinkService } from '@/lib/services/stripe/payment-links';

const generatePaymentLinkSchema = z.object({
  invoiceId: z.string().uuid(),
  expiresInHours: z.number().min(1).max(168).default(24), // Max 7 days
});

export const generatePaymentLink = createServerAction(
  generatePaymentLinkSchema,
  async ({ invoiceId, expiresInHours }, { userId, supabase }) => {
    // Get invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, shop:shops!inner(*), client:clients!inner(*)')
      .eq('id', invoiceId)
      .eq('shop.owner_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (!invoice) {
      throw new ActionError('Invoice not found or already paid');
    }

    // Check for active payment link
    const { data: activeLink } = await supabase
      .from('payment_links')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .single();

    if (activeLink) {
      return {
        url: activeLink.url,
        token: activeLink.token,
        expiresAt: activeLink.expires_at,
      };
    }

    // Generate new payment link
    const linkService = new PaymentLinkService();
    const { paymentLink, checkoutUrl } =
      await linkService.createPaymentLink(invoice);

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${token}`;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    // Save payment link
    const { error } = await supabase.from('payment_links').insert({
      invoice_id: invoiceId,
      token,
      stripe_payment_link_id: paymentLink.id,
      url: publicUrl,
      expires_at: expiresAt.toISOString(),
      status: 'active',
    });

    if (error) {
      throw new ActionError('Failed to save payment link');
    }

    return {
      url: publicUrl,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }
);
```

### Send Payment Link Email

```typescript
const sendPaymentLinkSchema = z.object({
  invoiceId: z.string().uuid(),
  recipientEmail: z.string().email().optional(),
  customMessage: z.string().optional(),
});

export const sendPaymentLink = createServerAction(
  sendPaymentLinkSchema,
  async (
    { invoiceId, recipientEmail, customMessage },
    { userId, supabase }
  ) => {
    // Get invoice with client
    const { data: invoice } = await supabase
      .from('invoices')
      .select(
        `
        *,
        shop:shops!inner(*),
        client:clients!inner(*)
      `
      )
      .eq('id', invoiceId)
      .eq('shop.owner_user_id', userId)
      .single();

    if (!invoice) {
      throw new ActionError('Invoice not found');
    }

    // Generate or get payment link
    const linkResult = await generatePaymentLink({ invoiceId });
    if (!linkResult.success) {
      throw new ActionError('Failed to generate payment link');
    }

    // Send email
    const emailService = new EmailService();
    const email = recipientEmail || invoice.client.email;

    await emailService.sendPaymentRequest({
      to: email,
      invoice,
      paymentUrl: linkResult.data.url,
      customMessage,
      expiresAt: linkResult.data.expiresAt,
    });

    return { success: true, emailSent: email };
  }
);
```

### Validate Payment Link

```typescript
const validatePaymentLinkSchema = z.object({
  token: z.string(),
});

export const validatePaymentLink = createServerAction(
  validatePaymentLinkSchema,
  async ({ token }, { supabase }) => {
    // No auth required - public endpoint
    const { data: link } = await supabase
      .from('payment_links')
      .select(
        `
        *,
        invoice:invoices!inner(
          *,
          shop:shops!inner(*),
          client:clients!inner(*)
        )
      `
      )
      .eq('token', token)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .single();

    if (!link) {
      throw new ActionError('Payment link is invalid or expired');
    }

    // Check if invoice already paid
    if (link.invoice.status === 'paid') {
      throw new ActionError('Invoice has already been paid');
    }

    return {
      invoice: link.invoice,
      expiresAt: link.expires_at,
      stripePaymentLinkId: link.stripe_payment_link_id,
    };
  }
);
```

## Settings Actions

### Update Payment Settings

```typescript
// lib/actions/settings.ts
'use server';

import { z } from 'zod';
import { createServerAction, ActionError } from './base';

const updatePaymentSettingsSchema = z.object({
  shopId: z.string().uuid(),
  settings: z.object({
    paymentRequiredBeforeService: z.boolean(),
    invoicePrefix: z.string().regex(/^[A-Z0-9-]{1,10}$/),
    stripeEnabled: z.boolean(),
    cashEnabled: z.boolean(),
    externalPosEnabled: z.boolean(),
  }),
});

export const updatePaymentSettings = createServerAction(
  updatePaymentSettingsSchema,
  async ({ shopId, settings }, { userId, supabase }) => {
    // Verify shop ownership
    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('id', shopId)
      .eq('owner_user_id', userId)
      .single();

    if (!shop) {
      throw new ActionError('Shop not found');
    }

    // Ensure at least one payment method is enabled
    if (
      !settings.stripeEnabled &&
      !settings.cashEnabled &&
      !settings.externalPosEnabled
    ) {
      throw new ActionError('At least one payment method must be enabled');
    }

    // Update or insert settings
    const { error } = await supabase.from('shop_settings').upsert(
      {
        shop_id: shopId,
        payment_required_before_service: settings.paymentRequiredBeforeService,
        invoice_prefix: settings.invoicePrefix,
        stripe_enabled: settings.stripeEnabled,
        cash_enabled: settings.cashEnabled,
        external_pos_enabled: settings.externalPosEnabled,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'shop_id',
      }
    );

    if (error) {
      throw new ActionError('Failed to update payment settings');
    }

    return { success: true };
  }
);
```

## Email Actions

### Send Invoice Receipt

```typescript
// lib/actions/emails.ts
'use server';

import { z } from 'zod';
import { createServerAction, ActionError } from './base';
import { EmailService } from '@/lib/services/email';

const sendInvoiceReceiptSchema = z.object({
  invoiceId: z.string().uuid(),
});

export const sendInvoiceReceipt = createServerAction(
  sendInvoiceReceiptSchema,
  async ({ invoiceId }, { userId, supabase }) => {
    // Get invoice with all relations
    const { data: invoice } = await supabase
      .from('invoices')
      .select(
        `
        *,
        shop:shops!inner(*),
        client:clients!inner(*),
        payments!inner(*)
      `
      )
      .eq('id', invoiceId)
      .eq('shop.owner_user_id', userId)
      .eq('status', 'paid')
      .single();

    if (!invoice) {
      throw new ActionError('Paid invoice not found');
    }

    // Get email template
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('shop_id', invoice.shop_id)
      .eq('template_type', 'invoice_receipt')
      .eq('is_active', true)
      .single();

    if (!template) {
      throw new ActionError('Email template not found');
    }

    // Send email
    const emailService = new EmailService();
    await emailService.sendFromTemplate({
      to: invoice.client.email,
      template,
      variables: {
        invoice_number: invoice.invoice_number,
        amount: formatCurrency(invoice.amount_cents),
        payment_date: formatDate(invoice.payments[0].processed_at),
        payment_method: formatPaymentMethod(invoice.payments[0].payment_method),
        client_name: `${invoice.client.first_name} ${invoice.client.last_name}`,
        shop_name: invoice.shop.name,
      },
    });

    return { success: true };
  }
);
```

### Update Email Templates

```typescript
const updateEmailTemplateSchema = z.object({
  shopId: z.string().uuid(),
  templateType: z.enum(['order_created', 'payment_request', 'invoice_receipt']),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  bodyText: z.string().min(1),
});

export const updateEmailTemplate = createServerAction(
  updateEmailTemplateSchema,
  async (
    { shopId, templateType, subject, bodyHtml, bodyText },
    { userId, supabase }
  ) => {
    // Verify shop ownership
    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('id', shopId)
      .eq('owner_user_id', userId)
      .single();

    if (!shop) {
      throw new ActionError('Shop not found');
    }

    // Extract variables used
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variablesUsed = [
      ...new Set(
        [
          ...subject.matchAll(variableRegex),
          ...bodyHtml.matchAll(variableRegex),
          ...bodyText.matchAll(variableRegex),
        ].map((match) => match[1])
      ),
    ];

    // Update template
    const { error } = await supabase.from('email_templates').upsert(
      {
        shop_id: shopId,
        template_type: templateType,
        subject,
        body_html: bodyHtml,
        body_text: bodyText,
        variables_used: variablesUsed,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'shop_id,template_type',
      }
    );

    if (error) {
      throw new ActionError('Failed to update email template');
    }

    return { success: true };
  }
);
```

## Reporting Actions

### Get Payment Analytics

```typescript
// lib/actions/reports.ts
'use server';

import { z } from 'zod';
import { createServerAction, ActionError } from './base';

const getPaymentAnalyticsSchema = z.object({
  shopId: z.string().uuid(),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const getPaymentAnalytics = createServerAction(
  getPaymentAnalyticsSchema,
  async ({ shopId, period, startDate, endDate }, { userId, supabase }) => {
    // Verify shop ownership
    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('id', shopId)
      .eq('owner_user_id', userId)
      .single();

    if (!shop) {
      throw new ActionError('Shop not found');
    }

    // Get payment data
    const { data: payments, error } = await supabase
      .from('payments')
      .select(
        `
        amount_cents,
        payment_method,
        processed_at,
        invoice:invoices!inner(shop_id)
      `
      )
      .eq('invoice.shop_id', shopId)
      .eq('status', 'completed')
      .gte('processed_at', startDate)
      .lte('processed_at', endDate);

    if (error) {
      throw new ActionError('Failed to fetch payment data');
    }

    // Aggregate data
    const analytics = {
      totalRevenue: payments.reduce((sum, p) => sum + p.amount_cents, 0),
      paymentCount: payments.length,
      averagePayment:
        payments.length > 0
          ? Math.round(
              payments.reduce((sum, p) => sum + p.amount_cents, 0) /
                payments.length
            )
          : 0,
      paymentMethodBreakdown: payments.reduce(
        (acc, p) => {
          acc[p.payment_method] = (acc[p.payment_method] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      revenueByPeriod: aggregateByPeriod(payments, period),
    };

    return analytics;
  }
);
```

### Export Invoice Report

```typescript
const exportInvoiceReportSchema = z.object({
  shopId: z.string().uuid(),
  format: z.enum(['csv', 'pdf']),
  filters: z.object({
    status: z.enum(['all', 'pending', 'paid', 'cancelled']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const exportInvoiceReport = createServerAction(
  exportInvoiceReportSchema,
  async ({ shopId, format, filters }, { userId, supabase }) => {
    // Verify shop ownership
    const { data: shop } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .eq('owner_user_id', userId)
      .single();

    if (!shop) {
      throw new ActionError('Shop not found');
    }

    // Build query
    let query = supabase
      .from('invoices')
      .select(
        `
        *,
        client:clients!inner(*),
        payments(*)
      `
      )
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data: invoices, error } = await query;

    if (error) {
      throw new ActionError('Failed to fetch invoice data');
    }

    // Generate report
    if (format === 'csv') {
      const csv = generateInvoiceCSV(invoices, shop);
      return {
        data: csv,
        filename: `invoices_${shop.name}_${Date.now()}.csv`,
        mimeType: 'text/csv',
      };
    } else {
      const pdf = await generateInvoicePDF(invoices, shop);
      return {
        data: pdf,
        filename: `invoices_${shop.name}_${Date.now()}.pdf`,
        mimeType: 'application/pdf',
      };
    }
  }
);
```

## Shared Utilities

### Database Stored Procedures

```sql
-- Function to create invoice with atomic number generation
CREATE OR REPLACE FUNCTION create_invoice_with_number(
  p_shop_id UUID,
  p_order_id UUID,
  p_client_id UUID,
  p_amount_cents INTEGER,
  p_line_items JSONB,
  p_description TEXT
) RETURNS invoices AS $$
DECLARE
  v_invoice invoices;
  v_settings shop_settings;
  v_invoice_number TEXT;
BEGIN
  -- Lock settings row to prevent concurrent number generation
  SELECT * INTO v_settings
  FROM shop_settings
  WHERE shop_id = p_shop_id
  FOR UPDATE;

  -- Generate next invoice number
  v_invoice_number := v_settings.invoice_prefix || '-' ||
    LPAD((v_settings.last_invoice_number + 1)::TEXT, 6, '0');

  -- Update last invoice number
  UPDATE shop_settings
  SET last_invoice_number = last_invoice_number + 1
  WHERE shop_id = p_shop_id;

  -- Create invoice
  INSERT INTO invoices (
    shop_id, order_id, client_id, invoice_number,
    amount_cents, line_items, description, status
  ) VALUES (
    p_shop_id, p_order_id, p_client_id, v_invoice_number,
    p_amount_cents, p_line_items, p_description, 'pending'
  ) RETURNING * INTO v_invoice;

  RETURN v_invoice;
END;
$$ LANGUAGE plpgsql;

-- Function to process manual payment
CREATE OR REPLACE FUNCTION process_manual_payment(
  p_invoice_id UUID,
  p_payment_method TEXT,
  p_amount_cents INTEGER,
  p_external_reference TEXT,
  p_notes TEXT,
  p_user_id TEXT
) RETURNS void AS $$
BEGIN
  -- Insert payment record
  INSERT INTO payments (
    invoice_id, payment_method, amount_cents,
    status, external_reference, notes, processed_at
  ) VALUES (
    p_invoice_id, p_payment_method, p_amount_cents,
    'completed', p_external_reference, p_notes, now()
  );

  -- Update invoice status
  UPDATE invoices
  SET status = 'paid', updated_at = now()
  WHERE id = p_invoice_id;

  -- Log status change
  INSERT INTO invoice_status_history (
    invoice_id, previous_status, new_status,
    changed_by, reason
  ) VALUES (
    p_invoice_id, 'pending', 'paid',
    p_user_id, 'Manual payment recorded'
  );
END;
$$ LANGUAGE plpgsql;
```

### Utility Functions

```typescript
// lib/utils/invoice.ts
export function formatInvoiceNumber(prefix: string, number: number): string {
  return `${prefix}-${number.toString().padStart(6, '0')}`;
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    stripe: 'Credit/Debit Card',
    cash: 'Cash',
    external_pos: 'External POS',
  };
  return methods[method] || method;
}

export function calculateDueDate(days: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// Aggregate payments by period
export function aggregateByPeriod(
  payments: Array<{ amount_cents: number; processed_at: string }>,
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
): Record<string, number> {
  return payments.reduce(
    (acc, payment) => {
      const date = new Date(payment.processed_at);
      let key: string;

      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          key = getWeekString(date);
          break;
        case 'month':
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        case 'quarter':
          key = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
      }

      acc[key] = (acc[key] || 0) + payment.amount_cents;
      return acc;
    },
    {} as Record<string, number>
  );
}
```

## Testing Patterns

### Server Action Testing

```typescript
// lib/actions/__tests__/invoices.test.ts
import { createInvoice, updateInvoiceStatus } from '../invoices';
import { createMockContext } from '@/tests/utils';

describe('Invoice Actions', () => {
  it('should create invoice with sequential number', async () => {
    const context = createMockContext({
      userId: 'user-123',
      shopId: 'shop-123',
    });

    const order = await createTestOrder(context);

    const result = await createInvoice({ orderId: order.id });

    expect(result.success).toBe(true);
    expect(result.data.invoice_number).toMatch(/^INV-\d{6}$/);
    expect(result.data.status).toBe('pending');
  });

  it('should prevent duplicate unpaid invoices', async () => {
    const context = createMockContext();
    const order = await createTestOrder(context);

    // Create first invoice
    await createInvoice({ orderId: order.id });

    // Attempt to create second invoice
    const result = await createInvoice({ orderId: order.id });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already has an unpaid invoice');
  });

  it('should enforce status transitions', async () => {
    const context = createMockContext();
    const invoice = await createTestInvoice(context, { status: 'paid' });

    const result = await updateInvoiceStatus({
      invoiceId: invoice.id,
      status: 'cancelled',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot change status of paid invoice');
  });
});
```

### Integration Testing

```typescript
// tests/integration/payment-flow.test.ts
describe('Payment Flow Integration', () => {
  it('should complete full payment flow', async () => {
    // Create invoice
    const invoice = await createInvoice({ orderId: testOrder.id });
    expect(invoice.success).toBe(true);

    // Process payment
    const payment = await processStripePayment({
      invoiceId: invoice.data.id,
    });
    expect(payment.success).toBe(true);
    expect(payment.data.clientSecret).toBeDefined();

    // Simulate webhook
    await simulateStripeWebhook('payment_intent.succeeded', {
      metadata: { invoice_id: invoice.data.id },
    });

    // Verify invoice updated
    const updated = await getInvoice({ invoiceId: invoice.data.id });
    expect(updated.data.status).toBe('paid');
  });
});
```

## Conclusion

This Server Actions architecture provides:

- **Type Safety**: Full TypeScript with runtime validation
- **Consistency**: Unified error handling and response patterns
- **Security**: Authorization checks on all operations
- **Reliability**: Transactional integrity and proper error recovery
- **Testability**: Clear patterns for unit and integration testing

The modular structure allows for easy maintenance and extension while maintaining the performance benefits of Next.js 15+ Server Actions.
