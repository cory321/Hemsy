# Phase 1: Dependencies & Setup

**Duration**: 30 minutes  
**Priority**: CRITICAL - Must complete before other phases

## Objective

Install required dependencies and prepare the project environment for the calendar refactoring implementation.

## Prerequisites

- Node.js 22.17.1 (LTS) installed
- Access to the project repository
- npm or yarn package manager

## Implementation Steps

### 1. Install Core Dependencies (10 minutes)

```bash
# Navigate to project root
cd "/Users/corywilliams/Hemsy"

# Install React Query and related packages
npm install @tanstack/react-query@^5.17.0 @tanstack/react-query-devtools@^5.17.0 react-hot-toast@^2.4.1

# Verify installation
npm list @tanstack/react-query
```

### 2. Verify TypeScript Types (5 minutes)

Create a test file to verify types are working:

```typescript
// src/test-react-query-types.ts
import { useQuery, QueryClient } from '@tanstack/react-query';

// This should compile without errors
const testClient = new QueryClient();
console.log('React Query types working!');

// Delete this file after verification
```

### 3. Update Project Configuration (10 minutes)

Ensure `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowJs": true,
    "jsx": "preserve"
  }
}
```

### 4. Clear Build Cache (5 minutes)

```bash
# Clear Next.js build cache
rm -rf .next
rm -rf node_modules/.cache

# Clear TypeScript build info
rm -f tsconfig.tsbuildinfo
```

## Files Created/Modified

- `package.json` - Updated with new dependencies
- `package-lock.json` - Updated dependency tree

## Verification Checklist

- [ ] All packages installed successfully
- [ ] No npm vulnerabilities reported
- [ ] TypeScript compiles without errors
- [ ] Package versions match requirements:
  - @tanstack/react-query: ^5.17.0
  - @tanstack/react-query-devtools: ^5.17.0
  - react-hot-toast: ^2.4.1

## Success Criteria

- Dependencies installed without conflicts
- Project builds successfully with `npm run build`
- No TypeScript errors when running `npm run type-check`

## Troubleshooting

### Issue: Package conflicts

```bash
# Force resolution
npm install --force @tanstack/react-query@^5.17.0

# Or clean install
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript errors

```bash
# Restart TypeScript server in VS Code
# Cmd+Shift+P -> "TypeScript: Restart TS Server"
```

## Next Phase

Once dependencies are installed and verified, proceed to Phase 2: Database Migration

## Notes for Implementation Agent

- This phase is foundational - ensure all steps complete successfully
- Keep the terminal output logs for debugging if needed
- If using yarn instead of npm, adjust commands accordingly
- React Query DevTools will only be visible in development mode
