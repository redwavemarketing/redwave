// Shared ESLint flat-config base for all RedWave workspaces.
// Keeps lint rules consistent across backend and frontend (CLAUDE.md §7: one consistent toolchain).
// Each workspace imports `baseConfig` and appends its environment-specific blocks.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export const baseConfig = [
  // Never lint build artifacts, deps, or generated code.
  {
    ignores: ['dist/**', 'build/**', 'coverage/**', 'node_modules/**', '**/generated/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Must be last: turns off stylistic rules that Prettier owns.
  eslintConfigPrettier,
];

export default baseConfig;
