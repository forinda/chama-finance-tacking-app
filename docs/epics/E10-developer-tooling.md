# E10 — Developer Tooling & Seeding

> Status: planned
> Depends on: E1 (User shape), E2 (Org + COA seed)
> Blocks: nothing — but unblocks productive local dev for everything
> Owner: @forinda

## Goal

Make local development fast and deterministic. A fresh checkout should reach a usable state — admin user, sample tenant users, sample orgs — with one command. Email-dependent flows (invitations, password reset) work end-to-end without a real provider via a dev outbox.

## In scope

- Seed script for users (super_admin + sample tenant users).
- Seed script for sample organizations + memberships + chart of accounts.
- Seed script for sample financial data (members, categories, journal entries) for testing E4/E5.
- Dev outbox: an in-process / DB-backed implementation of `sendEmail()` so invitations and password resets work locally without SMTP.
- One-command DB reset + reseed for local iteration.

## Out of scope

- Production data fixtures or migrations carrying business data.
- Real email provider integration (Phase 2).
- Test fixtures for unit tests (those are co-located with tests, not in seeds).
- Synthetic load / performance datasets.

## User stories

### S10.1 [P0] Seed users (admin + tenant samples)
**As a** developer, **I want** `pnpm db:seed:users` to populate a super_admin and a few tenant users **so that** I can log in and test flows immediately after a fresh DB.
**Acceptance criteria:**
- Script idempotent — re-running does not duplicate or error.
- Creates: 1 `super_admin` (email `admin@chama.local`), 4 `user` accounts (`alice`, `bob`, `carol`, `dan` @ `chama.local`).
- All users get a known dev password (`password123!` or similar) read from `.env.example`. Real-looking but not reused in production.
- All seeded users get `is_active: true`, `must_change_password: false`.
- README / `.env.example` documents the seeded credentials.

### S10.2 [P0] Seed sample organizations + memberships + COA
**As a** developer, **I want** `pnpm db:seed:orgs` to create sample orgs with the seeded users as members **so that** I can test multi-org flows without manual setup.
**Acceptance criteria:**
- Idempotent.
- Creates: 2 orgs ("Sunrise Chama", "Welfare Group"). Default COA + categories seeded per org via the same code path as S2.2.
- Memberships:
  - Sunrise Chama: alice (owner), bob (treasurer), carol (member).
  - Welfare Group: bob (owner), dan (treasurer).
- Each `Membership.role` reflects intended testing scenarios (owner / treasurer / member each represented at least once).

### S10.3 [P1] Seed sample financial data
**As a** developer, **I want** `pnpm db:seed:ledger` to populate sample members, categories, and posted journal entries **so that** I can test reporting views (E5) and reversals (E6).
**Acceptance criteria:**
- Idempotent.
- For one of the seeded orgs, creates ~10 `Member` rows, a couple of additional `Category` rows, and ~30 posted `JournalEntry`s spanning the last 90 days.
- Entries cover all three flows: contributions, payouts, transfers.
- One entry already voided + reversed so reversal UI has a sample state to render.
- Numbers are realistic but obviously synthetic (e.g. round amounts).

### S10.4 [P0] Dev outbox for outgoing email
**As a** developer, **I want** `sendEmail()` to write to a dev outbox in MVP **so that** invitation and password-reset flows are testable without configuring SMTP.
**Acceptance criteria:**
- `app/lib/email.ts` exports a single `sendEmail({ to, subject, body, meta })` function.
- MVP implementation: writes to `email_outbox { id, to, subject, body, meta_json, created_at }` and logs a one-line summary to the server console with the message id.
- A `/admin/outbox` page (super_admin only) renders the outbox with most-recent-first; clicking an entry shows the full body — useful for grabbing invite links during dev.
- Phase 2 swaps the implementation to a real provider behind the same signature; no caller code changes.
- Audit: not required for outbox writes (these are infrastructure, not user actions).

### S10.5 [P1] One-command reset + reseed
**As a** developer, **I want** `pnpm db:reset` to drop, re-create, migrate, and seed in one shot **so that** local iteration is friction-free.
**Acceptance criteria:**
- Runs migrations on an empty DB then chains S10.1 → S10.2 → S10.3.
- Refuses to run if `NODE_ENV=production` (hard guard).
- Completes in under 30 seconds on the dev machine.

## Technical notes

- All seeds live in `db/seeds/*.ts`, not under `app/`. Keep dev-only code out of the runtime bundle.
- Each seed step uses upserts keyed on a stable identifier (email for users, slug for orgs) so re-runs are safe.
- Seed entry-point script uses the same DB client/ORM as the app — no separate "seed-only" connection layer.
- Dev passwords stored in `.env.example` are committed; real `.env` is gitignored. Dev passwords are NEVER acceptable for production seed data — Phase 2 production seed (if any) prompts for or generates per-deploy secrets.
- The `email_outbox` table is created in the regular migration set (used in dev). In production with a real provider, the outbox table can be repurposed as a delivery log or left empty.

## Definition of done

- A clean clone + `pnpm install` + `pnpm db:reset` produces a working app with seeded data, logged-in flow available via the documented credentials.
- All three onboarding paths in E2 (S2.3 lookup, S2.4 owner-create, S2.8 invite) are exercised end-to-end against the seeded DB.
- `/admin/outbox` shows captured emails after triggering an invite.
- README documents: seed commands, seeded credentials, how to find an invite link in the outbox.
