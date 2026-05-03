import path from "node:path"
import { fileURLToPath } from "node:url"

import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

// vite-tsconfig-paths handles most of this for us, but we mirror the
// tsconfig `paths` aliases here so SSR module resolution always agrees
// with the editor and `tsc`. Keep this list in sync with tsconfig.json.
export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  resolve: {
    alias: {
      "~": path.resolve(projectRoot, "app"),
      "@db": path.resolve(projectRoot, "db"),
    },
  },
  server: {
    port: 3000,
  },
})
