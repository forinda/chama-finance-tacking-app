/**
 * `POST /api/v1/organizations` — versioned API endpoint for E2 S2.1.
 *
 * Resource route (action only).
 *
 * Behavior:
 *   1. Auth gate — must be logged in.
 *   2. Validate JSON body against `createOrgSchema`.
 *   3. Reject duplicate names (case-insensitive uniqueness).
 *   4. In one db.transaction:
 *        a) insert the organization row,
 *        b) insert the owner Membership for the caller,
 *        c) write a `org.create` audit row.
 *   5. After the transaction commits, set `activeOrgId` on the session
 *      so the user's next request is already scoped to this org.
 *
 * Responses:
 *   - 200 JSON `{ ok, org, redirectTo }` + Set-Cookie (session updated).
 *   - 400 JSON `{ errors }` on schema failure.
 *   - 401 JSON `{ formError }` if not authenticated.
 *   - 409 JSON `{ errors: { name: [...] } }` if name already taken.
 *   - 405 on non-POST.
 */
import { eq, sql } from "drizzle-orm"
import { z } from "zod"

import {
  memberships,
  organizations,
  type Organization,
} from "../../../../db/schema"
import { extractRequestMeta, logAudit } from "~/lib/audit.server"
import { db } from "~/lib/db"
import {
  getSession,
  getUserId,
  sessionStorage,
} from "~/lib/session.server"

import { createOrgSchema } from "../schemas"

import type { Route } from "./+types/api.create"

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  }

  const userId = await getUserId(request)
  if (!userId) {
    return Response.json(
      { formError: "You must be logged in to create an organization." },
      { status: 401 },
    )
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

  const parsed = createOrgSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    )
  }

  const { name, description } = parsed.data

  const existing = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(sql`lower(${organizations.name})`, name.toLowerCase()))
    .limit(1)

  if (existing.length > 0) {
    return Response.json(
      { errors: { name: ["An organization with this name already exists."] } },
      { status: 409 },
    )
  }

  const meta = extractRequestMeta(request)

  const org: Organization = await db.transaction(async (tx) => {
    const [createdOrg] = await tx
      .insert(organizations)
      .values({ name, description: description ?? null })
      .returning()

    await tx.insert(memberships).values({
      userId,
      orgId: createdOrg.id,
      role: "owner",
    })

    await logAudit(
      {
        orgId: createdOrg.id,
        actorUserId: userId,
        action: "org.create",
        entity: "organization",
        entityId: createdOrg.id,
        after: {
          id: createdOrg.id,
          name: createdOrg.name,
          description: createdOrg.description,
          plan: createdOrg.plan,
          ownerUserId: userId,
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
      tx,
    )

    return createdOrg
  })

  // Make the new org the session's active org so the next request is
  // already scoped to it.
  const session = await getSession(request)
  session.set("activeOrgId", org.id)
  const setCookie = await sessionStorage.commitSession(session)

  return Response.json(
    {
      ok: true,
      org: {
        id: org.id,
        name: org.name,
        description: org.description,
        plan: org.plan,
        role: "owner" as const,
        createdAt: org.createdAt.toISOString(),
      },
      redirectTo: "/onboarding",
    },
    { headers: { "Set-Cookie": setCookie } },
  )
}
