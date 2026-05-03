/**
 * Audit log writer.
 *
 * Transactionality is the key property here: an audit row must never exist
 * without the change it describes, and a committed change must never lack
 * its audit entry. To enforce that, callers wrap their work in
 * `db.transaction(async (tx) => { ... })` and pass `tx` to `logAudit`.
 *
 *   await db.transaction(async (tx) => {
 *     const [user] = await tx.insert(users).values(...).returning()
 *     await logAudit({ ...entry }, tx)
 *   })
 *
 * Calling `logAudit(entry)` without an executor uses the global db client
 * and is acceptable only when there is no accompanying write to coordinate
 * with (e.g. a standalone "user.view" event). When in doubt: pass a tx.
 *
 * The full `withAudit()` wrapper (auto-derives before/after, infers entity
 * from table) lands in story S7.1; this is the minimal version.
 */
import { auditLog, type NewAuditEntry } from "../../db/schema"
import { db } from "./db"

// Extract the transaction type directly from `db.transaction`'s callback so
// it always matches drizzle's actual signature — no manual generics to keep
// in sync.
export type DbTx = Parameters<typeof db.transaction>[0] extends (
  tx: infer T,
  ...rest: unknown[]
) => unknown
  ? T
  : never

export type DbExecutor = typeof db | DbTx

export async function logAudit(
  entry: NewAuditEntry,
  executor: DbExecutor = db,
): Promise<void> {
  await executor.insert(auditLog).values(entry)
}

/**
 * Pull the IP and User-Agent off an incoming Request for audit metadata.
 * Trusts `x-forwarded-for` only as far as your reverse proxy strips/sets it.
 */
export function extractRequestMeta(request: Request) {
  return {
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent") ?? null,
  }
}
