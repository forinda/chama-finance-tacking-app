/**
 * TanStack Query key factory for the orgs domain.
 *
 *   orgKeys.all                — wipes the whole scope on invalidate
 *   orgKeys.list()             — current user's memberships / orgs list
 *   orgKeys.detail(id)         — single org details
 */
export const orgKeys = {
  all: ["orgs"] as const,
  list: () => [...orgKeys.all, "list"] as const,
  detail: (id: string) => [...orgKeys.all, "detail", id] as const,
}
