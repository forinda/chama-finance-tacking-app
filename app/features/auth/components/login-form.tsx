/**
 * Login form — E1 S1.2.
 *
 * Mirrors the signup-form architecture:
 *   - RHF + Zod (via standard-schema resolver) drives client-side
 *     validation against the same schema the API uses server-side.
 *   - Posts to the versioned API at `/api/v1/auth/login` through a
 *     TanStack Query mutation. On success, navigates to the
 *     server-supplied `redirectTo`.
 *   - Server errors (`formError` for credential failures or rate limits;
 *     `errors` map for field-level validation) are surfaced inline.
 */
import * as React from "react"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router"

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

import { useLoginMutation } from "../mutations"
import { loginSchema, type LoginInput } from "../schemas"

export function LoginForm() {
  const navigate = useNavigate()
  const login = useLoginMutation()

  const form = useForm<LoginInput>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  // Surface server-side field errors inside the form.
  React.useEffect(() => {
    if (!login.error) return
    const payload = login.error.payload
    if (payload.errors) {
      for (const [field, msgs] of Object.entries(payload.errors)) {
        if (msgs && msgs.length > 0) {
          form.setError(field as keyof LoginInput, { message: msgs[0] })
        }
      }
    }
  }, [login.error, form])

  const onSubmit = form.handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: ({ redirectTo }) => navigate(redirectTo),
    })
  })

  const isSubmitting = login.isPending
  const formError =
    login.error && !login.error.payload.errors
      ? (login.error.payload.formError ?? login.error.message)
      : null

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Log in to continue managing your group's contributions.
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="Your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Logging in…" : "Log in"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                to="/auth/signup"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
