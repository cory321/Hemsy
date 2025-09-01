# Ready For Pickup Dashboard Section

## Overview

The dashboard now includes a dedicated "Ready For Pickup" section that displays the latest 3 garments ready for customer pickup. This section appears directly below the main Garment Pipeline section and provides quick visibility into completed items awaiting collection.

## Visual Design

### Color Scheme

- **Primary Color**: `#BD8699` (Rose/Pink tone)
- **Background**: Light tinted background using 2% opacity of the primary color
- **Border**: 20% opacity of the primary color
- **Hover States**: 8% opacity for background, 50% opacity for borders

### Layout

- **Position**: Below the Garment Pipeline section in the center column
- **Card Style**: Matches the dashboard's card design with custom Ready For Pickup theming
- **Compact Items**: Space-efficient display showing essential information

## Features

### 1. Section Header

- **Icon**: LocalShipping icon in a colored box
- **Title**: "Ready For Pickup"
- **Subtitle**: Dynamic count (e.g., "3 garments ready for customer pickup")
- **View All Button**: Quick navigation to filtered garments page

### 2. Garment Items (Compact View)

Each garment item displays:

- **Check Icon**: Visual indicator that the garment is complete
- **Garment Name**: Truncated with ellipsis for long names
- **Client Name**: First name and last initial (e.g., "Jane S.")
- **Due Date Display**: Formatted date information
- **Ready Badge**: Clear "READY" indicator

### 3. Interactive Elements

- **Click on Item**: Navigates to garment detail page (`/garments/{id}`)
- **View All Button**: Navigates to garments page with Ready For Pickup filter
- **Hover Effects**: Subtle elevation and color changes for better UX

## Implementation

### Components Created

1. **`ReadyForPickupSection.tsx`** (Server Component)
   - Fetches ready for pickup garments
   - Handles error states gracefully
   - Passes data to client component

2. **`ReadyForPickupSectionClient.tsx`** (Client Component)
   - Main section container
   - Manages section visibility (hidden when no garments)
   - Handles navigation to filtered view

3. **`ReadyForPickupItem.tsx`** (Client Component)
   - Individual garment item display
   - Compact, clickable card design
   - Hover interactions

### Server Action

**`getReadyForPickupGarments()`** in `dashboard.ts`:

- Fetches garments with stage "Ready For Pickup"
- Orders by most recent first (`created_at DESC`)
- Limits to 3 garments
- Includes client name and service data
- Returns typed `ActiveGarment[]` array

## Business Logic

### Display Rules

1. **Section Visibility**: Only shown when there are garments ready for pickup
2. **Item Count**: Maximum of 3 items displayed
3. **Sorting**: Most recently marked as ready shown first
4. **Progress**: All items show 100% progress (since they're complete)

### Navigation Behavior

- **Item Click**: Direct navigation to `/garments/{garmentId}`
- **View All**: Navigation to `/garments?stage=Ready%20For%20Pickup`
- **Stage Filter**: Uses URL-encoded stage parameter for filtering

## User Benefits

### For Seamstresses

- **Quick Overview**: Instant visibility of completed work
- **Pickup Management**: Easy identification of items ready for customer collection
- **Workflow Efficiency**: Reduces time spent searching for completed items

### For Business

- **Cash Flow**: Faster identification leads to quicker customer notifications
- **Customer Service**: Improved pickup coordination
- **Space Management**: Clear visibility helps manage storage of completed items

## Testing

Comprehensive test coverage includes:

- Component rendering with various data states
- Navigation functionality
- Conditional visibility (no render when empty)
- Singular/plural text handling
- Hover interactions
- Click handlers

Run tests: `npm test -- src/__tests__/components/dashboard/ReadyForPickupSection.test.tsx`

## Integration with Existing Features

### Stage Colors

Uses the centralized `STAGE_COLORS` constant from `src/constants/garmentStages.ts`

### Date Formatting

Leverages existing `getGarmentDueDateDisplay()` utility for consistent date display

### Navigation

Integrates with existing garment filtering system using URL parameters

## Future Enhancements

1. **Notification System**: Send automatic pickup reminders
2. **Batch Actions**: Mark multiple items as picked up
3. **Time Tracking**: Show how long items have been ready
4. **Customer Communication**: Integrated SMS/email notifications
5. **Storage Location**: Add physical location tracking for ready items

## Configuration

No additional configuration required. The section automatically:

- Appears when garments are ready for pickup
- Hides when no garments are in this stage
- Adapts to screen sizes (responsive design)

## Performance Considerations

- **Data Fetching**: Uses parallel promises for optimal loading
- **Limit**: Only fetches 3 items to minimize data transfer
- **Caching**: Benefits from Next.js server component caching
- **Lazy Loading**: Section only renders when needed
