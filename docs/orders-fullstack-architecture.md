# Orders Feature — Full-Stack Architecture (MVP)

## 0. Executive Summary

Implement Orders (Phase 3) with a single‑view composer (inline client select/create, garments, services) and DB-backed list/detail pages. Server Actions are the authoritative backend. Online-only. Align with Next.js 15 App Router, TypeScript strict, MUI, Supabase with RLS, and Clerk.

## 1. Scope & Goals

- In scope: Orders domain (schema, RLS), server actions, stepper UI, orders list/detail, services search + create modal, pricing (shop-level tax, flat discount), basic status/stage rules.
- Out of scope (MVP): Offline drafts, partial payments, custom garment stages, role-based pricing, client portal.
- Success: E2E flow from creation to detail works reliably; list/detail reflect DB; ≥80% test coverage for actions/business logic.

## 2. System Context & Responsibilities

- Frontend (Next.js 15): App Router pages for orders list/detail/new; single‑view composer orchestrated by an in-memory provider; MUI for UI.
- Backend (Server Actions): All mutations; validation, transactions, totals computation; revalidation and redirect.
- Data (Supabase): Orders, garments, garment_services tables; triggers for totals; RLS for multi-tenant security.
- AuthZ: Clerk authenticates; Server Actions derive `shop_id`; Supabase RLS enforces row-level security.

## 3. Frontend Architecture

### 3.1 App Structure

- Pages
  - `/(app)/orders` — list (filters by status)
  - `/(app)/orders/new` — single‑view composer
  - `/(app)/orders/[id]` — detail
- Components
  - `OrderCreationProvider` — holds state (selected client, garments[], discount, derived totals, taxPercent).
  - Composer sections: ClientPicker + ClientCard; Garments (list + editor), Services (speed dial, autocomplete, quick add), Review CTA.
  - Shared: `ClientLookup` (dialog with new/existing toggle), `ServicesSearch` (autocomplete + throttle), `AddServiceDialog`.

### 3.2 State & Validation

- Provider: in-memory only (no localStorage). Client-side validation mirrors server with zod schemas where possible. Submit via Server Action; handle pending with `useActionState`.
- If user switches client after garments exist, default to "Keep current session" (reassign garments/services), with option to "Start new session" (clear).

### 3.3 UX & Accessibility

- Mobile-first: sticky bottom CTA; large tap targets; responsive lists.
- If services catalog is empty, show an inline banner and offer “Create New Service” modal; otherwise show speed dial/autocomplete.
- Accessibility: inputs labeled; `aria-live` for error messages; dialogs fully keyboard navigable.

### 3.4 Data Fetching & Caching (UI)

- List page: SSR fetch with `next: { revalidate: 60 }` (path-based) or `revalidateTag('orders')` (tag-based) as needed.
- Detail page: `cache: 'no-store'` or short revalidate.
- After mutations: `revalidatePath('/orders')` and optionally revalidate detail route.

## 4. Backend Architecture (Server Actions)

### 4.1 Actions (Authoritative Layer)

- `createOrder(input): { orderId }`
  - Validates: client in shop; ≥1 garment; ≥1 service per garment; qty ≥1; discount bounds.
  - Transaction: insert order, garments, garment_services; compute totals (tax from shop settings).
  - Revalidate `/orders`; redirect to `/orders/[id]`.
- `updateOrder(orderId, patch)` — notes, order_due_date, status (guard transitions).
- `updateGarmentStage(garmentId, stage)` — enforce allowed stages; optional order status roll-up.
- `addGarment`, `removeGarment`, `addServiceLine`, `removeServiceLine`.
- Services catalog utilities: `searchServices`, `addService`, `editService`, `deleteService`, `fetchAllServices`.

### 4.2 Security & AuthZ

- Clerk session → derive `shop_id` server-side; never accept `shop_id` from client. Use existing helper `ensureUserAndShop()` to resolve the current shop where available.
- Supabase SSR client used inside actions to respect RLS.
- Error handling: structured errors returned for `useActionState`; avoid leaking internals.

### 4.3 Error & Idempotency

- UI disables submit while pending; server uses a single transaction to ensure atomicity.
- No external idempotency keys needed at MVP; retries handled at UI.

