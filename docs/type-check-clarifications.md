## Type-Check Clarifications Required

Below are questions that need human clarification before proceeding. If confirmed, I can implement the fixes to achieve a clean `npm run type-check`.

### Appointment model

- **Nullable notes**: Should `Appointment.notes` be `string | null`? Code/tests often use `null`.
- **Nullable order_id**: Should `Appointment.order_id` be `string | null` (not optional)?
- **Status values**: Should `Appointment.status` include "scheduled" for UI filtering? It’s used in tests/UI but not in DB enums.
- **Joined client shape**: Should `appointment.client` be a full `Client`, or can it remain a reduced shape (id/name/email/phone only)?
- **user_id field**: Do we need a `user_id` on `Appointment`? Some tests include it.

### Client model

- **Address field**: Standardize on `mailing_address` only? Some tests reference `address`.
- **Opt-in booleans**: Should `accept_email` and `accept_sms` be strictly boolean (non-null) across UI logic, or remain `boolean | null` as per DB?

### Order model

- **Due date**: Do we have `order.order_due_date` in the domain model? It’s referenced in `OrderListItem.tsx` but not typed in `src/types/index.ts`.
- **Totals**: Are order totals represented as `total_cents` (cents) or `total` (dollars) in domain/UI? References vary.

### Service model

- **Description nullability**: Should `Service.description` be `string | null` (many components pass `null`)?
- **Type source**: Prefer DB `services.Row` types at the boundaries (lists/setters) to avoid mismatches, or keep a custom `Service` domain type and convert?
- **Money units**: Standardize on cents in DB and convert to dollars only in UI? OK to enforce consistently?

### Email types and templates

- **Expand EmailType**: Add missing values referenced in code: `'appointment_reminder'`, `'payment_received'`, `'invoice_sent'`?
- **EMAIL_VARIABLES structure**: There is a malformed nested block where `appointment_no_show` appears inside another config. Should we split into separate top-level entries for:
  - `appointment_no_show`
  - `appointment_reminder`
  - `payment_received`
  - `invoice_sent`
- **HTML support**: Is HTML email supported end-to-end? `testEmailTemplate` sends `html` and `text`, but `ResendClient` payload type doesn’t include `html` yet.

### Email sending (Resend)

- **replyTo key**: Confirm using `replyTo` (camelCase) rather than `reply_to`. OK to update all call sites?
- **Dual-part messages**: Should we always send both `text` and `html` when available?

### Clerk auth usage

- **Awaiting auth**: Standardize on `await auth()` everywhere. OK to update all server actions that currently call `auth()` sync?

### React Query configuration

- **Cache option name**: Switch `cacheTime` to `gcTime` (v5) across code?
- **Devtools position**: `"bottom-right"` is rejected by types. Keep devtools with defaults or remove the explicit `position`?

### Calendar/time parsing

- **TIME normalization**: Normalize Postgres `TIME` values (`HH:mm`/`HH:mm:ss`) to `HH:mm` strings internally across the app?
- **Closing-time rule**: In available slots, should end time be allowed to equal closing (`<=`) or strictly before (`<`) closing time?

### Supabase vs domain types

- **Preferred pattern**: Use domain models from `src/types/index.ts` everywhere, or prefer generated Supabase row types for DB-bound data and map to domain at boundaries? Current mix causes mismatches.
- **Joined shapes**: OK to add a `supabase-extended` typed Row with joined client fields and use it in actions/providers for safer typing?

### Garment time entries

- **Table existence**: Code references `"garment_service_time_entries"` which isn’t in generated types. Is this table intended now? If yes, please provide schema to add to types. If not, should we remove or feature-flag this module?

### Tests vs implementation

- **Aligning tests**: Should tests be refactored to match official types (e.g., replace `address` with `mailing_address`, avoid `scheduled`), or should we expand domain types to accommodate test assumptions?
- **Non-null DOM nodes**: In tests calling DOM APIs on possibly undefined nodes, should we add non-null guards in tests or relax helper typings?

### Strictness settings

- **Keep strict flags**: Keep `"exactOptionalPropertyTypes": true` and current strict settings? If yes, I’ll update domain types to explicitly allow `null` where used across UI/tests rather than relying on `undefined`.

### Misc

- **Import path fix**: `AppointmentProvider` imports `calculateDateRange` from `appointment-keys`, but it’s defined in `appointment-queries`. OK to fix import?
- **UI-only status mapping**: Any objection to supporting a UI-only `"scheduled"` status mapped to DB `"confirmed"` where needed?

### Proposed implementation (pending your confirmation)

- Update domain types: make `Appointment.notes` nullable; make `Appointment.order_id` nullable; consider adding UI `"scheduled"` status.
- Align `Service` types with nullable description; prefer DB Row types at DB boundaries.
- Fix email constants structure; extend `EmailType` to match all referenced types; add `html` to `ResendClient` payload; use `replyTo` consistently.
- Standardize `await auth()` usage in server actions.
- Replace `cacheTime` with `gcTime`; adjust devtools options to satisfy types.
- Fix incorrect import of `calculateDateRange` in `AppointmentProvider`.
- Address `Order` due date/total fields based on your preference above.

### Scope question

- Do you want me to also patch the test files for stronger type-safety (e.g., non-null checks for DOM queries), or focus on production code/domain types and leave tests intact?
