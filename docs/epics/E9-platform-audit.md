# E9 — Platform Audit

> Status: planned
> Depends on: E7, E8
> Blocks: —
> Owner: @forinda

## Goal

Every `super_admin` action produces an audit entry. The platform itself is auditable.

## In scope

- Admin actions wrapped in `withAudit()` like tenant mutations, with `org_id` either null (cross-platform actions) or set (single-tenant actions).
- Dedicated admin audit view filtered to `actor_role = "super_admin"`.

## Out of scope

- Hash-chained tamper-evidence.
- External SIEM forwarding.
- Per-action approval workflows.

## User stories

### S9.1 [P0] Admin actions are audited
**As a** `super_admin`, **every** action I take is recorded in `audit_log` **so that** admin behavior is itself auditable.
**Acceptance criteria:**
- All admin write actions (suspend, billing change, viewing a specific org's detail page) call `withAudit()`.
- `actor_role: "super_admin"` set on the row.
- `org_id` set when the action targets one org; null when platform-wide.
- Action names use the `platform.*` prefix (e.g. `platform.org.suspend`, `platform.org.view`).

### S9.2 [P1] Admin-audit dedicated view
**As a** `super_admin` or future auditor, **I want** a view filtered to admin-side activity **so that** I can review platform behavior separately from tenant activity.
**Acceptance criteria:**
- `/admin/audit` shows entries where `actor_role = "super_admin"`.
- Filters: actor, action prefix, target org, date range.
- Pagination 50/page.

## Technical notes

- Reuse `audit_log` from E7 — no separate admin-audit table. Distinguish by `actor_role` and `action` prefix.
- Reading a single org's detail in `/admin` is a sensitive event: log it (`platform.org.view`) so we can answer "did anyone look at our org?"
- Frequency of `platform.org.view` could grow large — partition or roll up later if it becomes a problem.

## Definition of done

- Sensitive admin actions produce `audit_log` entries verified by integration test.
- `/admin/audit` view (P1) shows admin-side activity with filters working.
- No admin write path bypasses `withAudit`.
