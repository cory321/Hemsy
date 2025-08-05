# Calendar Refactoring - Quick Reference Card

## 🚀 Essential Commands

### Install Dependencies (Phase 1)

```bash
npm install @tanstack/react-query@^5.17.0 @tanstack/react-query-devtools@^5.17.0 react-hot-toast@^2.4.1
```

### Run Database Migration (Phase 2)

```bash
npx supabase migration up
# or
npx supabase db push --file supabase/migrations/004_optimize_appointment_indexes.sql
```

### Activate Components (Phase 3-5)

```bash
# Backup originals first!
cp src/app/layout.tsx src/app/layout.backup.tsx
mv src/app/layout-refactored.tsx src/app/layout.tsx

cp src/app/(app)/appointments/page.tsx src/app/(app)/appointments/page.backup.tsx
mv src/app/(app)/appointments/page-refactored.tsx src/app/(app)/appointments/page.tsx

cp src/app/(app)/appointments/AppointmentsClient.tsx src/app/(app)/appointments/AppointmentsClient.backup.tsx
mv src/app/(app)/appointments/AppointmentsClientRefactored.tsx src/app/(app)/appointments/AppointmentsClient.tsx
```

### Run Tests (Phase 6)

```bash
npm test
npm run test:e2e
npm run build
npm run type-check
```

## 📁 Key Files

### Core Implementation Files

- `/src/providers/QueryProvider.tsx` - React Query setup
- `/src/lib/queries/appointment-keys.ts` - Query key factory
- `/src/lib/queries/appointment-queries.ts` - React Query hooks
- `/src/lib/actions/appointments-refactored.ts` - Server actions
- `/src/app/api/appointments/time-range/route.ts` - Edge API
- `/src/components/appointments/CalendarWithQuery.tsx` - Main calendar

### Database Files

- `/supabase/migrations/004_optimize_appointment_indexes.sql` - Optimizations

### Files to Replace

- `layout.tsx` → Use `layout-refactored.tsx`
- `page.tsx` → Use `page-refactored.tsx`
- `AppointmentsClient.tsx` → Use `AppointmentsClientRefactored.tsx`

## 🔧 Common Fixes

### Import Path Issue

```typescript
// In appointment-queries.ts, change:
import { ... } from '@/lib/actions/appointments';
// To:
import { ... } from '@/lib/actions/appointments-refactored';
```

### TypeScript Errors

```typescript
// Add type assertions where needed
client: newAppointment.clientId ? {...} : undefined as any
```

### React Query Not Working

- Check QueryProvider is in root layout
- Verify DevTools appear in development
- Ensure imports are correct

## 📊 Performance Targets

- Initial Load: < 500ms ✅
- Navigation: < 50ms ✅
- Cache Hit Rate: > 80% ✅
- Memory Usage: < 50MB ✅

## 🧪 Quick Tests

### Test React Query

```typescript
// Browser Console
window.__REACT_QUERY_DEVTOOLS__?.version;
// Should show version number
```

### Test Database Functions

```sql
SELECT COUNT(*) FROM get_appointments_time_range(
  'shop-id'::uuid, '2024-01-01'::date, '2024-01-31'::date, false
);
```

### Test Prefetching

1. Open Network tab
2. Navigate calendar
3. Should see 3 requests (prev, current, next)

## ⚡ Architecture Overview

```
User Action → React Query Cache → Hit? → Return Cached
                    ↓ Miss
              Edge API → Supabase → Cache & Return
                    ↓
            Background Prefetch Adjacent Windows
```

## 🚨 Emergency Rollback

```bash
# Quick disable
CALENDAR_REFACTOR_ENABLED="false" npm run deploy

# Full rollback
mv src/app/layout.backup.tsx src/app/layout.tsx
mv src/app/(app)/appointments/page.backup.tsx src/app/(app)/appointments/page.tsx
mv src/app/(app)/appointments/AppointmentsClient.backup.tsx src/app/(app)/appointments/AppointmentsClient.tsx
npm run deploy
```

## ✅ Success Checklist

- [ ] Dependencies installed
- [ ] Database migration applied
- [ ] React Query DevTools visible
- [ ] Calendar loads < 500ms
- [ ] Navigation instant (no spinners)
- [ ] Create/Update/Delete works
- [ ] Tests passing
- [ ] No console errors

## 📝 Notes

- Keep browser DevTools open
- Monitor React Query cache
- Test with slow network
- Always backup before replacing files
