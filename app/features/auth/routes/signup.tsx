/**
 * Signup page — `/auth/signup`.
 *
 * UI-only route. The form posts to the versioned API endpoint at
 * `/api/v1/auth/signup` (see `api.signup.tsx`). This file is responsible
 * for: redirecting already-authenticated visitors away, and rendering the
 * form. All write logic, validation, and session minting live in the API
 * route.
 */
import { redirect } from "react-router"

import { getUserId } from "~/lib/session.server"

import { SignupForm } from "../components/signup-form"

import type { Route } from "./+types/signup"

export const meta: Route.MetaFunction = () => [{ title: "Sign up · Chama" }]

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request)
  if (userId) throw redirect("/onboarding")
  return null
}

export default function SignupRoute() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <SignupForm />
    </main>
  )
}
