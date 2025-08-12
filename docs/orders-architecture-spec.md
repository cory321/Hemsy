# Orders Feature Architecture Spec (Refactored MVP)

## 1. Overview

Canonical UX: single‑view composer. Users start from the Orders page by clicking "Create Order", then add/select a client; in the same view, they add garments and append services via speed dial, autocomplete, or quick add. Online‑only. Server Actions are the authoritative mutation layer; Supabase with RLS enforces multi‑tenant security. After successful creation, redirect to order detail at `/(app)/orders/[id]`.

## 2. Scope & Assumptions (Locked)

- In scope: Client selection/creation, inline client summary card, garments section, services via speed dial/autocomplete/quick add, order‑level discount and tax, totals computation, orders detail page.
- Out of scope (this MVP): Payments, invoices/QR, offline drafts, role‑based pricing, status roll‑ups beyond default, custom garment stages.
- Services rule: every garment must include ≥1 service line.
- Online‑only: no drafts/local storage; all data in memory until submit.

## 3. Entry & High‑Level UX Flow

- Entry from Orders page:
  - Desktop: "Create Order" button placed to the right of the Orders page heading (top toolbar).
  - Mobile: sticky "Create Order" button at the bottom of the screen.
- Clicking "Create Order" navigates to the composer at `/(app)/orders/new`.
- Composer start: "Add or Select Client" (blocking).
- After client picked/created:
  - Show compact client card pinned at top (name; email/phone if available).
  - Reveal "Garments" section below in the same view.
  - For each garment: add garment (name required; notes optional), append services via speed dial (frequent), autocomplete (search), or quick add (if not found); review/edit/remove services.
  - Add multiple garments as needed.
- Primary CTA: "Create Order" (disabled until requirements met).

## 4. UI Structure

### 4.1 Client Area

- Buttons: Add New Client, Select Existing (dialog/search; inline new‑client form allowed).
- Client card: name prominent; email/phone secondary; actions: Change client, Remove client.

### 4.2 Garments Area

- "Add Garment" button (prominent; mobile FAB acceptable).
- Garment editor:
  - Garment Name (required), Instructions/notes (optional).
  - Due date picker (dropdown calendar): optional; shown directly beneath the Garment Name field.
  - "Garment is for a special event" checkbox toggle (beneath Due date):
    - When checked, show Special event date picker (dropdown calendar) beneath the toggle.
    - When unchecked, hide and clear the Special event date value.
  - Services sub‑section:
    - Speed dial: up to 8 frequently used services (from settings).
    - Autocomplete: throttled search by name.
    - Quick add: minimal inline form (see Services Interactions).
  - Services list: name, qty, unit, unit price (USD), line total; edit/remove inline.
  - Save garment (creates/updates in view state; persists on Create Order).
- Garments list: card per garment with summary and actions (Edit, Remove).

### 4.3 Primary CTA in Composer

- Sticky bottom "Create Order" CTA on mobile.
- Disabled until: client selected AND ≥1 garment exists AND each garment has ≥1 valid service line.

- Order status (MVP): default `new`. Further transitions and roll‑ups are deferred.
- Garment stages (MVP, fixed): "New", "In Progress", "Done", "Archived"
- Pricing
  - Subtotal_cents = Σ(garment service lines: quantity × unit_price_cents)
  - Discount_cents: flat cents, clamped to [0, Subtotal_cents]
  - Tax_cents = round_half_away_from_zero((Subtotal_cents − Discount_cents) × shop.tax_percent)
  - Total_cents = Subtotal_cents − Discount_cents + Tax_cents
- Services rule: each garment must include ≥1 service line
- Copy prices at time of order creation; do not backfill from catalog later

## 5. Services Interactions

### 5.1 Speed Dial (Frequently Used)

- Sourced from Services settings (marked `frequently_used` + ordered, max 8).
- If fewer than 8 are configured, show only configured items; if none, show an inline hint linking to Services settings and allow Autocomplete/Quick Add as primary paths.
- Tap adds default line (qty=1, default unit/price); row remains editable.

### 5.2 Autocomplete

- Throttled search by name; select to add with defaults; row editable.

### 5.3 Quick Add (if not found)

- Minimal form: name (required), description (optional), qty (int ≥ 1), unit (enum: item/hour/day/week), unit price (USD, non‑negative).
- Persist to catalog by default; checkbox: "Don’t add this service to catalog" to opt out.
- Create‑then‑use: when persisting, create service in catalog first, then attach by `service_id`. When opted out, attach as an inline line (no `service_id`) using copied fields.
- After save, add to current garment.

