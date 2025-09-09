# Source Tree

## Project Structure Overview

```
hemsy/
├── 📁 Root Configuration
├── 📁 Documentation (docs/)
├── 📁 Source Code (src/)
├── 📁 Configuration (config/)
├── 📁 Public Assets (public/)
├── 📁 Build System & Dependencies
└── 📁 Development Tools
```

## Detailed Directory Structure

### Root Level

```
hemsy/
├── .env.local                 # Environment variables (local)
├── .eslintrc.json            # Legacy ESLint configuration
├── .gitignore                # Git ignore rules
├── README.md                 # Project documentation
├── PRD.md                    # Product Requirements Document
├── architecture.md           # Architecture documentation
├── eslint.config.js          # Modern ESLint configuration
├── jest.config.js            # Jest testing configuration
├── next.config.ts            # Next.js configuration
├── next-env.d.ts             # Next.js TypeScript declarations
├── package.json              # Dependencies and scripts
├── package-lock.json         # Dependency lock file
├── tsconfig.json             # TypeScript configuration
└── tsconfig.tsbuildinfo      # TypeScript build cache
```

### Source Code (`src/`)

```
src/
├── app/                      # Next.js App Router directory
│   ├── (app)/               # App route group (authenticated)
│   │   ├── appointments/    # Appointment management
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── clients/         # Client management
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── dashboard/       # Main dashboard
│   │   │   └── page.tsx
│   │   ├── garments/        # Garment tracking
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── invoices/        # Invoice management
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── onboarding/      # User onboarding flow
│   │   │   └── page.tsx
│   │   ├── orders/          # Order management
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── services/        # Service management
│   │   │   └── page.tsx
│   │   ├── settings/        # User settings
│   │   │   └── page.tsx
│   │   ├── more/           # Additional features
│   │   │   └── page.tsx
│   │   └── layout.tsx      # Authenticated app layout
│   ├── (auth)/             # Authentication route group
│   │   ├── sign-in/
│   │   │   └── [[...sign-in]]/
│   │   │       └── page.tsx
│   │   ├── sign-up/
│   │   │   └── [[...sign-up]]/
│   │   │       └── page.tsx
│   │   └── layout.tsx      # Auth layout
│   ├── (marketing)/        # Marketing/public route group
│   │   ├── contact/
│   │   │   └── page.tsx
│   │   ├── faq/
│   │   │   └── page.tsx
│   │   ├── features/
│   │   │   └── page.tsx
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   ├── privacy/
│   │   │   └── page.tsx
│   │   ├── terms/
│   │   │   └── page.tsx
│   │   └── layout.tsx      # Marketing layout
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── components/             # Reusable React components
│   ├── examples/
│   │   └── ResponsiveDashboardExample.tsx
│   ├── layout/             # Layout components
│   │   ├── README.md
│   │   ├── ResponsiveContainer.tsx
│   │   ├── ResponsiveGrid.tsx
│   │   ├── ResponsiveNav.tsx
│   │   └── index.ts        # Barrel export
│   ├── providers/          # Context providers
│   │   └── ThemeProvider.tsx
│   └── ui/                 # Base UI components
│       └── Button.test.tsx
├── hooks/                  # Custom React hooks
│   └── useResponsive.ts
├── lib/                    # Utility libraries and configurations
│   ├── actions/            # Server actions (empty)
│   ├── hooks/              # Additional hooks (empty)
│   ├── testing/            # Testing utilities (empty)
│   ├── utils/              # Utility functions
│   │   └── cn.ts           # className utility
│   └── validations/        # Schema validations (empty)
├── styles/                 # Additional stylesheets (empty)
├── types/                  # TypeScript type definitions
│   ├── globals.d.ts        # Global type declarations
│   ├── index.ts            # Type exports
│   └── jest.d.ts           # Jest type extensions
└── middleware.ts           # Next.js middleware
```

### Testing (`src/__tests__/`)

```
__tests__/
├── e2e/                    # End-to-end tests
│   ├── ai-generated/       # AI-generated test files
│   └── example.spec.ts     # Example E2E test
├── integration/            # Integration tests
│   └── sign-out.test.ts    # Sign-out flow test
└── unit/                   # Unit tests
    └── app/
        └── more/
            └── page.test.tsx  # Page component test
```

