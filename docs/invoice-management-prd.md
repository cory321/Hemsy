# Hemsy Invoice Management Feature - Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Enable seamstresses to collect payments from clients through multiple payment methods (Stripe, cash, external POS)
- Support flexible payment timing models (before service or after service completion) based on business preferences
- Automate invoice generation and payment tracking linked to orders
- Provide professional payment communication through automated emails
- Create a seamless payment experience for both seamstresses and their clients
- Ensure payment records are properly tracked for business financial management

### Background Context

Hemsy is a mobile-first PWA for seamstresses and tailoring businesses that currently manages clients, orders, garments, and appointments. The Invoice Management feature addresses a critical gap in the business workflow - the ability to collect payments professionally and efficiently. Currently, seamstresses must manage payments outside the system, leading to disconnected financial records and manual payment tracking. This feature integrates payment collection directly into the order workflow, supporting both business models where payment is required upfront (common for custom work) and where payment is collected after service completion (common for alterations). By leveraging Stripe for online payments while also supporting cash and external POS systems, we accommodate the diverse payment preferences of small tailoring businesses.

### Change Log

| Date  | Version | Description                                | Author |
| ----- | ------- | ------------------------------------------ | ------ |
| Today | 1.0     | Initial PRD for Invoice Management Feature | PM     |

## Requirements

### Functional

- **FR1:** The system shall generate invoices automatically from orders with sequential invoice numbers per shop (e.g., INV-001000)
- **FR2:** The system shall support payment collection through Stripe (credit/debit cards), cash, and external POS systems
- **FR3:** The system shall enforce shop-level payment timing preferences: payment required before service OR payment required after service completion
- **FR4:** The system shall generate and send payment links via email that expire after 24 hours for remote payment collection
- **FR5:** The system shall prevent creation of multiple unpaid invoices for a single order
- **FR6:** The system shall automatically mark invoices as paid upon successful Stripe payment confirmation via webhook
- **FR7:** The system shall send automated email receipts to clients after successful payment
- **FR8:** The system shall display invoice status (pending, paid, cancelled) on both order details and invoice list views
- **FR9:** The system shall link all invoices to their associated orders with bidirectional navigation
- **FR10:** The system shall provide a public payment page accessible via payment link without authentication
- **FR11:** The system shall support manual marking of invoices as paid for cash and external POS transactions
- **FR12:** The system shall calculate invoice amounts based on current order totals including all garments and services

### Non Functional

- **NFR1:** Payment processing shall complete within 3 seconds for optimal user experience
- **NFR2:** The system shall maintain PCI compliance by never storing credit card information directly
- **NFR3:** Payment links shall use cryptographically secure tokens to prevent unauthorized access
- **NFR4:** The system shall handle concurrent payment attempts with proper locking to prevent double payments
- **NFR5:** All payment operations shall be wrapped in database transactions to ensure data consistency
- **NFR6:** The public payment page shall be mobile-responsive and load within 2 seconds
- **NFR7:** The system shall provide graceful error handling with user-friendly messages for payment failures
- **NFR8:** Invoice data shall be retained indefinitely for financial record keeping
- **NFR9:** The system shall support USD currency only for MVP implementation
- **NFR10:** All payment-related actions shall be logged for audit trail purposes

## User Interface Design Goals

### Overall UX Vision

The invoice interface should seamlessly integrate into Hemsy's existing mobile-first design, maintaining consistency with the current order and client management flows. The payment experience should feel professional yet approachable, building trust through clear communication of payment status and security indicators. The interface should minimize cognitive load by presenting payment options contextually - showing relevant actions based on payment timing settings and current invoice state.

### Key Interaction Paradigms

- **Contextual Actions**: Payment buttons appear intelligently based on shop settings and order state
- **Progressive Disclosure**: Complex payment details revealed only when needed
- **Status-Driven UI**: Visual indicators (colors, badges, icons) clearly communicate invoice and payment states
- **Mobile-First Touch Targets**: All payment actions optimized for thumb reach on mobile devices
- **Inline Confirmations**: Success/error states shown immediately without page navigation
- **Quick Actions**: One-tap access to common tasks like sending payment links or marking as paid

