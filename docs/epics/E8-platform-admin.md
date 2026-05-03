# E8 — Platform Admin Console

> Status: planned
> Depends on: E1
> Blocks: E9
> Owner: @forinda

## Goal

`super_admin` users get an `/admin` console showing organizations, users, aggregate metrics, and billing — without ever seeing tenant transaction detail.

## In scope

- Org list (name, owner, member count, plan, created_at, last activity).
- User list (email, signup date, last login, orgs joined).
- Aggregate metrics (total orgs, total users, signups this week, MAU).
- Billing list per org (plan, amount, status).
- Hard exclusion of tenant data: no contributions, no member names, no categories.

## Out of scope

- Per-feature admin RBAC.
- Org suspension UI (P1).
- Impersonation (P2).
- Custom dashboards / saved queries.

## User stories

### S8.1 [P0] Org list
**As a** `super_admin`, **I want** a list of all organizations **so that** I can monitor adoption.
**Acceptance criteria:**
- Columns: org name, owner email, member count, plan, created_at, last activity timestamp.
- Sortable by created_at, last activity.
- Pagination 50/page.
- Counts derived without revealing names of members or transactions.

### S8.2 [P0] User list
**As a** `super_admin`, **I want** a list of all users **so that** I can support people.
**Acceptance criteria:**
- Columns: email, signup date, last login, count of orgs joined, platform role.
- Sortable / paginated.
- No view of contribution data attributed to that user.

### S8.3 [P0] Aggregate metrics dashboard
**As a** `super_admin`, **I want** aggregate metrics **so that** I have a pulse on the platform.
**Acceptance criteria:**
- Tiles: total orgs, total users, signups this week, MAU (last 30 days).
- Refreshes on page load; no caching beyond the request.

### S8.4 [P0] Billing list per org
**As a** `super_admin`, **I want** billing/charges per org **so that** I can monitor revenue.
**Acceptance criteria:**
- Columns: org, plan, amount, period, status (active / past_due / canceled).
- Aggregate row: total active MRR.
- Source: `Subscription` table; tenant ledger is **not** queried.

### S8.5 [P0] Hard exclusion of tenant detail
**As a** tenant, **I want** to know that admin **cannot** see my contributions **so that** I trust the platform.
**Acceptance criteria:**
- Code review: `app/admin/**` files **never** import from `app/features/<money/audit/etc>` modules.
- Lint rule (or folder boundary) enforces: admin loaders only query `Organization`, `User`, `Membership`, `Subscription`.
- Documentation (this section + privacy page in app) states the rule explicitly.

### S8.6 [P1] Suspend an organization
**As a** `super_admin`, **I want** to suspend an org **so that** I can respond to abuse / non-payment.
**Acceptance criteria:**
- Suspend toggles `Organization.is_suspended = true`.
- Suspended orgs: tenant users see read-only views with a banner; cannot post journal entries.
- Audit: `action: "platform.org.suspend"` (via E9).

### S8.7 [P2] Impersonation
Deferred. Requirements when picked up: tenant consent toggle, time-bound token, audit entry, persistent banner during session.

### S8.8 [P0] Toggle user active state
**As a** `super_admin`, **I want** to deactivate or reactivate a user **so that** I can close compromised or terminated accounts.
**Acceptance criteria:**
- Each row in the user list (S8.2) exposes an "Active" toggle.
- Deactivating a user flips `User.is_active` to `false`, invalidates all of that user's sessions, and blocks future login (E1 S1.2 / S1.7).
- Reactivating restores login; existing memberships are unchanged.
- A `super_admin` cannot deactivate their own account.
- Confirmation modal required on deactivate.
- Audit: `action: "platform.user.deactivate"` / `"platform.user.reactivate"` (E9 covers admin-side audit).

## Technical notes

- `super_admin` access enforced in two places: route loader (`platformRole === "super_admin"` else 403) and a query helper (`platformQuery(...)`) that disallows tables in the tenant set.
- Folder boundary: `app/admin/` for admin-only code; admin features must not import from `app/features/<tenant>/...`.
- Admin layout lives in `app/layouts/admin.tsx` and is selected by the root loader (E1 S1.4).

## Definition of done

- `super_admin` can navigate the four screens (orgs, users, metrics, billing).
- A `user` (non-admin) attempting `/admin` receives a 403.
- Lint / boundary check passes: admin files do not import tenant feature code.
- No contribution / member detail surfaces anywhere in admin UI.
