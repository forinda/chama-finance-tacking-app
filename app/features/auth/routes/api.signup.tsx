/**
 * `POST /api/v1/auth/signup` — versioned API endpoint for E1 S1.1.
 *
 * Resource route (no default export); only `action` is exported.
 *
 * Request body: JSON, validated against `signupSchema`.
 *
 * Responses:
 *   - 200 JSON `{ ok: true, userId, redirectTo }` + `Set-Cookie` on success.
 *   - 400 JSON `{ errors: { field: [msg] } }` on validation failure.
 *   - 409 JSON `{ errors: { email: ["already registered"] } }` on dup.
 *   - 405 JSON `{ error: "Method not allowed" }` for non-POST.
 *
 * Validation runs server-side via the same Zod schema the client uses.
 * Insert + audit run in a single `db.transaction` so a successful signup
 * is always paired with its audit row, and any failure rolls both back.
 */
import { eq, sql } from "drizzle-orm"
import { z } from "zod"

import { users } from "../../../../db/schema"
import { extractRequestMeta, logAudit } from "~/lib/audit.server"
import { db } from "~/lib/db"
import { hashPassword } from "~/lib/password.server"
import { sessionStorage } from "~/lib/session.server"

import { signupSchema } from "../schemas"

import type { Route } from "./+types/api.signup"

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { formError: "Request body must be JSON." },
      { status: 400 },
    )
  }

  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    )
  }

  const { email, firstName, lastName, gender, password } = parsed.data

  // Case-insensitive uniqueness check — matches lower(email) unique index.
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(sql`lower(${users.email})`, email))
    .limit(1)

  if (existing.length > 0) {
    return Response.json(
      { errors: { email: ["This email is already registered."] } },
      { status: 409 },
    )
  }

  const passwordHash = await hashPassword(password)
  const meta = extractRequestMeta(request)

  // Atomic insert + audit. If either fails, both roll back.
  const user = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(users)
      .values({ email, firstName, lastName, gender, passwordHash })
      .returning()

    await logAudit(
      {
        actorUserId: created.id,
        actorRole: created.platformRole,
        action: "user.signup",
        entity: "user",
        entityId: created.id,
        // Snapshot only safe fields — never include passwordHash.
        after: {
          id: created.id,
          email: created.email,
          firstName: created.firstName,
          lastName: created.lastName,
          gender: created.gender,
          platformRole: created.platformRole,
          isActive: created.isActive,
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
      tx,
    )

    return created
  })

  // Mint a session and respond with Set-Cookie. Client navigates on
  // success — we hand back a target so the client doesn't have to know it.
  const session = await sessionStorage.getSession()
  session.set("userId", user.id)
  return Response.json(
    { ok: true, userId: user.id, redirectTo: "/onboarding" },
    {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    },
  )
}
