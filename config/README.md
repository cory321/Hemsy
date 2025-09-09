# Configuration Files

This directory contains all configuration files for the Hemsy project.

## Files Overview

- **`.eslintrc.json`** - ESLint configuration for code quality
- **`.prettierrc`** - Prettier configuration for code formatting
- **`.prettierignore`** - Files to ignore during Prettier formatting
- **`jest.config.js`** - Jest configuration for unit/integration testing
- **`jest.setup.js`** - Jest setup and global test configuration
- **`playwright.config.ts`** - Playwright configuration for E2E testing

## Usage

These configurations are automatically used by the npm scripts defined in `package.json`:

```bash
npm run lint     # Uses .eslintrc.json
npm test         # Uses jest.config.js
npm run test:e2e # Uses playwright.config.ts
```

## Path References

All configurations use relative paths pointing back to the project root (`../`) where necessary.
