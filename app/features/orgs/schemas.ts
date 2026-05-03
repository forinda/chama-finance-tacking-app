/**
 * Zod schemas + inferred types for the organizations feature (E2).
 *
 * Single source of truth used by the create-org form (RHF resolver), the
 * `POST /api/v1/organizations` action, and any consumer that needs the
 * shape of an org payload.
 */
import { z } from "zod"

export const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be 80 characters or fewer")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer")
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
})

export type CreateOrgInput = z.infer<typeof createOrgSchema>

export type MembershipRole = "owner" | "treasurer" | "member"

export type OrgSummary = {
  id: string
  name: string
  description: string | null
  plan: string
  role: MembershipRole
  createdAt: string
}
