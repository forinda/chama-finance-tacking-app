/**
 * Tenant layout — wraps every page outside the admin console and
 * authentication routes (E1 S1.4).
 *
 * Role gate:
 *   - Anonymous → render the layout (some tenant pages, like the home
 *     route, are public; the page's own loader redirects if it needs
 *     auth).
 *   - Regular `user` → render the layout.
 *   - `super_admin` → bounce to /admin so they don't accidentally land in
 *     tenant context.
 *
 * Inactive users get bounced too — defense in depth on top of the login
 * gate (E1 S1.7) in case a session was minted before deactivation
 * propagated.
 */
import { eq } from "drizzle-orm"
import { Outlet, redirect } from "react-router"

import { users } from "@db/schema"
import { db } from "~/lib/db"
import { getUserId, logout } from "~/lib/session.server"

import type { Route } from "./+types/tenant"

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request)
  if (!userId) return null

  const [user] = await db
    .select({
      platformRole: users.platformRole,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  // Session points at a deleted user — clear it.
  if (!user) throw await logout(request, "/auth/login")

  // Defense in depth — login already rejects inactive users (E1 S1.2),
  // but if a session predates a deactivation we drop it here too.
  if (!user.isActive) throw await logout(request, "/auth/login")

  if (user.platformRole === "super_admin") throw redirect("/admin")
  return null
}

export default function TenantLayout() {
  return <Outlet />
}
