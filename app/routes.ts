import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),

  // UI pages
  route("auth/signup", "features/auth/routes/signup.tsx"),
  route("auth/login", "features/auth/routes/login.tsx"),
  route("onboarding", "routes/onboarding.tsx"),

  // Versioned JSON API — clients post to /api/v1/<resource>. Resource
  // routes have no default export and return Response objects only.
  route("api/v1/auth/signup", "features/auth/routes/api.signup.tsx"),
  route("api/v1/auth/login", "features/auth/routes/api.login.tsx"),
] satisfies RouteConfig
