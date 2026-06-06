/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  /**
   * Backend ORIGIN ONLY (no `/v1`, no trailing slash) for production builds where there is no Vite dev
   * proxy — e.g. `https://api.redwave.example`. Unset in development (the dev proxy forwards `/v1`).
   * See src/api/client.ts.
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
