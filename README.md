# Hemsy

A mobile-first PWA for seamstresses and tailoring businesses built with Next.js 15+.

## 🚀 Getting Started

### Prerequisites

- Node.js 22.17.1 (LTS) - Use `.nvmrc` file
- npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📋 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── providers/         # Context providers (Theme, etc.)
│   └── ui/               # Reusable UI components
├── lib/                  # Utility libraries
│   ├── actions/          # Server Actions
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── validations/      # Zod schemas
├── types/                # TypeScript type definitions
├── styles/               # Additional styles
└── __tests__/            # Test files
    ├── unit/             # Jest unit tests
    ├── integration/      # Jest integration tests
    └── e2e/              # Playwright E2E tests
```

## 🛠️ Available Scripts

### Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking

### Testing

- `npm test` - Run Jest unit tests
- `npm run test:watch` - Run Jest in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:e2e:ui` - Run E2E tests with UI
- `npm run test:a11y` - Run accessibility tests

## 🏗️ Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **UI Library**: Material UI (MUI)
- **Authentication**: Clerk
- **Database**: Supabase PostgreSQL
- **Payments**: Stripe
- **Testing**: Jest + Playwright + axe-core
- **Deployment**: Vercel

## 📱 Mobile-First Design

This application is built with mobile-first principles:

- Responsive design with MUI breakpoints
- Touch-friendly interfaces (44px minimum touch targets)
- PWA capabilities with offline support
- Optimized for mobile performance

## 🧪 Testing Strategy

### Unit Tests (Jest + React Testing Library)

- Component testing with accessibility checks
- Business logic testing
- 80% coverage requirement

### Integration Tests (Jest)

- Server Actions testing
- Database operations
- External API integrations

### E2E Tests (Playwright)

- Critical user journeys
- Mobile responsive testing
- Cross-browser compatibility

### Accessibility Testing (axe-core)

- WCAG 2.1 AA compliance
- Automated accessibility scanning
- Keyboard navigation testing

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

- Database URL (Supabase)
- Authentication keys (Clerk)
- Payment keys (Stripe)
- External service keys

### Feature Flags

- `TRIAL_COUNTDOWN_ENABLED`: Default OFF

## 📖 Documentation

- [docs/PRD.md](./docs/PRD.md) - Product Requirements Document
- [docs/architecture.md](./docs/architecture.md) - Technical Architecture
- [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md) - Testing Guidelines
- [docs/](./docs/) - All project documentation

## 🚀 Deployment

The application is configured for deployment on Vercel with:

- Automatic deployments from GitHub
- Edge runtime optimization
- Built-in analytics and monitoring

## 📄 License

Private - Hemsy
