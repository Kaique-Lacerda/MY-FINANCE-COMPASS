import { createFileRoute } from "@tanstack/react-router";

import { DiagnosticoPage } from "@/components/diagnostico-page";
import { requireAuthentication } from "@/routes/-auth-guards";
import { RequireAuth } from "@/routes/-auth-guard";

export const Route = createFileRoute("/diagnostico")({
  beforeLoad: requireAuthentication,
  component: DiagnosticoRoutePage,
});

function DiagnosticoRoutePage() {
  return (
    <RequireAuth>
      <DiagnosticoPage />
    </RequireAuth>
  );
}
