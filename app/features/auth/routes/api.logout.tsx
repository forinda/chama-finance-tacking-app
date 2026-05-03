/**
 * `POST /api/v1/auth/logout` — versioned API endpoint for E1 S1.3.
 *
 * Resource route (action only). Destroys the server-side session row,
 * returns a clearing `Set-Cookie`, and emits a `user.logout` audit row.
 *
 * Idempotent: posting twice (or when not logged in) still returns 200 with
 * a clearing cookie. We never reveal whether a session existed.
 *
 * Responses:
 *   - 200 JSON `{ ok: true, redirectTo: "/auth/login" }` + Set-Cookie.
 *   - 405 on non-POST.
 */
import { extractRequestMeta, logAudit } from "~/lib/audit.server"
import { getSession, sessionStorage } from "~/lib/session.server"

import type { Route } from "./+types/api.logout"

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  }

  const session = await getSession(request)
  const userId = session.get("userId") ?? null

  // Destroy the server-side session row + return a clearing cookie. This
  // call returns a Set-Cookie even if the session never existed, so a
  // double-logout is safe and indistinguishable from a single one.
  const setCookie = await sessionStorage.destroySession(session)

  // Best-effort audit. We don't gate the response on it because logout
  // succeeding visually is more important than a missed audit row.
  if (userId) {
    const meta = extractRequestMeta(request)
    try {
      await logAudit({
        actorUserId: userId,
        action: "user.logout",
        entity: "user",
        entityId: userId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      })
    } catch {
      // Swallow — the user is already logged out as far as the cookie is
      // concerned; surfacing an audit failure here would only confuse them.
    }
  }

  return Response.json(
    { ok: true, redirectTo: "/auth/login" },
    { headers: { "Set-Cookie": setCookie } },
  )
}