### Documentation (`docs/`)

```
docs/
├── README.md               # Documentation index
├── CONTEXT.md              # Project context
├── TESTING_GUIDE.md        # Testing guidelines
├── TEST_TEMPLATE.md        # Test template
├── package-scripts-reference.json  # npm scripts reference
├── responsive-design-guide.md      # Design guidelines
├── responsive-user-profile-solution.md  # Solution docs
├── architecture/           # Architecture documentation
│   ├── index.md           # Architecture index
│   ├── table-of-contents.md
│   ├── tech-stack.md      # Technology stack
│   ├── source-tree.md     # This file
│   ├── coding-standards.md
│   ├── 1-introduction.md
│   ├── 2-architectural-goals.md
│   ├── 3-high-level-system-overview.md
│   ├── 4-frontend-architecture.md
│   ├── 5-backend-architecture.md
│   ├── 6-data-layer-schema.md
│   ├── 7-external-integrations.md
│   ├── 8-infrastructure-deployment.md
│   ├── 9-security-compliance.md
│   ├── 10-scalability-performance.md
│   ├── 11-cicd-testing.md
│   ├── 12-configuration-environment.md
│   └── 13-future-considerations.md
├── prd/                   # Product Requirements Documentation
│   ├── index.md
│   ├── 1-executive-summary.md
│   ├── 2-product-goals-scope.md
│   ├── 3-core-features.md
│   ├── 4-user-flows-navigation.md
│   ├── 5-technical-architecture.md
│   ├── 6-marketing-onboarding.md
│   ├── 7-invoices-section.md
│   ├── 8-payment-billing.md
│   ├── 9-non-functional-requirements.md
│   ├── 10-roadmap-future-enhancements.md
│   ├── 11-risks-mitigations.md
│   └── 12-implementation-roadmap-epics-features-user-stories.md
└── stories/               # User stories and features
    └── Phase-0/           # Implementation phases
```

### Configuration (`config/`)

```
config/
├── README.md              # Configuration documentation
├── jest.config.js         # Jest configuration
├── jest.setup.js          # Jest setup file
└── playwright.config.ts   # Playwright E2E configuration
```

### Public Assets (`public/`)

```
public/
└── manifest.json          # PWA manifest
```

### Development Tools

```
.bmad-core/                # BMad development system (hidden)
node_modules/              # Dependencies (ignored)
```

## Key Architectural Patterns

### Route Groups

- **(app)** - Authenticated application routes with shared layout
- **(auth)** - Authentication flows (sign-in/sign-up)
- **(marketing)** - Public marketing pages

### File-based Routing

- **Dynamic routes** - `[id]` for entity-specific pages
- **Catch-all routes** - `[[...sign-in]]` for Clerk integration
- **Nested layouts** - Route group layouts for shared UI

### Component Organization

- **layout/** - Responsive layout components
- **ui/** - Base UI components with tests
- **providers/** - React context providers
- **examples/** - Implementation examples

### Library Structure

- **actions/** - Server Actions (future implementation)
- **hooks/** - Custom React hooks
- **utils/** - Utility functions
- **validations/** - Zod schemas (future implementation)
- **testing/** - Test utilities

### Testing Strategy

- **Unit tests** - Component and function testing
- **Integration tests** - Feature flow testing
- **E2E tests** - Full user journey testing
- **AI-generated tests** - Automated test creation

## Development Workflow Files

- **.env.local** - Local environment variables
- **eslint.config.js** - Code linting rules
- **tsconfig.json** - TypeScript compilation settings
- **next.config.ts** - Next.js framework configuration
- **jest.config.js** - Testing framework setup
- **package.json** - Dependencies and npm scripts

## Build & Deployment

- **Vercel** - Primary deployment platform
- **GitHub Actions** - CI/CD pipeline
- **Node.js 22.17.1** - Runtime environment
- **TypeScript** - Build-time type checking

---

This structure follows Next.js App Router conventions with clear separation of concerns, scalable component organization, and comprehensive testing coverage.
