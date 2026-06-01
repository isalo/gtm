// Flat ESLint config (ESLint 9). Type-unaware recommended rules keep linting
// fast and CI-friendly; Prettier owns formatting so style rules are disabled.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '**/*.html'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      // The codebase uses non-null assertions deliberately after explicit
      // length/existence checks (e.g. heatmap buckets, churn maps).
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
);
