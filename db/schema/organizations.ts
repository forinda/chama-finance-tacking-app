/**
 * `organizations` — the tenant root (E2).
 *
 * Every tenant-scoped table joins back to this row via `org_id`. The
 * domain decision is row-level multi-tenancy; we never split per-org.
 *
 * Notes:
 *   - `name` is human-readable; uniqueness is per-platform, case-
 *     insensitive (people will type "Sunrise Chama" and "sunrise chama"
 *     and we want them to collide on the create form rather than have
 *     two ambiguous orgs).
 *   - `plan` defaults to "free"; billing surface lands in E8 / S8.4.
 *   - Currency is **KES system-wide** (PRD decision) — no column needed.
 *   - Soft-delete is deferred to E2 S2.7 (org deletion); not in MVP.
 */
import { sql } from "drizzle-orm"
import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

export const organizations = pgTable(
  "organizations",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    description: text(),
    plan: text().notNull().default("free"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("organizations_name_unique").on(sql`lower(${table.name})`),
  ],
)

export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
