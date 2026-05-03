# Project Conventions

Stack: React Router v7 (SSR on), Tailwind v4 + Vite, shadcn/ui, TanStack Query, TanStack Table, Axios, Zustand.

Path alias: `~/*` → `./app/*`.

## Documentation

All product/spec docs live in `docs/`:

```
docs/
  PRD.md            # Product requirements — index, architecture, glossary
  PROGRESS.md       # Living status board — story state + percent complete
  epics/
    E1-identity-access.md
    E2-organization-lifecycle.md
    E3-members-categories.md
    E4-money-movement.md
    E5-ledger-reporting.md
    E6-reversals-corrections.md
    E7-audit-trail.md
    E8-platform-admin.md
    E9-platform-audit.md
```

Rules:
- Each epic file is the **single source of truth** for its scope. Do not expand scope mid-epic.
- Stories carry IDs like `S4.1` (epic 4, story 1). Reference these IDs in branches, commits, PRs, conversation.
- When starting work, read the relevant epic file end-to-end first. The acceptance criteria are the contract.
- "Out of scope" sections are binding — if a request strays, flag it and ask whether to add a story.

## Workflow per story

1. **Pick** the next story from `docs/PROGRESS.md` (P0 first).
2. **Mark `wip`** in PROGRESS.md and update `Last updated:`.
3. **Read** the epic file. Confirm acceptance criteria. Don't add scope.
4. **Build**. Use `S<id>` in branch name and commits (e.g., `S4.1: record contribution form`).
5. **Verify** acceptance criteria one by one before claiming done.
6. **Mark `done`** in PROGRESS.md: flip `[ ]` → `[x]`, change trailing tag to `**done**`, recount the per-epic and overall rollups, bump the date.
7. **If the epic is now fully done**, update its file's `Status:` header to `done` and reflect that in the PROGRESS rollup table.

When the user asks "where are we?" or "what's the status?", read `docs/PROGRESS.md` and report the percentages — overall + MVP + per-epic.

## Status states

- `todo` — not started
- `wip` — in progress
- `done` — merged and acceptance criteria met
- `blocked` — waiting on a decision; note the blocker inline

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

## Reference

- Product spec: `docs/PRD.md`
- Live status: `docs/PROGRESS.md`
- Per-epic scope: `docs/epics/E<N>-*.md`
