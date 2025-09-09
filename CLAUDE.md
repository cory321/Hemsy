# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hemsy is a mobile-first PWA for seamstresses and tailoring businesses built with Next.js 15+ App Router, TypeScript, Material UI, Supabase, Clerk Auth, and Stripe.

## Key Commands

### Development

- `npm run dev` - Start development server with Turbo
- `npm run build` - Build for production (runs icon build first)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run type-check` - Run TypeScript type checking

### Testing (MANDATORY for all features)

- `npm test` - Run Jest unit tests
- `npm run test:watch` - Run Jest in watch mode during development
- `npm run test:coverage` - Run tests with coverage (80% minimum required)
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:e2e:ui` - Run E2E tests with UI
- `npm run test:a11y` - Run accessibility tests with axe-core

### Database & Services

- `npm run setup:database` - Initialize database
- `npm run migrate` - Run database migrations
- `npm run test:supabase` - Test Supabase connection
- `npm run test:email` - Test email configuration
- `npm run test:stripe-webhook` - Test Stripe webhook locally

## Architecture & Code Organization

### Core Tech Stack

- **Framework**: Next.js 15+ (App Router with Server Actions)
- **Language**: TypeScript (strict mode)
- **UI**: Material UI v6 with mobile-first responsive design
- **Database**: Supabase PostgreSQL with RLS
- **Auth**: Clerk
- **Payments**: Stripe
- **Testing**: Jest + React Testing Library + Playwright + axe-core

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/             # Main authenticated app
│   ├── (auth)/            # Authentication pages
│   ├── (marketing)/       # Public marketing pages
│   └── api/               # API routes
├── components/            # React components organized by feature
├── lib/
│   ├── actions/          # Server Actions (backend logic)
│   ├── hooks/            # Custom React hooks
│   ├── supabase/         # Database clients
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
├── types/                # TypeScript type definitions
└── __tests__/            # Test files (unit, integration, e2e)
```

### Server Actions Pattern

All backend operations use Next.js Server Actions in `src/lib/actions/`. These handle:

- Database operations with Supabase RLS
- Authentication with Clerk
- External API integrations (Stripe, email)

### Testing Requirements (CRITICAL)

- **Test-First Development**: Write tests BEFORE or ALONGSIDE implementation
- **Coverage**: 80% minimum for all business logic
- **Types**: Unit (Jest + RTL), Integration (Jest), E2E (Playwright), A11y (axe-core)
- **Mobile-First**: All tests must verify responsive behavior
- **Definition of Done**: Features are NOT complete without comprehensive tests

## Key Implementation Patterns

### Mobile-First Design

- Touch-friendly interfaces (44px minimum touch targets)
- Responsive breakpoints using MUI system
- Offline-resilient with slow-network awareness
- PWA capabilities

### Data Management

- Server Actions for all data operations
- Optimistic UI patterns for better UX
- Supabase RLS for data security
- React Query for client-side state management

### Authentication & Authorization

- Clerk for user authentication
- Supabase RLS policies for data access control
- User-shop relationship management

## Important Configuration

### TypeScript

- Strict mode enabled with additional safety checks
- Path mapping configured for clean imports (`@/`)
- Exact optional property types enforced

### Environment Requirements

- Node.js 22.17.1 (see .nvmrc)
- Required env vars: Database URL, Clerk keys, Stripe keys
- Email via Resend, SMS via Twilio

### Feature Flags

- `trial_countdown_enabled`: Default OFF

## Development Guidelines

### Code Quality

- Follow existing patterns in the codebase
- Use TypeScript strictly - no `any` types
- Implement proper error handling and loading states
- Ensure WCAG 2.1 AA accessibility compliance
- Never commit sensitive information

### Testing Checklist (Every Feature)

- [ ] Unit tests for components and functions
- [ ] Integration tests for Server Actions
- [ ] E2E test for main user flow
- [ ] Accessibility test with axe-core
- [ ] Mobile responsive testing
- [ ] Error boundary testing
- [ ] Loading state testing

### Pre-commit Requirements

- All tests must pass (`npm test`)
- Type checking must pass (`npm run type-check`)
- Linting must pass (`npm run lint`)
- 80% test coverage maintained

## Documentation References

Essential reading before making changes:

- `docs/prd/index.md` - Product Requirements Document
- `docs/architecture/index.md` - Technical Architecture
- `docs/TESTING_GUIDE.md` - Testing patterns and examples
- `.cursorrules` - Detailed development guidelines

## Context7 Documentation Tools

When working with external libraries, ALWAYS use Context7 tools first:

1. `mcp__context7__resolve-library-id` to find library
2. `mcp__context7__get-library-docs` for current documentation
3. Focus on specific topics (e.g., "hooks", "server actions")

Priority libraries: Next.js 15+, Material UI v6, Supabase, Clerk, Stripe, Jest, Playwright

## Critical Notes

- This is a production application - prioritize user experience, performance, and reliability
- All user data must respect Supabase RLS policies
- Payment processing uses Stripe (PCI compliant)
- Mobile-first design is non-negotiable
- Testing is mandatory - no exceptions