### Core Screens and Views

- **Order Detail Enhancement**: Payment section added showing invoice status and action buttons
- **Invoice List View**: Filterable list of all invoices with status badges
- **Invoice Detail View**: Complete invoice information with payment history
- **Payment Collection Modal**: In-app Stripe card collection interface
- **Mark as Paid Dialog**: Confirmation interface for manual payment recording
- **Payment Link Generator**: Interface to create and send payment request emails
- **Public Payment Page**: Client-facing Stripe checkout for payment links
- **Payment Success/Error Pages**: Clear confirmation of payment outcomes

### Accessibility: WCAG AA

Following Hemsy's existing accessibility standards, ensuring all payment interfaces are screen reader compatible, keyboard navigable, and provide sufficient color contrast for payment status indicators.

### Branding

Maintain Hemsy's existing visual design system with its professional yet warm aesthetic tailored for seamstresses. Payment interfaces should feel trustworthy while staying consistent with the app's existing color palette, typography, and component library.

### Target Device and Platforms: Web Responsive

Mobile-first responsive design optimized for smartphones (primary use case) while providing full functionality on tablets and desktops. Special attention to touch-friendly payment forms and readable invoice displays on small screens.

## Technical Assumptions

### Repository Structure: Monorepo

The invoice feature will be developed within Hemsy's existing monorepo structure, maintaining consistency with the current codebase organization.

### Service Architecture

**Monolith with Server Actions** - The invoice feature will follow Hemsy's existing architecture pattern using Next.js 15+ App Router with Server Actions for backend logic. All invoice operations (creation, payment processing, status updates) will be implemented as Server Actions, maintaining the pattern of server-side business logic with client-side UI components.

### Testing Requirements

**Full Testing Pyramid** - Following Hemsy's mandatory testing requirements:

- Unit tests for all invoice components and business logic (minimum 80% coverage)
- Integration tests for Stripe webhook handling and invoice Server Actions
- E2E tests for complete payment flows using Playwright
- Accessibility tests for payment interfaces using axe-core

### Additional Technical Assumptions and Requests

- **Framework Stack**: Next.js 15+ (App Router), TypeScript (strict mode), Material UI v5+, maintaining consistency with existing Hemsy tech stack
- **Database**: Supabase with Row Level Security (RLS) policies for invoice data isolation between shops
- **Authentication**: Clerk Auth for shop owner authentication, with public routes for payment links
- **Payment Processing**: Stripe integration using Payment Links API and Payment Intents API for MVP simplicity
- **State Management**: React Query for invoice data fetching and optimistic updates
- **Email Service**: Integration with existing Hemsy email system (Resend) for payment notifications
- **Environment Management**: Separate Stripe keys for development/staging/production environments
- **Error Monitoring**: Integration with existing error tracking system for payment failure monitoring
- **API Design**: RESTful Server Actions following existing Hemsy patterns with proper TypeScript typing
- **Mobile Optimization**: Touch-optimized payment forms using Material UI components
- **Offline Handling**: Graceful degradation for payment operations when offline
- **Security**: HTTPS-only for all payment pages, secure webhook signature verification

## Epic List

**Epic 1: Invoice Infrastructure & Basic Payment Setup**
_Establish core invoice data model, Stripe integration, and basic invoice creation from orders_

**Epic 2: Payment After Service Flow**
_Implement complete payment collection for post-service model including email notifications_

**Epic 3: Payment Before Service Flow**
_Add upfront payment collection during order creation flow_

**Epic 4: Financial Reporting & Analytics**
_Provide payment insights, reporting, and financial analytics for business management_

## Epic 1: Invoice Infrastructure & Basic Payment Setup

**Epic Goal:** Establish the foundational invoice system by creating the data model, integrating Stripe for payment processing, and enabling basic invoice generation from orders. This epic delivers the core infrastructure that all payment features will build upon, while also providing immediate value through manual invoice creation and tracking capabilities.

### Story 1.1: Project Setup and Invoice Data Model

