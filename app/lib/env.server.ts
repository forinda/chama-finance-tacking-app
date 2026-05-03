/**
 * Centralized env access. Importing this module fails fast if any required
 * variable is missing — better to crash on boot than to discover at request
 * time that DATABASE_URL is unset.
 *
 * Add new required vars to the `required(...)` calls below; everything else
 * (NODE_ENV) is best-effort.
 */
function required(key: string): string {
  const value = process.env[key]
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  SESSION_SECRET: required("SESSION_SECRET"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
}

export const isProduction = env.NODE_ENV === "production"
