import { createFileRoute } from "@tanstack/react-router";

import { InvestimentosPage } from "@/components/finance-module-pages";
import { requireAuthentication } from "@/routes/-auth-guards";
import { RequireAuth } from "@/routes/-auth-guard";

export const Route = createFileRoute("/investimentos")({
  beforeLoad: requireAuthentication,
  component: InvestimentosRoutePage,
});

function InvestimentosRoutePage() {
  return (
    <RequireAuth>
      <InvestimentosPage />
    </RequireAuth>
  );
}
