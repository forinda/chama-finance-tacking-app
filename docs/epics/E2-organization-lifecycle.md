# E2 — Organization Lifecycle

> Status: planned
> Depends on: E1
> Blocks: E3, E4
> Owner: @forinda

## Goal

A user can create an organization, the system seeds a usable chart of accounts, and the owner can add collaborators by three paths: look up an existing account, create one directly, or send an email invitation. In MVP, email goes through a **dev outbox** (logged + stored in DB) — no real provider. Production swaps in a real provider in Phase 2.

## In scope

- Create org (name only — currency is system-wide KES).
- Seed default chart of accounts and default categories on creation.
- Add existing user to the org by exact-email lookup, with a role.
- Create a new user account on behalf of someone and add them in one step.
- Send an email invitation to a (possibly unregistered) email with a role.
- Accept an email invitation.
- Remove member.
- Rename org / edit description (P1).

## Out of scope (MVP)

- Currency selection — locked system-wide to KES.
- Org deletion (handle as soft-delete / suspend, P2).
- Owner transfer (P2).
- Custom subdomains.
- A real email provider — replaced by dev outbox in MVP (see E10 S10.4).

## Phase 2 (post-MVP, production)

- Real email provider behind the same `sendEmail()` interface used by the dev outbox — invitations and password resets go through actual SMTP / API.

## User stories

### S2.1 [P0] Create organization
**As a** new user, **I want** to create an organization with a name **so that** I can start recording money.
**Acceptance criteria:**
- Form validates: `name` 2–80 chars. No currency input — all amounts are KES system-wide.
- Creator becomes `Membership.role = "owner"`.
- `activeOrgId` updated to the new org.
- Audit: `action: "org.create"`.

### S2.2 [P0] Seed default chart of accounts on org create
**As an** `owner`, **I want** the default COA seeded automatically **so that** I don't configure accounting.
**Acceptance criteria:**
- On org create, the system inserts a fixed chart: `Cash`, `MPESA`, `Bank` (asset); `Contributions` (income); `Welfare`, `Operations` (expense); `Equity` (equity).
- Default categories created: `Monthly contribution`, `Welfare`, `Operations`, `Loan repayment`.
- All seed rows scoped by `org_id`.
- Audit: per-row `action: "account.create"` / `category.create"` with `actor: system`.

### S2.3 [P0] Add existing user to org (email lookup)
**As an** `owner`, **I want** to look up a registered user by exact email and add them to my org **so that** I can grant access without invitations.
**Acceptance criteria:**
- Form fields: `email` (exact match required), `role` (`treasurer` | `member`; never `owner`).
- Lookup is exact-match only — no partial / fuzzy search (privacy: don't expose the user directory).
- If a user with that email exists, the form reveals their name and a confirm button.
- If no user exists, show "User not registered. Create their account?" with a CTA to S2.4.
- Adding creates a `Membership` row. If a `Membership` already exists for that user/org, show the existing role instead of creating a duplicate.
- Audit: `action: "membership.create"` with snapshot of the new row.

### S2.4 [P0] Owner creates a new user account and adds them
**As an** `owner`, **I want** to create a new login account for a collaborator and add them to my org in one step **so that** non-registered people can join without email invitations.
**Acceptance criteria:**
- Form fields: `email`, `first_name`, `last_name`, `role` (`treasurer` | `member`), `temp_password` (auto-generated, shown once to the owner so they can share it out-of-band).
- New `User` created with `platformRole: "user"`, `is_active: true`, hashed `temp_password`.
- `Membership` created in the same transaction with the chosen role.
- Owner sees a one-time confirmation screen with the email + temp password to share manually (since no email provider).
- Newly-created user can log in immediately with the temp password and is prompted to change it on first login (gated by a `must_change_password` flag on `User`).
- If the email already exists, the form falls back to S2.3 (add existing).
- Audit: `action: "user.create_by_owner"` and `"membership.create"`.

### S2.5 [P0] Remove a member
**As an** `owner`, **I want** to remove a member **so that** departed users lose access.
**Acceptance criteria:**
- Cannot remove the last `owner` of an org.
- Removed user's existing `JournalLine.member_id` references are preserved; only the `Membership` row is deleted.
- Audit: `action: "membership.remove"` with `before` snapshot of the membership.

### S2.6 [P1] Rename org / edit description
**As an** `owner`, **I want** to rename the org **so that** records stay accurate.
**Acceptance criteria:**
- Only `owner` can edit.
- Audit: `action: "org.update"` with before/after JSON.

### S2.7 [P2] Transfer ownership
Deferred — flesh out when prioritized.

### S2.8 [P0] Send email invitation
**As an** `owner`, **I want** to invite a user by email **so that** I can grant access without creating an account on their behalf or sharing temp passwords.
**Acceptance criteria:**
- Form fields: `email`, `role` (`treasurer` | `member`).
- Generates a 32-byte URL-safe token; stores `sha256(token)` in `Invite { id, org_id, email, role, token_hash, expires_at, status }`.
- TTL: 7 days. Single-use. Status transitions: `pending → accepted | expired | revoked`.
- Calls `sendEmail()` (E10 S10.4) with the invite link. In MVP the dev outbox logs + stores the message; in Phase 2 a real provider sends it.
- Owner can copy the invite link from the UI directly (cover the dev case where mail isn't configured at all).
- Owner can revoke a pending invite.
- If a `Membership` already exists for that email, the form rejects with a clear message.
- Audit: `action: "invite.create"` (and `"invite.revoke"` if revoked).

### S2.9 [P0] Accept email invitation
**As an** invited person, **I want** to accept an invite link **so that** I gain access to the org.
**Acceptance criteria:**
- Token validates: not expired, not used, status `pending`.
- If the invitee email matches an existing logged-in user → one-click accept → creates `Membership`.
- If the invitee email matches an existing user not logged in → login screen prefilled with email; on success, accept proceeds.
- If no user exists → signup screen prefilled with email; on completion (S1.1), accept proceeds.
- On accept: `Invite.status = "accepted"`, `Membership` created, `activeOrgId` set to the org, redirect to dashboard.
- Audit: `action: "invite.accept"` and `"membership.create"`.

## Technical notes

- **Three onboarding paths coexist** in MVP: invite (S2.8/S2.9), email-lookup add (S2.3), and owner-creates-account (S2.4). Each covers a different real-world case; treasurer picks per situation.
- Email send abstracted behind `sendEmail()` in `app/lib/email.ts` (E10 S10.4). MVP implementation = dev outbox; Phase 2 = real provider. Feature code never branches on environment.
- `User.must_change_password boolean default false` — set to `true` for users created via S2.4. Login flow forces a change-password screen when the flag is set.
- `Invite { id, org_id, email, role, token_hash, expires_at, status, created_by_user_id, created_at }`. Token never stored in plaintext.
- Email-lookup search (S2.3) is **exact match only**. Do not implement substring or prefix search; it leaks the user directory.
- COA seed lives in `app/features/organization/seed-coa.ts` (or wherever org feature ends up). Single source of truth.
- Currency is system-wide KES; no per-org setting.

## Definition of done

- Creating an org seeds COA + categories visible in the UI immediately.
- Owner can onboard via all three paths: invite/accept (S2.8/S2.9), email-lookup add (S2.3), and owner-creates-account (S2.4).
- Invite tokens expire and can be revoked.
- A user created via S2.4 is forced to change password on first login.
- Removing a member preserves financial history.
- Audit log shows the full creation chain on a fresh org.
