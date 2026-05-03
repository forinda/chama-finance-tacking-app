# Project Conventions

Stack:
- **Framework**: React Router v7 (SSR on), Vite
- **Styling**: Tailwind v4, shadcn/ui (`radix-ui` umbrella package only — never split `@radix-ui/react-*`)
- **Data**: TanStack Query (server state), TanStack Table (grids), Zustand (client state)
- **DB**: Postgres + Drizzle ORM (`drizzle-orm` runtime, `drizzle-kit` migrations, `drizzle-seed` fixtures), `postgres` driver
- **Forms**: React Hook Form + Zod (validation) via `@hookform/resolvers`
- **HTTP**: Axios
- **Auth**: argon2id password hashing, DB-backed sessions
- **Dates**: date-fns

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
2. **Branch off `main`**: `git checkout -b feat/s<id>-<kebab-title>` (e.g. `feat/s1.1-email-password-signup`). One branch per story — never share a branch across stories. Keeps `main` clean and lets reviews stay scoped.
3. **Mark `wip`** in PROGRESS.md and update `Last updated:` (commit this on the feature branch).
4. **Read** the epic file. Confirm acceptance criteria. Don't add scope.
5. **Build**. Commit with `S<id>: <subject>` prefix (e.g. `S1.1: add user signup action`).
6. **Verify** acceptance criteria one by one before claiming done.
7. **Mark `done`** in PROGRESS.md: flip `[ ]` → `[x]`, change trailing tag to `**done**`, recount the per-epic and overall rollups, bump the date. Commit on the feature branch.
8. **Push the branch and open a PR** on GitHub (`gh pr create`). Wait for review/merge — do not local-merge or push directly to `main`. After the PR is merged, sync local `main` (`git checkout main && git pull`) and delete the local feature branch (`git branch -d feat/s<id>-…`).
9. **If the epic is now fully done**, update its file's `Status:` header to `done` on the next branch and reflect that in the PROGRESS rollup table.

Branch naming:
- Stories: `feat/s<id>-<kebab-title>` — e.g. `feat/s4.1-record-contribution`
- Cross-cutting epic infra (rare): `feat/e<id>-<kebab-title>` — e.g. `feat/e7-audit-log-infra`
- Hotfixes / chores: `chore/<kebab-title>` or `fix/<kebab-title>`

Multi-line commit / PR bodies:
- Don't inline heredocs for `gh pr create --body` or `git commit -m` — backticks, dollar signs and quotes interact badly with the shell on macOS and silently mangle the output.
- Write the body to a temp file (`/tmp/pr-body.md`, `/tmp/commit-msg.txt`) and pass `gh pr create --body-file /tmp/pr-body.md` or `git commit -F /tmp/commit-msg.txt`.

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
  index.ts              # Public barrel — re-exports keys/queries/mutations/schemas + types
  keys.ts               # Query key factories
  queries.ts            # useQuery hooks + fetchers
  mutations.ts          # useMutation hooks
  schemas.ts            # Zod schemas (input/output) + inferred types via z.infer<>
  components/           # Feature-scoped UI (optional)
  routes/               # Feature route modules (optional)
  store.ts              # Zustand store (optional)
```

### Schemas + types (domain-bound)

- One `schemas.ts` per feature. Holds all Zod schemas for that domain (form inputs, query responses, mutation payloads, server validation).
- Types are derived via `z.infer<typeof xSchema>` and exported alongside their schema. Never hand-write a TS type that's already covered by a Zod schema — let inference do it.
- Consumers in the same feature (queries, mutations, components, route loaders/actions) import from `./schemas`.
- Cross-feature consumers import via the public barrel only.
- Example:
  ```ts
  // features/auth/schemas.ts
  import { z } from "zod"

  export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(10),
  })
  export type LoginInput = z.infer<typeof loginSchema>
  ```

### Barrel rules

- Import features only via the public barrel: `import { useLoginMutation, loginSchema, type LoginInput } from "~/features/auth"`.
- Cross-feature imports go through the barrel — never reach into `queries.ts` or `schemas.ts` directly.
- Query keys use the `<feature>Keys` factory pattern with `all` root + scoped sub-keys.
- Mutations invalidate via `queryKey: <feature>Keys.all` (or narrower) on success.

### Note on the word "schema"

- `features/<x>/schemas.ts` → **Zod** validation schemas + inferred types.
- `db/schema/` → **Drizzle** table definitions.
- These are independent; never conflate them.

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

- `components/ui/` — shadcn primitives only. Add via `pnpm dlx shadcn@latest add <name>`.
- All Radix primitives come from the `radix-ui` umbrella package: `import { Label as LabelPrimitive, Slot } from "radix-ui"` then `Slot.Root`, `LabelPrimitive.Root`. Never install or import from `@radix-ui/react-*` split packages.
- `components/ui/form.tsx` is maintained manually (shadcn deprecated the registry entry). It wires `react-hook-form` to shadcn primitives.
- Reusable cross-feature components go in `components/` (not `ui/`).
- Feature-scoped components stay inside `features/<feature>/components/`.

## Forms

- All forms: `react-hook-form` + Zod schema via `@hookform/resolvers/zod`.
- Use the `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` primitives from `~/components/ui/form`.
- The Zod schema lives in the feature's `schemas.ts` and is imported via the barrel — never duplicate the validation rules at the form site.

## Database

- Drizzle schema lives in `db/schema/` (split per domain), exported from `db/schema/index.ts`.
- `drizzle.config.ts` at repo root.
- Migrations: `pnpm db:generate` (Drizzle Kit) then `pnpm db:migrate`.
- Seeds (E10): `db/seeds/` using `drizzle-seed`; entry `pnpm db:seed` chained by `pnpm db:reset`.
- DB client: `app/lib/db.ts` exports a singleton; SSR loaders import this directly.

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
