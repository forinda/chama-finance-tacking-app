# Chama Finance Tracking — PRD

> Phase: prototype / MVP planning
> Owner: @forinda
> Status: draft v1

This is the **index document**. Detailed scope per workstream lives in `docs/epics/`. Treat each epic file as the single source of truth for its stories — do not expand scope mid-epic.

---

## 1. Problem

Group savings collectives ("chamas"), small NGOs, churches, and similar groups rely on a single treasurer to receive contributions, disburse funds, and answer "where did the money go?" Today this happens in spreadsheets, WhatsApp screenshots, and notebooks. Reconciliation is painful, audit is impossible, and disputes are common.

This product gives treasurers a multi-tenant web app to record every money movement with full audit history and reconcile-able ledger semantics, while letting a platform owner monitor signups and billing without seeing tenant financial detail.

## 2. Goals (MVP)

- A treasurer can record contributions and payouts and answer "what is our balance?" in under 10 seconds.
- Every change to financial data is reconstructable from an append-only history.
- Cash totals always reconcile (no floats; balanced entries).
- A platform owner can see organizations, users, and aggregate metrics without seeing individual transactions.
- One codebase, two layouts (tenant vs. platform admin), swapped by `platformRole`.

### Non-goals (MVP)

- Multi-currency. **All orgs use KES (Kenyan Shilling).** No currency picker.
- OAuth / social login. Email + password only.
- Bank/MPESA API integrations. (Manual entry only.)
- Mobile apps. (Responsive web only.)
- Granular admin RBAC. (Single `super_admin` role is enough.)
- Public APIs / third-party integrations.
- Impersonation / "log in as user X." (Defer.)

## 3. Users & Roles

### Platform roles (on `User`)

| Role | Sees |
|---|---|
| `user` | Tenant app only. Their own orgs and the data of orgs they belong to. |
| `super_admin` | Platform admin console. Org list, user list, billing, aggregate metrics. **Never** tenant transaction detail. |

The app swaps layout based on `platformRole`. `super_admin` is created out-of-band (seed / env-driven). Self-signup always creates `user`.

### Org roles (on `Membership`, scoped by `org_id`)

| Role | Capability |
|---|---|
| `owner` | Everything `treasurer` can do + manage members, change org settings, delete org. |
| `treasurer` | Record contributions, payouts, transfers; void entries (creates reversal); manage chart-of-accounts and categories. |
| `member` | Read-only: own contribution history, org balance summary. |

A user can belong to N organizations with different roles in each.

## 4. Architecture decisions (locked)

| Concern | Decision |
|---|---|
| Tenancy | Shared DB, shared schema, **row-level** via `org_id` on every tenant table. |
| Auth | Email + password (MVP); session cookie; `platformRole` and `Membership[]` on session. |
| Layout | Single app; layout swap on `platformRole`. Routes: `/` (tenant), `/admin/*` (platform). |
| Money | `bigint` minor units (cents). No floats anywhere. **All amounts in KES.** Currency is a system-wide constant, not a per-org setting. |
| Ledger | **Double-entry**: `Account`, `JournalEntry`, `JournalLine`. Posted entries immutable. Voids = reversing entries. |
| Audit | Single `audit_log` table, JSONB before/after, append-only. App-layer `withAudit()` wrapper. |
| Hosting | Single deploy of the React Router v7 SSR app. Postgres. |

## 5. Domain Model

```
User { id, email, firstName, lastName, gender: male|female|other (default 'other'), passwordHash, platformRole: user|super_admin, isActive, mustChangePassword, createdAt, … }
  └─ Membership { user_id, org_id, role: owner|treasurer|member }

Organization { id, name, plan, created_at }   -- currency is a system constant (KES); not stored per-org
  ├─ Account { id, org_id, code, name, type, parent_id, is_active }
  ├─ Member { id, org_id, name, contact, … }            ← contributor; need not be a User
  ├─ Category { id, org_id, name, kind: income|expense } ← purpose tag
  ├─ JournalEntry { id, org_id, occurred_at, memo, status, reverses_entry_id, posted_by_user_id }
  └─ JournalLine { id, journal_entry_id, account_id, debit_minor, credit_minor, member_id?, category_id? }

audit_log { id, org_id?, actor_user_id, action, entity, entity_id, before, after, at, request_id, ip, user_agent }
Subscription { org_id, plan, status, charge_amount, period }   ← admin-visible billing surface
```

Invariants:
- Every tenant table carries `org_id`; every tenant query filters by it via `tenantQuery(orgId, …)`.
- For each `JournalEntry`, `SUM(debit_minor) = SUM(credit_minor)` on transition `draft → posted`.
- Posted `JournalEntry` is never updated. Status flips to `void` only via a new reversing entry.
- `audit_log` is append-only (convention now; DB-grant pre-launch).

