# E1 — Identity & Access

> Status: planned
> Depends on: —
> Blocks: E2, E8
> Owner: @forinda

## Goal

Let users sign up, log in, and land on the right surface based on their `platformRole`. Sessions persist. Layout swap (tenant vs. admin) is decided at the root.

## In scope

- Email + password signup with first name + last name (creates `user` platform role only).
- Login / logout / session persistence.
- Layout swap by `platformRole`: `super_admin` → `/admin`, `user` → `/`.
- Active-org switcher in header for users with multiple memberships.
- `super_admin` seeding via env var or seed script (no UI to elevate).
- `User.is_active` flag — gates login; admin UI to toggle lives in E8 (S8.8).

## Out of scope

- OAuth providers (Google, GitHub, etc.) — deferred indefinitely; revisit only if user demand surfaces.
- Password reset (P1, see S1.6).
- 2FA / MFA.
- Impersonation.
- Per-feature admin RBAC.
- Username / display-name customization beyond first + last name.

## User stories

### S1.1 [P0] Email + password signup
**As a** visitor, **I want** to sign up with email, first name, last name, and password **so that** I can create an organization.
**Acceptance criteria:**
- Required fields: `email`, `first_name` (1–60 chars), `last_name` (1–60 chars), `password`.
- Email is unique, validated format.
- Password ≥ 10 chars, hashed with argon2id (or bcrypt cost ≥ 12).
- New user gets `platformRole: "user"` and `is_active: true`. Never `super_admin` via signup.
- On success, session created and user lands on "create your first org" screen.
- Audit: `audit_log` entry with `action: "user.signup"`.

### S1.2 [P0] Login
**As a** user, **I want** to log in with email + password **so that** I access my orgs.
**Acceptance criteria:**
- Wrong credentials show generic error (no email-exists leak).
- Inactive users (`is_active = false`) cannot log in — same generic error, no information leak.
- Successful login creates a session cookie (httpOnly, secure, sameSite=lax).
- Session carries `userId`, `platformRole`, `activeOrgId` (default = most recently used).
- Failed-login rate limit: 5 / 15 min per email.

### S1.3 [P0] Logout
**As a** user, **I want** to log out **so that** I secure a shared device.
**Acceptance criteria:**
- Server invalidates session.
- Client cookie cleared.
- Redirect to login page.

### S1.4 [P0] Layout swap by platform role
**As a** `super_admin`, **I want** to land on `/admin` after login **so that** I don't navigate manually.
**Acceptance criteria:**
- Root loader inspects `platformRole`; renders admin layout for `super_admin`, tenant layout for `user`.
- A `super_admin` visiting `/` redirects to `/admin`. A `user` visiting `/admin` returns 403.
- Layout decision is made server-side in the root loader; no flicker.

### S1.5 [P0] Active-org switcher
**As a** `user` with multiple orgs, **I want** to switch active org from a header dropdown **so that** context is always clear.
**Acceptance criteria:**
- Header shows current org name; dropdown lists all orgs the user belongs to.
- Selecting an org updates `activeOrgId` on session and reloads.
- All tenant queries scope by `activeOrgId`.
- Users with one membership see the org name as static text (no dropdown).

### S1.6 [P1] Password reset by email
**As a** user, **I want** to reset my password by email **so that** I can recover access.
**Acceptance criteria:**
- "Forgot password" link sends a token-bearing email via `sendEmail()` (E10 S10.4 — dev outbox in MVP, real provider in Phase 2).
- Token TTL 30 min, single-use, stored hashed.
- Reset page accepts token + new password. Old sessions invalidated on password change.
- Audit: `action: "user.password_reset.request"` and `"user.password_reset.complete"`.

### S1.7 [P0] User account active flag
**As a** `super_admin`, **I want** every user to carry an `is_active` flag that gates login **so that** I can close compromised or terminated accounts.
**Acceptance criteria:**
- `User.is_active boolean not null default true` column.
- Inactive users cannot log in (S1.2 covers the rejection path).
- Toggling a user to inactive invalidates their existing sessions immediately.
- Toggling is performed only by `super_admin`; the UI lives in E8 (S8.8) — this story covers the data + login enforcement.
- Audit: `action: "user.deactivate"` / `"user.reactivate"` (admin actor recorded).

## Technical notes

- Auth implementation: `react-router` actions + session cookie via `@react-router/node`'s session storage.
- Argon2id hashing via `argon2` package. Cost: m=64MB, t=3, p=4.
- DB-backed sessions chosen for revocability (needed for S1.7 — toggling `is_active` must invalidate live sessions).
- `super_admin` seed: env-driven `SUPER_ADMIN_EMAIL`; on boot, if matching user exists, ensure `platformRole = super_admin` and `is_active = true`.
- Layout swap lives in `app/root.tsx` loader; renders `app/layouts/tenant.tsx` or `app/layouts/admin.tsx`.
- `User` shape (final for MVP): `{ id, email, firstName, lastName, passwordHash, platformRole, isActive, mustChangePassword, createdAt, updatedAt }`.
- `mustChangePassword`: set when an owner creates a user via E2 S2.4; the login flow redirects to a change-password screen before granting access.

## Definition of done

- All P0 stories pass acceptance criteria with tests.
- Audit log entries verified for signup, login (success + failure), password reset, deactivate, reactivate.
- `super_admin` can log in and reach `/admin`; `user` cannot.
- Switching active org updates subsequent loader queries.
- Inactive user is blocked at login and their existing sessions are invalidated on deactivation.
- Documented env vars in README: `SUPER_ADMIN_EMAIL`, `SESSION_SECRET`.
