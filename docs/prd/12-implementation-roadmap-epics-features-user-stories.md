# 12. Implementation Roadmap: Epics → Features → User Stories

## Phase 0 – Project Setup

**Epic 0.1: Project Initialization & CI/CD**

- **Feature 0.1.1: Repository & Tooling Scaffold**
  - **User Story**: As a developer, I want the repo bootstrapped with Next.js 15+, TypeScript, ESLint/Prettier, Jest & Playwright, and Vercel CI/CD configured so I can start building immediately.

---

## Phase 1 – Auth & Shop Configuration

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

## Phase 2 – Master Data (Catalogs)

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

## Phase 3 – Orders & Garments

**Epic 3.1: Order Processing**

- **Feature 3.1.1: Create Order Flow**
  - **User Story**: As a seamstress, I want to create an order by selecting a client and adding garments + services so I can record new jobs.
- **Feature 3.1.2: Garment Details in Order**
  - **User Story**: As a seamstress, within order creation, I want to add garments (title, photo, due/event dates, stage) so I capture all details.
- **Feature 3.1.3: Orders List & Detail**
  - **User Story**: As a seamstress, I want a list of all orders (filterable) and a detail page showing its garments/services so I can track progress.
- **Feature 3.1.4: Garment Backlog & Filters**
  - **User Story**: As a seamstress, I want to view all garments across orders by stage, due date, and client so I can prioritize work.

---

## Phase 4 – Invoices & Payments

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

## Phase 5 – Appointments & Scheduling

**Epic 5.1: Calendar & Conflicts**

- **Feature 5.1.1: Create Appointment w/ Conflict Prevention**
  - **User Story**: As a seamstress, I want to schedule appointments within working hours and buffer times so I never double-book.
- **Feature 5.1.2: Calendar Views**
  - **User Story**: As a seamstress, I want month/week/day/list calendar views so I plan my schedule visually.
- **Feature 5.1.3: Color-Coded Types & Filters**
  - **User Story**: As a seamstress, I want appointment types color-coded and filterable so I recognize them at a glance.

---

## Phase 6 – Dashboard & Quick Actions

**Epic 6.1: Home & Action Center**

- **Feature 6.1.1: Dashboard Widgets**
  - **User Story**: As a seamstress, I want widgets for today’s appointments and high-priority garments so I see what needs my attention first.
- **Feature 6.1.2: Quick Actions Menu**
  - **User Story**: As a seamstress, I want a persistent quick-action menu on the dashboard so I can create orders, clients, appointments, or invoices instantly.

---

## Phase 7 – Marketing & Subscription Flow

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
