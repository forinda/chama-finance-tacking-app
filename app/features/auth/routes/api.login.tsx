/**
 * `POST /api/v1/auth/login` — versioned API endpoint for E1 S1.2.
 *
 * Resource route (action only, no default export).
 *
 * Behavior:
 *   - Validates the JSON body against `loginSchema`.
 *   - Rate-limits per email: 5 failed attempts in 15 min → 429. Successful
 *     logins reset the counter.
 *   - Generic error on every authentication failure (wrong password, no
 *     such user, inactive user). Identical message + status so the client
 *     can't distinguish them.
 *   - Timing-mitigation: when the user isn't found we still run an
 *     argon2id verify against a dummy hash, so the response time doesn't
 *     leak account existence.
 *   - On success: delete login_attempts for the email, mint a session,
 *     log a `user.login` audit row, return 200 with Set-Cookie and a
 *     redirectTo target.
 *
 * Responses:
 *   - 200 JSON `{ ok: true, userId, redirectTo }` + Set-Cookie on success.
 *   - 400 JSON `{ errors: { field: [msg] } }` on schema failure.
 *   - 401 JSON `{ formError: "Invalid email or password." }` on auth fail.
 *   - 429 JSON `{ formError: "Too many attempts. Try again in N min." }`.
 *   - 405 on non-POST.
 */
import { and, count, eq, gte, sql } from "drizzle-orm"
import { z } from "zod"

import { loginAttempts, users } from "../../../../db/schema"
import { extractRequestMeta, logAudit } from "~/lib/audit.server"
import { db } from "~/lib/db"
import { hashPassword, verifyPassword } from "~/lib/password.server"
import { sessionStorage } from "~/lib/session.server"

import { loginSchema } from "../schemas"

import type { Route } from "./+types/api.login"

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000

// Pre-computed once and cached: argon2id hash of a throw-away password.
// Used when a login attempt's email doesn't match any user, so the verify
// step still runs and the response time doesn't leak account existence.
let dummyHashPromise: Promise<string> | null = null
function getDummyHash() {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword(
      "this-is-not-a-real-password-only-used-for-timing-mitigation",
    )
  }
  return dummyHashPromise
}

const GENERIC_ERROR = "Invalid email or password."

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { formError: "Request body must be JSON." },
      { status: 400 },
    )
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    )
  }

  const { email, password } = parsed.data
  const meta = extractRequestMeta(request)
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)

  // Rate-limit gate.
  const [{ value: recentFailures }] = await db
    .select({ value: count() })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.emailLower, email),
        gte(loginAttempts.attemptedAt, windowStart),
      ),
    )

  if (recentFailures >= RATE_LIMIT_MAX) {
    return Response.json(
      {
        formError: `Too many attempts. Try again in ${Math.ceil(
          RATE_LIMIT_WINDOW_MS / 60_000,
        )} minutes.`,
      },
      { status: 429 },
    )
  }

  // Lookup. Always run the verify — even on miss — for timing parity.
  const [user] = await db
    .select()
    .from(users)
    .where(eq(sql`lower(${users.email})`, email))
    .limit(1)

  const hashToCheck = user?.passwordHash ?? (await getDummyHash())
  const passwordMatches = await verifyPassword(hashToCheck, password)

  const authenticated = Boolean(user) && passwordMatches && user!.isActive

  if (!authenticated) {
    await db
      .insert(loginAttempts)
      .values({ emailLower: email, ipAddress: meta.ipAddress })
    return Response.json({ formError: GENERIC_ERROR }, { status: 401 })
  }

  // Successful login: clear failure counter, mint session, audit.
  await db.delete(loginAttempts).where(eq(loginAttempts.emailLower, email))

  const session = await sessionStorage.getSession()
  session.set("userId", user!.id)
  const setCookie = await sessionStorage.commitSession(session)

  await logAudit({
    actorUserId: user!.id,
    actorRole: user!.platformRole,
    action: "user.login",
    entity: "user",
    entityId: user!.id,
    after: {
      id: user!.id,
      email: user!.email,
      platformRole: user!.platformRole,
    },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  })

  // E1 S1.4 will replace this redirectTo with role-aware routing
  // (`super_admin` → /admin, others → /onboarding or active-org dashboard).
  return Response.json(
    { ok: true, userId: user!.id, redirectTo: "/onboarding" },
    { headers: { "Set-Cookie": setCookie } },
  )
}
