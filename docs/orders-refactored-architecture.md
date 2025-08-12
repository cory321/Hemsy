# Orders — Refactored Full-Stack Architecture (Client‑First, Single View)

## 0. Executive Summary

Replace the stepper with a streamlined, single-view composer. Start from the Orders page by clicking "Create Order", then add/select a client; in the same view, add garments and append services via speed dial, autocomplete, or quick add. Online-only. Server Actions are the authoritative mutation layer; Supabase with RLS enforces multi-tenant security.

## 1. Scope

- In scope: Client selection/creation, inline client summary card, garments section, services via speed dial/autocomplete/quick add, basic validation/formatting.
- Out of scope: Payments, taxes/discounts, status roll-ups, QR/invoices, offline drafts, role-based pricing.

## 2. High‑Level UX Flow

- Entry from Orders page:
  - Desktop: "Create Order" button placed to the right of the Orders page heading (top toolbar).
  - Mobile: sticky "Create Order" button at the bottom of the screen.
- Clicking "Create Order" navigates to the composer: `/(app)/orders/new`.
- Start in composer: "Add or Select Client" (blocking).
- After client picked/created:
  - Show compact client card pinned at top (name; email/phone if available).
  - Reveal "Garments" section below in the same view.
  - For each garment:
    - Add garment (name required; notes optional).
    - Append services via speed dial (frequent), autocomplete (search), or quick add (if not found).
    - Review/edit/remove services.
  - Add multiple garments as needed.
- Primary CTA: "Create Order" (disabled until requirements met).

## 3. UI Structure

### 3.1 Client Area

- Buttons: Add New Client, Select Existing (dialog/search; inline new-client form allowed).
- Client card: name prominent; email/phone secondary; actions: Change client, Remove client.

### 3.2 Garments Area

- "Add Garment" button (prominent; mobile FAB acceptable).
- Garment editor (modal/drawer):
  - Name (required), Instructions/notes (optional).
  - Services sub‑section:
    - Speed dial: up to 8 frequently used services (from settings).
    - Autocomplete: throttled search by name.
    - Quick add: minimal inline form (see 4. Services).
  - Services list: name, qty, unit, unit price (USD), line total; edit/remove inline.
  - Save garment (creates/updates in view state; persists on Create Order).
- Garments list: card per garment with summary and actions (Edit, Remove).

### 3.3 Primary CTA

- Composer: sticky bottom "Create Order" CTA on mobile.
- Disabled until: client selected AND ≥1 garment exists AND each garment has ≥1 valid service line.

## 4. Services Interactions

### 4.1 Speed Dial (Frequently Used)

- Sourced from Services settings (marked `frequently_used` + ordered).
- Tap adds default line (qty=1, default unit/price); row remains editable.

### 4.2 Autocomplete

- Throttled search by name; select to add with defaults; row editable.

### 4.3 Quick Add (if not found)

- Minimal form: name (required), description (optional), qty (int ≥ 1), unit (enum: item/hour/day/week), unit price (USD, non‑negative).
- Persist to catalog by default; checkbox: "Don’t add this service to catalog" to opt out.
- After save, add to current garment.

## 5. Data & Validation Rules

- Client: name required; email/phone optional.
- Garment: name required; notes optional.
- Service line:
  - Name required; description optional.
  - Quantity: integer ≥ 1.
  - Unit: enum { item, hour, day, week }.
  - Unit price: non‑negative; display formatted as USD.

## 6. Interaction Details

- Changing client after garments exist → confirmation dialog:
  - Keep current session: retain garments and services; reassign to new client.
  - Start new session: clear garments/services; proceed with selected client.
- Garment editing: reopens editor; services editable; save updates list state.
- Keyboard/Mobile: accessible autocomplete and dialogs (focus trap); sticky CTA.

## 7. Visual & Content Guidelines

- Orders list page:
  - Desktop: page heading left; primary "Create Order" button aligned right.
  - Mobile: sticky bottom "Create Order" button.