## 6. Data & Validation Rules

- Client: name required; email/phone optional.
- Garment: name required; notes optional; due_date optional (date only); special_event (boolean) optional; event_date required when special_event is true (date only). When special_event is unchecked, API clears `event_date` to null.
- Service line:
  - Name required; description optional.
  - Quantity: integer ≥ 1.
  - Unit: enum { item, hour, day, week }.
  - Unit price: non‑negative; display formatted as USD.

## 7. Interaction Details

- Changing client after garments exist → confirmation dialog:
  - Keep current session (default): retain garments and services; reassign to new client.
  - Start new session: clear garments/services; proceed with selected client.
- Garment editing: reopens editor; services editable; save updates list state.
- Keyboard/Mobile: accessible autocomplete and dialogs (focus trap); sticky CTA on mobile.

## 8. Visual & Content Guidelines

- Orders list page:
  - Desktop: page heading left; primary "Create Order" button aligned right.
  - Mobile: sticky bottom "Create Order" button.
- Client card: compact, elevated; avatar/initial; subtle "Change/Remove" actions.
- Speed dial: large tap targets with labels/icons (max 8 items).
- Services list: dense but legible; right‑aligned currency.
  - Use `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` for display formatting.
  - Date inputs use MUI X Date Pickers via the existing `DateLocalizationProvider`.

## 8.1 Acceptance Criteria (Garment Dates)

- Garment editor displays a Due date picker beneath the Garment Name field.
- A "Garment is for a special event" checkbox appears beneath the Due date.
- When the special event checkbox is enabled, a Special event date picker appears beneath the checkbox.
- When the special event checkbox is disabled, the Special event date is hidden and cleared from state.

## 9. Pages & Components

- Orders list page:
  - Desktop header layout supports right‑aligned CTA.
  - Mobile layout includes sticky CTA component.
- Composer page: `/(app)/orders/new` renders the single‑view composer.
- Provider: `OrderCreationProvider` holds in‑memory state (client, garments[], services per garment).
- Components:
  - Client: `ClientPicker` (add/select), `ClientCard` (summary with actions).
  - Garments: `GarmentList`, `GarmentEditor` (modal/drawer), `ServiceSpeedDial`, `ServiceAutocomplete`, `ServiceQuickAddDialog`, `ServicesTable`.
- State flow:
  - Client selection sets `selectedClient`.
  - Garment editor mutates `garments[]` with embedded `services[]` (client‑side only until submit).
  - CTA computes eligibility from state.

## 10. Backend Architecture (Server Actions)

- `createOrder(input)` — single transaction:
  - Input: `clientId`, `discountCents`, `garments: [{ name, notes?, dueDate?, specialEvent?: boolean, eventDate?, services: [{ quantity, unit, unitPriceCents, serviceId? , inline?: { name, description?, unit, unitPriceCents } }] }]`.
  - Validates rules from Data & Validation; ensures each garment has ≥1 service line.
  - If `inline` provided and "Don’t add to catalog" is false, first creates catalog service, then uses its ID. If opted out, store line with null `service_id` and copied fields.
  - Inserts `orders` (id, shop_id, client_id, status default 'new', discount_cents, tax_cents, subtotal_cents, total_cents, notes?), `garments`, and `garment_services` (service_id or inline copy) in one transaction.
  - Totals computed by DB triggers; rounding is half‑away‑from‑zero.
  - Revalidate path `/orders` and redirect to `/orders/[id]` on success.
- `createClient(input)` — inline client creation.
- Services utilities:
  - `searchServices(query)` — throttled server‑side search.
  - `getFrequentlyUsedServices()` — ordered.
  - `addService(input)` — used by quick add when persisting to catalog.

Notes:

- Totals (subtotal/discount/tax/total) are computed and stored via triggers.
- Order status default 'new'; further roll‑ups deferred.

## 11. Data Model & Migrations (Adjusted)

- `orders`
  - id uuid pk; shop_id uuid → shops.id (RLS); client_id uuid → clients.id; status text default 'new'; order_due_date date null; discount_cents int not null default 0; tax_cents int not null default 0; subtotal_cents int not null default 0; total_cents int not null default 0; notes text; created_at/updated_at
