# Progress

> Living document. Update when a story or epic transitions state. Counts roll up automatically.

## Status legend

- `todo` — not started
- `wip` — in progress (PR open or work happening)
- `done` — merged & acceptance criteria met
- `blocked` — waiting on a decision or dependency
- `phase-2` — explicitly deferred to the post-MVP / production phase

## Overall

- **Stories total:** 60
- **Done:** 0
- **WIP:** 0
- **Overall progress:** 0%
- **MVP (P0 only) total:** 45
- **MVP done:** 0
- **MVP progress:** 0%

_Last updated: 2026-05-03_

## Per-epic rollup

| Epic | Stories | Done | WIP | % | Status |
|---|---:|---:|---:|---:|---|
| E1 — Identity & Access | 7 | 0 | 0 | 0% | planned |
| E2 — Organization Lifecycle | 9 | 0 | 0 | 0% | planned |
| E3 — Members & Categories | 6 | 0 | 0 | 0% | planned |
| E4 — Money Movement | 6 | 0 | 0 | 0% | planned |
| E5 — Ledger & Reporting | 8 | 0 | 0 | 0% | planned |
| E6 — Reversals & Corrections | 4 | 0 | 0 | 0% | planned |
| E7 — Audit Trail | 5 | 0 | 0 | 0% | planned |
| E8 — Platform Admin Console | 8 | 0 | 0 | 0% | planned |
| E9 — Platform Audit | 2 | 0 | 0 | 0% | planned |
| E10 — Developer Tooling & Seeding | 5 | 0 | 0 | 0% | planned |
| **Total** | **60** | **0** | **0** | **0%** | |

## Story status

### E1 — Identity & Access
- [ ] `S1.1` [P0] Email + password signup (email, first name, last name, password) — **todo**
- [ ] `S1.2` [P0] Login (rejects inactive users) — **todo**
- [ ] `S1.3` [P0] Logout — **todo**
- [ ] `S1.4` [P0] Layout swap by platform role — **todo**
- [ ] `S1.5` [P0] Active-org switcher — **todo**
- [ ] `S1.6` [P1] Password reset by email (uses dev outbox in MVP) — **todo**
- [ ] `S1.7` [P0] User account active flag — **todo**

### E2 — Organization Lifecycle
- [ ] `S2.1` [P0] Create organization (name only; KES system-wide) — **todo**
- [ ] `S2.2` [P0] Seed default chart of accounts — **todo**
- [ ] `S2.3` [P0] Add existing user to org (email lookup) — **todo**
- [ ] `S2.4` [P0] Owner creates new user account and adds them — **todo**
- [ ] `S2.5` [P0] Remove a member — **todo**
- [ ] `S2.6` [P1] Rename org / edit description — **todo**
- [ ] `S2.7` [P2] Transfer ownership — **todo**
- [ ] `S2.8` [P0] Send email invitation (dev outbox in MVP) — **todo**
- [ ] `S2.9` [P0] Accept email invitation — **todo**

### E3 — Members & Categories
- [ ] `S3.1` [P0] Add a member — **todo**
- [ ] `S3.2` [P0] Edit member contact info — **todo**
- [ ] `S3.3` [P0] Deactivate a member — **todo**
- [ ] `S3.4` [P0] Add a category — **todo**
- [ ] `S3.5` [P0] Edit / deactivate a category — **todo**
- [ ] `S3.6` [P1] Bulk import members from CSV — **todo**

### E4 — Money Movement
- [ ] `S4.1` [P0] Record a contribution — **todo**
- [ ] `S4.2` [P0] Record a payout — **todo**
- [ ] `S4.3` [P0] Record a transfer between accounts — **todo**
- [ ] `S4.4` [P0] Chronological journal list — **todo**
- [ ] `S4.5` [P1] Attach a receipt file — **todo**
- [ ] `S4.6` [P1] Pending pledge → posted contribution — **todo**

### E5 — Ledger & Reporting
- [ ] `S5.1` [P0] Per-account balance — **todo**
- [ ] `S5.2` [P0] Org total balance — **todo**
- [ ] `S5.3` [P0] Per-member statement — **todo**
- [ ] `S5.4` [P0] Per-category statement — **todo**
- [ ] `S5.5` [P0] Date-range filter — **todo**
- [ ] `S5.6` [P0] Member self-service statement — **todo**
- [ ] `S5.7` [P1] CSV export — **todo**
- [ ] `S5.8` [P2] Printable PDF — **todo**

### E6 — Reversals & Corrections
- [ ] `S6.1` [P0] Void a posted entry — **todo**
- [ ] `S6.2` [P0] Void requires a reason — **todo**
- [ ] `S6.3` [P0] Voided entries visible with marker — **todo**
- [ ] `S6.4` [P1] Edit-as-reversal flow — **todo**

### E7 — Audit Trail
- [ ] `S7.1` [P0] Audit log infrastructure — **todo**
- [ ] `S7.2` [P0] Per-entity history view — **todo**
- [ ] `S7.3` [P0] Org-wide audit search — **todo**
- [ ] `S7.4` [P0] Append-only enforcement — **todo**
- [ ] `S7.5` [P1] Diff viewer — **todo**

### E8 — Platform Admin Console
- [ ] `S8.1` [P0] Org list — **todo**
- [ ] `S8.2` [P0] User list — **todo**
- [ ] `S8.3` [P0] Aggregate metrics dashboard — **todo**
- [ ] `S8.4` [P0] Billing list per org — **todo**
- [ ] `S8.5` [P0] Hard exclusion of tenant detail — **todo**
- [ ] `S8.6` [P1] Suspend an organization — **todo**
- [ ] `S8.7` [P2] Impersonation — **todo**
- [ ] `S8.8` [P0] Toggle user active state — **todo**

### E9 — Platform Audit
- [ ] `S9.1` [P0] Admin actions are audited — **todo**
- [ ] `S9.2` [P1] Admin-audit dedicated view — **todo**

### E10 — Developer Tooling & Seeding
- [ ] `S10.1` [P0] Seed users (admin + tenant samples) — **todo**
- [ ] `S10.2` [P0] Seed sample organizations + memberships + COA — **todo**
- [ ] `S10.3` [P1] Seed sample financial data — **todo**
- [ ] `S10.4` [P0] Dev outbox for outgoing email — **todo**
- [ ] `S10.5` [P1] One-command reset + reseed — **todo**

## Update protocol

When a story moves state:
1. Flip the checkbox: `- [ ]` → `- [x]` on `done`.
2. Replace the trailing tag with `**wip**` / `**done**` / `**blocked**` / `**phase-2**`.
3. Recount the per-epic rollup table.
4. Recount the **Overall** counters and percentages at the top.
5. Update `Last updated:` date (today's date).
6. If all stories in an epic are `done`, update the epic file's `Status:` header to `done` and reflect in the rollup table.

Commit message convention: `S<id>: <subject>` (e.g. `S4.1: record contribution form`).
