import { createFileRoute } from "@tanstack/react-router";

import { ContasPage } from "@/components/finance-module-pages";
import { requireAuthentication } from "@/routes/-auth-guards";
import { RequireAuth } from "@/routes/-auth-guard";

export const Route = createFileRoute("/contas")({
  beforeLoad: requireAuthentication,
  component: ContasRoutePage,
});

function ContasRoutePage() {
  return (
    <RequireAuth>
      <ContasPage />
    </RequireAuth>
  );
}
