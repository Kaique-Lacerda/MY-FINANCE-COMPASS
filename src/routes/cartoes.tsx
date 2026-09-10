import { createFileRoute } from "@tanstack/react-router";

import { CreditCardsPage } from "@/components/credit-cards-page";
import { requireAuthentication } from "@/routes/-auth-guards";
import { RequireAuth } from "@/routes/-auth-guard";

export const Route = createFileRoute("/cartoes")({
  beforeLoad: requireAuthentication,
  component: CreditCardsRoutePage,
});

function CreditCardsRoutePage() {
  return (
    <RequireAuth>
      <CreditCardsPage />
    </RequireAuth>
  );
}
