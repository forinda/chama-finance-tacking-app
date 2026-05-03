/**
 * Admin landing page — placeholder until E8 fleshes out the console.
 *
 * The layout (app/layouts/admin.tsx) already enforces the super_admin
 * role gate; this page just renders a brief confirmation so the route
 * does something visible.
 */
import type { Route } from "./+types/index"

export const meta: Route.MetaFunction = () => [{ title: "Admin · Chama" }]

export default function AdminIndexRoute() {
  return (
    <main className="container mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-medium">Platform admin console</h1>
      <p className="mt-2 text-muted-foreground">
        You're signed in as a super-admin. Org list, user management,
        billing and platform metrics ship in epic E8.
      </p>
    </main>
  )
}
