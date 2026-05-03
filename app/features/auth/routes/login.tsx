/**
 * Login page — `/auth/login`.
 *
 * UI-only route. The form posts to the versioned API endpoint at
 * `/api/v1/auth/login`. Already-authenticated visitors are bounced to
 * /onboarding so this page is for the logged-out state only.
 */
import { redirect } from "react-router"

import { getUserId } from "~/lib/session.server"

import { LoginForm } from "../components/login-form"

import type { Route } from "./+types/login"

export const meta: Route.MetaFunction = () => [{ title: "Log in · Chama" }]

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request)
  if (userId) throw redirect("/onboarding")
  return null
}

export default function LoginRoute() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <LoginForm />
    </main>
  )
}