**As a** developer,  
**I want** to set up the invoice infrastructure and database schema,  
**so that** we have a solid foundation for all invoice operations.

#### Acceptance Criteria

1: Database migrations created for invoice tables (invoices, payments) with proper Supabase RLS policies
2: TypeScript types generated for all invoice-related database tables
3: Invoice number generation logic implemented with shop-specific sequential numbering
4: Server Actions created for basic invoice CRUD operations (create, read, update)
5: Unit tests written for invoice number generation and basic operations
6: Shop settings updated to include payment preferences fields

### Story 1.2: Stripe Integration Foundation

**As a** developer,  
**I want** to integrate Stripe SDK and webhook infrastructure,  
**so that** we can process payments securely.

#### Acceptance Criteria

1: Stripe SDK integrated with proper TypeScript types
2: Environment variables configured for Stripe keys (publishable and secret)
3: Webhook endpoint created at /api/webhooks/stripe with signature verification  
4: Basic webhook event handlers for payment_intent.succeeded and checkout.session.completed
5: Error handling and logging implemented for Stripe operations
6: Integration tests written for webhook signature verification

### Story 1.3: Basic Invoice Creation from Orders

**As a** seamstress,  
**I want** to create invoices from orders,  
**so that** I can track payment requirements for my work.

#### Acceptance Criteria

1: Create Invoice button appears on order detail page when no unpaid invoice exists
2: Clicking button generates invoice with correct amount from order total
3: Invoice displays with status badge (pending/paid) on order detail page
4: Invoice number shown using shop's prefix and sequential numbering
5: Navigation link from order to invoice detail page functions correctly
6: Server Action validates order state before creating invoice
7: Error messages display clearly if invoice creation fails

### Story 1.4: Invoice List and Detail Views

**As a** seamstress,  
**I want** to view all my invoices and their details,  
**so that** I can track my payment status.

#### Acceptance Criteria

1: Invoice list page accessible from main navigation showing all shop invoices
2: List displays invoice number, client name, amount, status, and creation date
3: Status badges clearly distinguish between pending, paid, and cancelled invoices
4: Clicking invoice navigates to detailed view with full information
5: Invoice detail shows associated order with navigation link back
6: List supports pagination for shops with many invoices
7: Basic filtering by status (All, Pending, Paid) implemented

### Story 1.5: Payment Settings Configuration

**As a** shop owner,  
**I want** to configure my payment preferences,  
**so that** the system matches my business model.

#### Acceptance Criteria

1: Payment Preferences section added to Settings page
2: Toggle for "Payment required after service completion" (default for Epic 2)
3: Payment method checkboxes for Stripe, Cash, and External POS
4: Invoice prefix customization field with validation for alphanumeric characters
5: Starting invoice number field with validation for positive integers
6: Settings save successfully and persist across sessions
7: Settings changes apply immediately to new invoices

## Epic 2: Payment After Service Flow

**Epic Goal:** Implement the complete payment collection workflow for businesses that collect payment after service completion. This epic delivers the ability to create orders without upfront payment, send payment requests when work is complete, and process payments through multiple methods including automated email communications for a professional client experience.

### Story 2.1: Order Creation Without Payment Requirement

**As a** seamstress using payment-after-service model,  
**I want** to create orders without requiring immediate payment,  
**so that** I can start work right away and collect payment when finished.

#### Acceptance Criteria

1: Order creation flow completes successfully without payment step when payment_required_before_service is false
2: Order status sets to "confirmed" immediately after creation
3: Order summary page shows "Payment will be collected after service" message
4: No invoice is automatically created during order creation
5: "Order Created" email automatically sent to client with order details
6: Email includes order summary and expected completion date
7: Order creation follows existing validation rules for garments and services

### Story 2.2: Email Template System for Invoices

**As a** shop owner,  
**I want** to customize email templates for payment communications,  
**so that** my clients receive professional, branded messages.

#### Acceptance Criteria

1: Three new email templates added to Settings > Emails: order_created, payment_request, invoice_receipt
2: Templates include default content with placeholder variables for dynamic data
3: Template editor supports preview with sample data
4: Templates save successfully and validate required variables
5: Email sending service integrated with existing Hemsy email system (Resend)
6: Server Actions created for sending each email type with proper data injection
7: Email send failures logged with appropriate error handling

