/**
 * Orgs mutations — TanStack Query hooks for write-side state.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

import { apiClient, type ApiFieldErrors } from "~/lib/api-client"

import { orgKeys } from "./keys"
import type { CreateOrgInput, OrgSummary } from "./schemas"

export type CreateOrgSuccess = {
  ok: true
  org: OrgSummary
  redirectTo: string
}

export type CreateOrgErrorPayload = {
  errors?: ApiFieldErrors<keyof CreateOrgInput>
  formError?: string
}

export class CreateOrgError extends Error {
  status: number
  payload: CreateOrgErrorPayload

  constructor(status: number, payload: CreateOrgErrorPayload) {
    super(payload.formError ?? "Could not create organization")
    this.status = status
    this.payload = payload
  }
}

async function postCreateOrg(
  input: CreateOrgInput,
): Promise<CreateOrgSuccess> {
  try {
    const { data } = await apiClient.post<CreateOrgSuccess>(
      "/organizations",
      input,
    )
    return data
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      throw new CreateOrgError(err.response.status, err.response.data ?? {})
    }
    throw err
  }
}

export function useCreateOrgMutation() {
  const qc = useQueryClient()
  return useMutation<CreateOrgSuccess, CreateOrgError, CreateOrgInput>({
    mutationFn: postCreateOrg,
    onSuccess: () => {
      // The user's membership list changed; refetch any consumer using it.
      qc.invalidateQueries({ queryKey: orgKeys.all })
    },
  })
}
