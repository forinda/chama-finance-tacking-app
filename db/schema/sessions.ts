/**
 * `sessions` — server-side session store backing the cookie.
 *
 * The signed cookie carries only this row's id; the rest lives here so we
 * can revoke sessions server-side (required by E1 S1.7 — deactivating a
 * user must drop their live sessions). Cascade delete on `userId` ensures
 * we don't orphan rows when a user is hard-deleted.
 *
 * `expiresAt` is checked at read time and the row is deleted lazily;
 * `purgeExpiredSessions()` in `app/lib/session.server.ts` is the periodic
 * sweep helper.
 */
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import { users } from "./users"

export const sessions = pgTable(
  "sessions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
)

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
