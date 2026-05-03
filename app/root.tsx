import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router"

import type { Route } from "./+types/root"
import "./app.css"
import { AppProviders } from "./providers"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!"
  let details = "An unexpected error occurred."
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 404:
        message = "404 — Not found"
        details = "The page you were looking for doesn't exist."
        break
      case 403:
        message = "403 — Forbidden"
        details = "You don't have permission to view this page."
        break
      case 401:
        message = "401 — Not authenticated"
        details = "You need to log in to view this page."
        break
      default:
        message = `${error.status} — ${error.statusText || "Error"}`
        details =
          (typeof error.data === "string" ? error.data : error.statusText) ||
          details
    }
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-medium">{message}</h1>
      <p className="mt-2 text-muted-foreground">{details}</p>
      {stack && (
        <pre className="mt-6 w-full overflow-x-auto rounded-md border p-4 text-xs">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
