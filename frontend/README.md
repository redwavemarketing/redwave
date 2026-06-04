# Redwave Frontend (React + Vite)

The Redwave ERP/HRM web client: a **React + TypeScript** single-page app built with **Vite**.
It consumes the backend through the **OpenAPI contract** (`../contract/`). This is the scaffold —
a placeholder page that confirms the app boots. **No design system yet** (built later per
`CLAUDE.md` §7).

## Setup & run

```sh
# From the repo root (npm workspaces):
npm install

# Start the dev server — http://localhost:5173
npm run dev:frontend
```

During development the Vite server proxies `/api` and `/health` to the NestJS backend
(`http://localhost:3000`), so API calls work without CORS friction.

## Scripts

| Script            | Does                                         |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Vite dev server (HMR).                       |
| `npm run build`   | Type-check then production build to `dist/`. |
| `npm run preview` | Serve the production build locally.          |
| `npm run lint`    | ESLint over `src/`.                          |

> **Next sessions:** implement the design system (tokens, component library) per
> `docs/design-system.md` and `CLAUDE.md` §7, add routing, and generate the typed API client
> from `../contract/openapi.yaml`. Do not introduce one-off colors/spacing — always use a token.
