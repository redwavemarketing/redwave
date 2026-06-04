// Backend ESLint flat config: shared base + Node/NestJS environment specifics.
import globals from 'globals';
import { baseConfig } from '../eslint.config.base.mjs';

export default [
  ...baseConfig,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      sourceType: 'module',
      parserOptions: {
        ecmaVersion: 'latest',
      },
    },
    rules: {
      // NestJS leans on decorators + DI; these defaults are noise in that style.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
  {
    ignores: ['eslint.config.mjs', 'dist/**'],
  },
];