### Story 2.3: Payment Link Generation and Sending

**As a** seamstress,  
**I want** to send payment links to clients via email,  
**so that** they can pay remotely at their convenience.

#### Acceptance Criteria

1: "Send Payment Link" button appears on unpaid invoices
2: Clicking button shows confirmation dialog with client email pre-filled
3: Payment link generated through Stripe Payment Links API with 24-hour expiration
4: Email sent using payment_request template with clickable payment button
5: Payment link URL saved to invoice record for reference
6: Success toast confirms "Payment link sent to [client email]"
7: Error handling for expired Stripe sessions or invalid email addresses

### Story 2.4: Public Payment Page Experience

**As a** client,  
**I want** to pay my invoice through a secure link,  
**so that** I can complete payment conveniently online.

#### Acceptance Criteria

1: Payment link opens public page at /pay/[token] without authentication required
2: Page displays invoice details including amount, invoice number, and service description
3: Stripe payment form embedded with credit/debit card fields
4: Mobile-responsive design with touch-optimized inputs
5: Clear security indicators (HTTPS, Stripe branding) visible
6: Success page shows after payment with receipt information
7: Error page displays for expired or invalid payment links

### Story 2.5: Payment Confirmation and Status Updates

**As a** seamstress,  
**I want** invoice status to update automatically when payment is received,  
**so that** I can track payments without manual work.

#### Acceptance Criteria

1: Stripe webhook processes checkout.session.completed events successfully
2: Invoice status updates to "paid" with payment timestamp recorded
3: Payment method and transaction ID stored for reference
4: Order detail page reflects updated payment status immediately
5: Invoice receipt email automatically sent to client upon payment
6: Receipt includes payment method, amount, and transaction date
7: Webhook processing includes retry logic for transient failures

### Story 2.6: Manual Payment Recording

**As a** seamstress,  
**I want** to mark invoices as paid for cash or external POS payments,  
**so that** all payments are tracked in the system.

#### Acceptance Criteria

1: "Mark as Paid" button appears on unpaid invoices for in-person scenarios
2: Clicking button opens dialog with payment method selection (Cash/External POS)
3: Optional notes field available for reference number or details
4: Confirmation required before marking paid with clear warning
5: Invoice status updates to "paid" with manual payment method recorded
6: Receipt email sent to client if email address exists
7: Audit log entry created for manual payment recording

### Story 2.7: Complete Payment After Service E2E Testing

**As a** developer,  
**I want** comprehensive end-to-end tests for the payment-after-service flow,  
**so that** we ensure reliability of the complete payment journey.

#### Acceptance Criteria

1: E2E test covers order creation through payment completion via payment link
2: Test verifies email delivery at each step (order created, payment request, receipt)
3: Test includes both successful payment and payment failure scenarios
4: Mobile viewport testing ensures responsive design works correctly
5: Test covers manual payment marking flow
6: Performance benchmarks verified (page load < 2s, payment processing < 3s)
7: Accessibility testing confirms WCAG AA compliance for payment pages

## Epic 3: Payment Before Service Flow

**Epic Goal:** Add the ability to collect payment upfront during order creation for shops that require payment before beginning work. This epic builds upon the existing payment infrastructure to integrate payment collection seamlessly into the order creation workflow, ensuring shops get paid before investing time in custom work.

### Story 3.1: Payment Step in Order Creation Flow

**As a** seamstress requiring upfront payment,  
**I want** payment collection integrated into order creation,  
**so that** I receive payment before beginning work.

#### Acceptance Criteria

1: When payment_required_before_service is true, order flow shows payment step after order summary
2: Payment step displays total amount due clearly with itemized breakdown
3: "Generate Invoice & Collect Payment" button appears instead of "Create Order"
4: Invoice automatically created with order details when entering payment step
5: Order remains in "draft" status until payment is completed
6: Back button allows returning to modify order before payment
7: Clear messaging indicates payment is required to confirm order

