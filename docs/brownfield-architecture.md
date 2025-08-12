# Threadfolio V2 Brownfield Architecture Document

## Introduction

This document captures the current state of the Threadfolio V2 codebase, including real-world patterns, technical debt, and integration constraints. It is optimized for AI agents and contributors working on enhancements and maintenance.

### Document Scope

Focused on the MVP features defined in `PRD.md` with emphasis on App Router pages, Server Actions, appointments/calendar flows, and the email system.

### Change Log

| Date       | Version | Description                      | Author     |
| ---------- | ------- | -------------------------------- | ---------- |
| 2025-08-08 | 1.0     | Initial brownfield documentation | AI Analyst |

## Quick Reference — Key Files and Entry Points

### Critical Files for Understanding the System

- Main App entry/layout (RSC): `src/app/layout.tsx`
- Auth-protected app shell: `src/app/(app)/layout.tsx`
- Marketing shell: `src/app/(marketing)/layout.tsx`
- Middleware (route protection): `src/middleware.ts`
- Global styles: `src/app/globals.css`
- PWA manifest: `public/manifest.json`
- Next.js config: `next.config.ts`
- TypeScript config & path aliases: `tsconfig.json`
- Test runners/config: `jest.config.js`, `config/jest.config.js`, `config/playwright.config.ts`

### Core Business Logic

- Server Actions (appointments - legacy): `src/lib/actions/appointments.ts`
- Server Actions (appointments - refactored): `src/lib/actions/appointments-refactored.ts`
- Email Service: `src/lib/services/email/email-service.ts`
- Email Repository/Renderer/Resend client: `src/lib/services/email/*`
- React Query provider & caching: `src/providers/QueryProvider.tsx`
- Appointments context + optimistic UI + realtime: `src/providers/AppointmentProvider.tsx`
- Calendar reducer & state: `src/lib/reducers/appointments-reducer.ts`
- Appointment query keys/helpers: `src/lib/queries/appointment-keys.ts`

### API Routes

- Appointments (time range, Edge): `src/app/api/appointments/time-range/route.ts`
- Email test (Resend): `src/app/api/email/test/route.ts`

### Database & Types

- Supabase client (server): `src/lib/supabase/server.ts`
- Supabase client (browser): `src/lib/supabase/client.ts`
- Types: `src/types/*`
- Migrations: `supabase/migrations/*.sql`
  - Functions used in code: `check_appointment_conflict`, `check_within_working_hours`, `get_appointment_counts_by_date`

## High Level Architecture

### Technical Summary

- App: Next.js 15+ (App Router, RSC + Client Components), TypeScript strict
- UI: Material UI v6, Emotion compiler flag enabled
- State/Data: Server Actions + Supabase JS; React Query (offlineFirst) for client-side caching
- Auth: Clerk with middleware-route protection
- Email: Resend (React templates supported in API), domain service abstraction with idempotency
- Payments: Stripe (integration points scaffolded; core flows to be implemented alongside invoices)
- Hosting: Vercel; Edge runtime used for some API routes

### Actual Tech Stack (from package.json)

| Category  | Technology            | Version | Notes                             |
| --------- | --------------------- | ------- | --------------------------------- |
| Runtime   | Node.js               | 22.17.1 | Enforced via engines              |
| Framework | Next.js               | 15.1.x  | App Router, serverActions enabled |
| Language  | TypeScript            | 5.6.x   | Strict mode on                    |
| UI        | MUI                   | 6.1.x   | Emotion compiler enabled          |
| Data      | Supabase JS           | 2.46.x  | SSR helpers used                  |
| Auth      | Clerk                 | 6.3.x   | Middleware + server auth          |
| Query     | @tanstack/react-query | 5.84.x  | offlineFirst queries              |
| Email     | Resend                | 4.x     | Service abstraction, API route    |
| Payments  | Stripe                | 17.x    | Planned invoice flows             |
| A11y/E2E  | axe-core + Playwright | latest  | E2E and a11y suites configured    |

