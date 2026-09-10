import { createFileRoute } from "@tanstack/react-router";

import { SignupPage } from "@/components/auth-pages";
import { redirectAuthenticatedUser } from "@/routes/-auth-guards";
import { GuestOnly } from "@/routes/-auth-guard";

export const Route = createFileRoute("/cadastro")({
  beforeLoad: redirectAuthenticatedUser,
  component: CadastroRoutePage,
});

function CadastroRoutePage() {
  return (
    <GuestOnly>
      <SignupPage />
    </GuestOnly>
  );
}
