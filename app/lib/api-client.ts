/**
 * Axios instance pointed at our versioned API.
 *
 * Use this for every client-side data call so the base URL, credentials
 * policy, and error shape stay consistent.
 *
 *   import { apiClient } from "~/lib/api-client"
 *   const { data } = await apiClient.post("/auth/signup", input)
 *
 * Notes:
 *   - `baseURL` is `/api/v1` — every call site writes the path relative to
 *     that. When we cut a v2 we add a second client and migrate features
 *     incrementally; the v1 endpoints keep working.
 *   - `withCredentials: true` so the session cookie travels on every
 *     request. Server-side code should not import this module.
 */
import axios from "axios"

export const apiClient = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

/** Field-scoped errors returned by API routes on validation failure. */
export type ApiFieldErrors<TFields extends string = string> = Partial<
  Record<TFields, string[]>
>
