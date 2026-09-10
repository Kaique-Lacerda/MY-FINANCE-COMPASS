import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CreditCard,
  SlidersHorizontal,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { DiagnosticCard } from "@/components/diagnostic-card";
import {
  EmptyModuleState,
  ModuleHeader,
  ModulePage,
  MonthSwitcher,
  SummaryStat,
} from "@/components/finance-module-pages";
import {
  useAccounts,
  useBudgets,
  useCategories,
  useDebts,
  useGoals,
  useInstallments,
  useObligations,
  useRecurrings,
  useTransactions,
} from "@/hooks/useFinance";
import { buildDiagnostics, type DiagnosticCategory } from "@/lib/diagnostics";
import {
  accountBalances,
  availableBalance,
  buildForecast,
  monthKeyOf,
  monthTotals,
} from "@/lib/finance";
import { formatCurrency } from "@/lib/format";

const SECTIONS: {
  categories: DiagnosticCategory[];
  title: string;
  icon: LucideIcon;
}[] = [
  { categories: ["resultado"], title: "Resultado do mês", icon: Activity },
  {
    categories: ["gastos", "despesas_fixas"],
    title: "Gastos",
    icon: BarChart3,
  },
  { categories: ["orcamento"], title: "Orçamento", icon: SlidersHorizontal },
  { categories: ["previsao"], title: "Previsão", icon: TrendingUp },
  { categories: ["metas"], title: "Metas", icon: Target },
  { categories: ["dividas"], title: "Dívidas", icon: CreditCard },
];

export function DiagnosticoPage() {
  const [selectedMonth, setSelectedMonth] = useState(monthKeyOf(new Date()));
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: obligations = [] } = useObligations();
  const { data: categories = [] } = useCategories();
  const { data: recurrings = [] } = useRecurrings();
  const { data: debts = [] } = useDebts();
  const { data: installments = [] } = useInstallments();
  const { data: goals = [] } = useGoals();
  const { data: budgets = [] } = useBudgets();

  const balances = accountBalances(accounts, transactions);
  const currentBalance = availableBalance(accounts, balances);
  const totals = monthTotals(transactions, selectedMonth);
  // Só precisamos do mês selecionado aqui — buildForecast não é alterado, apenas
  // chamado com months: 1 para obter a projeção desse único mês.
  const forecast = buildForecast({
    startingBalance: currentBalance,
    fromMonthKey: selectedMonth,
    months: 1,
    transactions,
    obligations,
    recurrings,
    installments,
    debts,
  });

  const insights = buildDiagnostics({
    monthKey: selectedMonth,
    transactions,
    categories,
    recurrings,
    debts,
    installments,
    goals,
    budgets,
    forecast,
  });

  return (
    <ModulePage title="Diagnóstico">
      <ModuleHeader
        title="Diagnóstico financeiro"
        description="Leitura automática e determinística dos seus dados — sem inteligência artificial, apenas regras claras aplicadas ao que você já cadastrou."
      />
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <MonthSwitcher monthKey={selectedMonth} onChange={setSelectedMonth} />
      </div>
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        <SummaryStat
          label="Entradas do mês"
          value={formatCurrency(totals.income)}
          icon={ArrowUpRight}
          tone="positive"
        />
        <SummaryStat
          label="Despesas do mês"
          value={formatCurrency(totals.expense)}
          icon={ArrowDownLeft}
          tone="negative"
        />
        <SummaryStat
          label="Saldo atual"
          value={formatCurrency(currentBalance)}
          icon={Wallet}
          tone={currentBalance >= 0 ? "positive" : "negative"}
        />
      </div>
      {insights.length === 0 ? (
        <EmptyModuleState
          icon={Activity}
          title="Ainda não há dados suficientes para um diagnóstico."
          description="Cadastre movimentações, limites, metas ou dívidas para receber uma leitura automática das suas finanças."
        />
      ) : (
        <div className="space-y-8">
          {SECTIONS.map((section) => {
            const items = insights.filter((insight) =>
              section.categories.includes(insight.category),
            );
            if (items.length === 0) return null;
            const Icon = section.icon;
            return (
              <div key={section.title}>
                <div className="mb-4 flex items-center gap-2">
                  <Icon className="size-4 text-primary" />
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((insight) => (
                    <DiagnosticCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ModulePage>
  );
}
