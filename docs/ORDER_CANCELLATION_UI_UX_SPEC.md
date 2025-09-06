# Order Cancellation UI/UX Specification

## Overview

This document provides detailed UI/UX specifications for implementing order cancellation in Threadfolio V2. All designs follow Material UI patterns and prioritize mobile-first responsive design.

## Visual Design System

### Status Indicators

#### Cancelled Order Badge

```typescript
<Chip
  label="CANCELLED"
  size="small"
  sx={{
    backgroundColor: '#ef4444',
    color: 'white',
    fontWeight: 600,
    fontSize: '0.75rem',
    height: 24,
    '& .MuiChip-label': {
      px: 1.5
    }
  }}
/>
```

#### Cancelled Order Card Treatment

- **Opacity**: 60% (0.6)
- **Filter**: grayscale(50%)
- **Background**: Subtle striped pattern overlay
- **Border**: Dashed border in error color
- **Interaction**: Reduced hover effects

### Color Palette

| Element             | Color        | Hex     | Usage                         |
| ------------------- | ------------ | ------- | ----------------------------- |
| Cancel Button       | Error Red    | #d32f2f | Primary cancel action         |
| Cancel Button Hover | Dark Red     | #c62828 | Hover state                   |
| Restore Button      | Primary Blue | #1976d2 | Restore action                |
| Warning Background  | Amber Light  | #fff3cd | Warning messages              |
| Warning Border      | Amber        | #ffc107 | Warning borders               |
| Cancelled Text      | Grey         | #6b7280 | Muted text on cancelled items |

## Component Specifications

### 1. Order Detail Page - Cancellation Section

#### Location

Bottom of order detail page, above action buttons

#### Desktop Layout (>768px)

```
┌─────────────────────────────────────────────┐
│ Order Management                            │
├─────────────────────────────────────────────┤
│ ⚠️ Warning: This order has work in progress │
│                                             │
│ [Cancel Order]                              │
└─────────────────────────────────────────────┘
```

#### Mobile Layout (<768px)

```
┌─────────────────────────┐
│ Order Management        │
├─────────────────────────┤
│ ⚠️ Warning: This order  │
│ has work in progress    │
│                         │
│ [    Cancel Order    ]  │
└─────────────────────────┘
```

#### States

**Active Order - Can Cancel:**

- Show red "Cancel Order" button
- Display contextual warning based on order progress

**Cancelled Order - Can Restore:**

- Replace with blue "Restore Order" button
- Show cancellation info (who, when, why)

**Completed Order - Cannot Cancel:**

- No cancellation section shown
- Direct users to refund process if needed

### 2. Cancel Order Dialog

#### Dialog Structure

```
┌──────────────────────────────────────────┐
│ Cancel Order #2024-0089?                 │ ✕
├──────────────────────────────────────────┤
│                                          │
│ ⚠️ Warning: Work in Progress             │
│                                          │
│ This order has:                          │
│ • 2 garments in progress                 │
│ • 1 garment ready for pickup             │
│ • $125.00 in completed work              │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ Cancellation Reason (Optional)     │   │
│ │                                    │   │
│ │ __________________________________ │   │
│ │ __________________________________ │   │
│ │ __________________________________ │   │
│ └────────────────────────────────────┘   │
│                                          │
│ This action cannot be automatically      │
│ undone. You can restore the order later. │
│                                          │
│ [Cancel]              [Confirm Cancel]   │
└──────────────────────────────────────────┘
```

#### Dialog Behavior

**Warning Levels:**

1. **No Work Started** (Green)
   - "This order has no work started yet."
   - Simple confirmation

2. **Work in Progress** (Amber)
   - List garments by stage
   - Show value of work completed
   - Emphasize customer communication needed

3. **Ready for Pickup** (Red)
   - Strong warning about completed work
   - Suggest contacting customer first
   - Show total order value

**Reason Field:**

- Optional field
- No minimum characters required
- Placeholder: "Add a reason for cancellation (optional)..."
- Character counter: "0/500"

**Buttons:**

- Cancel: Grey, closes dialog
- Confirm Cancel: Red, enabled immediately

### 3. Order List Filters

#### Desktop Filter Bar

```
┌─────────────────────────────────────────────────┐
│ Orders                                          │
├─────────────────────────────────────────────────┤
│ [Active ✓] [Cancelled] [All]  🔍 Search...     │
└─────────────────────────────────────────────────┘
```

#### Mobile Filter

```
┌─────────────────────┐
│ Orders              │
├─────────────────────┤
│ [Active ✓]          │
│ [Cancelled]         │
│ [All]               │
│                     │
│ 🔍 Search...        │
└─────────────────────┘
```

#### Filter States

- **Active** (default): Show non-cancelled orders
- **Cancelled**: Show only cancelled orders
- **All**: Show all orders including cancelled

### 4. Order Cards - Cancelled State

#### Compact Card - Cancelled

```
┌─────────────────────────────────────┐
│ #2024-0089  [CANCELLED]            │
│ Sarah Johnson                       │
│ ────────────────────────────────── │
│ 3 garments • Due: Dec 15           │
│ Cancelled: Dec 10 by shop owner    │
└─────────────────────────────────────┘
```

