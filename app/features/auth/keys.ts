/**
 * TanStack Query key factory for the auth domain.
 *
 * Conventions:
 *   - `all` is the root and is also used as the broad invalidation target.
 *   - Sub-keys spread `all` so an `invalidateQueries({ queryKey: authKeys.all })`
 *     wipes everything auth-scoped in one call.
 */
export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  user: (id: string) => [...authKeys.all, "user", id] as const,
}
