import { createFileRoute } from "@tanstack/react-router";

import { FinanceDashboard } from "@/components/finance-dashboard";
import { requireAuthentication } from "@/routes/-auth-guards";
import { RequireAuth } from "@/routes/-auth-guard";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  beforeLoad: requireAuthentication,
  component: Index,
});

function Index() {
  return (
    <RequireAuth>
      <FinanceDashboard />
    </RequireAuth>
  );
}