### Story 3.2: In-App Stripe Payment Collection

**As a** seamstress,  
**I want** to collect credit card payments during order creation,  
**so that** clients can pay immediately while placing their order.

#### Acceptance Criteria

1: "Pay with Card" option displays Stripe Elements form inline
2: Card form includes number, expiration, CVC, and postal code fields
3: Form validates card details with real-time error messages
4: Payment processes using Stripe Payment Intents API
5: Loading state displays during payment processing with clear feedback
6: 3D Secure authentication handled automatically when required
7: Payment errors display clearly with option to try different card

### Story 3.3: Cash and External POS Payment Options

**As a** seamstress,  
**I want** to record cash or external POS payments during order creation,  
**so that** I can accommodate clients who prefer these payment methods.

#### Acceptance Criteria

1: Payment method selector shows available options based on shop settings
2: Selecting "Cash" shows confirmation dialog with payment amount
3: Selecting "External POS" allows entry of transaction reference number
4: "Mark as Paid" button requires explicit confirmation
5: Order status updates to "confirmed" upon manual payment recording
6: Payment method clearly recorded on invoice for reference
7: Timestamp captured for when payment was marked as received

### Story 3.4: Payment Success and Order Confirmation

**As a** seamstress,  
**I want** orders to confirm automatically after successful payment,  
**so that** the workflow continues smoothly.

#### Acceptance Criteria

1: Successful payment immediately updates invoice status to "paid"
2: Order status changes from "draft" to "confirmed" automatically
3: Success page displays with order number and payment confirmation
4: Invoice receipt email sent automatically to client
5: Navigation options to view order details or create another order
6: Payment details accessible from order detail page
7: All status updates happen within single database transaction

### Story 3.5: Payment Failure Handling

**As a** seamstress,  
**I want** clear handling of payment failures,  
**so that** I can help clients complete their order successfully.

#### Acceptance Criteria

1: Payment failures display specific error messages (insufficient funds, card declined, etc.)
2: Order remains in draft status with unpaid invoice after failure
3: Option to try different payment method without losing order details
4: Failed payment attempts logged for troubleshooting
5: Ability to save draft order and send payment link for later completion
6: Clear instructions for next steps after payment failure
7: No duplicate invoices created on retry attempts

### Story 3.6: Order Modification After Invoice Creation

**As a** seamstress,  
**I want** to handle order changes that affect payment amount,  
**so that** I can accommodate client requests accurately.

#### Acceptance Criteria

1: Editing order after invoice creation shows warning about payment impact
2: If invoice is unpaid, system cancels it and creates new one with updated amount
3: If invoice is paid, system prevents changes that affect total amount
4: Clear messaging explains why certain changes are restricted
5: Ability to create adjustment invoice for additional services (future enhancement noted)
6: Audit trail maintains history of cancelled/replaced invoices
7: Updated invoice follows same numbering sequence

### Story 3.7: Complete Payment Before Service E2E Testing

**As a** developer,  
**I want** comprehensive end-to-end tests for the payment-before-service flow,  
**so that** we ensure the integrated payment experience works reliably.

#### Acceptance Criteria

1: E2E test covers complete order creation with upfront payment
2: Test includes all payment methods (Stripe, cash, external POS)
3: Payment failure and retry scenarios tested thoroughly
4: Order modification restrictions after payment verified
5: Test confirms proper status transitions throughout flow
6: Performance verified for payment during order creation
7: Mobile experience tested for touch-optimized payment forms

## Epic 4: Financial Reporting & Analytics

**Epic Goal:** Provide seamstresses with financial insights and reporting capabilities to understand their business performance, track payment trends, and manage cash flow effectively. This epic transforms raw payment data into actionable business intelligence while maintaining simplicity appropriate for small tailoring businesses.

### Story 4.1: Payment Dashboard Overview

**As a** shop owner,  
**I want** to see a payment overview dashboard,  
**so that** I can quickly understand my current financial status.

#### Acceptance Criteria

