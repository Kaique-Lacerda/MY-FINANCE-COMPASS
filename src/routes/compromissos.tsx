import { createFileRoute } from "@tanstack/react-router";

import { CompromissosPage } from "@/components/finance-module-pages";
import { requireAuthentication } from "@/routes/-auth-guards";
import { RequireAuth } from "@/routes/-auth-guard";

export const Route = createFileRoute("/compromissos")({
  beforeLoad: requireAuthentication,
  component: CompromissosRoutePage,
});

function CompromissosRoutePage() {
  return (
    <RequireAuth>
      <CompromissosPage />
    </RequireAuth>
  );
}
