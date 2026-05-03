/**
 * Postgres enums shared across tables.
 *
 * `platform_role` controls the layout-swap and admin gate (E1 S1.4 / E8).
 * Adding a value here is a migration — keep the list small and intentional.
 *
 * `gender` is captured per E1 S1.1; defaults to "other" at the column level.
 */
import { pgEnum } from "drizzle-orm/pg-core"

export const platformRoleEnum = pgEnum("platform_role", ["user", "super_admin"])

export const genderEnum = pgEnum("gender", ["male", "female", "other"])
