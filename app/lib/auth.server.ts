/**
 * Auth-related helpers shared across loaders.
 *
 * Single source of truth for the post-login landing path so the login
 * action, signup action, login page loader, and root redirects all
 * agree on where to send a user given their `platformRole`.
 */
import type { User } from "@db/schema"

export type PlatformRole = User["platformRole"]

/**
 * Where to send a freshly authenticated user. Super-admins go straight to
 * the admin console; everyone else lands on /onboarding (which itself will
 * be replaced once active orgs exist — E2 / S1.5).
 */
export function landingPathForRole(role: PlatformRole): string {
  return role === "super_admin" ? "/admin" : "/onboarding"
}
