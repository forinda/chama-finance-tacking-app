/**
 * Admin layout — wraps `/admin` and everything beneath it (E1 S1.4 + E8).
 *
 * Role gate:
 *   - Anonymous → /auth/login.
 *   - `user` → 403. We deliberately use a hard 403 (not a silent redirect)
 *     so any leak shows up in logs/screens immediately.
 *   - `super_admin` → render.
 *
 * The admin chrome (sidebar, header, breadcrumbs) gets fleshed out as E8
 * lands; for now the layout is just an outlet shell with a tiny header so
 * super_admins see they're in the admin context.
 */
import { eq } from "drizzle-orm"
import { Outlet, redirect } from "react-router"

import { users } from "../../db/schema"
import { LogoutButton } from "~/features/auth"
import { db } from "~/lib/db"
import { getUserId, logout } from "~/lib/session.server"

import type { Route } from "./+types/admin"

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request)
  if (!userId) throw redirect("/auth/login")

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      platformRole: users.platformRole,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) throw await logout(request, "/auth/login")
  if (!user.isActive) throw await logout(request, "/auth/login")

  if (user.platformRole !== "super_admin") {
    throw new Response("Forbidden", { status: 403 })
  }

  return { user }
}

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData
  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="container mx-auto flex max-w-5xl items-center justify-between p-4">
          <div className="flex items-baseline gap-3">
            <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Admin
            </span>
            <span className="text-base font-medium">Chama Platform</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              {user.firstName} {user.lastName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