## 5. Data Model & Migrations

### 5.1 Tables

- `orders`: id, shop_id, client_id, status, order_due_date, notes, subtotal_cents, discount_cents, tax_cents, total_cents, timestamps.
- `garments`: id, order_id, name, notes, photo_url, event_date, due_date, stage ("New"|"In Progress"|"Done"|"Archived"), timestamps.
- `garment_services`: id, garment_id, service_id, quantity, unit_price_cents, unit, line_total_cents.

### 5.2 Constraints & Indexes

- Constraints: `quantity > 0`, `unit_price_cents >= 0`; stage check constraint; status check values.
- Indexes: `orders(shop_id, status, created_at desc)`, `garments(order_id, stage)`, `garment_services(garment_id)`.

### 5.3 Triggers (Recommended)

- BEFORE ins/upd on `garment_services`: set `line_total_cents = quantity * unit_price_cents`.
- AFTER ins/upd/del on `garment_services`: roll up orders `subtotal_cents`, `tax_cents`, `total_cents`.
- AFTER update `garments.stage`: optional order status roll-up (or handled in actions for MVP).

### 5.4 RLS Policies

- Enable RLS on all new tables.
- Policies: `shop_id = auth_shop_id()` for CRUD.
- `garment_services` policy derives `shop_id` via join (garments → orders).

### 5.5 Migration Plan

- 017_create_orders_tables.sql — tables + indexes + RLS enablement + basic policies.
- 018_orders_totals_triggers.sql — line totals + order roll-up triggers.
- 019_orders_status_rollup.sql — optional status roll-up trigger (if not in actions).

## 6. Domain Logic & Rules

- Garment stages (fixed in MVP): "New", "In Progress", "Done", "Archived".
- Order status default `new` at creation. Further transitions are deferred for now.
- Pricing:
  - Subtotal = Σ(quantity × unit_price_cents).
  - Discount flat, clamped to [0, Subtotal].
- Tax = round_half_away_from_zero((Subtotal − Discount) × shop.tax_percent).
  - Total = Subtotal − Discount + Tax.
- Services rule: every garment must have ≥1 service.

## 7. Integration Points

- Appointments: deep link `/appointments/new?client={id}&order={id}` post-create.
- Invoices: `/invoices/new?order={id}` (prefill items from garment_services).
- Email: order confirmation via existing Email Service (template later).

## 8. Performance & Reliability

- Targets: create → redirect < 1.5s P95 on WiFi; list render < 2s initial.
- Use SSR for data-heavy pages; avoid client waterfalls; keep bundles lean.
- Revalidation strategy: path-based for list; tag-based optional.

## 9. Observability & Ops

- Log action failures with context (shop_id, action, validation stage).
- Add breadcrumbs for creation steps; capture server errors.
- Consider Sentry integration (existing project setup) for actions.

## 10. Developer Experience

- TypeScript strict types for inputs/outputs.
- Zod schemas for inputs; shared types for server/client.
- Co-locate tests with actions; E2E in `__tests__/e2e`.

## 11. Testing Strategy

- Unit: pricing math, status roll-up, zod validation.
- Integration: `createOrder` transaction, RLS enforcement, totals integrity, service search/add.
- E2E (Playwright, mobile): full creation flow; validation blocks; a11y scans.
- Coverage: ≥80% for business logic and actions.

## 12. Risks & Mitigations

- Pricing drift (catalog vs order): copy unit price to lines at creation; no backfill.
- Stage/status sync complexity: consolidate in actions or trigger, not both.
- Future custom stages: encapsulate stage values behind constants to ease migration.

## 13. Milestones

- M1 (1–2d): Migrations + RLS + types + orders list/detail reads.
- M2 (2d): Steps 1–2 (client + garments) UI wired.
- M3 (3d): Step 3 services + pricing + add-service modal.
- M4 (3d): Review/submit + server action + tests.
- M5 (3d): Detail actions + list filters + E2E/a11y.

## 14. Open Questions

- Allow line-level price override in MVP? If yes, require confirmation (and optional reason) and audit trail.
- Default order due date to max garment due date when omitted?
