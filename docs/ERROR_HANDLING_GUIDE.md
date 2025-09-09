# Error Handling Guide

## Overview

This guide documents the error handling strategy implemented in Hemsy to ensure graceful error handling in production without breaking the application.

## Architecture

### 1. Error Boundaries

We use Next.js 13+ App Router error boundaries for catching and handling errors at different levels:

#### Global Error Boundary (`src/app/global-error.tsx`)

- Catches errors at the root level
- Provides minimal UI without dependencies
- Handles catastrophic failures

#### App Error Boundary (`src/app/error.tsx`)

- Catches errors in the main app directory
- Uses Material UI components for consistent styling
- Provides user-friendly error messages

#### Route Group Error Boundary (`src/app/(app)/error.tsx`)

- Catches errors within the authenticated app routes
- Includes navigation options back to dashboard
- Clears session storage on reset to prevent stale data issues

### 2. Logger Utility (`src/lib/utils/logger.ts`)

A custom logging utility that replaces `console.error` throughout the application:

**Features:**

- **Production-safe**: No console output in production
- **Structured logging**: Consistent log format with timestamps
- **Context preservation**: Attach metadata to logs
- **Error sanitization**: Removes sensitive data and circular references
- **Service integration**: Ready for Sentry/LogRocket integration

**Usage:**

```typescript
import { logger } from '@/lib/utils/logger';

// Basic error logging
logger.error('Failed to fetch data', error);

// With additional context
logger.error('Failed to fetch data', error, {
  userId: user.id,
  endpoint: '/api/garments',
});

// API-specific errors
logger.apiError('API request failed', '/api/orders', error);

// Database errors
logger.dbError('Query failed', 'SELECT * FROM garments', error);

// Info/warning/debug
logger.info('User logged in', { userId: user.id });
logger.warn('Rate limit approaching', { remaining: 10 });
logger.debug('Cache hit', { key: 'user:123' }); // Only in development
```

### 3. Migration Strategy

#### Phase 1: Core Infrastructure ✅

- Created error boundary components
- Implemented logger utility
- Updated critical paths (GarmentContext, garments-paginated)

#### Phase 2: Gradual Migration (Recommended)

Replace `console.error` statements throughout the codebase:

```typescript
// Before
console.error('Error:', error);

// After
logger.error('Error description', error, { contextData });
```

#### Phase 3: Production Monitoring

1. Integrate with error tracking service (Sentry recommended)
2. Set up alerts for critical errors
3. Monitor error rates and patterns

## Best Practices

### 1. Always Use Try-Catch in Server Actions

```typescript
export async function serverAction(data: FormData) {
  try {
    // Your logic here
    return { success: true, data: result };
  } catch (error) {
    logger.error('Server action failed', error, {
      action: 'serverAction',
      data: sanitizeFormData(data),
    });

    // Return user-friendly error
    return {
      success: false,
      error: 'An error occurred. Please try again.',
    };
  }
}
```

### 2. Implement Optimistic Updates with Rollback

```typescript
const handleUpdate = async () => {
  const previousState = currentState;

  // Optimistic update
  setState(newState);

  try {
    await updateAction(newState);
  } catch (error) {
    // Rollback on error
    setState(previousState);
    logger.error('Update failed, rolling back', error);
    toast.error('Failed to update. Please try again.');
  }
};
```

### 3. Use Error Boundaries for Component Trees

```tsx
// For specific features that might fail
<ErrorBoundary fallback={<FeatureErrorFallback />}>
  <ComplexFeatureComponent />
</ErrorBoundary>
```

### 4. Provide Meaningful Error Messages

```typescript
// ❌ Bad
toast.error('Error');

// ✅ Good
toast.error(
  'Failed to save garment. Please check your connection and try again.'
);
```

## Testing Error Handling

Run the error handling tests:

```bash
npm test -- __tests__/error-handling.test.tsx
```

## Monitoring in Production

### Current Setup

- Error boundaries catch and display user-friendly messages
- Logger prevents console errors in production
- Memory monitor widget reports critical errors

### Future Enhancements

1. **Sentry Integration**
   - Add `@sentry/nextjs` package
   - Configure in `next.config.js`
   - Update logger to send errors to Sentry

2. **Error Analytics**
   - Track error frequency by type
   - Monitor error trends
   - Set up alerting thresholds

3. **User Feedback**
   - Add error reporting dialog
   - Collect user context for errors
   - Link errors to support tickets

## Common Error Scenarios

### 1. Network Errors

- Handled by React Query retry logic
- User sees loading states and retry options

### 2. Authentication Errors

- Clerk handles auth errors
- Redirects to sign-in when needed

### 3. Database Errors

- Caught in server actions
- Logged with context
- User sees generic error message

### 4. Payment Errors

- Stripe errors handled specifically
- Clear user messaging about payment issues
- Logged for reconciliation

## Troubleshooting

### Error Not Being Caught

1. Check if error is thrown in server or client component
2. Ensure error boundary is at correct level
3. Verify async errors are properly awaited

### Console Errors Still Appearing

1. Search for remaining `console.error` statements
2. Check third-party libraries
3. Review browser extensions

### Error Boundary Not Rendering

1. Check for syntax errors in error.tsx files
2. Verify error boundary is 'use client'
3. Ensure proper export default

## Resources

- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

## Migration Checklist

- [x] Create error.tsx files
- [x] Create global-error.tsx
- [x] Implement logger utility
- [x] Update GarmentContext
- [x] Update garments-paginated action
- [x] Create error handling tests
- [x] Document error handling approach
- [ ] Replace all console.error statements (gradual)
- [ ] Integrate with Sentry
- [ ] Set up production monitoring
- [ ] Add user feedback mechanism
