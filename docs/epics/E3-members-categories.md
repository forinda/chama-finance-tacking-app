# E3 — Members & Categories

> Status: planned
> Depends on: E2
> Blocks: E4
> Owner: @forinda

## Goal

The treasurer can manage the people who contribute (independent of app users) and the categories that classify money movement.

## In scope

- CRUD for `Member` (a contributor; not necessarily a `User`).
- Deactivate member (no hard delete).
- CRUD for `Category` with `kind: income | expense`.
- Bulk member CSV import (P1).

## Out of scope

- Linking a `Member` row to an external `User` ("claim profile") — deferred.
- Member custom fields / profile photos.
- Category icons / colors.

## User stories

### S3.1 [P0] Add a member
**As a** `treasurer`, **I want** to add a member with name + contact **so that** I can attribute contributions.
**Acceptance criteria:**
- Required: `name`. Optional: `phone`, `email`, `note`.
- Scoped by `org_id`.
- Audit: `action: "member.create"`.

### S3.2 [P0] Edit a member's contact info
**As a** `treasurer`, **I want** to edit a member **so that** records stay current.
**Acceptance criteria:**
- All fields editable except `id` and `org_id`.
- Audit: `action: "member.update"` with before/after.

### S3.3 [P0] Deactivate a member
**As a** `treasurer`, **I want** to deactivate a member **so that** they no longer appear in dropdowns but historical data is preserved.
**Acceptance criteria:**
- `is_active` flag toggles.
- Inactive members hidden from selection UIs by default but visible with a "Show inactive" toggle in member list.
- All historical journal lines remain unchanged.
- Audit: `action: "member.deactivate"` / `"member.reactivate"`.

### S3.4 [P0] Add a category
**As a** `treasurer`, **I want** to add a category with kind **so that** I can tag money movements.
**Acceptance criteria:**
- Fields: `name` (unique within org per kind), `kind: income | expense`.
- Audit: `action: "category.create"`.

### S3.5 [P0] Edit / deactivate a category
**As a** `treasurer`, **I want** to edit or deactivate categories **so that** the list stays clean.
**Acceptance criteria:**
- Cannot delete; only deactivate.
- Inactive hidden from selection UIs by default.
- Audit: `action: "category.update"` / `"category.deactivate"`.

### S3.6 [P1] Bulk import members from CSV
**As a** `treasurer`, **I want** to upload a CSV of members **so that** onboarding a 50-person chama is fast.
**Acceptance criteria:**
- CSV columns: `name, phone, email, note`. Header row required.
- Validates each row; shows preview with errors before commit.
- Atomic: all-or-nothing per upload (single transaction).
- Audit: one entry per imported member + one summary `action: "member.import"`.

## Technical notes

- `Member` is its own table. Do **not** use `User` to model contributors — most contributors will never log in.
- Soft delete via `is_active` flag, not `deleted_at`. Categories use the same pattern.
- Category `kind` constrains which accounts a journal line can target in E4 (income → income accounts; expense → expense accounts).

## Definition of done

- Treasurer can add members, edit them, deactivate them; deactivated members are hidden from contribution forms.
- Treasurer can add and deactivate categories with kind-based behavior.
- Audit log shows all member/category operations.
