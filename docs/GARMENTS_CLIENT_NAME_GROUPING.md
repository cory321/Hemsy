# Garments Client Name Grouping

## Overview

This feature adds client name grouping headers to the garments page when sorting by client name. When users select "Client Name" from the sort dropdown, garments are visually grouped under their respective client names with clear headers and garment counts.

## Implementation Details

### Frontend Changes

#### Modified Files

1. **`src/app/(app)/garments/page.tsx`**
   - Added import for `groupGarmentsByClientName` utility
   - Added logic to detect when sorting by client name
   - Implemented conditional rendering for grouped vs. regular grid view
   - Added client name headers with garment counts

### Key Features

1. **Client Name Headers**
   - Each client gets a dedicated section with their name as a header
   - Headers use Typography h6 component styled as h2
   - Headers include garment count (e.g., "Alice Johnson (2 garments)")

2. **Visual Separation**
   - Headers have a bottom border for clear visual separation
   - Each client section has margin bottom for spacing
   - Headers align baseline with counts for better readability

3. **Sorting Integration**
   - Grouping only activates when "Client Name" is selected in sort dropdown
   - Respects ascending/descending sort order
   - Handles "Unknown Client" for garments without client names

4. **Responsive Design**
   - Works seamlessly with existing responsive grid layout
   - Headers span full width on all screen sizes
   - Maintains existing garment card grid within each group

## Testing

### Unit Tests

- `src/__tests__/unit/garments/client-name-grouping.test.tsx`
  - Tests client name header display when sorting by client name
  - Verifies no headers appear for other sort fields
  - Tests sort order toggling
  - Handles "Unknown Client" grouping

### E2E Tests

- `src/__tests__/e2e/garments-client-name-grouping.spec.ts`
  - Tests real user interaction with sort dropdown
  - Verifies header visibility and garment grouping
  - Tests sort order changes
  - Validates "Unknown Client" handling

## User Experience

1. **Default View**: Garments display in regular grid (no grouping)
2. **Select "Client Name" Sort**: Garments automatically group by client
3. **Clear Visual Hierarchy**: Client names as section headers with counts
4. **Maintains Performance**: Uses existing pagination and infinite scroll

## Technical Notes

- Leverages existing `groupGarmentsByClientName` utility function
- No changes to backend or data fetching logic
- Purely presentational change in the UI layer
- Compatible with all existing filters and search functionality
