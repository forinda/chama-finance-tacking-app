export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  user: (id: string) => [...authKeys.all, "user", id] as const,
}