1: Dashboard widget added to main dashboard showing payment summary
2: Display total revenue for current month with comparison to previous month
3: Show count and total of pending invoices requiring attention
4: Quick stats for payment method distribution (percentage paid via Stripe vs cash/POS)
5: Visual indicator for overdue invoices (pending invoices older than 7 days)
6: Dashboard refreshes automatically when returning from payment actions
7: Mobile-responsive layout maintains readability on small screens

### Story 4.2: Payment History and Search

**As a** seamstress,  
**I want** to search and filter my payment history,  
**so that** I can find specific transactions and reconcile my records.

#### Acceptance Criteria

1: Payment history page accessible from main navigation or dashboard
2: Search by client name, invoice number, or order number
3: Filter by date range with preset options (today, this week, this month, custom)
4: Filter by payment method (all, Stripe, cash, external POS)
5: Export filtered results to CSV format for accounting software
6: Pagination handles large datasets efficiently
7: Sort by date, amount, or client name with persistent preferences

### Story 4.3: Financial Reports Generation

**As a** shop owner,  
**I want** to generate financial reports,  
**so that** I can track business performance and prepare for taxes.

#### Acceptance Criteria

1: Reports section added to Settings or new Reports navigation item
2: Monthly revenue report shows daily breakdown with totals
3: Payment method report shows distribution and processing fees (Stripe)
4: Client payment report shows payment history by client
5: Reports generate for selectable date ranges
6: PDF export option for all reports with shop branding
7: Reports calculate business metrics (average order value, payment collection time)

### Story 4.4: Payment Trends Analytics

**As a** shop owner,  
**I want** to see payment trends over time,  
**so that** I can make informed business decisions.

#### Acceptance Criteria

1: Trends page shows revenue graph for last 6 months
2: Toggle between monthly, weekly, and daily views
3: Comparison view shows current vs previous period
4: Payment method trends show shifting preferences over time
5: Average payment collection time trending (for payment-after-service)
6: Busy period identification highlights peak revenue days/months
7: Mobile-friendly charts with touch interactions for details

### Story 4.5: Outstanding Payments Tracking

**As a** seamstress,  
**I want** to track outstanding payments efficiently,  
**so that** I can follow up with clients appropriately.

#### Acceptance Criteria

1: Outstanding payments view shows all unpaid invoices with age
2: Sort by age to prioritize oldest outstanding payments
3: Bulk actions to send payment reminder emails
4: One-click payment link regeneration for expired links
5: Notes field to track follow-up communications
6: Visual aging indicators (color coding by days outstanding)
7: Quick stats showing total outstanding amount and count

### Story 4.6: Basic Revenue Forecasting

**As a** shop owner,  
**I want** basic revenue projections,  
**so that** I can plan for upcoming expenses and growth.

#### Acceptance Criteria

1: Forecasting based on historical payment data and active orders
2: Show projected revenue for next 30 days based on order due dates
3: Include pending invoices in near-term projections
4: Simple trend line showing if revenue is growing or declining
5: Seasonal pattern detection based on historical data (if available)
6: Confidence indicators for projections based on data availability
7: Export projections for business planning purposes

### Story 4.7: Analytics Testing and Performance

**As a** developer,  
**I want** to ensure analytics features perform well,  
**so that** insights load quickly even with large datasets.

#### Acceptance Criteria

1: Report generation completes within 3 seconds for typical data volumes
2: Database indexes optimized for common query patterns
3: Caching implemented for expensive calculations
4: Analytics queries don't impact transaction processing performance
5: E2E tests verify report accuracy with known test data
6: Load testing confirms performance with 10,000+ invoices
7: Graceful handling when insufficient data exists for analytics

## Checklist Results Report

_[To be populated after checklist execution]_

## Next Steps

### UX Expert Prompt

Review the Invoice Management PRD and create detailed UX mockups focusing on the mobile-first payment experience, ensuring seamless integration with Hemsy's existing design system while maintaining trust and clarity in all payment interactions.

### Architect Prompt

Using this Invoice Management PRD, create a comprehensive technical architecture document that details the implementation approach for Stripe integration, database schema design, Server Actions structure, and security considerations while maintaining consistency with Hemsy's existing architecture patterns.
