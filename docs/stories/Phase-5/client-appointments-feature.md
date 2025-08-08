# Feature: Client Appointments Section

**Epic**: Client Relationship Management Enhancement  
**Phase**: 5 (Appointments & Scheduling)  
**Priority**: High  
**Estimated Effort**: 2-3 weeks

---

## Overview

Add a comprehensive Appointments section to the individual Client View page, enabling seamstresses to view and manage all appointments associated with a specific client. This feature enhances client relationship management by providing historical context and future scheduling information in one centralized location.

---

## User Stories

### US-5.2.1: View Client Appointments List

**As a** seamstress  
**I want to** see all appointments for a specific client on their profile page  
**So that** I can understand our complete service history and upcoming schedule

**Acceptance Criteria:**

- [ ] New "Appointments" section appears on the client detail page
- [ ] Section shows total count of appointments in the header
- [ ] Appointments are grouped into "Upcoming" and "Past" categories
- [ ] Each appointment shows: date, time, type, and status
- [ ] Section loads within 500ms on mobile devices
- [ ] Gracefully handles clients with no appointments

**Technical Notes:**

- Use existing `getClientAppointments` server action
- Implement with React Query for caching
- Mobile-first responsive design

---

### US-5.2.2: Filter Appointments by Status

**As a** seamstress  
**I want to** filter client appointments by status  
**So that** I can focus on specific types of appointments

**Acceptance Criteria:**

- [ ] Filter pills appear below section header
- [ ] Default filters: "All", "Upcoming", "Past", "Canceled"
- [ ] Selecting a filter updates the list immediately
- [ ] Multiple filters can be active simultaneously
- [ ] Filter state persists during the session
- [ ] Visual indicator shows active filters

**Technical Notes:**

- Use MUI ToggleButtonGroup for filter UI
- Store filter state in component state
- Apply filters client-side for performance

---

### US-5.2.3: Create New Appointment from Client View

**As a** seamstress  
**I want to** create a new appointment directly from the client's profile  
**So that** I can quickly schedule follow-ups without navigation

**Acceptance Criteria:**

- [ ] "+" button appears in the Appointments section header
- [ ] Clicking opens the appointment dialog
- [ ] Client field is pre-populated and locked
- [ ] Upon creation, new appointment appears in the list
- [ ] Success toast confirms appointment creation
- [ ] List refreshes to show the new appointment

**Technical Notes:**

- Reuse existing AppointmentDialog component
- Pass client_id as prefilled data
- Invalidate React Query cache on success

---

### US-5.2.4: Visual Status Indicators

**As a** seamstress  
**I want to** see clear visual indicators for appointment statuses  
**So that** I can quickly identify canceled, rescheduled, or special appointments

**Acceptance Criteria:**

- [ ] Each appointment type has a unique icon and color
- [ ] Status badges use consistent colors from the calendar
- [ ] Canceled appointments show with strikethrough or reduced opacity
- [ ] Rescheduled appointments show a special indicator
- [ ] Past appointments appear visually distinct from upcoming ones
- [ ] No-show appointments have a warning indicator

**Technical Notes:**

- Define appointment type/status configuration constants
- Use MUI Chip component for badges
- Maintain consistency with calendar styling

---

### US-5.2.5: Expand Appointment Details

**As a** seamstress  
**I want to** expand appointment items to see more details  
**So that** I can view notes and additional information without leaving the page

**Acceptance Criteria:**

- [ ] Appointments show in collapsed state by default
- [ ] Clicking/tapping expands to show notes and details
- [ ] Expand/collapse icon indicates current state
- [ ] Smooth animation for expand/collapse
- [ ] Multiple appointments can be expanded simultaneously
- [ ] Expanded state shows edit and status change actions

**Technical Notes:**

- Use MUI Collapse component
- Memo component to prevent unnecessary re-renders
- Store expanded state per appointment item

---

### US-5.2.6: Quick Status Updates

**As a** seamstress  
**I want to** quickly update appointment status from the client view  
**So that** I can manage appointments without opening dialogs

**Acceptance Criteria:**

- [ ] Pending appointments show "Confirm" quick action
- [ ] Confirmed appointments show "Complete" action
- [ ] Status updates happen optimistically
- [ ] Error handling with rollback on failure
- [ ] Success feedback via subtle animation
- [ ] Updated appointment moves to appropriate group

**Technical Notes:**

- Implement optimistic updates with React Query
- Use mutation with onMutate for immediate UI update
- Show toast on error with rollback

---

### US-5.2.7: Mobile-Optimized Experience

**As a** seamstress using a mobile device  
**I want** the appointments section to be fully functional on small screens  
**So that** I can manage client appointments on the go

**Acceptance Criteria:**

- [ ] Touch-friendly tap targets (minimum 44px)
- [ ] Swipe gestures for quick actions (future)
- [ ] Responsive layout adapts to screen size
- [ ] Pull-to-refresh functionality
- [ ] Appropriate font sizes for mobile
- [ ] No horizontal scrolling required

**Technical Notes:**

- Use useMediaQuery for responsive behavior
- Implement touch event handlers
- Test on actual mobile devices

---

### US-5.2.8: Empty State Experience

**As a** seamstress viewing a new client  
**I want** helpful guidance when no appointments exist  
**So that** I understand how to get started

**Acceptance Criteria:**

- [ ] Friendly empty state message
- [ ] Illustration or icon to make it visually appealing
- [ ] Call-to-action button to create first appointment
- [ ] Educational tip about appointment benefits
- [ ] Consistent with other empty states in the app
- [ ] Mobile-responsive empty state design

**Technical Notes:**

- Create reusable EmptyAppointmentsState component
- Include SVG illustration
- Link to appointment creation flow

---

## Implementation Checklist

### Phase 1: Foundation

- [ ] Create ClientAppointmentsSection component structure
- [ ] Set up React Query integration
- [ ] Implement basic data fetching
- [ ] Add loading skeleton
- [ ] Create empty state

### Phase 2: Core Features

- [ ] Implement appointment grouping logic
- [ ] Create AppointmentListItem component
- [ ] Add status and type badges
- [ ] Implement filter controls
- [ ] Add expand/collapse functionality

### Phase 3: Interactions

- [ ] Add "New Appointment" integration
- [ ] Implement quick status updates
- [ ] Add optimistic updates
- [ ] Create success/error feedback
- [ ] Add pull-to-refresh

### Phase 4: Polish

- [ ] Mobile optimization
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Cross-browser testing
- [ ] Documentation update

---

## Success Metrics

- **Performance**: Load time <500ms on 3G network
- **Usability**: Zero layout shift score
- **Adoption**: 80% of users view client appointments within first month
- **Efficiency**: 50% reduction in time to schedule follow-up appointments
- **Quality**: <2% error rate for appointment operations

---

## Dependencies

- Existing appointment system (Phase 5.1)
- Client management system (Phase 2.1)
- React Query setup
- Material UI components

---

## Future Enhancements

1. **Appointment Analytics**
   - Service frequency graphs
   - No-show rate tracking
   - Preferred time analysis

2. **Bulk Operations**
   - Multi-select appointments
   - Batch rescheduling
   - Export functionality

3. **Communication Integration**
   - Send reminder from appointment
   - Quick message client
   - View communication history

4. **Smart Suggestions**
   - AI-powered scheduling recommendations
   - Automatic follow-up suggestions
   - Conflict detection

---

## Notes

- This feature significantly enhances the value of the client profile page
- Consider A/B testing the default filter state
- Monitor performance impact of loading appointments
- Gather user feedback on information density
- Consider pagination for clients with many appointments (>50)
