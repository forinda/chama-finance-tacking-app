/**
 * `users` — the platform identity row.
 *
 * Notes:
 *   - `email` carries a unique index over `lower(email)` so address case
 *     never lets two accounts coexist (Jane@x.com vs jane@x.com).
 *   - `gender` defaults to "other" (E1 spec); the column is non-nullable so
 *     the default applies even when the API omits it.
 *   - `platformRole` controls layout swap (E1 S1.4); only the env-driven
 *     seed is allowed to mint super_admin — never via signup.
 *   - `isActive` gates login (E1 S1.7). Toggling it to false invalidates
 *     all of the user's sessions; admin UI lives in E8 S8.8.
 *   - `mustChangePassword` is set when an org owner creates an account on
 *     someone's behalf (E2 S2.4) — login redirects to a change-password
 *     screen until cleared.
 */
import { sql } from "drizzle-orm"
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import { genderEnum, platformRoleEnum } from "./enums"

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),
    email: text().notNull(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    gender: genderEnum().notNull().default("other"),
    passwordHash: text().notNull(),
    platformRole: platformRoleEnum().notNull().default("user"),
    isActive: boolean().notNull().default(true),
    mustChangePassword: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(sql`lower(${table.email})`),
  ],
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
