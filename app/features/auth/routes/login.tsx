/**
 * Login page — `/auth/login`.
 *
 * UI-only route. The form posts to the versioned API endpoint at
 * `/api/v1/auth/login`. Already-authenticated visitors are bounced to
 * the role-appropriate landing page (E1 S1.4): `super_admin` → /admin,
 * everyone else → /onboarding.
 */
import { eq } from "drizzle-orm"
import { redirect } from "react-router"

import { users } from "@db/schema"
import { landingPathForRole } from "~/lib/auth.server"
import { db } from "~/lib/db"
import { getUserId } from "~/lib/session.server"

import { LoginForm } from "../components/login-form"

import type { Route } from "./+types/login"

export const meta: Route.MetaFunction = () => [{ title: "Log in · Chama" }]

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request)
  if (!userId) return null

  const [user] = await db
    .select({ platformRole: users.platformRole })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (user) throw redirect(landingPathForRole(user.platformRole))
  return null
}

export default function LoginRoute() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <LoginForm />
    </main>
  )
}
