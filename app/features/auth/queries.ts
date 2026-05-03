import { useQuery } from "@tanstack/react-query"

import { authKeys } from "./keys"

export type Session = {
  userId: string
  email: string
}

async function fetchSession(): Promise<Session | null> {
  const res = await fetch("/api/auth/session", { credentials: "include" })
  if (!res.ok) throw new Error("Failed to load session")
  return res.json()
}

export function useSessionQuery() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: fetchSession,
  })
}
