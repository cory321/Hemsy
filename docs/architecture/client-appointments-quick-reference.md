# Client Appointments Section - Quick Reference

## 🎯 Feature Overview

Add appointments section to client detail page showing all appointments for that specific client.

## 📁 File Structure

```
src/
├── components/clients/
│   ├── ClientAppointmentsSection.tsx    # Main container
│   ├── AppointmentsList.tsx             # List renderer
│   ├── AppointmentListItem.tsx          # Individual item
│   └── AppointmentFilters.tsx           # Filter controls
├── lib/
│   ├── actions/appointments-refactored.ts
│   │   └── getClientAppointments()      # Enhanced with filters
│   └── queries/client-appointment-queries.ts
│       └── useClientAppointments()      # React Query hook
└── app/(app)/clients/[id]/page.tsx      # Integration point
```

## 🔧 Key Components

### ClientAppointmentsSection

```typescript
<ClientAppointmentsSection
  clientId={client.id}
  clientName={`${client.first_name} ${client.last_name}`}
  shopId={shopData.id}
/>
```

### Data Fetching

```typescript
const { data, isLoading, error } = useClientAppointments(shopId, clientId, {
  includeCompleted: true,
  statuses: ['pending', 'confirmed'],
});
```

## 🎨 UI Components

### Status Badges

```typescript
// Appointment Types
consultation → 💬 Blue (#2196F3)
fitting      → ✂️  Purple (#9C27B0)
pickup       → 📦 Orange (#FF9800)
delivery     → 🏠 Green (#4CAF50)
other        → ⋯  Grey (#607D8B)

// Status Colors
pending   → warning (orange)
confirmed → success (green)
declined  → error (red)
canceled  → default (grey)
no_show   → error (red)
```

### Layout Structure

```
┌─────────────────────────────────┐
│  Appointments (12)     [+ New]  │
├─────────────────────────────────┤
│  [All] [Upcoming] [Past] [...]  │
├─────────────────────────────────┤
│  Upcoming Appointments          │
│  ├─ Tomorrow 2:00 PM           │
│  └─ Dec 28 10:00 AM            │
├─────────────────────────────────┤
│  Past Appointments              │
│  └─ Dec 15 3:00 PM             │
└─────────────────────────────────┘
```

## 🚀 Implementation Steps

1. **Update Client Page**

   ```typescript
   // In src/app/(app)/clients/[id]/page.tsx
   import ClientAppointmentsSection from '@/components/clients/ClientAppointmentsSection';

   // Add after existing client info sections
   <ClientAppointmentsSection ... />
   ```

2. **Create Main Component**
   - Fetch appointments with React Query
   - Group by upcoming/past/canceled
   - Handle filters and state

3. **Style Consistently**
   - Match existing card elevation (2)
   - Use theme spacing and colors
   - Mobile-first responsive design

4. **Add Interactions**
   - Expand/collapse for details
   - Quick status updates
   - New appointment creation

## 📊 State Management

### Filter State

```typescript
interface FilterState {
  statuses: AppointmentStatus[];
  showPast: boolean;
  showUpcoming: boolean;
  showCanceled: boolean;
}
```

### Grouping Logic

```typescript
const now = new Date();
appointments.reduce(
  (groups, apt) => {
    const aptDate = new Date(`${apt.date} ${apt.start_time}`);

    if (apt.status === 'canceled') {
      groups.canceled.push(apt);
    } else if (aptDate >= now) {
      groups.upcoming.push(apt);
    } else {
      groups.past.push(apt);
    }
    return groups;
  },
  { upcoming: [], past: [], canceled: [] }
);
```

## ⚡ Performance Tips

1. **React Query Settings**

   ```typescript
   staleTime: 30 * 1000,      // 30 seconds
   gcTime: 5 * 60 * 1000,     // 5 minutes
   refetchOnWindowFocus: true,
   ```

2. **Component Optimization**
   - Memoize list items
   - Use skeleton loaders
   - Implement virtual scrolling for 50+ items

3. **Mobile Performance**
   - Lazy load expanded content
   - Minimize re-renders
   - Use CSS transforms for animations

## 🧪 Testing Checklist

- [ ] Renders appointment count
- [ ] Filters work correctly
- [ ] Groups appointments properly
- [ ] Empty state displays
- [ ] New appointment prefills client
- [ ] Status updates optimistically
- [ ] Mobile responsive
- [ ] Accessibility compliant

## 🔗 Related Documentation

- [Full Architecture Document](./client-appointments-section.md)
- [Implementation Specification](./client-appointments-implementation-spec.md)
- [User Stories](../stories/Phase-5/client-appointments-feature.md)

## 💡 Quick Tips

1. **Reuse Existing Components**
   - AppointmentDialog for creation
   - Existing appointment type/status configs
   - Current date/time formatters

2. **Maintain Consistency**
   - Match calendar color scheme
   - Use same status terminology
   - Follow existing patterns

3. **Error Handling**
   - Show friendly error messages
   - Implement retry mechanisms
   - Log errors for debugging

4. **Future-Proof**
   - Design for pagination
   - Consider bulk operations
   - Plan for analytics integration
