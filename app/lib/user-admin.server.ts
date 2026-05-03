/**
 * User-administration helpers — E1 S1.7.
 *
 * Server-only utilities that toggle `users.is_active` and revoke live
 * sessions atomically. The data column was created with the user table
 * (E1 S1.1) and login already rejects inactive accounts (E1 S1.2); this
 * module supplies the *write* path super_admins use to flip the flag.
 *
 * No HTTP surface yet — the admin UI lives in E8 S8.8 and will import
 * these functions directly from a role-gated route action. Until then we
 * call them from one-off scripts or tests.
 *
 * Invariants:
 *   - Update + session purge + audit log run inside one `db.transaction`.
 *     A failure rolls back all three; we never end up with an inactive
 *     user that still has a live session, or a state change without an
 *     audit row.
 *   - A super_admin cannot deactivate themselves. The check belongs at the
 *     UI layer too (E8 S8.8 acceptance), but we re-enforce here so any
 *     direct caller is also protected.
 *   - Reactivation does not bring sessions back — they were destroyed at
 *     deactivation; the user must log in again.
 */
import { eq } from "drizzle-orm"

import { sessions, users, type User } from "@db/schema"
import { logAudit } from "./audit.server"
import { db } from "./db"

export class UserAdminError extends Error {
  code: "self_deactivation" | "user_not_found" | "no_change"
  constructor(code: UserAdminError["code"], message: string) {
    super(message)
    this.code = code
  }
}

type ActorContext = {
  /** The super_admin performing the action. */
  actorUserId: string
  /** Optional request metadata for the audit row. */
  ipAddress?: string | null
  userAgent?: string | null
}

async function setUserActive(
  targetUserId: string,
  active: boolean,
  actor: ActorContext,
): Promise<User> {
  if (active === false && actor.actorUserId === targetUserId) {
    throw new UserAdminError(
      "self_deactivation",
      "An admin cannot deactivate their own account.",
    )
  }

  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1)

    if (!before) {
      throw new UserAdminError("user_not_found", "User not found.")
    }

    if (before.isActive === active) {
      throw new UserAdminError(
        "no_change",
        `User is already ${active ? "active" : "inactive"}.`,
      )
    }

    const [after] = await tx
      .update(users)
      .set({ isActive: active, updatedAt: new Date() })
      .where(eq(users.id, targetUserId))
      .returning()

    // Deactivation revokes every live session immediately. Reactivation
    // does NOT recreate sessions — the user logs in again to get one.
    if (!active) {
      await tx.delete(sessions).where(eq(sessions.userId, targetUserId))
    }

    await logAudit(
      {
        actorUserId: actor.actorUserId,
        actorRole: "super_admin",
        action: active ? "user.reactivate" : "user.deactivate",
        entity: "user",
        entityId: targetUserId,
        before: { isActive: before.isActive },
        after: { isActive: after.isActive },
        ipAddress: actor.ipAddress ?? null,
        userAgent: actor.userAgent ?? null,
      },
      tx,
    )

    return after
  })
}

export function deactivateUser(
  targetUserId: string,
  actor: ActorContext,
): Promise<User> {
  return setUserActive(targetUserId, false, actor)
}

export function reactivateUser(
  targetUserId: string,
  actor: ActorContext,
): Promise<User> {
  return setUserActive(targetUserId, true, actor)
}
