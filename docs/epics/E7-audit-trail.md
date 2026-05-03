# E7 — Audit Trail

> Status: planned
> Depends on: all previous (writes happen in E1–E6); UI features here.
> Blocks: —
> Owner: @forinda

## Goal

Every mutation in the system is captured in an append-only `audit_log` with actor, timestamp, before/after snapshots. Owners and treasurers can investigate any change.

## In scope

- `audit_log` table + `withAudit()` mutation wrapper (infrastructure, used by E1–E6).
- Per-entity history view (timeline for one entity).
- Org-wide audit search (filter by actor, action, entity, date).
- Append-only enforcement (convention now; DB grant pre-launch).

## Out of scope

- Diff viewer with side-by-side JSON formatting beyond plain JSON dump (P1 polish).
- Replay / restore from audit log.
- Tamper-evidence (hash chains). Defer until enterprise customer asks.

## User stories

### S7.1 [P0] Audit log infrastructure
**As a** developer, **I want** a `withAudit()` wrapper used in every mutation **so that** writes always produce an audit entry.
**Acceptance criteria:**
- Helper signature: `withAudit({ action, entity, entityId, before, after, orgId? }, fn)`.
- Helper inserts an `audit_log` row in the same DB transaction as `fn`.
- CI rule (lint or test) verifies that any file under `app/features/**/mutations.ts` calls `withAudit` (or explicitly opts out with a comment).
- `audit_log` columns per PRD §5.

### S7.2 [P0] Per-entity history view
**As an** `owner` or `treasurer`, **I want** to see the audit history of any entry **so that** I can answer questions in a meeting.
**Acceptance criteria:**
- Detail page for any auditable entity has a "History" tab.
- Tab shows reverse-chronological list: action, actor, timestamp, expandable before/after JSON.
- Actor displayed as user email (or "system" for seeded data).

### S7.3 [P0] Org-wide audit search
**As an** `owner`, **I want** to search the audit log for my org **so that** I can investigate concerns.
**Acceptance criteria:**
- Filters: actor (user picker), action prefix (e.g. `journal.*`), entity, date range.
- Results paginated 50/page.
- Limited to `org_id = activeOrgId` (`super_admin` has its own admin audit view in E9).

### S7.4 [P0] Append-only enforcement
**As an** any user, **I cannot** edit or delete `audit_log` rows **so that** the trail is trustworthy.
**Acceptance criteria:**
- App layer: no code path performs UPDATE / DELETE on `audit_log` (verified by code review + grep test).
- DB layer (pre-launch milestone, not MVP): a separate DB role with INSERT-only grant on `audit_log`.

### S7.5 [P1] Diff viewer
**As an** `owner`, **I want** before/after as a clean diff (not just JSON dump) **so that** changes are easy to read.
**Acceptance criteria:**
- Side-by-side or inline diff with key-level highlighting.
- Falls back to JSON dump for unsupported types.

## Technical notes

- `audit_log` shape (final, locked):
  ```
  id, org_id?, actor_user_id, actor_role,
  action,        -- dotted name: "<entity>.<verb>"
  entity, entity_id,
  before jsonb, after jsonb,
  at timestamptz, request_id text, ip inet, user_agent text
  ```
- Action naming convention: `<entity>.<verb>` (e.g. `journal.post`, `member.update`, `org.create`).
- `withAudit` lives in `app/lib/audit.ts`. All mutations import from here.
- Indexes: `(org_id, entity, entity_id, at desc)` and `(actor_user_id, at desc)`.

## Definition of done

- Every E1–E6 mutation produces an audit entry verified by integration test.
- Per-entity history view renders correctly.
- Org-wide search filters work.
- Lint/test enforces `withAudit` usage in mutation files.
