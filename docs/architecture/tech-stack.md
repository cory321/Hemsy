# Tech Stack

## Core Framework

- **Next.js 15.1.0+** - React framework with App Router and Server Components
- **React 19.0.0** - UI library with latest concurrent features
- **TypeScript 5.6.3** - Type safety and developer experience
- **Node.js 22.17.1** - JavaScript runtime

## Frontend

- **MUI 6.1.6** - Material Design component library
  - `@mui/material` - Core components
  - `@mui/icons-material` - Icon set
  - `@mui/x-date-pickers` - Date/time components
- **Emotion** - CSS-in-JS styling
  - `@emotion/react` - React integration
  - `@emotion/styled` - Styled components
  - `@emotion/cache` - Style caching
- **Lucide React** - Additional icon library
- **CLSX** - Conditional className utility

## State Management & Forms

- **React Context** - Global state management
- **React Hook Form 7.53.2** - Form handling
- **Zod 3.23.8** - Schema validation
- **@hookform/resolvers** - Form validation integration

## Backend & Database

- **Supabase** - Backend-as-a-Service
  - PostgreSQL database with RLS
  - Real-time subscriptions
  - Authentication (supplemented by Clerk)
- **Next.js Server Actions** - Server-side logic
- **Shared `server/db/`** - Database access layer

## Authentication & Security

- **Clerk 6.3.1** - Authentication provider
- **Row Level Security (RLS)** - Database-level authorization
- **Webhook sync** - User data synchronization

## External Services

- **Stripe 17.3.1** - Payment processing and invoicing
- **Cloudinary 2.5.1** - Image storage and optimization
- **Resend 4.0.1** - Email delivery
- **Twilio 5.3.5** - SMS notifications (future)
- **Sentry 8.42.0** - Error tracking and monitoring
- **Vercel Analytics** - Performance monitoring

## Utilities & Helpers

- **Date-fns 4.1.0** - Date manipulation
- **Day.js 1.11.13** - Lightweight date library
- **Sharp 0.33.5** - Image processing
- **CLSX** - Conditional styling utility

## Development Tools

### Testing

- **Jest 29.7.0** - Unit testing framework
- **@testing-library/react** - React component testing
- **@testing-library/jest-dom** - DOM testing utilities
- **@testing-library/user-event** - User interaction testing
- **Playwright 1.48.2** - End-to-end testing
- **@axe-core/playwright** - Accessibility testing

### Code Quality

- **ESLint 9.15.0** - Code linting
  - `@typescript-eslint/eslint-plugin` - TypeScript rules
  - `eslint-config-next` - Next.js configuration
  - `eslint-config-prettier` - Prettier integration
- **Prettier 3.3.3** - Code formatting
- **Husky 9.1.6** - Git hooks
- **lint-staged 15.2.10** - Pre-commit linting

## Infrastructure & Deployment

- **Vercel** - Hosting and deployment platform
- **GitHub Actions** - CI/CD pipeline
- **Vercel Cron/QStash** - Background job processing

## Performance Features

- **Turbo Mode** - Fast development rebuilds (`next dev --turbo`)
- **Service Worker** - Offline capabilities
- **IndexedDB** - Client-side caching
- **ISR (Incremental Static Regeneration)** - Optimized page generation
- **Optimistic UI** - Immediate user feedback
- **React Server Components** - Server-side rendering optimization

## Mobile & PWA

- **Mobile-first design** - Responsive layouts
- **PWA capabilities** - Progressive Web App features
- **Offline support** - Service Worker implementation

## Development Environment

- **Node.js 22.17.1** - Exact version specification
- **Package Manager** - npm (as indicated by package-lock.json usage)
- **Hot Reload** - Next.js fast refresh
- **TypeScript strict mode** - Enhanced type checking

---

This stack prioritizes:

- **Developer Experience** - TypeScript, comprehensive testing, modern tooling
- **User Experience** - Performance, offline capabilities, responsive design
- **Scalability** - Server Components, efficient state management
- **Reliability** - Type safety, testing coverage, error monitoring
- **Security** - RLS, authentication, secure integrations
