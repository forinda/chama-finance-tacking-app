# Project Conventions

Stack: React Router v7 (SSR on), Tailwind v4 + Vite, shadcn/ui, TanStack Query, TanStack Table, Axios, Zustand.

Path alias: `~/*` → `./app/*`.

## Folder Layout

```
app/
  root.tsx              # Layout + AppProviders wrap
  providers.tsx         # All client-side providers
  routes.ts             # Route registry
  routes/               # Top-level route modules
  components/
    ui/                 # shadcn primitives (button, etc.)
  features/<name>/      # Feature module (see below)
  hooks/                # Reusable cross-cutting hooks
    index.ts            # Barrel
  lib/                  # Framework-agnostic utilities
    query-client.ts     # SSR-safe QueryClient factory
    utils.ts            # cn() etc.
```

## Feature Module Convention

Each feature lives in `app/features/<feature>/` and is the unit of ownership. Files sit flat at the feature root — no `api/` subfolder.

```
features/<feature>/
  index.ts              # Public barrel — re-exports keys/queries/mutations
  keys.ts               # Query key factories
  queries.ts            # useQuery hooks + fetchers
  mutations.ts          # useMutation hooks
  components/           # Feature-scoped UI (optional)
  routes/               # Feature route modules (optional)
  store.ts              # Zustand store (optional)
```

Rules:
- Import features only via the public barrel: `import { useLoginMutation } from "~/features/auth"`.
- Cross-feature imports go through the barrel — never reach into `queries.ts` directly.
- Query keys use the `<feature>Keys` factory pattern with `all` root + scoped sub-keys.
- Mutations invalidate via `queryKey: <feature>Keys.all` (or narrower) on success.

## React Query

- One `QueryClient` per request on server, singleton on client (`getQueryClient`).
- Provider lives in `app/providers.tsx` (`AppProviders`), wrapped once in `root.tsx`.
- Devtools render in dev only via `import.meta.env.DEV` guard.
- Defaults: `staleTime: 60s`, `retry: 1`, no refetch on focus. Override per query when needed.

## Hooks

- Cross-cutting hooks live in `app/hooks/` and are exported via `app/hooks/index.ts`.
- Feature-specific hooks belong inside the feature.
- `useIsClient()` — returns `true` after hydration; use to gate browser-only code in SSR components.

## Components

- `components/ui/` — shadcn primitives only. Add via shadcn CLI.
- Reusable cross-feature components go in `components/` (not `ui/`).
- Feature-scoped components stay inside `features/<feature>/components/`.

## Routes

- Register all routes in `app/routes.ts`. Feature routes import from `features/<feature>/routes/`.
- SSR is on (`react-router.config.ts`). Server-only code goes in `*.server.ts(x)` files.

## State

- Server state: TanStack Query (queries/mutations).
- Client state: Zustand stores. Place feature stores at `features/<feature>/store.ts`; global stores at `app/stores/`.

## HTTP

- Use `axios` for HTTP. Auth feature currently uses `fetch` placeholders — swap to a shared axios client when introduced at `app/lib/api-client.ts`.

## Scripts

- `pnpm dev` — dev server (port 3000)
- `pnpm build` — production build
- `pnpm typecheck` — `react-router typegen && tsc`
- `pnpm format` — prettier write
