import "dotenv/config"
import { defineConfig } from "drizzle-kit"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required (see .env.example)")
}

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
})
