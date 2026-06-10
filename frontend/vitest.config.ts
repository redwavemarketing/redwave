/**
 * Vitest config — fast unit tests for framework-free logic (e.g. the session refresh classifier). Runs in
 * a `node` env (no jsdom): tests stub `fetch`/`localStorage` themselves. Kept separate from vite.config.ts
 * so the svgr/react plugins aren't loaded for tests.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
