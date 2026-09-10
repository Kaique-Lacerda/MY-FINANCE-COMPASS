import { createFileRoute } from "@tanstack/react-router";

import { LimitesPage } from "@/components/finance-module-pages";
import { requireAuthentication } from "@/routes/-auth-guards";
import { RequireAuth } from "@/routes/-auth-guard";

export const Route = createFileRoute("/limites")({
  beforeLoad: requireAuthentication,
  component: LimitesRoutePage,
});

function LimitesRoutePage() {
  return (
    <RequireAuth>
      <LimitesPage />
    </RequireAuth>
  );
}
