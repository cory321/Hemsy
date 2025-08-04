# Calendar Past Dates and Closed Days Visual Indicators

## Overview

This document describes the visual indicators implemented for days where appointments cannot be created in the calendar views.

## Implementation

### Visual Indicators

Days where appointments cannot be created are now visually distinguished in all calendar views:

1. **Past Dates**
   - Background color: Light grey (using `alpha(theme.palette.action.disabled, 0.08)`)
   - Text color: Disabled text color (`text.disabled`)
   - Hover effect: Darker grey instead of primary color
   - Still clickable but no appointment creation allowed

2. **Closed Days**
   - Background color: Very light grey (using `alpha(theme.palette.action.disabled, 0.02)`)
   - "Closed" badge displayed in month view
   - Still clickable but no appointment creation allowed

3. **Past + Closed Days**
   - Past date styling takes precedence
   - Shows the grey background of past dates

### Affected Components

1. **MonthViewDesktop**
   - Day cells show grey background for past dates
   - Day numbers appear in disabled text color
   - Hover state adjusted for non-creatable days

2. **WeekViewDesktop**
   - Day headers show grey background for past dates
   - Day column backgrounds are grey for past dates
   - Text colors adjusted accordingly

3. **DayView**
   - Time slots have grey background for past dates
   - Header message indicates if date is past
   - "Add appointment" hints only show for valid dates

4. **CalendarDesktop (Mini Calendar)**
   - Days show appropriate grey backgrounds
   - Hover states adjusted for consistency

### Utility Functions Added

1. **`isPastDate(date: Date): boolean`**
   - Checks if a date is before today (midnight comparison)
   - Returns true for any date before today

2. **`canCreateAppointment(date: Date, shopHours: Array): boolean`**
   - Checks if appointments can be created on a specific date
   - Returns false for past dates or closed days
   - Used to determine clickability and visual feedback

### User Experience

- **Visual Clarity**: Users can immediately see which days are not available for booking
- **Consistency**: All calendar views use the same visual language
- **Accessibility**: Still clickable for viewing existing appointments
- **Feedback**: Appropriate hover states indicate interactivity level

### Testing

Unit tests have been added to verify the behavior of the new utility functions:

- `src/__tests__/unit/utils/calendar.test.ts`

The tests cover:

- Past date detection
- Shop hours validation
- Combined conditions for appointment creation
