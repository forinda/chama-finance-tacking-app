/**
 * Create-org form — E2 S2.1.
 *
 * Mirrors the auth form architecture: RHF + Zod via standard-schema
 * resolver against the same schema the API validates server-side, with
 * a TanStack Query mutation talking to `/api/v1/organizations`. On
 * success we navigate to the server-supplied `redirectTo`.
 */
import * as React from "react"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router"

import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"

import { useCreateOrgMutation } from "../mutations"
import { createOrgSchema, type CreateOrgInput } from "../schemas"

export function CreateOrgForm() {
  const navigate = useNavigate()
  const createOrg = useCreateOrgMutation()

  const form = useForm<CreateOrgInput>({
    resolver: standardSchemaResolver(createOrgSchema),
    defaultValues: { name: "", description: "" },
  })

  // Mirror server field errors into the form.
  React.useEffect(() => {
    if (!createOrg.error) return
    const payload = createOrg.error.payload
    if (payload.errors) {
      for (const [field, msgs] of Object.entries(payload.errors)) {
        if (msgs && msgs.length > 0) {
          form.setError(field as keyof CreateOrgInput, { message: msgs[0] })
        }
      }
    }
  }, [createOrg.error, form])

  const onSubmit = form.handleSubmit((values) => {
    createOrg.mutate(values, {
      onSuccess: ({ redirectTo }) => navigate(redirectTo),
    })
  })

  const isSubmitting = createOrg.isPending
  const formError =
    createOrg.error && !createOrg.error.payload.errors
      ? (createOrg.error.payload.formError ?? createOrg.error.message)
      : null

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your organization</CardTitle>
        <CardDescription>
          Every group needs an organization. You'll be its owner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="grid gap-4" noValidate>
            {formError ? (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </p>
            ) : null}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Sunrise Chama" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What is this group for?"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    All amounts are tracked in KES.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating organization…" : "Create organization"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
