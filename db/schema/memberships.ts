/**
 * `memberships` — link table between User and Organization (E2).
 *
 * One row per (user_id, org_id) pair, carrying the user's role inside
 * that org. A user can belong to N orgs with different roles in each.
 *
 * Cascading deletes:
 *   - When the user is hard-deleted, drop their memberships (auth-side
 *     hygiene). Note we never hard-delete users in MVP — toggling
 *     `is_active` is the supported deactivation path (E1 S1.7).
 *   - When the org is hard-deleted, drop its memberships. Org delete
 *     itself is a future story.
 */
import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import { membershipRoleEnum } from "./enums"
import { organizations } from "./organizations"
import { users } from "./users"

export const memberships = pgTable(
  "memberships",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orgId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: membershipRoleEnum().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("memberships_user_org_unique").on(table.userId, table.orgId),
    index("memberships_org_idx").on(table.orgId),
  ],
)

export type Membership = typeof memberships.$inferSelect
export type NewMembership = typeof memberships.$inferInsert