### Repository Structure Reality Check

- Type: Single app repository
- Package Manager: npm
- Key segments under `src/app`: `(app)`, `(auth)`, `(marketing)`, `api/`
- Notable: Coexistence of legacy vs refactored appointments actions; backup UI files retained in tree

## Source Tree and Module Organization

```text
src/
├── app/
│   ├── (app)/                # Authenticated app sections (dashboard, clients, orders, garments, appointments, invoices, services, settings)
│   ├── (auth)/               # Authentication routes
│   ├── (marketing)/          # Public marketing pages
│   ├── api/                  # Edge/Node API routes
│   ├── layout.tsx            # Root RSC layout with providers
│   └── globals.css
├── components/               # Feature and layout components (calendar suite, clients, layout)
├── lib/
│   ├── actions/              # Server Actions (appointments legacy + refactored)
│   ├── queries/              # Query keys and helpers
│   ├── reducers/             # Appointments reducer
│   ├── services/email/       # Email service + infra
│   ├── supabase/             # SSR/Browser clients
│   └── utils/validations     # Utilities and zod schemas
├── providers/                # App-level providers (Query, Date localization, Appointments)
├── types/                    # Shared types
└── __tests__/                # Unit, integration, e2e suites
```

### Key Modules and Their Purpose

- App shell and providers: `src/app/layout.tsx` with `ThemeProvider`, `QueryProvider`, `DateLocalizationProvider`, conditional `ClerkProvider`
- Auth enforcement and shop context: `src/app/(app)/layout.tsx` (redirects via Supabase lookups; wraps with `AppointmentProvider`)
- Appointments domain:
  - Server-side: `src/lib/actions/appointments-refactored.ts` (CRUD, constraints, emails, revalidation)
  - Client-side: `src/providers/AppointmentProvider.tsx` (optimistic updates, realtime via Supabase channels)
  - Calendar UI: `src/components/appointments/*` and `src/lib/reducers/appointments-reducer.ts`
- Email domain: `src/lib/services/email/*` with idempotency, constraints, templating, Resend integration
- API (Edge): `src/app/api/appointments/time-range/route.ts` for cacheable range fetches; `src/app/api/email/test/route.ts` for email smoke tests

## Data Models and APIs

### Data Models (referenced via Supabase)

- Tables (per migrations): `clients`, `appointments`, `shops`, `shop_hours`, `calendar_settings`, `email_logs`, `email_templates`, etc.
- Enums/Defaults: `appointments.status` includes `pending` default; `completed` removed via migrations
- Functions: conflict checks and working-hours checks used by Server Actions

### API Specifications

- App Router API routes under `src/app/api/*` follow Next.js 15 handlers.
- Edge runtime used for `appointments/time-range` with caching headers set.
- Server Actions are primary backend logic for mutations and critical reads.

## Technical Debt and Known Issues

1. Duplicate appointments action modules
   - Legacy: `src/lib/actions/appointments.ts`
   - Refactored: `src/lib/actions/appointments-refactored.ts`
   - Risk: Divergence and confusion over which to use; refactored is the de-facto path in providers and should be the single source of truth.
2. API route data mapping bug in `src/app/api/appointments/time-range/route.ts`
   - The query selects nested `client:clients(...)`, but the transformation references flattened fields like `apt.client_first_name`. These fields are not present; client data resides under `apt.client`. This yields null/empty client details when `includeClient=true`.
   - Impact: Incomplete client payloads for consumers relying on this API.
3. Backup files present
   - `src/app/(app)/appointments/AppointmentsClient.backup.tsx`, `page.backup.tsx` and `src/components/appointments/Calendar.backup.tsx` increase noise; confirm intent or remove.
4. Two Jest configs
   - Root `jest.config.js` and `config/jest.config.js` coexist with subtle differences. The root one is authoritative via `package.json`. Prefer consolidating to one to avoid confusion.
