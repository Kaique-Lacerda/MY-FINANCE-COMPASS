import { createFileRoute } from "@tanstack/react-router";

import { ConciliacaoPage } from "@/components/finance-module-pages";
import { requireAuthentication } from "@/routes/-auth-guards";
import { RequireAuth } from "@/routes/-auth-guard";

export const Route = createFileRoute("/conciliacao")({
  beforeLoad: requireAuthentication,
  component: ConciliacaoRoutePage,
});

function ConciliacaoRoutePage() {
  return (
    <RequireAuth>
      <ConciliacaoPage />
    </RequireAuth>
  );
}
