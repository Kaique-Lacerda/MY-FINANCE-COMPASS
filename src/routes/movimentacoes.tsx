import { createFileRoute } from "@tanstack/react-router";

import { MovimentacoesPage } from "@/components/finance-module-pages";
import { requireAuthentication } from "@/routes/-auth-guards";
import { RequireAuth } from "@/routes/-auth-guard";

export const Route = createFileRoute("/movimentacoes")({
  beforeLoad: requireAuthentication,
  component: MovimentacoesRoutePage,
});

function MovimentacoesRoutePage() {
  return (
    <RequireAuth>
      <MovimentacoesPage />
    </RequireAuth>
  );
}
