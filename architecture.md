# Threadfolio Architecture Specification

_Last updated: August 1, 2025_

---

## Table of Contents

1. [Introduction](#introduction)
2. [Architectural Goals](#architectural-goals)
3. [High-Level System Overview](#high-level-system-overview)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
   - 5.1 [User Identity & Synchronization](#user-identity--synchronization)
6. [Data Layer & Schema](#data-layer--schema)
   - 6.1 [Clients Table](#clients-table)
7. [External Integrations](#external-integrations)
8. [Infrastructure & Deployment](#infrastructure--deployment)
9. [Security & Compliance](#security--compliance)
10. [Scalability & Performance](#scalability--performance)
11. [CI/CD & Testing](#cicd--testing)
12. [Configuration & Environment](#configuration--environment)
13. [Future Considerations](#future-considerations)

---

## 1. Introduction

This document captures the **end-to-end system architecture** for Threadfolio—a mobile-first PWA for seamstresses. It unifies frontend, backend, data, and infrastructure views to guide development, ensure consistency, and enable AI-driven agents to iterate autonomously.

---

## 2. Architectural Goals

- **Mobile-First & Responsive**
- **Offline-Resilient / Slow-Network-Aware**
- **Secure & Compliant**
- **Maintainable & Extensible**
- **Scalable**

---

## 3. High-Level System Overview

```text
┌────────────────────────────┐
│    Marketing Site (ISR)    │
│  Next.js / Vercel Edge CDN │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│  Threadfolio App (PWA)     │
│  Next.js 15+ (App Router)  │
│  MUI, React Server Components │
└─────────────┬──────────────┘
 Server Actions│   Client Components
              ▼
┌───────────────────────────────────┐
│  Backend Logic & Data Access     │
│  Next.js Server Actions + Supabase JS SDK │
└──────┬───────────────┬────────────┘
       │               │
       ▼               ▼
┌────────────┐    ┌──────────────────┐
│ Supabase   │    │ External Services │
│ PostgreSQL │    │ (Clerk, Stripe,  │
└────────────┘    │  Resend, Twilio, │
                  │  Cloudinary)     │
                  └──────────────────┘
```

---

## 4. Frontend Architecture

- **Framework:** Next.js 15+ (App Router, RSC)
- **Design System:** MUI with centralized theme
- **State Management:** React Context
- **UX:** Optimistic UI, inline spinners, toasts
- **Offline & Caching:** Service Worker, IndexedDB, ISR

---

## 5. Backend Architecture

- **Runtime:** Node.js 22.17.1
- **Server Layer:** Next.js Server Actions
- **Data Access:** Supabase JS SDK via shared `server/db/`
- **Logic:** Modular server actions, atomic DB transactions
- **Feature Flags:** `trial_countdown_enabled`

### 5.1 User Identity & Synchronization

- Clerk user IDs (`clerk_user_id`) map to Supabase `users` table.
- On sign-in, `ensureUser()` upserts user.
- Clerk webhook keeps email/name in sync.
- Supabase RLS enforces row-level access.

---

## 6. Data Layer & Schema

**Core Tables:**

- `users(id, clerk_user_id, email, role)`
- `shops(id, owner_user_id, trial_countdown_enabled, …)`
- `clients(...)` (see below)
- `orders(id, shop_id, client_id, status, total)`
- `garments(id, order_id, title, due_date, stage)`
- `services(id, shop_id, name, unit_price, unit)`
- `garment_services(garment_id, service_id, quantity)`
- `invoices(id, order_id, status, stripe_link, due_date)`
- `payments(id, invoice_id, method, amount, stripe_txn_id)`
- `appointments(id, shop_id, client_id, date, start_time, end_time, type)`

### 6.1 Clients Table

| Column          | Type            | Notes         |
| --------------- | --------------- | ------------- |
| id              | UUID PK         |               |
| shop_id         | UUID → shops.id |               |
| first_name      | TEXT            | NOT NULL      |
| last_name       | TEXT            | NOT NULL      |
| email           | TEXT            | NOT NULL      |
| phone_number    | TEXT            | NOT NULL      |
| accept_email    | BOOLEAN         | DEFAULT TRUE  |
| accept_sms      | BOOLEAN         | DEFAULT FALSE |
| notes           | TEXT            | Optional      |
| mailing_address | TEXT            | Optional      |
| created_at      | TIMESTAMP       | now()         |
| updated_at      | TIMESTAMP       | now()         |

---

## 7. External Integrations

- **Clerk**: Authentication
- **Stripe**: Billing + Invoices
- **Cloudinary**: Image storage
- **Resend**: Email
- **Twilio**: SMS (future)

---

## 8. Infrastructure & Deployment

- **Hosting:** Vercel
- **Database:** Supabase with RLS
- **Background Jobs:** Vercel Cron / QStash
- **CI/CD:** GitHub → Vercel

---

## 9. Security & Compliance

- HTTPS everywhere
- Clerk JWT sessions
- Stripe PCI compliance
- GDPR-ready

---

## 10. Scalability & Performance

- ISR & PWA caching
- Supabase indexes & optimization
- Vercel serverless scaling

---

## 11. CI/CD & Testing

- Jest (unit), Playwright (E2E)
- axe-core accessibility tests
- ESLint & Prettier

---

## 12. Configuration & Environment

Env Vars:

```
DATABASE_URL=
CLERK_API_KEY=
STRIPE_SECRET_KEY=
RESEND_API_KEY=
TWILIO_API_KEY=
CLOUDINARY_URL=
TRIAL_COUNTDOWN_ENABLED=false
CLERK_WEBHOOK_SECRET=
```

---

## 13. Future Considerations

- Multi-tenancy
- Client portal
- Recurring & partial payments
- Offline-first sync

---

_End of Threadfolio Architecture Specification_
