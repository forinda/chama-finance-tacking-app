/**
 * Signup form — E1 S1.1.
 *
 * Architecture:
 *   - React Hook Form drives client-side validation via the same Zod schema
 *     used server-side (single source of truth in features/auth/schemas.ts).
 *   - Resolves through `standardSchemaResolver` — Zod 4 implements the
 *     Standard Schema spec, so this is the future-proof path that also
 *     dodges the Zod 3/4 type-overload friction in `zodResolver`.
 *   - On valid submit we call `useSignupMutation` (TanStack Query). That
 *     hook POSTs JSON to the versioned API at `/api/v1/auth/signup` via
 *     axios, then invalidates the auth query scope on success so any
 *     component reading the session refetches.
 *   - On success we navigate to the server-supplied `redirectTo` using
 *     `useNavigate`. No cookie handling on the client — `Set-Cookie` is
 *     honored by the browser automatically.
 *   - Server errors come back via `SignupError.payload` and are merged
 *     into the form via `form.setError`, so `<FormMessage />` shows them
 *     inline next to the offending field.
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"

import { useSignupMutation } from "../mutations"
import { genderValues, signupSchema, type SignupInput } from "../schemas"

export function SignupForm() {
  const navigate = useNavigate()
  const signup = useSignupMutation()

  const form = useForm<SignupInput>({
    resolver: standardSchemaResolver(signupSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      gender: "other",
      password: "",
    },
  })

  // Surface server-side field errors inside the form.
  React.useEffect(() => {
    if (!signup.error) return
    const payload = signup.error.payload
    if (payload.errors) {
      for (const [field, msgs] of Object.entries(payload.errors)) {
        if (msgs && msgs.length > 0) {
          form.setError(field as keyof SignupInput, { message: msgs[0] })
        }
      }
    }
  }, [signup.error, form])

  const onSubmit = form.handleSubmit((values) => {
    signup.mutate(values, {
      onSuccess: ({ redirectTo }) => navigate(redirectTo),
    })
  })

  const isSubmitting = signup.isPending
  const formError =
    signup.error && !signup.error.payload.errors
      ? (signup.error.payload.formError ?? signup.error.message)
      : null

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Sign up to start tracking contributions for your group.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          {/* noValidate — RHF/Zod handle validation; we don't want the
              browser's default-bubbles fighting with the inline messages. */}
          <form onSubmit={onSubmit} className="grid gap-4" noValidate>
            {formError ? (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="given-name"
                        placeholder="Jane"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="family-name"
                        placeholder="Doe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? "other"}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {genderValues.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="At least 10 characters"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