_60% opacity, grayscale filter applied_

#### Visual Modifications

- Strikethrough on order number
- Muted colors throughout
- "CANCELLED" badge in top right
- Show cancellation date instead of progress

### 5. Garment Page - Service Controls

#### Disabled State for Cancelled Orders

```
┌─────────────────────────────────────┐
│ Services                            │
├─────────────────────────────────────┤
│ ℹ️ Order cancelled - services frozen │
│                                     │
│ ✓ Hemming              $25.00      │
│ ✓ Take in waist       $35.00      │
│                                     │
│ [+ Add Service]  (disabled)         │
└─────────────────────────────────────┘
```

#### Disabled State Styling

- Buttons: 50% opacity, cursor not-allowed
- Tooltip on hover: "Cannot modify services for cancelled orders"
- Info banner at top of services section

### 6. Restoration Success Feedback

#### Toast Notification

```
┌────────────────────────────────┐
│ ✓ Order Restored Successfully  │
│   Order #2024-0089 is now      │
│   active again                 │
└────────────────────────────────┘
```

#### Page Update

- Immediate status update
- Remove cancelled styling
- Re-enable all controls
- Smooth transition animation (300ms)

## Interaction Patterns

### Cancel Order Flow

1. **Click Cancel Order**
   - Button shows loading state
   - Dialog opens with contextual warnings

2. **Enter Cancellation Reason (Optional)**
   - User can optionally add a reason
   - Confirm button is always enabled

3. **Confirm Cancellation**
   - Show processing state
   - Close dialog on success
   - Update page immediately
   - Show success toast

4. **Error Handling**
   - Show inline error in dialog
   - Keep dialog open
   - Allow retry

### Restore Order Flow

1. **Click Restore Order**
   - Immediate processing
   - No confirmation needed

2. **Success**
   - Update UI instantly
   - Show success toast
   - Enable all controls

3. **Error**
   - Show error message
   - Provide retry option

## Mobile-Specific Considerations

### Touch Targets

- Minimum 44x44px for all buttons
- Extra padding on mobile devices
- Clear spacing between actions

### Responsive Breakpoints

- **Mobile**: <768px
- **Tablet**: 768px-1024px
- **Desktop**: >1024px

### Mobile Optimizations

- Full-width buttons on mobile
- Stacked layouts for warnings
- Bottom sheet style for dialogs
- Swipe to dismiss (where appropriate)

## Accessibility Requirements

### WCAG 2.1 AA Compliance

1. **Color Contrast**
   - Error text: 4.5:1 minimum
   - Disabled states: 3:1 minimum
   - Focus indicators: 3:1 minimum

2. **Keyboard Navigation**
   - All controls keyboard accessible
   - Logical tab order
   - Escape closes dialogs

3. **Screen Reader Support**
   - Proper ARIA labels
   - Status announcements
   - Error announcements

4. **Focus Management**
   - Focus trap in dialogs
   - Return focus on close
   - Visual focus indicators

### ARIA Labels

```typescript
// Cancel button
aria-label="Cancel order number 2024-0089"

// Restore button
aria-label="Restore cancelled order number 2024-0089"

// Disabled service button
aria-label="Add service - disabled for cancelled orders"
aria-disabled="true"
```

## Animation Specifications

### Transitions

- **Duration**: 300ms for state changes
- **Easing**: Material UI standard easing
- **Properties**: opacity, filter, transform

### Cancel Animation

```css
@keyframes cancelOrder {
  0% {
    opacity: 1;
    filter: grayscale(0%);
  }
  100% {
    opacity: 0.6;
    filter: grayscale(50%);
  }
}
```

### Restore Animation

```css
@keyframes restoreOrder {
  0% {
    opacity: 0.6;
    filter: grayscale(50%);
  }
  100% {
    opacity: 1;
    filter: grayscale(0%);
  }
}
```

## Error States

### Common Error Messages

| Error                   | Message                                                                 | Display |
| ----------------------- | ----------------------------------------------------------------------- | ------- |
| Already Cancelled       | "This order is already cancelled"                                       | Toast   |
| Cannot Cancel Completed | "Completed orders cannot be cancelled. Use the refund process instead." | Dialog  |
| Network Error           | "Unable to cancel order. Please try again."                             | Dialog  |
| Permission Denied       | "You don't have permission to cancel this order"                        | Toast   |

## Performance Considerations

1. **Optimistic Updates**
   - Update UI immediately
   - Rollback on error
   - Show loading states appropriately

2. **Lazy Loading**
   - Load cancellation components on demand
   - Defer non-critical animations

3. **Caching**
   - Cache cancellation status
   - Update related queries

## Testing Checklist

- [ ] All buttons have proper touch targets
- [ ] Keyboard navigation works correctly
- [ ] Screen reader announces all states
- [ ] Animations respect prefers-reduced-motion
- [ ] Error messages are clear and actionable
- [ ] Mobile layout is fully responsive
- [ ] Loading states prevent double-submission
- [ ] Focus management works correctly
- [ ] Color contrast meets WCAG standards
- [ ] All interactive elements have hover/focus states