## 6. Epics

| ID | Epic | File | Status |
|---|---|---|---|
| E1 | Identity & Access | [docs/epics/E1-identity-access.md](./epics/E1-identity-access.md) | planned |
| E2 | Organization Lifecycle | [docs/epics/E2-organization-lifecycle.md](./epics/E2-organization-lifecycle.md) | planned |
| E3 | Members & Categories | [docs/epics/E3-members-categories.md](./epics/E3-members-categories.md) | planned |
| E4 | Money Movement | [docs/epics/E4-money-movement.md](./epics/E4-money-movement.md) | planned |
| E5 | Ledger Views & Reporting | [docs/epics/E5-ledger-reporting.md](./epics/E5-ledger-reporting.md) | planned |
| E6 | Reversals & Corrections | [docs/epics/E6-reversals-corrections.md](./epics/E6-reversals-corrections.md) | planned |
| E7 | Audit Trail | [docs/epics/E7-audit-trail.md](./epics/E7-audit-trail.md) | planned |
| E8 | Platform Admin Console | [docs/epics/E8-platform-admin.md](./epics/E8-platform-admin.md) | planned |
| E9 | Platform Audit | [docs/epics/E9-platform-audit.md](./epics/E9-platform-audit.md) | planned |
| E10 | Developer Tooling & Seeding | [docs/epics/E10-developer-tooling.md](./epics/E10-developer-tooling.md) | planned |

Story IDs use the form `S<epic>.<n>` (e.g. `S4.3`). Reference these IDs in commits, PRs, and conversation.

## 7. MVP scope

P0 stories across all epics define MVP. P1 ships post-MVP if cheap. P2 is explicitly deferred. **Phase 2** stories (currently: E2 S2.8 email invitations) ship after the production cutover when an email provider is wired up.

Dependency order (rough):
```
E1 → E2 → E3 → E4 → E5 → E6 → E7
              ↘     ↗
                E8 → E9
```

### Phase 2 (post-MVP, production cutover)

- **Real email provider** behind the existing `sendEmail()` interface (currently the dev outbox in E10 S10.4). Swapping it in lights up production email for invitations, password reset, and any future notifications without changing feature code.

## 8. Success metrics

| Metric | Target (90 days post-launch) |
|---|---|
| Time from first login → first recorded contribution | < 5 min median |
| Treasurers who record ≥ 10 entries in their first month | ≥ 50% of signups |
| Orgs with ≥ 3 active members | ≥ 30% of orgs |
| Reconciliation drift reports from users | 0 (impossible by design) |
| Audit-related support tickets | < 1 per 100 orgs / month |

## 9. Open questions

- Member identity: do we need a "claim your member profile" flow so a `Member` row can be linked to a `User`? Defer unless requested.
- Pricing: free tier limits (members? entries/month?)? Needed before billing screen has real data.
- Backups & data export: at what cadence, and who can trigger? Defer past MVP but plan storage.
- Email provider for production (Phase 2). MVP uses a dev outbox (E10 S10.4) so all email-dependent flows work locally.

### Resolved

- ~~Currency selection~~ → **KES only**, system-wide constant. No picker, no per-org setting.
- ~~OAuth login~~ → out of scope for MVP and beyond unless demand surfaces.
- ~~Email invitations in MVP~~ → kept in MVP, backed by dev outbox (E10 S10.4); real provider lights up in Phase 2.

## 10. Out of scope (and why)

| Item | Reason |
|---|---|
| Any currency other than KES | Target market is Kenyan chamas. Multi-currency adds FX + reporting cost with no MVP demand. |
| OAuth / social login | Out of scope. Email + password is enough for the target user. |
| Bank/MPESA API auto-import | Integration cost is huge; manual entry is fine for groups < 100 members. |
| Mobile native | Responsive web meets the bar for treasurers. |
| Granular admin RBAC | One `super_admin` is enough for solo founder phase. |
| Loan management / interest accrual | Adjacent product. Track interest as just another category in MVP. |
| Public API | Premature. |

## 11. Glossary

- **Chama**: East African informal savings/investment group, typically 5–50 members pooling funds.
- **Treasurer**: The person responsible for receiving, holding, and disbursing the group's money.
- **Double-entry**: Accounting model where each transaction has equal total debits and credits across N accounts.
- **Journal entry**: One transaction envelope. Contains 2+ journal lines that sum to zero.
- **Posted vs. draft**: A draft entry is editable; a posted entry is immutable and must be reversed to correct.
- **Reversing entry**: A new journal entry that offsets a previous one — used instead of editing or deleting.
- **Chart of accounts (COA)**: The hierarchical list of accounts (Cash, MPESA, Income, Expense, …) the org uses.
- **Tenant**: An organization. Each tenant's data is isolated by `org_id`.
