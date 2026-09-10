import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "@/components/auth-pages";
import { redirectAuthenticatedUser } from "@/routes/-auth-guards";
import { GuestOnly } from "@/routes/-auth-guard";

export const Route = createFileRoute("/login")({
  beforeLoad: redirectAuthenticatedUser,
  component: LoginRoutePage,
});

function LoginRoutePage() {
  return (
    <GuestOnly>
      <LoginPage />
    </GuestOnly>
  );
}