- Client card: compact, elevated; avatar/initial; subtle "Change/Remove" actions.
- Speed dial: large tap targets with labels/icons (max 8 items).
- Services list: dense but legible; right‑aligned currency.

## 8. Acceptance Criteria

- Orders page shows the "Create Order" CTA as specified (desktop top-right; mobile sticky bottom) and navigates to composer.
- After client selection/creation, client card appears; garments section becomes visible.
- Multiple garments supported; each with multiple services.
- Services addable via speed dial, autocomplete, and quick add (with default persistence and opt‑out checkbox).
- Quantity must be whole numbers; unit constrained; unit price formatted as USD.
- Notes captured per garment.
- "Create Order" disabled until client + garments + per‑garment ≥1 service line.
- On client change with existing garments, confirmation dialog appears and applies chosen behavior.

## 9. Configuration

- Services settings:
  - Mark services as `frequently_used` and set `frequently_used_position` ordering.
  - Defaults per service: `default_unit`, `default_qty` (1), `default_unit_price_cents`.
- Speed dial: maximum of 8 items shown based on ordering.

## 10. Accessibility

- Labels on client card/actions; headings as landmarks.
- Autocomplete: aria‑live for results; proper roles/keyboard navigation.
- Dialogs: labeled titles/descriptions; focus trap; Escape to close.

## 11. Frontend Architecture

- Orders list page:
  - Desktop header layout supports right-aligned CTA.
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

## 12. Backend Architecture (Server Actions)

- `createOrder(input)` — single transaction:
  - Input: `clientId`, `garments: [{ name, notes?, services: [{ serviceId? | inline: { name, description?, unit, unitPriceCents }, quantity }] }]`.
  - Validates rules from Section 5; ensures each garment has ≥1 service line.
  - If `inline` provided and "Don’t add to catalog" is false, first creates catalog service, then uses its ID.
  - Inserts `orders` (id, shop_id, client_id, notes?), `garments`, and `garment_services` (service_id or inline copy) in one transaction.
  - Revalidate `/orders` if list is cacheable; redirect to `/orders/[id]` on success.
- `createClient(input)` — inline client creation.
- Services utilities:
  - `searchServices(query)` — throttled server‑side search
  - `getFrequentlyUsedServices()` — ordered
  - `addService(input)` — used by quick add when persisting to catalog

Notes:

- No totals/taxes/discounts computed or stored in this refactor MVP.
- No status roll‑ups; status field optional/not required.

## 13. Data Model & Migrations (Adjusted)

- `orders`
  - id uuid pk; shop_id uuid → shops.id (RLS); client_id uuid → clients.id; notes text; created_at/updated_at
  - (Optional) status text for future use; no roll‑ups in MVP
- `garments`
  - id uuid pk; order_id uuid → orders.id (cascade); name text not null; notes text; timestamps
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

- Indexes: `orders(shop_id, created_at desc)`, `garments(order_id)`, `garment_services(garment_id)`
- RLS: enable on all; policies ensure `shop_id = auth_shop_id()`; `garment_services` derives via join garments → orders.

## 14. Observability & Testing

- Logging: action errors with context (shop_id, action, validation stage).
- Unit: validation rules for lines/garments; quick‑add persistence toggle.
- Integration: `createOrder` happy/edge paths; inline vs catalog services; RLS enforcement.
- E2E (mobile): orders page CTA → composer → client select/create → add garments → add services via each path → create order; a11y checks.
- Coverage ≥80% on business logic/actions.

## 15. Milestones

- M1 (1–2d): Schema adjustments + RLS + services settings additions.
- M2 (3d): Single‑view composer UI (client picker/card, garments list/editor, services interactions) with client‑side validation.
- M3 (2d): Server Actions (`createOrder`, services utils, createClient) + wiring + revalidation/redirect.
- M4 (2d): Tests (unit/integration/E2E/a11y) + polish (accessibility, sticky CTA, error states).
