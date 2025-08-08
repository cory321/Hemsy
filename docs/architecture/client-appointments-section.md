# Client Appointments Section Architecture

_Document Version: 1.0_  
_Created: December 2024_  
_Author: Winston, System Architect_

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [User Requirements & Stories](#user-requirements--stories)
3. [Technical Architecture](#technical-architecture)
4. [Data Model & API Design](#data-model--api-design)
5. [UI/UX Architecture](#uiux-architecture)
6. [Performance Optimization Strategy](#performance-optimization-strategy)
7. [Security & Access Control](#security--access-control)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Future Enhancements](#future-enhancements)

---

## 1. Feature Overview

The Client Appointments Section is a new feature within the individual Client View page that provides seamstresses with a comprehensive view of all appointments associated with a specific client. This feature enhances the client management experience by consolidating appointment history and upcoming schedules in one intuitive interface.

### Core Value Proposition

- **Holistic Client View**: See all client interactions in one place
- **Historical Context**: View past appointments to understand service patterns
- **Future Planning**: See upcoming appointments for better preparation
- **Status Tracking**: Monitor rescheduled and canceled appointments

### Business Impact

- Improved client relationship management
- Better service personalization based on history
- Reduced scheduling conflicts
- Enhanced decision-making for client services

---

## 2. User Requirements & Stories

### Epic: Client Appointment Management

**Goal**: Enable seamstresses to view and manage all appointments for a specific client within the client's profile page.

#### User Stories

**US-CA-1**: As a seamstress, I want to see all appointments for a client on their profile page so I can understand our service history at a glance.

**US-CA-2**: As a seamstress, I want to filter appointments by status (upcoming, past, canceled, rescheduled) so I can focus on relevant information.

**US-CA-3**: As a seamstress, I want to see appointment details (date, time, type, notes) inline so I don't need to navigate away from the client view.

**US-CA-4**: As a seamstress, I want to create a new appointment for this client directly from their profile so I can schedule follow-ups quickly.

**US-CA-5**: As a seamstress, I want to see visual indicators for appointment status so I can quickly identify canceled or rescheduled appointments.

**US-CA-6**: As a seamstress, I want appointments sorted chronologically (upcoming first, then past) so the most relevant information is immediately visible.

### Acceptance Criteria

- ✓ Appointments section loads within 500ms on mobile devices
- ✓ All appointment statuses are visually distinct
- ✓ Section is mobile-responsive with proper touch targets
- ✓ Data updates in real-time when appointments are modified elsewhere
- ✓ Graceful handling of clients with no appointments

---

## 3. Technical Architecture

### System Integration

```text
┌─────────────────────────────────────┐
│     Client View Page Component      │
│         (Server Component)          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Client Appointments Section       │
│      (Client Component)             │
├─────────────────────────────────────┤
│ • Appointment List Component        │
│ • Filter Controls                   │
│ • Quick Actions (New Appointment)   │
│ • Status Indicators                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│        Data Layer (Server)          │
├─────────────────────────────────────┤
│ • getClientAppointments()           │
│ • React Query Integration           │
│ • Optimistic Updates                │
│ • Real-time Subscriptions           │
└─────────────────────────────────────┘
```

### Component Architecture

1. **ClientAppointmentsSection** (Container Component)
   - Manages data fetching and state
   - Handles filtering logic
   - Coordinates child components

2. **AppointmentsList** (Presentation Component)
   - Renders appointment items
   - Groups by status/date
   - Handles empty states

3. **AppointmentListItem** (Atomic Component)
   - Displays individual appointment
   - Status badges and indicators
   - Quick actions (view, edit)

4. **AppointmentFilters** (Control Component)
   - Status filter toggles
   - Date range selector (future)
   - Sort options

### State Management

```typescript
interface ClientAppointmentsState {
  appointments: Appointment[];
  filters: {
    statuses: AppointmentStatus[];
    dateRange?: { start: Date; end: Date };
  };
  isLoading: boolean;
  error: Error | null;
  view: 'compact' | 'detailed';
}
```

---

## 4. Data Model & API Design

### Existing Data Structure

Leveraging the current appointment model with client relationships:

```typescript
interface Appointment {
  id: string;
  shop_id: string;
  client_id: string;
  order_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
  status: 'pending' | 'declined' | 'confirmed' | 'canceled' | 'no_show';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  client?: Client;
}
```

### Server Action Enhancement

Update existing `getClientAppointments` to support enhanced filtering:

```typescript
export async function getClientAppointments(
  shopId: string,
  clientId: string,
  options?: {
    includeCompleted?: boolean;
    statuses?: AppointmentStatus[];
    dateRange?: { start: string; end: string };
    limit?: number;
    offset?: number;
  }
): Promise<{
  appointments: Appointment[];
  total: number;
  hasMore: boolean;
}> {
  // Implementation with enhanced filtering
}
```

### React Query Integration

```typescript
// Query key factory
export const clientAppointmentKeys = {
  all: (clientId: string) => ['appointments', 'client', clientId] as const,
  list: (clientId: string, filters?: AppointmentFilters) =>
    [...clientAppointmentKeys.all(clientId), 'list', filters] as const,
};

// Custom hook
export function useClientAppointments(
  shopId: string,
  clientId: string,
  options?: AppointmentQueryOptions
) {
  return useQuery({
    queryKey: clientAppointmentKeys.list(clientId, options?.filters),
    queryFn: () => getClientAppointments(shopId, clientId, options),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

---

## 5. UI/UX Architecture

### Mobile-First Design Principles

1. **Progressive Disclosure**
   - Compact view by default
   - Expandable details on tap
   - Swipe actions for quick operations

2. **Visual Hierarchy**

   ```
   ┌─────────────────────────────────┐
   │  Appointments (12)     [+ New]  │ ← Section Header
   ├─────────────────────────────────┤
   │  [All] [Upcoming] [Past] [...]  │ ← Filter Pills
   ├─────────────────────────────────┤
   │  ┌───────────────────────────┐  │
   │  │ Tomorrow at 2:00 PM       │  │ ← Upcoming Group
   │  │ 👗 Fitting • Confirmed    │  │
   │  └───────────────────────────┘  │
   │  ┌───────────────────────────┐  │
   │  │ Dec 28 at 10:00 AM        │  │
   │  │ 📦 Pickup • Pending       │  │
   │  └───────────────────────────┘  │
   ├─────────────────────────────────┤
   │  Past Appointments              │ ← Section Divider
   ├─────────────────────────────────┤
   │  ┌───────────────────────────┐  │
   │  │ Dec 15 at 3:00 PM         │  │
   │  │ 🎯 Consultation • Done    │  │
   │  └───────────────────────────┘  │
   └─────────────────────────────────┘
   ```

3. **Status Indicators**
   - Color-coded badges (consistent with calendar)
   - Icons for appointment types
   - Strike-through for canceled
   - Clock icon for rescheduled

4. **Responsive Breakpoints**
   - Mobile (<600px): Single column, stacked layout
   - Tablet (600-960px): Wider cards with inline actions
   - Desktop (>960px): Grid layout option, side-by-side details

### Interaction Patterns

1. **Touch Gestures**
   - Tap: Expand/collapse details
   - Long press: Quick actions menu
   - Swipe right: Mark complete (future)
   - Swipe left: Quick reschedule (future)

2. **Loading States**
   - Skeleton screens for initial load
   - Optimistic updates for status changes
   - Pull-to-refresh on mobile

3. **Empty States**
   - Friendly message for new clients
   - CTA to create first appointment
   - Educational tooltip about benefits

---

## 6. Performance Optimization Strategy

### Data Loading Strategy

1. **Initial Load**
   - Server-side data fetching in parent component
   - Pass initial data to client component
   - Hydrate React Query cache

2. **Pagination**
   - Load 10 appointments initially
   - Infinite scroll for more
   - Virtual scrolling for large lists (>50 items)

3. **Caching Strategy**

   ```typescript
   // Stale-while-revalidate approach
   const cacheConfig = {
     staleTime: 30 * 1000, // Consider fresh for 30s
     gcTime: 5 * 60 * 1000, // Keep in cache for 5min
     refetchOnWindowFocus: true,
     refetchOnMount: 'always',
   };
   ```

4. **Optimistic Updates**
   - Immediate UI updates for status changes
   - Background sync with rollback on error
   - Toast notifications for sync status

### Rendering Optimization

1. **Component Memoization**

   ```typescript
   const AppointmentListItem = memo(
     ({ appointment, onUpdate }) => {
       // Component implementation
     },
     (prevProps, nextProps) => {
       // Custom comparison for re-render optimization
       return (
         prevProps.appointment.updated_at === nextProps.appointment.updated_at
       );
     }
   );
   ```

2. **Lazy Loading**
   - Defer loading of appointment details
   - Load create appointment dialog on demand
   - Code-split filter components

3. **Image Optimization**
   - Lazy load client avatars
   - Use Next.js Image component
   - Placeholder blur for images

---

## 7. Security & Access Control

### Data Access Patterns

1. **Row Level Security (RLS)**

   ```sql
   -- Existing RLS ensures users only see their shop's appointments
   -- No additional policies needed
   ```

2. **Client-Side Validation**
   - Verify shop ownership before API calls
   - Validate client belongs to shop
   - Sanitize filter inputs

3. **Audit Trail**
   - Log appointment views for analytics
   - Track filter usage patterns
   - Monitor performance metrics

### Privacy Considerations

- Client appointment history is sensitive
- Ensure proper auth checks at every level
- No client data in URLs or local storage
- Clear cache on logout

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1)

- [ ] Create `ClientAppointmentsSection` component structure
- [ ] Implement basic data fetching with existing API
- [ ] Add loading and empty states
- [ ] Basic mobile-responsive layout

### Phase 2: Core Features (Week 2)

- [ ] Implement status filtering
- [ ] Add appointment grouping (upcoming/past)
- [ ] Create appointment list items with status badges
- [ ] Add "New Appointment" quick action

### Phase 3: Enhancements (Week 3)

- [ ] Implement React Query integration
- [ ] Add optimistic updates
- [ ] Enhance mobile interactions
- [ ] Add pull-to-refresh

### Phase 4: Polish & Testing (Week 4)

- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Accessibility audit
- [ ] Documentation update

### Success Metrics

- Load time <500ms on 3G
- Zero layout shift
- 100% mobile usability score
- <2% error rate

---

## 9. Future Enhancements

### Near-term (3-6 months)

1. **Appointment Analytics**
   - Service frequency insights
   - No-show patterns
   - Preferred appointment times

2. **Bulk Operations**
   - Multi-select for rescheduling
   - Batch status updates
   - Export appointment history

3. **Communication Integration**
   - Quick SMS/Email from appointment
   - Automated follow-up suggestions
   - Reminder history

### Long-term (6-12 months)

1. **AI-Powered Insights**
   - Predictive scheduling suggestions
   - Client preference learning
   - Optimal appointment slot recommendations

2. **Client Portal Integration**
   - Client self-service rescheduling
   - Appointment history access
   - Digital appointment cards

3. **Advanced Filtering**
   - Service type grouping
   - Order association
   - Custom date ranges
   - Saved filter presets

---

## Conclusion

The Client Appointments Section represents a natural evolution of Threadfolio's client management capabilities. By following this architecture, we ensure a seamless, performant, and user-centric implementation that scales with the business needs of seamstresses.

This design prioritizes:

- **Mobile-first** responsive experience
- **Performance** through smart data loading
- **Usability** with intuitive interactions
- **Scalability** for future enhancements

The phased implementation approach allows for iterative development with continuous feedback integration, ensuring the final feature truly serves the needs of our users.
