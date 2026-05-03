import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes"

export default [
  // Auth routes — public, outside any role-gated layout. Each route's own
  // loader handles redirecting authenticated visitors to the right
  // landing page.
  route("auth/signup", "features/auth/routes/signup.tsx"),
  route("auth/login", "features/auth/routes/login.tsx"),

  // Tenant pages — wrapped by the tenant layout, which bounces
  // super_admins to /admin.
  layout("layouts/tenant.tsx", [
    index("routes/home.tsx"),
    route("onboarding", "routes/onboarding.tsx"),
  ]),

  // Admin pages — wrapped by the admin layout, which 403s non-admins.
  layout("layouts/admin.tsx", [
    route("admin", "routes/admin/index.tsx"),
  ]),

  // Versioned JSON API — clients post to /api/v1/<resource>. Resource
  // routes have no default export and return Response objects only.
  route("api/v1/auth/signup", "features/auth/routes/api.signup.tsx"),
  route("api/v1/auth/login", "features/auth/routes/api.login.tsx"),
  route("api/v1/auth/logout", "features/auth/routes/api.logout.tsx"),
] satisfies RouteConfig
