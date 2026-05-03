/**
 * Auth mutations — TanStack Query hooks that call the versioned API.
 *
 * On success each mutation invalidates the auth scope so any component that
 * queries the current session refetches. The form/component layer is free
 * to read mutation state (`isPending`, `error`, `data`) and decide UX
 * (navigation, toast, inline errors).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

import { apiClient, type ApiFieldErrors } from "~/lib/api-client"

import { authKeys } from "./keys"
import type { SignupInput } from "./schemas"

export type SignupSuccess = {
  ok: true
  userId: string
  redirectTo: string
}

export type SignupErrorPayload = {
  errors?: ApiFieldErrors<keyof SignupInput>
  formError?: string
}

export class SignupError extends Error {
  status: number
  payload: SignupErrorPayload

  constructor(status: number, payload: SignupErrorPayload) {
    super(payload.formError ?? "Signup failed")
    this.status = status
    this.payload = payload
  }
}

async function postSignup(input: SignupInput): Promise<SignupSuccess> {
  try {
    const { data } = await apiClient.post<SignupSuccess>("/auth/signup", input)
    return data
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      throw new SignupError(err.response.status, err.response.data ?? {})
    }
    throw err
  }
}

export function useSignupMutation() {
  const qc = useQueryClient()
  return useMutation<SignupSuccess, SignupError, SignupInput>({
    mutationFn: postSignup,
    onSuccess: () => {
      // Session changed — wipe any cached auth queries so they refetch.
      qc.invalidateQueries({ queryKey: authKeys.all })
    },
  })
}
