/**
 * Single Drizzle client used by every server-side loader, action, and helper.
 *
 * Pool sized at 10 — fine for SSR with low concurrency. Bump if loaders start
 * blocking on connection acquisition.
 *
 * `prepare: false` disables postgres.js prepared statements, which interact
 * badly with PgBouncer in transaction-pooling mode (the most common Postgres
 * managed-service config, e.g. Neon/Supabase). Drizzle still benefits from
 * its own prepared-query cache.
 *
 * `casing: "snake_case"` keeps columns snake_cased in SQL while we use
 * camelCase property names in TypeScript. Must match drizzle.config.ts so
 * generated migrations and the runtime client agree.
 */
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "@db/schema"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required")
}

const queryClient = postgres(process.env.DATABASE_URL, {
  max: 10,
  prepare: false,
})

export const db = drizzle(queryClient, { schema, casing: "snake_case" })

export type Db = typeof db
