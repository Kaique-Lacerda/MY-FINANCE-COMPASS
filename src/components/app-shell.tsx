import { useState, type ReactNode } from "react";
import {
  Activity,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Gauge,
  LayoutDashboard,
  Menu,
  PieChart,
  Settings,
  SlidersHorizontal,
  Stethoscope,
  Target,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { formatMonthLong } from "@/lib/format";
import { signOut } from "@/lib/auth";

const navGroups = [
  {
    label: "Principal",
    items: [{ label: "Dashboard", to: "/", icon: LayoutDashboard }],
  },
  {
    label: "Financeiro",
    items: [
      { label: "Contas", to: "/contas", icon: Wallet },
      { label: "Movimentações", to: "/movimentacoes", icon: Activity },
      { label: "Cartões", to: "/cartoes", icon: CreditCard },
      { label: "Compromissos", to: "/compromissos", icon: CalendarDays },
      { label: "Investimentos", to: "/investimentos", icon: TrendingUp },
    ],
  },
  {
    label: "Planejamento",
    items: [
      { label: "Metas", to: "/metas", icon: Target },
      { label: "Limites", to: "/limites", icon: SlidersHorizontal },
      { label: "Diagnóstico", to: "/diagnostico", icon: Stethoscope },
    ],
  },
  {
    label: "Análises",
    items: [
      { label: "Relatórios", to: "/relatorios", icon: PieChart },
      { label: "Conciliação", to: "/conciliacao", icon: Gauge },
    ],
  },
  {
    label: "Rodapé",
    items: [{ label: "Configurações", to: "/configuracoes", icon: Settings }],
  },
] as const;

type AppShellProps = {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  headerActions?: ReactNode;
  showGlobalPeriodSelector?: boolean;
};

export function AppShell({
  children,
  title,
  eyebrow = "Painel financeiro",
  headerActions,
  showGlobalPeriodSelector = true,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(86vw,246px)] -translate-x-full flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 transition-[width,transform] duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : ""} ${sidebarCollapsed ? "lg:w-[78px]" : "lg:w-[246px]"}`}
      >
        <div className="flex items-center justify-between px-2">
          <Link
            to="/"
            className={`min-w-0 ${sidebarCollapsed ? "lg:hidden" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              My
            </p>
            <p className="truncate text-lg font-bold tracking-tight">
              Finance Compass
            </p>
          </Link>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="size-5" />
          </button>
          <button
            type="button"
            className="hidden size-9 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        </div>
        <div className="my-7 h-px bg-sidebar-border" />
        <nav
          className="min-h-0 flex-1 space-y-5 overflow-y-auto"
          aria-label="Navegação principal"
        >
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <p
                className={`px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/75 ${sidebarCollapsed ? "lg:hidden" : ""}`}
              >
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map(({ label, to, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    title={sidebarCollapsed ? label : undefined}
                    activeOptions={{ exact: to === "/" }}
                    onClick={() => setSidebarOpen(false)}
                    activeProps={{
                      className: `flex min-h-10 w-full items-center gap-3 rounded-lg bg-sidebar-accent px-3 text-sm font-semibold text-sidebar-accent-foreground transition ${sidebarCollapsed ? "lg:justify-center" : ""}`,
                    }}
                    inactiveProps={{
                      className: `flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-sidebar-foreground/65 transition hover:bg-sidebar-accent/60 hover:text-sidebar-foreground ${sidebarCollapsed ? "lg:justify-center" : ""}`,
                    }}
                  >
                    <Icon className="size-[18px] shrink-0" />
                    <span
                      className={`truncate ${sidebarCollapsed ? "lg:hidden" : ""}`}
                    >
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div
          className={`mt-5 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3 ${sidebarCollapsed ? "lg:p-2" : ""}`}
        >
          <div
            className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""}`}
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              KC
            </div>
            <div className={`min-w-0 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              <p className="truncate text-sm font-semibold">Minha conta</p>
              <p className="text-xs text-muted-foreground">Perfil pessoal</p>
            </div>
            <button
              type="button"
              className={`ml-auto text-xs text-muted-foreground hover:text-foreground ${sidebarCollapsed ? "lg:hidden" : ""}`}
              onClick={async () => {
                await signOut();
                await navigate({ to: "/login", replace: true });
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </aside>
      <div
        className={`min-w-0 transition-[padding] duration-200 ${sidebarCollapsed ? "lg:pl-[78px]" : "lg:pl-[246px]"}`}
      >
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border/80 bg-background/95 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu />
            </Button>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {eyebrow}
              </p>
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {headerActions ??
              (showGlobalPeriodSelector ? (
                <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-2 py-1 sm:flex">
                  <button
                    aria-label="Mês anterior"
                    onClick={() =>
                      setSelectedMonth((current) => shiftMonth(current, -1))
                    }
                  >
                    <ChevronLeft className="size-4 text-muted-foreground" />
                  </button>
                  <span className="min-w-[112px] text-center text-sm font-medium">
                    {formatMonthLong(selectedMonth)}
                  </span>
                  <button
                    aria-label="Próximo mês"
                    onClick={() =>
                      setSelectedMonth((current) => shiftMonth(current, 1))
                    }
                  >
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                </div>
              ) : null)}
            <Button variant="ghost" size="icon" aria-label="Notificações">
              <Bell />
            </Button>
            <div className="flex size-9 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
              KC
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function shiftMonth(monthKey: string, amount: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function PagePlaceholder({
  title,
  description,
  emptyTitle = "Nenhum registro cadastrado.",
  emptyDescription = "Quando você adicionar dados, eles aparecerão nesta área.",
  action,
}: {
  title: string;
  description: string;
  emptyTitle?: string;
  emptyDescription?: string;
  action?: ReactNode;
}) {
  return (
    <AppShell title={title}>
      <main className="mx-auto max-w-[1100px] px-5 py-7 sm:px-8 lg:px-10">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">
            Organize esta área do seu painel financeiro.
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <section className="surface-card flex min-h-72 flex-col items-center justify-center px-6 text-center">
          <CircleDollarSign className="mb-4 size-10 text-primary/60" />
          <h3 className="text-lg font-semibold">{emptyTitle}</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {emptyDescription}
          </p>
          {action && <div className="mt-5">{action}</div>}
        </section>
      </main>
    </AppShell>
  );
}
