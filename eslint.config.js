import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'prettier'),
  {
    rules: {
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-unused-vars': 'off', // Disabled for development mode
    },
    ignores: ['.next', 'dist', 'node_modules'],
  },
];

export default eslintConfig;
