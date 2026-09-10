import { createFileRoute } from "@tanstack/react-router";

import { MetasPage } from "@/components/finance-module-pages";
import { requireAuthentication } from "@/routes/-auth-guards";
import { RequireAuth } from "@/routes/-auth-guard";

export const Route = createFileRoute("/metas")({
  beforeLoad: requireAuthentication,
  component: MetasRoutePage,
});

function MetasRoutePage() {
  return (
    <RequireAuth>
      <MetasPage />
    </RequireAuth>
  );
}
