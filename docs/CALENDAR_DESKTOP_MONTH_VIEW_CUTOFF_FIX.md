# Calendar Desktop Month View Cutoff Fix

## Issue

The month view calendar days were getting cut off at the bottom, particularly the last row of dates (days 24-30).

## Root Cause

The issue was caused by multiple height constraints:

1. **Parent container overflow**: The Paper component containing the calendar views had `overflow: 'hidden'`
2. **Fixed height constraint**: The main container had `height: 'calc(100vh - 200px)'` instead of `minHeight`
3. **Grid height limitations**: The calendar grid had `height: '100%'` and `flex: 1` which constrained its growth

## Solution

### 1. Changed overflow handling in CalendarDesktop.tsx

```diff
- overflow: 'hidden',
+ overflow: 'auto',
```

This allows scrolling if content exceeds the container height.

### 2. Updated height constraints

```diff
// Main container
- height: 'calc(100vh - 200px)',
+ minHeight: 'calc(100vh - 200px)',

// MonthViewDesktop container
- height: '100%',
+ minHeight: '100%',
```

### 3. Fixed calendar grid sizing

```diff
- gridTemplateRows: `repeat(${numWeeks}, minmax(140px, 1fr))`,
- flex: 1,
- height: '100%',
+ gridTemplateRows: `repeat(${numWeeks}, minmax(140px, auto))`,
+ minHeight: `${numWeeks * 140}px`,
```

## Impact

- Calendar grid now expands to show all rows without cutoff
- Maintains minimum height of 140px per row
- Adds scrollbar if content exceeds viewport (rare case)
- Preserves responsive behavior and visual design

## Testing

All existing tests pass, confirming the fix doesn't break functionality while solving the cutoff issue.
