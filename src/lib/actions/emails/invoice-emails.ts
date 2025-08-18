'use server';

import { z } from 'zod';
import { Resend } from 'resend';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '../users';
import { getShopDisplayName } from '@/lib/utils/shop';
import type { Tables } from '@/types/supabase';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Validation schemas
const SendInvoiceEmailSchema = z.object({
  invoiceId: z.string().uuid(),
  emailType: z.enum([
    'order_created',
    'payment_request',
    'invoice_receipt',
    'deposit_receipt',
  ]),
});

const EmailContentSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
  text: z.string(),
});

// Template variable types
interface InvoiceEmailVariables {
  // Client info
  client_name: string;
  client_email: string;
  client_phone: string;

  // Shop info
  shop_name: string;
  shop_email?: string;
  shop_phone?: string;
  shop_address?: string;

  // Invoice info
  invoice_number: string;
  invoice_date: string;
  invoice_amount: string;
  deposit_amount?: string;
  remaining_amount?: string;
  due_date?: string;

  // Order info
  order_number: string;
  order_total: string;
  expected_completion?: string;

  // Payment info
  payment_amount?: string;
  payment_date?: string;
  payment_method?: string;
  payment_link?: string;

  // Conditional flags
  deposit_required?: boolean;
  payment_required_before_service?: boolean;
}

/**
 * Replace template variables in content
 */
function replaceTemplateVariables(
  template: string,
  variables: InvoiceEmailVariables
): string {
  let content = template;

  // Replace simple variables
  Object.entries(variables).forEach(([key, value]) => {
    if (typeof value === 'string') {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
  });

  // Handle conditional blocks {{#if variable}}...{{/if}}
  content = content.replace(
    /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g,
    (match, variable, block) => {
      return variables[variable as keyof InvoiceEmailVariables] ? block : '';
    }
  );

  return content;
}

/**
 * Format currency amount
 */
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/**
 * Format date
 */
function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Get email template
 */
async function getEmailTemplate(
  shopId: string,
  templateType: string
): Promise<Tables<'invoice_email_templates'> | null> {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('invoice_email_templates')
    .select('*')
    .eq('shop_id', shopId)
    .eq('template_type', templateType)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching email template:', error);
    return null;
  }

  return data;
}

/**
 * Get invoice with full details for email
 */
async function getInvoiceForEmail(invoiceId: string) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('invoices')
    .select(
      `
      *,
      client:clients(*),
      order:orders(*),
      shop:shops(*),
      payments(*),
      shop_settings!inner(*)
    `
    )
    .eq('id', invoiceId)
    .single();

  if (error || !data) {
    throw new Error('Invoice not found');
  }

  return data;
}

/**
 * Build email variables from invoice data
 */
function buildEmailVariables(
  invoice: any,
  paymentLink?: string
): InvoiceEmailVariables {
  const totalPaid =
    invoice.payments
      ?.filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + p.amount_cents, 0) || 0;

  const remainingAmount = invoice.amount_cents - totalPaid;
  const lastPayment = invoice.payments
    ?.filter((p: any) => p.status === 'completed')
    .sort(
      (a: any, b: any) =>
        new Date(b.processed_at).getTime() - new Date(a.processed_at).getTime()
    )[0];

  return {
    // Client info
    client_name: `${invoice.client.first_name} ${invoice.client.last_name}`,
    client_email: invoice.client.email as any,
    client_phone: invoice.client.phone_number as any,

    // Shop info
    shop_name: getShopDisplayName(invoice.shop),
    shop_email: invoice.shop.email as any,
    shop_phone: invoice.shop.phone_number as any,
    shop_address: invoice.shop.mailing_address as any,

    // Invoice info
    invoice_number: invoice.invoice_number as any,
    invoice_date: formatDate(invoice.created_at),
    invoice_amount: formatCurrency(invoice.amount_cents),
    deposit_amount: invoice.deposit_amount_cents
      ? formatCurrency(invoice.deposit_amount_cents)
      : '',
    remaining_amount:
      remainingAmount > 0 ? formatCurrency(remainingAmount) : undefined,
    due_date: invoice.due_date ? formatDate(invoice.due_date) : undefined,

    // Order info
    order_number: invoice.order.order_number,
    order_total: formatCurrency(invoice.order.total_cents),
    expected_completion: invoice.order.order_due_date
      ? formatDate(invoice.order.order_due_date)
      : undefined,

    // Payment info
    payment_amount: lastPayment ? formatCurrency(lastPayment.amount_cents) : '',
    payment_date: lastPayment ? formatDate(lastPayment.processed_at) : '',
    payment_method: lastPayment?.payment_method,
    payment_link: paymentLink,

    // Conditional flags
    deposit_required: invoice.deposit_amount_cents > 0 && totalPaid === 0,
    payment_required_before_service: invoice.shop_settings[0]
      ?.payment_required_before_service as any,
  } as any;
}

