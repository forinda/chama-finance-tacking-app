import { useMutation, useQueryClient } from "@tanstack/react-query"

import { authKeys } from "./keys"
import type { Session } from "./queries"

export type LoginInput = { email: string; password: string }

async function login(input: LoginInput): Promise<Session> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Login failed")
  return res.json()
}

async function logout(): Promise<void> {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  })
  if (!res.ok) throw new Error("Logout failed")
}

export function useLoginMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: (session) => qc.setQueryData(authKeys.session(), session),
  })
}

export function useLogoutMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      qc.setQueryData(authKeys.session(), null)
      qc.invalidateQueries({ queryKey: authKeys.all })
    },
  })
}
