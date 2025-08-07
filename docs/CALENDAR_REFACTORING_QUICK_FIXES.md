# Quick Fixes for Calendar Refactoring

## 1. Install Required Dependencies

```bash
npm install @tanstack/react-query@^5.17.0 @tanstack/react-query-devtools@^5.17.0 react-hot-toast@^2.4.1
```

## 2. Import Path Updates

Since we created `appointments-refactored.ts`, you need to either:

### Option A: Update imports in query files

```typescript
// In src/lib/queries/appointment-queries.ts
// Change from:
import { ... } from '@/lib/actions/appointments';

// To:
import { ... } from '@/lib/actions/appointments-refactored';
```

### Option B: Merge refactored code into original file

1. Backup the original: `cp src/lib/actions/appointments.ts src/lib/actions/appointments.backup.ts`
2. Add new functions to the original file
3. Keep both old and new functions during migration

## 3. Type Fixes

### Fix CalendarWithQuery component props

```typescript
// In CalendarWithQuery.tsx, update the calendar render:
<CalendarComponent
  appointments={appointments}
  shopHours={shopHours}
  onAppointmentClick={onAppointmentClick || undefined}
  onDateClick={onDateClick || undefined}
  onRefresh={handleRefresh}
/>
```

### Fix TypeScript strict null checks

```typescript
// In appointment-queries.ts, update the client type:
client: newAppointment.clientId ? {
  id: newAppointment.clientId,
  first_name: '',
  last_name: '',
  email: '',  // Change from null to empty string
  phone_number: '',  // Change from null to empty string
  accept_email: false,
  accept_sms: false,
} : undefined as any,  // Type assertion for now
```

## 4. Complete Migration Steps

1. **Install dependencies first**
2. **Choose import strategy** (Option A or B above)
3. **Run the database migration**
4. **Test with a small dataset first**
5. **Monitor performance metrics**

## 5. Testing Checklist

- [ ] Dependencies installed successfully
- [ ] No TypeScript errors
- [ ] Database migration applied
- [ ] Calendar loads without errors
- [ ] Appointments display correctly
- [ ] Navigation works smoothly
- [ ] Create/Update/Delete operations work
- [ ] Prefetching is active (check Network tab)

## Notes

- The refactoring is designed to be backwards compatible
- You can run both old and new systems in parallel during migration
- Use feature flags to control rollout
- Monitor error rates during deployment
