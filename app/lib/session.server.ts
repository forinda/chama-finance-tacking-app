/**
 * Session storage — DB-backed via React Router's `createSessionStorage`.
 *
 * Why DB-backed (not signed-cookie sessions):
 *   - E1 S1.7 requires deactivating a user to invalidate their live sessions.
 *     Cookie-only sessions can't be invalidated server-side.
 *   - The signed cookie carries only the session row id; everything else
 *     lives in the `sessions` table and is loaded per request.
 *
 * Cookie hardening:
 *   - httpOnly: not readable by JS (defends against XSS exfil).
 *   - secure: forced in production (TLS-only).
 *   - sameSite=lax: blocks CSRF for state-changing cross-site POSTs while
 *     still allowing top-level navigations from external links.
 *   - secrets: rotation-friendly array; first entry signs new cookies, the
 *     rest are accepted for verification.
 *
 * TTL is 30 days. `updateData` bumps `lastSeenAt` on every read so stale
 * sessions can be reaped without forcing fresh logins for active users.
 */
import { eq, lt } from "drizzle-orm"
import { createCookie, createSessionStorage, redirect } from "react-router"

import { sessions } from "../../db/schema"
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

type SessionData = {
  userId: string
}

export const sessionStorage = createSessionStorage<SessionData>({
  cookie: sessionCookie,

  // Called when committing a brand-new session; we insert a row and return
  // its uuid as the cookie value.
  async createData(data, expires) {
    const expiresAt = expires ?? new Date(Date.now() + SESSION_TTL_MS)
    if (!data.userId) {
      throw new Error("Cannot create session without userId")
    }
    const [row] = await db
      .insert(sessions)
      .values({ userId: data.userId, expiresAt })
      .returning({ id: sessions.id })
    return row.id
  },

  // Called on every request that carries a session cookie. Expired rows are
  // deleted on read so stale sessions self-clean as they're touched.
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
    return { userId: row.userId }
  },

  async updateData(id, data, expires) {
    const patch: Partial<typeof sessions.$inferInsert> = {
      lastSeenAt: new Date(),
    }
    if (expires) patch.expiresAt = expires
    if (data.userId) patch.userId = data.userId
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
) {
  const session = request
    ? await getSession(request)
    : await sessionStorage.getSession()
  session.set("userId", userId)
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
