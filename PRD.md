# Hemsy Product Requirements Document (PRD)

---

## 1. Executive Summary

**Hemsy** is a **mobile-first PWA** designed for seamstresses and tailoring businesses. It provides a **fast, connectivity-aware workflow** to manage clients, orders, garments, appointments, and invoices. The app removes friction in daily operations with a streamlined, conflict-free scheduling system and integrated invoicing.

**Target Users:** Solo seamstresses, small-to-medium tailoring shops, alteration businesses, custom garment makers, and mobile tailors.

**Problem:** Seamstresses often manage workflows using paper, spreadsheets, or generic software that doesn’t match their needs.

**Solution:** Hemsy mirrors how seamstresses work, enabling quick actions, visual tracking, and professional invoicing.

---

## 2. Product Goals & Scope

- **Business Goals:** Improve operational efficiency, prevent scheduling conflicts, support modern payment flows, and create a scalable SaaS model.
- **MVP Scope:** Core features (Dashboard, Clients, Orders, Garments, Appointments, Services, Invoices, Settings) with Stripe billing.
- **Future Vision:** Multi-tenancy, client portals, branding customization, advanced analytics.

---

## 3. Core Features

- **Dashboard:** Quick actions, high-priority garments, upcoming appointments.
- **Clients:** Mini CRM with contact info, order history, and appointments.
- **Orders:** Parent entity containing garments; supports quick client lookup, service attachment, and confirmation flow.
- **Garments:** Stage-based tracking with filters and sorting. Fixed stages: "New", "In Progress", "Ready For Pickup", "Done".
- **Appointments:** Mobile-friendly calendar with conflict prevention, working hour enforcement, buffer times, and color-coded types.
- **Services:** Manage alteration services with quick-add shortcuts.
- **Invoices:** Create, send, and manage invoices with Stripe integration and manual payment tracking.
- **Settings:** Configure business info, working hours, location type, and payment preferences.

---

## 4. User Flows & Navigation

### Navigation Structure

- Bottom Nav (Mobile): Home, Clients, Orders, Garments, Appointments
- Overflow Menu: Services, Invoices, Settings

### Key User Flows

- Quick Action Workflow (Dashboard)
- Order Creation (client → garments → services → summary)
- Client Lookup & Profile Access
- Garment Tracking & Stage Updates
- Appointment Scheduling (conflict-free)
- Service Management
- Invoice Management (creation, sending, payment)
- Settings Flow

**Mobile-First Considerations:** Large tap targets, bottom sheets, swipe gestures, sticky action bars, toasts for feedback.

---

## 5. Technical Architecture

- **Runtime:** Node.js 22.17.1 (LTS)
- **Framework:** Next.js 15+ (App Router, Server Actions)
- **UI Library:** Material UI (MUI)
- **Auth:** Clerk (JWT sessions)
- **Database:** Supabase PostgreSQL (future-ready for multi-tenancy)
- **Storage:** Cloudinary (auto-compression)
- **Email:** Resend
- **SMS:** Twilio
- **Payments:** Stripe (client invoicing + recurring billing)
- **Hosting:** Vercel
- **Monitoring:** Sentry, Logtail/Datadog
- **Caching:** Next.js ISR & caching layers

---

## 6. Marketing & Onboarding

- **Marketing Pages:** Home, Features, Pricing, FAQ, Contact, Privacy Policy, Terms.
- **Conversion Tracking:** GA4 + Vercel Analytics; A/B testing for CTAs.
- **Free Trial:** 14 days, no card required (with trial countdown + reminders).
- **Onboarding:** Initial questions (business name, location, working hours, payment preference) with progressive setup and reminders.

---

## 7. Invoices Section

- **Invoices List View:** Filters, sorting, and status badges.
- **Invoice Detail View:** Itemized services, client/business info, totals, payment status.
- **Invoice Creation Flow:** Client → services → payment terms → summary.
- **Payment Integration:** Stripe Checkout links, manual payment options, real-time updates via webhooks.
- **UX Enhancements:** Sticky CTAs, swipe actions, toasts, optimistic UI.
- **Future Enhancements:** Partial payments, recurring invoices, invoice customization, analytics.

---

## 8. Payment & Billing

- **Client Payments:** Upfront vs after services, determined by seamstress preferences.
- **Payment Options:** Cash/external POS (manual), Stripe Checkout (online).
- **Recurring Billing:** Stripe Billing for Hemsy subscriptions.
- **Trial Handling:** Trial countdown with upgrade prompts.

---

## 9. Non-Functional Requirements

- **Performance:**
  - Marketing pages <1.5 s load on 3G
  - Dashboard <2 s initial render
  - Image upload limits + auto-compression
- **Security:** Clerk, Stripe PCI compliance, HTTPS, encrypted storage
- **Reliability:** 99.9% uptime, error retries, optimistic UI with rollback
- **Usability:** Mobile-first, accessibility (WCAG 2.1 AA), onboarding guidance
- **Maintainability:** Clean architecture, CI/CD with Vercel, TypeScript enforced
- **Observability:** Sentry, Logtail/Datadog, analytics KPIs
- **Compliance:** GDPR-ready, legal pages hosted as static ISR

---

## 10. Roadmap & Future Enhancements

- Multi-tenancy (Clerk Organizations)
- Client Portal for viewing & paying invoices
- Branding customization for invoices
- Referral program & SEO content strategy
- Partial payments & recurring invoices

---

## 11. Risks & Mitigations

- **Conversion Risk:** Mitigated with countdown, reminders, A/B testing.
- **Onboarding Drop-off:** Mitigated with progressive setup & reminders.
- **Performance Risks:** Lazy loading, image optimization, database indexing.
- **Feature Creep:** MVP scope locked; advanced features deferred.
- **UX Risks:** Avoid over-complexity with smart defaults & staged customization.

