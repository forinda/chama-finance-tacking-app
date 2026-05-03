# E6 — Reversals & Corrections

> Status: planned
> Depends on: E4
> Blocks: —
> Owner: @forinda

## Goal

Treasurers correct mistakes by **reversing** posted entries — never by editing or deleting. The original entry remains visible in history with a clear "voided" marker.

## In scope

- Void a posted entry (creates a reversing entry).
- Reason required on void (captured in audit).
- "Edit" UX shortcut that voids + lets re-entry in one flow.
- Voided entries excluded from balances but visible in journal list.

## Out of scope

- Editing memos / non-financial fields on posted entries (potentially safe but defer to keep rules simple).
- Multi-step approval workflows for voids.
- Auto-detected reversals.

## User stories

### S6.1 [P0] Void a posted entry
**As a** `treasurer`, **I want** to void a posted entry **so that** I can correct mistakes — preserving audit trail.
**Acceptance criteria:**
- "Void" action available on any `posted` entry. Disabled if `status = "void"` or already reversed.
- System creates a new `JournalEntry` with `reverses_entry_id = original.id`, lines copied with debit↔credit swapped.
- The original's `status` flips to `"void"`. The reversing entry is `posted`.
- Both entries are visible in the journal list, linked.
- Balances reflect the net (zero) effect immediately.

### S6.2 [P0] Void requires a reason
**As a** `treasurer`, **I want** to be required to provide a reason on void **so that** the audit log records intent.
**Acceptance criteria:**
- Void modal mandates a `reason` text (≥ 10 chars).
- Reason stored in the reversing `JournalEntry.memo` and in `audit_log.after.reason`.
- Audit: `action: "journal.void"` with `before` = original entry snapshot, `after` = reversing entry snapshot + reason.

### S6.3 [P0] Voided entries visible with marker
**As a** `treasurer`, **I want** to see voided entries clearly marked **so that** I can see what happened.
**Acceptance criteria:**
- Voided rows have a strikethrough on amount and a "voided" badge.
- Clicking shows entry detail with link to the reversing entry.
- Voided entries excluded from all balance calculations and statements (E5) but included in raw journal list (E4).

### S6.4 [P1] Edit-as-reversal flow
**As a** `treasurer`, **I want** an "edit" shortcut that voids + lets me re-enter corrected data **so that** corrections feel natural.
**Acceptance criteria:**
- "Edit" action on a posted entry opens void modal pre-filled, then opens a new entry form pre-filled from the original.
- Both transactions occur in a single DB transaction; if the new entry fails to validate, the void rolls back.
- Audit shows the linked sequence: `journal.void` then `journal.post` with a `correction_of` reference in metadata.

## Technical notes

- "Void" is **never** an UPDATE on financial fields of the original. The only change is `status: posted → void` and a back-reference to the reversing entry.
- Reversing entry's lines mirror the original: each line's `debit_minor` becomes `credit_minor` and vice versa, account/member/category preserved.
- Add a DB constraint or trigger: cannot void an already-voided entry; cannot void a draft (it's not in the ledger yet — just delete the draft).

## Definition of done

- Voiding works end-to-end: original marked voided, reversing entry posted, balances unchanged net.
- Audit log captures void with reason.
- UI clearly distinguishes voided entries.
- Cannot void without reason; cannot void already-voided entries.
