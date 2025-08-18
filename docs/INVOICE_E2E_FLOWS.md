# Invoice E2E Flows (Business Logic Only)

This document enumerates end-to-end flows for invoice management. It describes preconditions, inputs, expected state changes, side effects (emails, webhooks), and terminal statuses to guide future E2E tests.

Notes:

- Money values are in cents.
- Status values: invoices: pending | partially_paid | paid | cancelled | refunded; payments: pending | completed | failed | refunded | partially_refunded.
- Shop settings default: payment_required_before_service = true, invoice_prefix = "INV", last_invoice_number = 999, stripe_enabled = true, cash/external_pos disabled by default.
- One unpaid invoice per order is enforced.
- Atomic invoice numbering via DB function.

## 0) Shop Settings Initialization

- Preconditions: Shop exists; first access to settings.
- Action: Server action `getShopSettings()` auto-creates `shop_settings` with defaults if missing.
- Expected DB: `shop_settings` row created (with defaults above).

## 1) Create Order (Draft)

- Preconditions: Authenticated user; client exists; garments/services added to order.
- Action: Create order via existing flows (outside invoices scope).
- Expected DB: `orders` row with `is_paid=false`, typically `status='draft'` (UI behavior). Totals present.

## 2) Create Invoice From Order

- Preconditions: Order exists for shop; order has client; no existing unpaid invoice for the order.
- Inputs:
  - orderId (UUID)
  - optional: depositAmountCents ≥ 0, description, dueDate
- Action:
  - Build line items from garment services (name, qty, unit price, line total).
  - Call `create_invoice_with_number(...)`:
    - Locks `shop_settings` row
    - Increments `last_invoice_number` and composes `invoice_number` as `${invoice_prefix}-${NNNNNN}`
    - Inserts `invoices` row with status='pending'
  - Insert `invoice_status_history` (pending)
  - If `payment_required_before_service` is true, send "order_created" email (via `sendOrderCreatedEmail`)
- Expected DB:
  - `invoices` row created (pending, amount_cents, deposit_amount_cents, line_items JSON)
  - `invoice_status_history` row added
- Side effects: Email (order created) if configured.
- Errors:
  - Missing order or client → error
  - Another unpaid invoice exists for same order → error (trigger)

## 3) Generate Payment Link (Public)

- Preconditions: Invoice exists; status not in {paid, cancelled}
- Inputs: invoiceId, optional expiresInDays (default 7)
- Action:
  - Create `payment_links` row with token (uuid), url `${APP_URL}/pay/${token}`, expiry
  - Send "payment_request" email
- Expected DB:
  - `payment_links` row (status='active', expires_at in the future)
- Side effects: Email (payment request)
- Errors:
  - Invoice paid/cancelled → error

## 4) Public Payment Page Access

- Preconditions: Valid payment link token; not expired
- Action:
  - Resolve token via `getPaymentLinkByToken` (joins invoice, client, shop, payments)
  - If invoice.status is paid → render already-paid state
  - If invoice.status is cancelled → render error state
  - Otherwise, compute amount due (see §6) and (if needed) create PaymentIntent (see §5)
- Expected DB: None unless a new PaymentIntent is created (then §5 applies)
- Errors: Expired/invalid token → error view

## 5) Create PaymentIntent (Stripe)

- Preconditions: Invoice exists and is payable; Stripe enabled
- Inputs: invoiceId, paymentType ('deposit' | 'remainder' | 'full'), optional amountCents, optional returnUrl
- Amount selection logic:
  - If `amountCents` provided → use that
  - Else if paymentType='deposit' → amount = `deposit_amount_cents` (must be > 0)
  - Else if 'remainder' → amount = `invoice.amount_cents - sum(completed payments)`
  - Else if 'full' → amount = `invoice.amount_cents`
  - Validate amount > 0
- Action:
  - Create Stripe PaymentIntent with metadata: {invoice_id, invoice_number, shop_id, payment_type, client details}
  - Insert `payments` row with status='pending', `stripe_payment_intent_id`, `stripe_metadata.client_secret`
- Expected DB:
  - `payments` row created (pending)
- Side effects: Client secret returned to client to complete payment
- Errors:
  - Invoice paid/cancelled → error
  - Invalid amount (≤ 0) → error

## 6) Online Payment Succeeds (Webhook)

- Trigger: Stripe sends `payment_intent.succeeded`
- Action:
  - Find `payments` by `stripe_payment_intent_id`
  - Update payment: status='completed', set `processed_at`, enrich `stripe_metadata`
  - Recalculate `totalPaid = sum(completed payments)`
  - Update invoice status:
    - If totalPaid ≥ amount_cents → 'paid'
    - Else if totalPaid > 0 → 'partially_paid'
  - Insert `invoice_status_history` with previous/new status
  - If invoice fully paid and has `order_id` → update `orders`: `is_paid=true`, `paid_at=now`, `status='active'`
  - Send receipt email:
    - If this payment is deposit and invoice not fully paid → send `deposit_receipt`
    - If now fully paid → send `invoice_receipt`
