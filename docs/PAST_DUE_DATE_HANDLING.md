# Past Due Date Handling in Garment Edit Dialog

## Problem Statement

When editing a garment with a past due date, the original implementation prevented saving the garment because it had validation that blocked all past dates. This made it impossible to edit other fields (like name or notes) for garments that already had past due dates.

## Solution Implemented

The garment edit dialog (`GarmentEditDialogOptimistic.tsx`) has been updated to intelligently handle past due dates:

### Key Changes

1. **Track Original Date Status**
   - The component now tracks whether the garment originally had a past due date or event date
   - This is determined when the dialog opens by comparing dates to today

2. **Conditional Validation**
   - Past dates are **allowed** if the garment already had a past due date
   - Past dates are **prevented** if the garment didn't originally have a past due date
   - This prevents accidentally setting past dates while allowing existing ones to be kept

3. **User-Friendly Warnings**
   - Shows an alert when editing a garment with a past due date
   - Displays the original past date so users are aware
   - Provides helper text explaining that past dates are allowed in this scenario

4. **DatePicker Configuration**
   - The `minDate` prop is conditionally set based on whether the original date was past
   - If original date was past: no minimum date restriction
   - If original date was not past: minimum date is today

## Implementation Details

### Code Structure

```typescript
// Track if the garment originally had a past due date
const today = dayjs().startOf('day');
const originalDueDateIsPast = garment.due_date
  ? dayjs(garment.due_date).isBefore(today)
  : false;
const originalEventDateIsPast = garment.event_date
  ? dayjs(garment.event_date).isBefore(today)
  : false;
```

### Validation Logic

```typescript
// Only validate if the garment didn't originally have a past date
if (formData.dueDate) {
  const dueDateIsPast = dayjs(formData.dueDate).isBefore(today);

  // If setting a new past date (and the original wasn't past), prevent it
  if (dueDateIsPast && !originalDueDateIsPast) {
    setDateValidationError('Due date cannot be in the past.');
    return;
  }
}
```

### UI Feedback

```typescript
{/* Show warning if the garment has a past due date */}
{originalDueDateIsPast && (
  <Alert severity="warning" sx={{ mb: 1 }}>
    This garment has a past due date ({dayjs(garment.due_date).format('MMM DD, YYYY')}).
    You can keep the existing date or select a new one.
  </Alert>
)}
```

## Testing Scenarios

### Scenario 1: Garment with Past Due Date

- ✅ Shows warning alert
- ✅ Allows keeping the existing past date
- ✅ Allows selecting a different past date
- ✅ Allows changing to a future date
- ✅ Can save changes without date validation errors

### Scenario 2: Garment with Future Due Date

- ✅ No warning shown
- ✅ Prevents selecting past dates
- ✅ Shows error if trying to set past date
- ✅ Allows changing to different future dates

### Scenario 3: Garment with No Due Date

- ✅ No warning shown
- ✅ Prevents selecting past dates
- ✅ Can set any future date

### Scenario 4: Event Date Handling

- ✅ Same logic applies to event dates
- ✅ Shows separate warning for past event dates
- ✅ Validates event date cannot be before due date

## User Experience Benefits

1. **No Data Loss**: Users can edit garments with past due dates without being forced to change the date
2. **Clear Communication**: Warnings explain why past dates are allowed in specific scenarios
3. **Prevents Mistakes**: Still prevents accidentally setting past dates for garments that don't already have them
4. **Flexibility**: Users can update past dates to future dates if desired

## Server-Side Considerations

The server action (`updateGarment`) doesn't validate dates, allowing the client to control this logic. This is appropriate since:

- The client has the context of whether a date was already past
- The server trusts authenticated users to make valid updates
- Historical data integrity is preserved

## Future Enhancements

1. **Audit Trail**: Track when dates are changed from past to future or vice versa
2. **Bulk Operations**: Handle past due dates in bulk edit scenarios
3. **Reporting**: Flag garments with past due dates in analytics
4. **Notifications**: Alert users when due dates become past