/**
 * Send invoice email
 */
export async function sendInvoiceEmail(
  params: z.infer<typeof SendInvoiceEmailSchema>
) {
  try {
    const { shop, user } = await ensureUserAndShop();
    const validated = SendInvoiceEmailSchema.parse(params);
    const supabase = await createSupabaseClient();

    // Get invoice details
    const invoice = await getInvoiceForEmail(validated.invoiceId);

    // Verify invoice belongs to shop
    if (invoice.shop_id !== shop.id) {
      throw new Error('Invoice not found');
    }

    // Check if client accepts emails
    if (!invoice.client.accept_email) {
      return {
        success: false,
        error: 'Client has opted out of email communications',
      };
    }

    // Get email template
    const template = await getEmailTemplate(shop.id, validated.emailType);
    if (!template) {
      throw new Error('Email template not found');
    }

    // Generate payment link if needed
    let paymentLink: string | undefined;
    if (
      validated.emailType === 'payment_request' &&
      invoice.status !== 'paid'
    ) {
      const { data: linkData } = await supabase
        .from('payment_links')
        .select('url')
        .eq('invoice_id', invoice.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      paymentLink = linkData?.url;
    }

    // Build template variables
    const variables = buildEmailVariables(invoice, paymentLink);

    // Replace variables in template
    const subject = replaceTemplateVariables(template.subject, variables);
    const htmlBody = replaceTemplateVariables(template.body_html, variables);
    const textBody = replaceTemplateVariables(template.body_text, variables);

    // Send email via Resend
    const emailOptions: any = {
      from: `${getShopDisplayName(shop)} <${process.env.RESEND_FROM_EMAIL || 'noreply@threadfolio.com'}>`,
      to: invoice.client.email,
      subject,
      html: htmlBody,
      text: textBody,
    };

    if (shop.email) {
      emailOptions.replyTo = shop.email;
    }

    const { data: emailData, error: sendError } =
      await resend.emails.send(emailOptions);

    if (sendError) {
      console.error('Error sending email:', sendError);
      throw new Error('Failed to send email');
    }

    // Log email
    await supabase.from('email_logs').insert({
      email_type: `invoice_${validated.emailType}`,
      recipient_email: invoice.client.email,
      recipient_name: `${invoice.client.first_name} ${invoice.client.last_name}`,
      subject,
      body: htmlBody,
      status: 'sent',
      resend_id: emailData?.id,
      created_by: user.id,
      sent_at: new Date().toISOString(),
      metadata: {
        invoice_id: invoice.id,
        template_id: template.id,
        payment_link: paymentLink,
      },
    });

    return { success: true, data: { emailId: emailData?.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(', '),
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send order created email with invoice
 */
export async function sendOrderCreatedEmail(invoiceId: string) {
  return sendInvoiceEmail({
    invoiceId,
    emailType: 'order_created',
  });
}

/**
 * Send payment request email
 */
export async function sendPaymentRequestEmail(invoiceId: string) {
  return sendInvoiceEmail({
    invoiceId,
    emailType: 'payment_request',
  });
}

/**
 * Send invoice receipt email
 */
export async function sendInvoiceReceiptEmail(invoiceId: string) {
  return sendInvoiceEmail({
    invoiceId,
    emailType: 'invoice_receipt',
  });
}

/**
 * Send deposit receipt email
 */
export async function sendDepositReceiptEmail(invoiceId: string) {
  return sendInvoiceEmail({
    invoiceId,
    emailType: 'deposit_receipt',
  });
}

/**
 * Preview invoice email
 */
export async function previewInvoiceEmail(
  invoiceId: string,
  emailType: string
) {
  try {
    const { shop } = await ensureUserAndShop();

    // Get invoice details
    const invoice = await getInvoiceForEmail(invoiceId);

    // Verify invoice belongs to shop
    if (invoice.shop_id !== shop.id) {
      throw new Error('Invoice not found');
    }

    // Get email template
    const template = await getEmailTemplate(shop.id, emailType);
    if (!template) {
      throw new Error('Email template not found');
    }

    // Build template variables
    const variables = buildEmailVariables(invoice);

    // Replace variables in template
    const subject = replaceTemplateVariables(template.subject, variables);
    const htmlBody = replaceTemplateVariables(template.body_html, variables);
    const textBody = replaceTemplateVariables(template.body_text, variables);

    return {
      success: true,
      data: {
        to: invoice.client.email,
        subject,
        html: htmlBody,
        text: textBody,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to preview email',
    };
  }
}
