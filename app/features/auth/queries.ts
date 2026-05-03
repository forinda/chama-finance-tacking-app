/**
 * Auth queries — TanStack Query hooks for read-side state.
 *
 * `useSessionQuery` reads the current session from `/api/v1/auth/me`. The
 * `me` endpoint isn't built yet (lands with E1 S1.4 layout swap); this hook
 * is wired and ready so consumers can adopt it the moment it does.
 */
import { useQuery } from "@tanstack/react-query"

import { apiClient } from "~/lib/api-client"

import { authKeys } from "./keys"

export type Session = {
  userId: string
  email: string
  firstName: string
  lastName: string
  platformRole: "user" | "super_admin"
}

async function fetchSession(): Promise<Session | null> {
  try {
    const { data } = await apiClient.get<Session>("/auth/me")
    return data
  } catch {
    return null
  }
}

export function useSessionQuery() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: fetchSession,
  })
}
