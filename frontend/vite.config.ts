import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend dev server config. The `/v1`, `/api`, and `/health` proxies forward to the NestJS
// backend (default :3000) so the SPA can call the API in development without CORS friction.
// The typed client (openapi-fetch) targets `/v1` (all backend routes live under /v1).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/v1': { target: 'http://localhost:3000', changeOrigin: true },
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/health': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
