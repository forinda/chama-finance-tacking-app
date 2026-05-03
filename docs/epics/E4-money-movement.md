# E4 — Money Movement

> Status: planned
> Depends on: E2, E3
> Blocks: E5, E6
> Owner: @forinda

## Goal

The treasurer records contributions, payouts, and inter-account transfers via simple forms. The backend translates each into a balanced double-entry journal entry. The treasurer never sees debit/credit terminology.

## In scope

- Record contribution (money in, attributed to a member, tagged with a category).
- Record payout (money out, optional recipient member, tagged with a category).
- Record transfer between two asset accounts (e.g. MPESA → Bank).
- Chronological list of all entries.
- Attach receipt file/photo (P1).
- Pending → posted state for pledges (P1).

## Out of scope

- Editing posted entries (handled via E6 reversal).
- Recurring/scheduled entries.
- Splits across multiple categories in one entry (use multiple entries for now).

## User stories

### S4.1 [P0] Record a contribution
**As a** `treasurer`, **I want** to record a member contribution **so that** it lands in the ledger.
**Acceptance criteria:**
- Form fields: `member`, `amount` (KES — system-wide), `received_into` (asset account, defaults to `Cash`), `category` (income kind), `occurred_at` (defaults to today), `memo` (optional). No currency input.
- On save the system posts a journal entry with two lines: `DR <received_into> amount` / `CR <income account mapped from category> amount`.
- `JournalEntry.status = "posted"`. `JournalEntry.posted_by_user_id = current user`.
- Validates: amount > 0; member active; category active; account active.
- Audit: `action: "journal.post"` with full entry + lines snapshot.

### S4.2 [P0] Record a payout
**As a** `treasurer`, **I want** to record a payout **so that** disbursements are tracked.
**Acceptance criteria:**
- Form fields: `paid_from` (asset account), `amount`, `category` (expense kind), `recipient_member` (optional), `occurred_at`, `memo`.
- Posts: `DR <expense account mapped from category> amount` / `CR <paid_from> amount`.
- Validates: source account has non-negative balance after post (warn but allow if user confirms — overdraw is real life).
- Audit: `action: "journal.post"`.

### S4.3 [P0] Record a transfer between accounts
**As a** `treasurer`, **I want** to record a transfer **so that** internal movements don't look like income or expense.
**Acceptance criteria:**
- Form fields: `from_account`, `to_account`, `amount`, `occurred_at`, `memo`.
- Both accounts must be `asset` type and different.
- Posts: `DR <to_account>` / `CR <from_account>`.
- No category required; transfer is internal.
- Audit: `action: "journal.post"`.

### S4.4 [P0] Chronological journal list
**As a** `treasurer`, **I want** to see all entries chronologically **so that** I can review what's been recorded.
**Acceptance criteria:**
- Default sort: `occurred_at DESC`, tiebreak by `posted_at DESC`.
- Each row shows: date, type (deduced from line shape — contribution / payout / transfer), amount, account(s), member or category, memo, status.
- Voided entries shown with strikethrough and a "voided" tag, linked to their reversing entry.
- Pagination: 50/page.

### S4.5 [P1] Attach a receipt file
**As a** `treasurer`, **I want** to attach a receipt **so that** I have evidence on file.
**Acceptance criteria:**
- File upload on the record forms (image or PDF, max 5MB).
- Stored as a `JournalEntry.attachment_url` or in an `entry_attachment` table for multiple files.
- Visible in entry detail view.
- Audit: file metadata in `after` snapshot.

### S4.6 [P1] Pending pledge → posted contribution
**As a** `treasurer`, **I want** to record a pledge as pending **so that** I can capture commitments separately from received funds.
**Acceptance criteria:**
- New entry can be saved as `status: "draft"`.
- Draft entries are visible in a "Pledges" tab; do not affect balances.
- "Mark received" action transitions the draft to `posted` and writes the journal lines.
- Audit: `action: "journal.draft.create"` then `"journal.post"`.

## Technical notes

- Use a single `JournalEntry` with N `JournalLine` rows. The line shape determines the entry "type" — there is no `entry_type` enum.
- Category-to-account mapping in MVP: each org has fixed default mappings (`Monthly contribution → Contributions`, `Welfare → Welfare`, etc.). Make this a join via `Category.default_account_id` set during seed (E2).
- `tenantQuery(orgId, …)` helper enforces `org_id` filter on every read.
- Validation that `SUM(debit) = SUM(credit)` runs in the post-helper before insert; fail fast.
- Money is `bigint` minor units (KES cents) throughout. UI takes a string like `"1,250.00"`, parses to `125000` minor units. KES displays with the `KSh` / `KES` symbol; no currency selector anywhere.

## Definition of done

- Recording a contribution / payout / transfer produces a balanced journal entry visible in the journal list.
- Each entry shows up correctly in the per-account balance (see E5).
- Audit log captures every post.
- Form validation rejects: negative/zero amounts, inactive members/categories/accounts, mismatched category kind.
