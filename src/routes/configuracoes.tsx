import { createFileRoute } from "@tanstack/react-router";

import { ConfiguracoesPage } from "@/components/finance-module-pages";
import { requireAuthentication } from "@/routes/-auth-guards";
import { RequireAuth } from "@/routes/-auth-guard";

export const Route = createFileRoute("/configuracoes")({
  beforeLoad: requireAuthentication,
  component: ConfiguracoesRoutePage,
});

function ConfiguracoesRoutePage() {
  return (
    <RequireAuth>
      <ConfiguracoesPage />
    </RequireAuth>
  );
}
