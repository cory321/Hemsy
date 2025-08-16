# TypeScript Issues Requiring Human Decisions

## Summary

After fixing the simple TypeScript errors, there are several type-related issues that require architectural or design decisions. These issues generally fall into categories where changing the types could have broader implications on the application's behavior or data model.

## Issues by Category

### 1. Nullable vs Required Fields in Database Types

#### Client Type - Boolean Fields

- **Issue**: `accept_email` and `accept_sms` are defined as `boolean | null` in the database but `boolean` in the Client interface
- **Files Affected**: Multiple test files and components
- **Decision Needed**: Should these fields be nullable in the Client type, or should we ensure they always have a boolean value (defaulting to false)?

#### Appointment Type - order_id Field

- **Issue**: `order_id` is defined as nullable in the database but required in some type definitions
- **Location**: `src/lib/actions/appointments-refactored.ts`, appointment provider files
- **Decision Needed**: Should appointments without orders be allowed? If yes, `order_id` should be optional in the Appointment type.

### 2. Type Mismatches Between Database and Application Types

#### Client Type Compatibility

- **Issue**: `Tables<'clients'>` from Supabase doesn't match the `Client` interface exactly
- **Specific Problems**:
  - `mailing_address` is optional in Client but required (nullable) in database type
  - Type conversion issues in components using ClientSearchField
- **Decision Needed**: Should we create a mapper function to convert between database and application types, or align the types?

#### Service Type - Description Field

- **Issue**: `description` is `string | null` in database but `string` in Service interface
- **Location**: `src/components/services/ServiceList.tsx`
- **Decision Needed**: Should service descriptions be optional/nullable?

### 3. Missing or Incorrect Properties

#### Garment Properties

- **Issue**: Code references `stage_id` and `stage_color` which don't exist in the garment type
- **Location**: `src/app/(app)/garments/page.tsx`
- **Resolution**: RESOLVED - These properties were removed from the codebase as they are no longer in the database schema. The system now uses a fixed `stage` enum instead of customizable stages.

#### Order Due Date

- **Issue**: Code references `order_due_date` which doesn't exist in the Order type
- **Location**: `src/components/clients/OrderListItem.tsx`
- **Decision Needed**: Should this be `due_date` instead, or is this a missing property?

### 4. Authentication Type Issues

#### Auth Function Return Type

- **Issue**: `auth()` function seems to return a Promise but code expects synchronous return with `userId`
- **Location**: `src/lib/actions/emails/email-send.ts`
- **Decision Needed**: Should we await the auth() call or update the type definitions?

### 5. Strict Optional Property Types

The TypeScript configuration has `exactOptionalPropertyTypes: true`, which causes several issues:

#### undefined vs optional

- Many places try to pass `undefined` to optional properties
- **Decision Needed**: Should we:
  1. Keep strict mode and update all code to omit properties instead of passing undefined
  2. Disable `exactOptionalPropertyTypes` in tsconfig.json
  3. Update type definitions to explicitly allow undefined (e.g., `value?: string | undefined`)

### 6. Third-Party Library Issues

#### React Query Configuration

- **Issue**: `cacheTime` property doesn't exist (renamed to `gcTime` in newer versions)
- **Location**: `src/providers/QueryProvider.tsx`
- **Decision Needed**: Update to use `gcTime` or downgrade React Query version?

#### React Query Devtools Position

- **Issue**: `position="bottom-right"` is not a valid DevtoolsPosition
- **Decision Needed**: Check valid positions in the library documentation

### 7. Email System Type Inconsistencies

#### Email Type Enum

- **Issue**: Some email types in code don't match the EmailType enum
- Examples: 'appointment_reminder', 'payment_received', 'invoice_sent'
- **Decision Needed**: Should these be added to the EmailType enum or renamed to match existing types?

#### Shop Email Properties

- **Issue**: Code references `business_email`, `business_phone`, `business_address` which don't exist on Shop type
- **Location**: `src/lib/actions/emails/email-settings.ts`
- **Decision Needed**: Should these be added to the Shop type or use existing properties?

## Recommendations

1. **Database Type Alignment**: Consider creating a clear separation between database types and application types with explicit conversion functions
2. **Nullable Fields**: Make a consistent decision about nullable vs required fields based on business logic
3. **Type Guards**: Implement type guards for external data to ensure type safety
4. **Documentation**: Document the decisions made for each of these issues for future reference

## Next Steps

1. Review each category with the team
2. Make decisions based on business requirements and existing data
3. Create migration scripts if database changes are needed
4. Update type definitions consistently across the codebase
5. Add runtime validation where appropriate
