import { createFileRoute } from "@tanstack/react-router";

import { PasswordRecoveryPage } from "@/components/auth-pages";
import { redirectAuthenticatedUser } from "@/routes/-auth-guards";
import { GuestOnly } from "@/routes/-auth-guard";

export const Route = createFileRoute("/recuperar-senha")({
  beforeLoad: redirectAuthenticatedUser,
  component: RecuperarSenhaRoutePage,
});

function RecuperarSenhaRoutePage() {
  return (
    <GuestOnly>
      <PasswordRecoveryPage />
    </GuestOnly>
  );
}
