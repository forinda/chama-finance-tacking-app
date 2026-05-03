# E5 — Ledger Views & Reporting

> Status: planned
> Depends on: E4
> Blocks: —
> Owner: @forinda

## Goal

The treasurer (and members) can answer balance, per-member, and per-category questions in seconds, with date-range filters, and export to CSV.

## In scope

- Per-account balance display.
- Org total balance (sum of asset accounts).
- Per-member statement.
- Per-category statement.
- Date-range filters across all views.
- CSV export (P1).
- Member self-service view of their own statement.

## Out of scope

- Real reports (income statement, balance sheet) as standalone screens — derive informally from the views above for MVP.
- Charts / graphs.
- Scheduled email reports.
- PDF export (P2).

## User stories

### S5.1 [P0] Per-account balance
**As a** `treasurer`, **I want** to see each account's current balance **so that** I know what we have where.
**Acceptance criteria:**
- Lists all active accounts; shows balance computed as `SUM(debit_minor) - SUM(credit_minor)` for asset/expense accounts and reverse for liability/income/equity.
- Inactive accounts hidden behind a toggle.
- Updates immediately after posting an entry (no manual refresh needed for the same session — server data on next loader).

### S5.2 [P0] Org total balance
**As a** `treasurer`, **I want** to see total org balance **so that** I have a one-glance number.
**Acceptance criteria:**
- Sum of all asset accounts in the org.
- Visible on the dashboard / home.
- Always non-negative in healthy state; if negative, dashboard shows a warning banner.

### S5.3 [P0] Per-member statement
**As a** `treasurer`, **I want** a per-member statement **so that** I can answer "how much has Jane paid this year?"
**Acceptance criteria:**
- List all journal lines where `member_id = X`, with running total.
- Columns: date, account, category, amount (in or out, sign-aware), memo, entry status.
- Date range filter; default = current calendar year.
- Shows total contributions and total payouts to/for that member, separately.

### S5.4 [P0] Per-category statement
**As a** `treasurer`, **I want** a per-category statement **so that** I can answer "how much went to Welfare this quarter?"
**Acceptance criteria:**
- List all journal lines where `category_id = X` within the date range.
- Columns: date, account, member (if any), amount, memo.
- Total at top.
- Date range filter; default = last 90 days.

### S5.5 [P0] Date-range filter
**As a** `treasurer`, **I want** all ledger views to accept a date range **so that** I can produce monthly/quarterly views.
**Acceptance criteria:**
- Each view exposes a `from` / `to` date input. Sensible defaults per view.
- URL reflects the range (`?from=2025-01-01&to=2025-12-31`) so views are bookmarkable / shareable inside the org.

### S5.6 [P0] Member self-service statement
**As a** `member`, **I want** to see my own statement **so that** I can verify what's been recorded.
**Acceptance criteria:**
- A `member`-role user with a corresponding `Member` record sees only their own statement.
- Layout matches S5.3 but read-only and limited to the logged-in user's `Member` row(s).
- Cross-member browsing is forbidden at the loader level (403 if attempted).

### S5.7 [P1] CSV export
**As a** `treasurer`, **I want** to export any statement to CSV **so that** I can share with the committee.
**Acceptance criteria:**
- Each statement view has an "Export CSV" button.
- File reflects the active filters; UTF-8; comma-separated; ISO date format.
- Audit: `action: "report.export"` with view name and filter snapshot.

### S5.8 [P2] Printable PDF
Deferred.

## Technical notes

- Balances computed via SQL aggregation, not stored. Keep it simple; reconsider only if perf data shows a problem.
- Use TanStack Table for the statement grids — already a project dependency.
- Member self-service requires linking `User.id` to `Member.id` (open question in PRD §9). Until resolved, gate S5.6 behind that link or expose by `Member` lookup at admin discretion.

## Definition of done

- All four MVP views (account, org total, per-member, per-category) render correct numbers given a seeded test ledger.
- Date filtering works on all views and round-trips through the URL.
- Member can see only their own statement.
- Voided entries are excluded from balances but visible in raw journal list.
