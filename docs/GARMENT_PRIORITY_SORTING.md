# Garment Priority Sorting

## Overview

When multiple garments have the same due date, the system now intelligently prioritizes them based on their stage and completion progress. This helps seamstresses focus on garments that are closer to completion and can be delivered sooner.

## Priority Rules

### Stage-Based Priority

When garments have the same due date, they are sorted by stage in this order:

1. **Ready For Pickup** (Highest Priority)
   - These garments are complete and can be delivered immediately
   - Clearing these out first improves cash flow and customer satisfaction

2. **In Progress** (Medium Priority)
   - Work has already started on these garments
   - Prioritizing these helps complete work that's already begun

3. **New** (Lower Priority)
   - No work has started yet
   - These can wait if other garments are closer to completion

4. **Done** (Filtered Out)
   - "Done" garments are not shown in active garment lists
   - They are completely removed from priority sorting

### Progress-Based Sub-Priority

When multiple garments are in the "In Progress" stage with the same due date:

- Garments with higher completion percentage are shown first
- Example: A garment that's 75% complete appears before one that's 25% complete

## Overall Sorting Order

The complete priority order for garment lists is:

1. **Overdue garments** (sorted by how overdue they are)
   - Most overdue appears first
   - Within same overdue date: sorted by stage/progress

2. **Due today**
   - Sorted by stage (Ready For Pickup → In Progress → New)
   - Within same stage: sorted by progress

3. **Due tomorrow**
   - Sorted by stage and progress

4. **Future due dates**
   - Sorted by due date (earliest first)
   - Within same date: sorted by stage/progress

5. **No due date**
   - Sorted by stage and progress only

## Implementation Details

### Files Modified

1. **`src/lib/utils/garment-priority.ts`** (New)
   - Core sorting utility functions
   - `getStagePriorityScore()`: Returns numeric priority for each stage
   - `compareGarmentsByStageAndProgress()`: Comparison function for same-date garments
   - `sortGarmentsByPriority()`: Complete sorting algorithm

2. **`src/lib/actions/dashboard.ts`**
   - Updated `getActiveGarments()` to use stage-based sorting
   - Active garments on dashboard now prioritize by stage when due dates match

3. **`src/lib/actions/garments-paginated.ts`**
   - Added secondary stage sorting when primary sort is by due date
   - Garments list page now shows higher-priority items first

## User Benefits

### For Seamstresses

- **Better workflow**: Focus on garments that can be completed and delivered first
- **Reduced stress**: Clear priority order helps with time management
- **Improved efficiency**: Complete partially-done work before starting new items

### For Customers

- **Faster delivery**: Garments that are ready get delivered sooner
- **Better communication**: Clear status on which items are prioritized

## Testing

Comprehensive unit tests ensure the sorting logic works correctly:

- Stage priority ordering
- Progress-based sorting for same stage
- Complex multi-factor sorting scenarios
- Overdue item handling
- Null due date handling

Run tests with: `npm test -- src/__tests__/utils/garment-priority.test.ts`

## Example Scenarios

### Scenario 1: Three garments due today

- Garment A: Due today, Ready For Pickup → **Shown first**
- Garment B: Due today, In Progress (60%) → Shown second
- Garment C: Due today, New → Shown third

### Scenario 2: Multiple overdue garments

- Garment A: 3 days overdue, In Progress → Shown second
- Garment B: 3 days overdue, Ready For Pickup → **Shown first**
- Garment C: 1 day overdue, Ready For Pickup → Shown third

### Scenario 3: Mixed due dates

- Garment A: Due tomorrow, New → Shown fourth
- Garment B: Due today, In Progress (80%) → **Shown first**
- Garment C: Due today, In Progress (30%) → Shown second
- Garment D: Due next week, Ready For Pickup → Shown fifth
- Garment E: Due today, New → Shown third

## Future Enhancements

Potential improvements to consider:

1. User-configurable priority weights
2. Custom priority rules per shop
3. Priority based on customer VIP status
4. Rush order priority flags
5. Automatic priority escalation as due dates approach
