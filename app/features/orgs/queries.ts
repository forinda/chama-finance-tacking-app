/**
 * Orgs queries — TanStack Query hooks for read-side state.
 *
 * `useMyOrgsQuery` lists every org the current user belongs to, with their
 * role on each membership. Backed by a future `/api/v1/me/orgs` endpoint;
 * for now /onboarding fetches via its loader and seeds initialData if
 * needed.
 */
import { useQuery } from "@tanstack/react-query"

import { apiClient } from "~/lib/api-client"

import { orgKeys } from "./keys"
import type { OrgSummary } from "./schemas"

async function fetchMyOrgs(): Promise<OrgSummary[]> {
  const { data } = await apiClient.get<OrgSummary[]>("/me/orgs")
  return data
}

export function useMyOrgsQuery() {
  return useQuery({
    queryKey: orgKeys.list(),
    queryFn: fetchMyOrgs,
  })
}