- `garments`
  - id uuid pk; order_id uuid → orders.id (cascade); name text not null; notes text; due_date date null; event_date date null; stage text not null default 'New' check in ('New','In Progress','Done','Archived'); timestamps
- `garment_services`
  - id uuid pk; garment_id uuid → garments.id (cascade)
  - service_id uuid null → services.id (nullable when using inline non‑catalog entries)
  - name text not null; description text; quantity int check (quantity > 0)
  - unit text check (unit in ('item','hour','day','week'))
  - unit_price_cents int check (unit_price_cents >= 0)
  - line_total_cents int generated always as (quantity \* unit_price_cents) stored
- `services` (catalog) — add fields
  - frequently_used boolean default false; frequently_used_position int
  - default_unit text default 'item'; default_qty int default 1; default_unit_price_cents int default 0

Indexes & RLS

- Indexes: `orders(shop_id, created_at desc)`, `garments(order_id, stage)`, `garment_services(garment_id)`
- RLS: enable on all; policies constrain access to the current shop by deriving `shop_id` via join (as used in appointments policies). For `garment_services`, derive via join garments → orders.

## 12. Caching & Performance

- Reads: Server Components; list may use `next: { revalidate: 60 }` (path-based) or tag-based `revalidateTag('orders')`.
- Mutations: Server Actions only; after create/update, call `revalidatePath('/orders')`; optionally revalidate detail path.
- Avoid duplicate API routes for creation.

## 13. Accessibility

- Labels on client card/actions; headings as landmarks.
- Autocomplete: aria‑live for results; proper roles/keyboard navigation.
- Dialogs: labeled titles/descriptions; focus trap; Escape to close.

## 14. Testing (Mandatory)

- Unit
  - Validation rules for garments and service lines; quick‑add persistence toggle.
- Integration
  - `createOrder` transaction happy/edge cases; inline vs catalog services; RLS violations.
- E2E (Playwright, mobile)
  - Orders page CTA → composer → client select/create → add garments → add services via each path → create order; a11y checks on both pages.
- Coverage ≥80% on actions/business logic; a11y tests in CI.

Note: For this initial implementation PR, tests will follow in a separate PR.

## 15. Deliverables & Milestones

- Deliverables
  - Migrations (017/018/019) + RLS policies + types
  - Server Actions implemented
  - Orders list page CTA + single‑view composer UI + order detail page
- Milestones (estimate)
  - M1 (1–2d): Schema adjustments + RLS + services settings additions
  - M2 (3d): Single‑view composer UI (client picker/card, garments list/editor, services interactions) with client‑side validation
  - M3 (2d): Server Actions (`createOrder`, services utils, createClient) + wiring + revalidation/redirect
  - M4 (2d): Order detail page + polish (accessibility, sticky CTA, error states); tests in follow‑up PR

Create new tables (shop-scoped) and supporting indexes/policies.

- orders
  - id uuid pk
  - shop_id uuid → shops.id (RLS scope)
  - client_id uuid → clients.id
  - status text (enum-like via check: pending/in_progress/ready_for_pickup/completed/cancelled)
  - order_due_date date null
  - notes text null
  - subtotal_cents int not null default 0
  - discount_cents int not null default 0
  - tax_cents int not null default 0
  - total_cents int not null default 0
  - created_at timestamptz default now()
  - updated_at timestamptz default now()

- garments
  - id uuid pk
  - order_id uuid → orders.id on delete cascade
  - title text not null
  - notes text null
  - photo_url text null
  - event_date date null
  - due_date date null
  - stage text not null default 'New' check in ('New','In Progress','Done','Archived')
  - created_at timestamptz default now()
  - updated_at timestamptz default now()

- garment_services
  - id uuid pk
  - garment_id uuid → garments.id on delete cascade
  - service_id uuid → services.id (catalog)
  - quantity int not null check (quantity > 0)
  - unit_price_cents int not null check (unit_price_cents >= 0)
  - unit text not null
  - line_total_cents int not null (maintained by trigger)

Indexes

- orders (shop_id, status, created_at desc)
- garments (order_id, stage)
- garment_services (garment_id)

Triggers (recommended for consistency)

- BEFORE INSERT/UPDATE on garment_services → set line_total_cents = quantity × unit_price_cents
- AFTER INSERT/UPDATE/DELETE on garment_services → roll up orders.subtotal_cents, tax_cents, total_cents
- AFTER UPDATE of garments.stage → optional order status roll-up (or handle in Server Actions)

