import { createFileRoute } from "@tanstack/react-router";

import { RelatoriosPage } from "@/components/finance-module-pages";
import { requireAuthentication } from "@/routes/-auth-guards";
import { RequireAuth } from "@/routes/-auth-guard";

export const Route = createFileRoute("/relatorios")({
  beforeLoad: requireAuthentication,
  component: RelatoriosRoutePage,
});

function RelatoriosRoutePage() {
  return (
    <RequireAuth>
      <RelatoriosPage />
    </RequireAuth>
  );
}