5. Env dependency for Clerk in root layout
   - `src/app/layout.tsx` conditionally wraps `ClerkProvider` based on `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Inconsistent environments may change provider trees at runtime; document and standardize.
6. Server Action + Edge API responsibilities
   - Both Server Actions and `/api/appointments/time-range` perform overlapping reads. Consolidation or clear layering would reduce duplication.
   - Orders domain: Authoritative mutations via Server Actions; no duplicate API routes for create. Use path-based revalidation for `/orders` and redirect to detail on success.

## Integration Points and External Dependencies

### External Services

| Service    | Purpose          | Integration Type             | Key Files                                                     |
| ---------- | ---------------- | ---------------------------- | ------------------------------------------------------------- |
| Clerk      | Authentication   | Middleware + server auth     | `src/middleware.ts`, `@clerk/nextjs/server`                   |
| Supabase   | Data layer       | JS SDK SSR/Client            | `src/lib/supabase/*`                                          |
| Resend     | Email delivery   | SDK/API + React templates    | `src/lib/services/email/*`, `src/app/api/email/test/route.ts` |
| Stripe     | Payments/Billing | SDK/Webhooks (planned)       | `package.json`, PRD Phase 4                                   |
| Cloudinary | Media storage    | SDK + Next Image remote host | `next.config.ts`                                              |
| Twilio     | SMS (future)     | SDK                          | `package.json`                                                |

### Internal Integration Points

- RSC Server Actions with Supabase SSR client for authZ and multi-tenant scoping
- React Query for offlineFirst cache of calendar ranges; manual GC to keep memory bounded
- Supabase realtime channels inside `AppointmentProvider` for INSERT/UPDATE fan-in

## Development and Deployment

### Local Development Setup

1. `npm install`
2. Copy `.env.example` → `.env.local` and set Supabase, Clerk, Resend, Stripe
3. `npm run dev` to start Next.js with Turbopack

Known setup notes:

- Ensure `NEXT_PUBLIC_SUPABASE_*` are present for both server and client helpers
- Clerk keys must be set for authenticated areas to render with `ClerkProvider`

### Build and Deployment Process

- Build: `npm run build` (type-check and ESLint enforced via Next config)
- Deploy: Vercel (Edge + Node targets)
- Security headers set via `next.config.ts`

## Testing Reality

- Jest unit/integration configured with strict coverage thresholds (80%); root config is canonical
- Playwright E2E configured with mobile and desktop projects; dev server auto-starts
- Accessibility tests via axe-core and Playwright grep `@accessibility`

### Commands

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:e2e
npm run test:a11y
```

## If Enhancement PRD Provided — Impact Focus (MVP)

- Appointments & Calendar: Refactored Server Actions and provider are primary touchpoints; prefer `appointments-refactored.ts`
- Invoices/Payments: Implement flows under `(app)/invoices` and integrate Stripe (Phase 4); add Server Actions with Supabase writes and webhook handlers (future)
- Email: Leverage `EmailService` idempotent patterns; add templates and logs per migration schema

## Appendix — Useful Commands and Scripts

- Database setup/migration scripts in `src/scripts/*`
- Migrations: `npm run migrate`
- Supabase connection tests: `npm run test:supabase`
- Email tests: `npm run test:email`, `npm run test:email:api`, `npm run test:email:service`

## Gotchas and Workarounds

- Email idempotency: Reschedule emails use a time-window dedupe; other types check `email_logs` for existing sends
- Appointment constraints: Server Actions enforce conflict and working-hours checks via Supabase functions
- API route bug: Fix `client_*` mapping in `appointments/time-range` to consume nested `apt.client.*`
- Feature flags: `TRIAL_COUNTDOWN_ENABLED` default OFF; ensure env is set consistently across environments

---

This document reflects the current implementation as observed in the repository and should be treated as the source of truth for onboarding and enhancement planning. Future edits should update this single file and then shard as needed.
