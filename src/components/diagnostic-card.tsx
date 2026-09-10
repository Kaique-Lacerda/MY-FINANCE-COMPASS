import { AlertTriangle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { DiagnosticType, Insight } from "@/lib/diagnostics";

/** Estilo por tipo de diagnóstico — única fonte de verdade para não espalhar cores/ícones pelo JSX. */
const TYPE_META: Record<
  DiagnosticType,
  { icon: LucideIcon; text: string; surface: string }
> = {
  negative: {
    icon: AlertTriangle,
    text: "text-negative",
    surface: "border-negative/30 bg-negative-soft/40",
  },
  warning: {
    icon: TriangleAlert,
    text: "text-warning-foreground",
    surface: "border-warning/30 bg-warning-soft/40",
  },
  positive: {
    icon: CheckCircle2,
    text: "text-positive",
    surface: "border-positive/30 bg-positive-soft/40",
  },
  info: {
    icon: Info,
    text: "text-muted-foreground",
    surface: "border-border bg-muted/20",
  },
};

export function DiagnosticCard({ insight }: { insight: Insight }) {
  const meta = TYPE_META[insight.type];
  const Icon = meta.icon;
  return (
    <div className={`rounded-xl border p-4 ${meta.surface}`}>
      <div className="flex items-center gap-2">
        <Icon className={`size-4 shrink-0 ${meta.text}`} />
        <p className={`text-sm font-semibold ${meta.text}`}>{insight.title}</p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{insight.message}</p>
    </div>
  );
}
