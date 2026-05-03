/**
 * `audit_log` — append-only history of every user-visible mutation.
 *
 * Conventions:
 *   - `action` is dotted: `<entity>.<verb>` (e.g. "user.signup",
 *     "journal.post").
 *   - `before`/`after` are plain JSON snapshots; never include secrets
 *     (passwordHash, tokens). Authors curate which fields land in the
 *     snapshot per call site.
 *   - `org_id` is null for platform-level events (signup, super_admin
 *     actions); set for tenant-scoped events.
 *   - Rows are written by `app/lib/audit.server.ts#logAudit` inside the
 *     same transaction as the change being audited (see that file's
 *     header comment for why).
 *
 * Append-only is enforced by convention now; pre-launch we'll switch to a
 * separate DB role with INSERT-only grants (E7 S7.4).
 *
 * Indexes target the two access patterns we expect:
 *   1. "show me history for entity X in org Y"  → org_entity index
 *   2. "show me what user Z did"                 → actor index
 */
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid().primaryKey().defaultRandom(),
    orgId: uuid(),
    actorUserId: uuid(),
    actorRole: text(),
    action: text().notNull(),
    entity: text().notNull(),
    entityId: text(),
    before: jsonb(),
    after: jsonb(),
    requestId: text(),
    ipAddress: text(),
    userAgent: text(),
    at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_org_entity_idx").on(
      table.orgId,
      table.entity,
      table.entityId,
      table.at,
    ),
    index("audit_log_actor_idx").on(table.actorUserId, table.at),
  ],
)

export type AuditEntry = typeof auditLog.$inferSelect
export type NewAuditEntry = typeof auditLog.$inferInsert
