import { createFileRoute } from "@tanstack/react-router";

import { DividasPage } from "@/components/finance-module-pages";
import { requireAuthentication } from "@/routes/-auth-guards";
import { RequireAuth } from "@/routes/-auth-guard";

export const Route = createFileRoute("/dividas")({
  beforeLoad: requireAuthentication,
  component: DividasRoutePage,
});

function DividasRoutePage() {
  return (
    <RequireAuth>
      <DividasPage />
    </RequireAuth>
  );
}
