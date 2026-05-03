/**
 * Onboarding placeholder.
 *
 * Lands here immediately after signup (E1 S1.1) or login (E1 S1.2). The
 * real "create your first organization" flow ships in story S2.1 — until
 * then this page just confirms the account exists and shows who's
 * logged in. Includes a logout button (E1 S1.3) so dev sessions can be
 * cleared from the UI.
 *
 * Authenticated-only: an anonymous visitor is sent to /auth/login.
 */
import { eq } from "drizzle-orm"
import { redirect } from "react-router"

import { users } from "../../db/schema"
import { LogoutButton } from "~/features/auth"
import { db } from "~/lib/db"
import { getUserId } from "~/lib/session.server"

import type { Route } from "./+types/onboarding"

export const meta: Route.MetaFunction = () => [{ title: "Welcome · Chama" }]

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request)
  if (!userId) throw redirect("/auth/login")

  const [user] = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  // Defensive — session pointed at a user that no longer exists.
  if (!user) throw redirect("/auth/login")
  return { user }
}

export default function OnboardingRoute({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData
  return (
    <main className="container mx-auto max-w-2xl p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">Welcome, {user.firstName}!</h1>
          <p className="mt-2 text-muted-foreground">
            Your account is ready. The next step is to create your first
            organization — that flow ships in story S2.1.
          </p>
        </div>
        <LogoutButton />
      </div>
      <dl className="mt-6 grid gap-2 text-sm">
        <div>
          <dt className="font-medium">Email</dt>
          <dd className="text-muted-foreground">{user.email}</dd>
        </div>
        <div>
          <dt className="font-medium">User ID</dt>
          <dd className="font-mono text-muted-foreground">{user.id}</dd>
        </div>
      </dl>
    </main>
  )
}
