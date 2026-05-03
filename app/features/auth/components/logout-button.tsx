/**
 * Reusable logout button.
 *
 * Calls `useLogoutMutation` (which POSTs `/api/v1/auth/logout`), then
 * navigates to the server-supplied `redirectTo` (currently `/auth/login`).
 * The button is disabled while the request is in flight so a stuck UI
 * can't get into a double-logout race.
 */
import { useNavigate } from "react-router"

import { Button } from "~/components/ui/button"

import { useLogoutMutation } from "../mutations"

type LogoutButtonProps = {
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
  className?: string
  children?: React.ReactNode
}

export function LogoutButton({
  variant = "outline",
  size = "sm",
  className,
  children,
}: LogoutButtonProps) {
  const navigate = useNavigate()
  const logout = useLogoutMutation()

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={logout.isPending}
      onClick={() =>
        logout.mutate(undefined, {
          onSuccess: ({ redirectTo }) => navigate(redirectTo),
        })
      }
    >
      {logout.isPending ? "Logging out…" : (children ?? "Log out")}
    </Button>
  )
}