- Expected DB:
  - `payments` updated to completed
  - `invoices` status updated, history logged
  - `orders` updated if fully paid
- Side effects: Emails sent

## 7) Online Payment Fails (Webhook)

- Trigger: Stripe sends `payment_intent.payment_failed`
- Action:
  - Update `payments` row to status='failed'; record failure reason in `stripe_metadata`
  - No change to invoice status
- Expected DB: Payment marked failed

## 8) Manual Payment Recording (Cash / External POS)

- Preconditions: Invoice exists; payable
- Inputs: invoiceId, paymentType ('deposit' | 'remainder' | 'full'), paymentMethod ('cash' | 'external_pos'), amountCents, optional externalReference, notes
- Action (via `process_manual_payment` DB function):
  - Insert `payments` row with status='completed'
  - Recalculate total paid and update invoice status as in §6
  - If fully paid and invoice has order → update `orders` (is_paid=true, paid_at, status='active')
- Expected DB:
  - New completed payment row
  - Invoice status updated, history logged
  - Order updated if fully paid
- Side effects: No automatic email for manual payments in current implementation

## 9) Cancel Invoice

- Preconditions: Invoice exists; status not 'paid'; not already 'cancelled'
- Inputs: invoiceId, optional reason
- Action:
  - Update invoice status to 'cancelled'; set `updated_at`
  - Insert `invoice_status_history` with reason
- Expected DB: Invoice cancelled; history logged
- Errors: Attempt to cancel paid invoice → error

## 10) Refund Payment (Stripe)

- Preconditions: Payment exists; status='completed'; payment_method='stripe'
- Inputs: paymentId, optional amountCents (≤ payment.amount_cents), optional reason
- Action:
  - Create Stripe refund (full/partial)
  - Update payment status to 'refunded' (full) or 'partially_refunded' (partial); record refund info in `stripe_metadata`
  - Re-evaluate total paid for invoice:
    - If totalPaid == 0 → invoice status 'pending'
    - Else if totalPaid < amount_cents → 'partially_paid'
  - If status changes → insert `invoice_status_history`
- Expected DB: Payment updated; invoice status potentially updated; history logged

## 11) Payment Link Expiration

- Preconditions: `payment_links.expires_at` < now
- Action:
  - Public access via token fails (link considered invalid)
  - No DB change
- Expected: Public page shows error; no payment actions allowed

## 12) Duplicate Webhook Handling

- Trigger: Same Stripe event delivered more than once
- Action:
  - Insert into `stripe_webhook_events` (unique constraint on event_id prevents duplicates)
  - If duplicate insert fails with unique violation → skip processing
- Expected DB: At most one record per event id; idempotent processing

## 13) Guardrails / Constraints

- Only one unpaid invoice per order (trigger `enforce_single_unpaid_invoice`)
- Prevent changing amounts on fully paid invoice (trigger `protect_paid_invoices`)
- Generate invoice numbers atomically under concurrency (`create_invoice_with_number`)

## 14) Emails (Automated)

- On invoice creation (if payment before service): send `order_created`
- On payment link generation: send `payment_request`
- On deposit payment (not fully paid): send `deposit_receipt`
- On full payment: send `invoice_receipt`
- Emails respect client preference `clients.accept_email`

## 15) Order State and Payment Before Service

- Default behavior: order is considered on hold until fully paid
  - When fully paid via any method → order `is_paid=true`, `status='active'`
  - Deposit alone does not currently change order status (future enhancement could allow work start on deposit)

## 16) Error Scenarios (Non-exhaustive)

- PaymentIntent creation for paid/cancelled invoice → error
- PaymentIntent with computed amount ≤ 0 → error
- Generate payment link for paid/cancelled invoice → error
- Cancel a paid invoice → error
- Public payment link invalid/expired → error screen

## 17) Observability (Suggested E2E Checks)

- Verify DB transitions for `invoices`, `payments`, `invoice_status_history`, `orders`
- Verify emails are logged in `email_logs` (status sent)
- Verify `stripe_webhook_events` tracks unique events
- Verify `payment_links` created and invalidated by expiry

## 18) Not Yet Implemented (Backlog)

- Auto-cancel unpaid invoices/orders after X days following failed payment
- Tax calculation (explicitly deferred for MVP)
- Payment method toggles beyond Stripe (UI-level enablement)
- Reminders / dunning flow

---

This document captures the business logic paths suitable for E2E test planning across creation → payment → webhook → status updates → receipts → refunds → cancellation and public payment links.
