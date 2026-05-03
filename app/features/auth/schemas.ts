/**
 * Zod schemas + inferred types for the auth feature.
 *
 * These are the single source of truth for shape & validation rules — used
 * by the client form (RHF resolver), the server route action (safeParse on
 * incoming form data), and any future API client. Do not duplicate field
 * rules elsewhere; import from here via the feature barrel.
 */
import { z } from "zod"

export const genderValues = ["male", "female", "other"] as const
export const genderSchema = z.enum(genderValues)
export type Gender = z.infer<typeof genderSchema>

export const signupSchema = z.object({
  email: z.string().min(1, "Email is required").email().toLowerCase().trim(),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(60, "First name must be 60 characters or fewer")
    .trim(),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(60, "Last name must be 60 characters or fewer")
    .trim(),
  // Optional in the API; defaults to "other" when omitted (matches the
  // database column default and the E1 spec).
  gender: genderSchema.optional().default("other"),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters"),
})

export type SignupInput = z.infer<typeof signupSchema>