---

## 12. Implementation Roadmap: Epics → Features → User Stories

### Phase 0 – Project Setup

**Epic 0.1: Project Initialization & CI/CD**

- **Feature 0.1.1: Repository & Tooling Scaffold**
  - **User Story**: As a developer, I want the repo bootstrapped with Next.js 15+, TypeScript, ESLint/Prettier, Jest & Playwright, and Vercel CI/CD configured so I can start building immediately.

---

### Phase 1 – Auth & Shop Configuration

**Epic 1.1: Authentication & Organization Setup**

- **Feature 1.1.1: User Authentication (Clerk)**
  - **User Story**: As a seamstress, I want to sign up and log in via Clerk (JWT sessions) so only authorized users access the app.
- **Feature 1.1.2: Onboarding Wizard**
  - **User Story**: As a new user, I want an onboarding wizard (business name, location, hours, payment prefs) so my shop is preconfigured.
- **Feature 1.1.3: Business Settings CRUD**
  - **User Story**: As a seamstress, I want to update my business settings (name, working hours, payment preference) so my data stays current.
- **Feature 1.1.4: Free-Trial Activation**
  - **User Story**: As a seamstress, I want a 14-day free trial (no card required) so I can evaluate Hemsy risk-free.

---

### Phase 2 – Master Data (Catalogs)

**Epic 2.1: Catalog Management**

- **Feature 2.1.1: Services Catalog CRUD**
  - **User Story**: As a seamstress, I want to add/edit/delete my alteration services (name, unit, price) so I can reuse them in orders.
- **Feature 2.1.2: Clients Management**
  - **User Story**: As a seamstress, I want to create, view, search, and paginate clients so I can manage my customer base.
- **Feature 2.1.3: Quick-Add Services**
  - **User Story**: As a seamstress, I want my top services as one-tap buttons in the order flow so I can speed up order creation.
- **Feature 2.1.4: Trial Countdown & Reminders**
  - ⚑ **Feature-Flag: `trial_countdown_enabled` (default OFF)**
  - **User Story**: As a seamstress, I want to see “X days left” and receive email reminders so I convert before my trial ends.

---

### Phase 3 – Orders & Garments

**Epic 3.1: Order Processing**

- **Feature 3.1.1: Create Order Flow**
  - **User Story**: As a seamstress, I want to create an order by selecting a client and adding garments + services so I can record new jobs.
- **Feature 3.1.2: Garment Details in Order**
  - **User Story**: As a seamstress, within order creation, I want to add garments (title, photo, due/event dates) so I capture all details. Garments automatically start in "New" stage.
- **Feature 3.1.3: Orders List & Detail**
  - **User Story**: As a seamstress, I want a list of all orders (filterable) and a detail page showing its garments/services so I can track progress.
- **Feature 3.1.4: Garment Backlog & Filters**
  - **User Story**: As a seamstress, I want to view all garments across orders by stage, due date, and client so I can prioritize work.

---

### Phase 4 – Invoices & Payments

**Epic 4.1: Billing & Invoicing**

- **Feature 4.1.1: Generate Invoice**
  - **User Story**: As a seamstress, I want to generate an invoice from an order so I can bill the client.
- **Feature 4.1.2: Invoice List & Filtering**
  - **User Story**: As a seamstress, I want a list of all invoices with status badges so I can manage receivables.
- **Feature 4.1.3: Send Invoice**
  - **User Story**: As a seamstress, I want to send invoices via email or SMS with a Stripe link so clients can pay online.
- **Feature 4.1.4: Mark Invoice Paid**
  - **User Story**: As a seamstress, I want to mark invoices paid (cash/external POS) so my records stay accurate.

---

### Phase 5 – Appointments & Scheduling

**Epic 5.1: Calendar & Conflicts**

- **Feature 5.1.1: Create Appointment w/ Conflict Prevention**
  - **User Story**: As a seamstress, I want to schedule appointments within working hours and buffer times so I never double-book.
- **Feature 5.1.2: Calendar Views**
  - **User Story**: As a seamstress, I want month/week/day/list calendar views so I plan my schedule visually.
- **Feature 5.1.3: Color-Coded Types & Filters**
  - **User Story**: As a seamstress, I want appointment types color-coded and filterable so I recognize them at a glance.

---

### Phase 6 – Dashboard & Quick Actions

**Epic 6.1: Home & Action Center**

- **Feature 6.1.1: Dashboard Widgets**
  - **User Story**: As a seamstress, I want widgets for today’s appointments and high-priority garments so I see what needs my attention first.
- **Feature 6.1.2: Quick Actions Menu**
  - **User Story**: As a seamstress, I want a persistent quick-action menu on the dashboard so I can create orders, clients, appointments, or invoices instantly.

---

### Phase 7 – Marketing & Subscription Flow

**Epic 7.1: Public Site & Trials**

- **Feature 7.1.1: Marketing Pages**
  - **User Story**: As a visitor, I want fast-loading, SEO-optimized pages (Home, Features, Pricing, FAQ, Contact, Privacy, Terms) so I can evaluate and sign up.
- **Feature 7.1.2: Subscription Flow Post-Trial**
  - **User Story**: As a seamstress, I want to subscribe via Stripe Billing when my free trial ends so I continue using Hemsy.

---

> **Dependencies:**  
> Phase N features build on Phase N–1 foundations.  
> Feature 2.1.4 is hidden behind the `trial_countdown_enabled` flag until we enable it.

```markdown

```
