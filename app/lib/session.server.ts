/**
 * Session storage — DB-backed via React Router's `createSessionStorage`.
 *
 * Why DB-backed (not signed-cookie sessions):
 *   - E1 S1.7 requires deactivating a user to invalidate their live sessions.
 *     Cookie-only sessions can't be invalidated server-side.
 *   - The signed cookie carries only the session row id; everything else
 *     lives in the `sessions` table and is loaded per request.
 *
 * Session shape carried back to callers:
 *   - userId: who is logged in.
 *   - activeOrgId: which organization their tenant requests target.
 *     Null until they create or switch into one. Set in E2 S2.1 (org
 *     create) and S1.5 (active-org switcher).
 *
 * Cookie hardening:
 *   - httpOnly, secure (prod), sameSite=lax, signed with rotating
 *     `secrets`. First entry signs new cookies; remaining entries are
 *     accepted on read.
 *
 * TTL is 30 days. `updateData` bumps `lastSeenAt` on every read so stale
 * sessions can be reaped without forcing fresh logins for active users.
 */
import { eq, lt } from "drizzle-orm"
import { createCookie, createSessionStorage, redirect } from "react-router"

import { sessions, type NewSession } from "../../db/schema"
import { db } from "./db"
import { env, isProduction } from "./env.server"

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

const sessionCookie = createCookie("__session", {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  secrets: [env.SESSION_SECRET],
  maxAge: SESSION_TTL_MS / 1000,
})

// Both fields required at the type level so `session.set("activeOrgId", …)`
// is reachable. Use `null` to mean "no active org yet" — most callers will
// commit a session with userId + activeOrgId=null and update it later.
type SessionData = {
  userId: string
  activeOrgId: string | null
}

export const sessionStorage = createSessionStorage<SessionData>({
  cookie: sessionCookie,

  async createData(data, expires) {
    const expiresAt = expires ?? new Date(Date.now() + SESSION_TTL_MS)
    if (!data.userId) {
      throw new Error("Cannot create session without userId")
    }
    const [row] = await db
      .insert(sessions)
      .values({
        userId: data.userId,
        activeOrgId: data.activeOrgId,
        expiresAt,
      })
      .returning({ id: sessions.id })
    return row.id
  },

  async readData(id) {
    const [row] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1)
    if (!row) return null
    if (row.expiresAt.getTime() < Date.now()) {
      await db.delete(sessions).where(eq(sessions.id, id))
      return null
    }
    return { userId: row.userId, activeOrgId: row.activeOrgId }
  },

  async updateData(id, data, expires) {
    const patch: Partial<NewSession> = { lastSeenAt: new Date() }
    if (expires) patch.expiresAt = expires
    if (data.userId) patch.userId = data.userId
    // Caller may explicitly set `null` to clear the active org — only
    // skip when the field was not provided at all.
    if ("activeOrgId" in data) patch.activeOrgId = data.activeOrgId
    await db.update(sessions).set(patch).where(eq(sessions.id, id))
  },

  async deleteData(id) {
    await db.delete(sessions).where(eq(sessions.id, id))
  },
})

/** Convenience: parse the request cookie header and return the session bag. */
export async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"))
}

/** Returns the authenticated userId or null — never throws. */
export async function getUserId(request: Request): Promise<string | null> {
  const session = await getSession(request)
  return session.get("userId") ?? null
}

/** Returns the active org id from the session, or null. */
export async function getActiveOrgId(
  request: Request,
): Promise<string | null> {
  const session = await getSession(request)
  return session.get("activeOrgId") ?? null
}

/**
 * Mint a session for `userId` and redirect with the Set-Cookie header.
 *
 * Pass `request` if the visitor already has an existing session cookie that
 * should be re-used; omit it for a fresh sign-up flow.
 */
export async function createUserSession(
  userId: string,
  redirectTo: string,
  request?: Request,
  options?: { activeOrgId?: string | null },
) {
  const session = request
    ? await getSession(request)
    : await sessionStorage.getSession()
  session.set("userId", userId)
  if (options?.activeOrgId !== undefined) {
    session.set("activeOrgId", options.activeOrgId)
  }
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  })
}

/** Invalidate the current session and clear the cookie. */
export async function logout(request: Request, redirectTo = "/auth/login") {
  const session = await getSession(request)
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  })
}

/**
 * Sweep expired session rows. Intended for a periodic job; safe to call
 * anytime since `readData` already drops expired rows lazily.
 */
export async function purgeExpiredSessions() {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()))
}