RLS

- Enable RLS on all 3 tables
- Policies: tenant access where `shop_id = auth_shop_id()`
- For `garment_services`, derive shop via join to garments → orders → shop_id in policy using `USING` subquery
- Enforce server-side population of `shop_id` (never client-supplied)

Seed data (dev): add 8 services marked `frequently_used` with positions 1–8 to support speed dial.

## 6. Server Actions (Authoritative API)

- createOrder(input): { orderId }
  - Validates: client belongs to shop; ≥1 garment; per-garment ≥1 service; quantities ≥1; discount within bounds
  - Transaction: insert order, garments, garment_services; compute totals (using shop.tax_percent)
  - Revalidation: `revalidatePath('/orders')`; `redirect('/orders/[id]')`

- updateOrder(orderId, patch)
  - Patch fields: notes, order_due_date, status (guard transitions)

- updateGarmentStage(garmentId, stage)
  - Enforce allowed stages; optionally roll-up order status

- addGarment(orderId, garment)
- addServiceLine(garmentId, line)
- removeServiceLine(lineId)
- removeGarment(garmentId)

- Services catalog utilities
  - searchServices(query)
  - addService(input) — for modal create
  - editService, deleteService, fetchAllServices (reused patterns)

All actions derive `shop_id` from session; use Supabase SSR client; return typed results or structured error for `useActionState`.

## 7. Pages & Components

- Pages
  - `/(app)/orders/new` → single‑view composer
  - `/(app)/orders/[id]` → order detail (DB-backed)
  - `/(app)/orders` → orders list (DB-backed)

- Provider
  - `OrderCreationProvider` (in-memory only): selectedClient, garments[], discountCents, derived totals, taxPercent

- Composer Sections
  - Client: `ClientPicker` + `ClientCard`
  - Garments: cards + editor (optional photo)
  - Services: per-garment editor, `ServicesSearch`, `AddServiceDialog`, speed dial; inline empty-catalog banner when applicable
  - Review: sticky CTA and summary

- Reuse/Port prior UI patterns from previous app for ClientLookup and ServicesSearch (TypeScript, strict types)

## 8. Validation & Error Handling

- Step guards: require persisted client; ≥1 garment; ≥1 service per garment
- Field validation: non-empty title, quantity ≥1, prices ≥0, discount ≤ subtotal
- Server-side zod schemas mirror client rules; errors surfaced via `useActionState`
- Submit once; disable CTA while pending; idempotency at UX layer

## 9. Caching & Performance

- Reads: Server Components; list may use `revalidateTag('orders')` or `next: { revalidate: 60 }`
- Mutations: Server Actions only; revalidate `/orders` and detail path
- Avoid duplicate API routes for create

## 10. Accessibility & Mobile

- Stepper with `aria-current`, properly labeled inputs, `aria-live` errors
- Sticky bottom CTA on mobile; large tap targets; responsive tables/rows

## 11. Integrations (Post-Create)

- Create invoice: link to `/(app)/invoices/new?order={id}` with prefilled lines
- Schedule appointment: link to `/(app)/appointments/new?client={id}&order={id}`
- Send confirmation email via existing Email Service (template later)

## 12. Testing (Mandatory)

- Unit
  - Pricing math (subtotal/discount/tax/total, rounding, clamp)
  - Status roll-up logic (garment → order)
  - Zod schemas for CreateOrderInput
- Integration
  - createOrder transaction happy/edge cases; RLS violations; totals; FKs
  - Service search/add flows
- E2E (Playwright, mobile viewport)
  - Full create flow; validation blocks; a11y scan on each step
- Coverage ≥80% on actions/business logic; a11y tests in CI

## 13. Deliverables & Milestones

- Deliverables
  - Migrations + RLS policies + types
  - Server Actions implemented with tests
  - New Order UI (4 steps) + orders list/detail wired to DB

- Milestones (estimate)
  - M1 (1–2d): Migrations+RLS+types+list/detail reads
  - M2 (2d): Steps 1–2 UI (client+garments)
  - M3 (3d): Step 3 services + pricing + add-service modal
  - M4 (3d): Review/submit + server action + tests
  - M5 (3d): Detail actions + list filters + E2E/a11y

## 14. Open Items

- Price override per line in MVP? If yes, confirm requirement for confirmation/audit trail
- Order due date default: use max garment due_date when omitted?

---

Owner: Architecture Team
Version: 1.0 (MVP)
