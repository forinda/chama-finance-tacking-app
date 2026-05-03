/**
 * /onboarding — post-auth landing for tenant users (E1 / E2).
 *
 * Two states:
 *   - User has no memberships → render the create-org form (E2 S2.1).
 *   - User has at least one membership → list their orgs with role; the
 *     org with the active session id is highlighted. A "Create another"
 *     link drops back into the form.
 *
 * The tenant layout (E1 S1.4) bounces super_admins and inactive users
 * before this loader runs, so we only see logged-in regular users here.
 */
import { desc, eq } from "drizzle-orm"
import { Link, redirect } from "react-router"

import { memberships, organizations, users } from "@db/schema"
import { LogoutButton } from "~/features/auth"
import { CreateOrgForm } from "~/features/orgs"
import { db } from "~/lib/db"
import { getActiveOrgId, getUserId } from "~/lib/session.server"

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
  if (!user) throw redirect("/auth/login")

  const myOrgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      description: organizations.description,
      plan: organizations.plan,
      role: memberships.role,
      createdAt: organizations.createdAt,
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.orgId, organizations.id))
    .where(eq(memberships.userId, userId))
    .orderBy(desc(organizations.createdAt))

  const activeOrgId = await getActiveOrgId(request)

  return {
    user,
    orgs: myOrgs.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    })),
    activeOrgId,
  }
}

export default function OnboardingRoute({ loaderData }: Route.ComponentProps) {
  const { user, orgs, activeOrgId } = loaderData
  const hasOrgs = orgs.length > 0

  return (
    <main className="container mx-auto max-w-2xl p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">
            {hasOrgs ? `Welcome back, ${user.firstName}` : `Welcome, ${user.firstName}!`}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {hasOrgs
              ? "Pick an organization to continue, or create another."
              : "Your account is ready. Create your first organization to start tracking contributions."}
          </p>
        </div>
        <LogoutButton />
      </div>

      {hasOrgs ? (
        <section className="mt-6 grid gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Your organizations
          </h2>
          <ul className="grid gap-2">
            {orgs.map((org) => (
              <li
                key={org.id}
                className={`flex items-center justify-between rounded-md border p-3 ${
                  org.id === activeOrgId ? "border-foreground/30 bg-muted/40" : ""
                }`}
              >
                <div>
                  <div className="font-medium">{org.name}</div>
                  {org.description ? (
                    <div className="text-sm text-muted-foreground">
                      {org.description}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {org.role}
                  </span>
                  {org.id === activeOrgId ? (
                    <span className="rounded bg-foreground/10 px-2 py-1 text-xs font-medium">
                      active
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <Link
            to="/onboarding?create=1"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Create another organization
          </Link>
        </section>
      ) : (
        <section className="mt-6">
          <CreateOrgForm />
        </section>
      )}

      <details className="mt-8 text-sm text-muted-foreground">
        <summary className="cursor-pointer">Account</summary>
        <dl className="mt-3 grid gap-2">
          <div>
            <dt className="font-medium">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt className="font-medium">User ID</dt>
            <dd className="font-mono">{user.id}</dd>
          </div>
        </dl>
      </details>
    </main>
  )
}
