/**
 * `login_attempts` — failed-login record used to rate-limit the login
 * endpoint (E1 S1.2: 5 attempts / 15 min per email).
 *
 * Convention:
 *   - We only insert on FAILURE (wrong password, inactive user, no such
 *     user). Successful logins delete every row for that email so the
 *     counter resets without leaving cruft.
 *   - `email_lower` is normalized at insert time. The query side counts
 *     rows for `email_lower` within the last 15 minutes.
 *   - `ip_address` is recorded for forensics; we don't currently rate-limit
 *     by IP, but the data is there if we add it.
 *
 * Cleanup: rows older than the rate-limit window are pointless to keep.
 * A periodic sweep (or a scheduled job in S10.5) can DELETE WHERE
 * attempted_at < now() - interval '1 hour'.
 */
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid().primaryKey().defaultRandom(),
    emailLower: text().notNull(),
    ipAddress: text(),
    attemptedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("login_attempts_email_attempted_at_idx").on(
      table.emailLower,
      table.attemptedAt,
    ),
  ],
)

export type LoginAttempt = typeof loginAttempts.$inferSelect
export type NewLoginAttempt = typeof loginAttempts.$inferInsert
