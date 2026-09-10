import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CircleAlert,
  Plus,
  SlidersHorizontal,
  Target,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DiagnosticCard } from "@/components/diagnostic-card";
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
import {
  accountBalances,
  availableBalance,
  buildForecast,
  budgetUsage,
  committedForMonth,
  goalProgress,
  monthRange,
  monthTotals,
  upcomingOccurrences,
  type BudgetState,
} from "@/lib/finance";
import {
  formatCurrency,
  formatDate,
  formatMonthLong,
  formatPercent,
  formatSigned,
  toISODate,
} from "@/lib/format";
import { addMonthsKey, monthKeyOf } from "@/lib/finance";
import { buildDiagnostics } from "@/lib/diagnostics";
import { TransactionDialog } from "@/components/transaction-dialog";
import { AppShell } from "@/components/app-shell";
const monthKey = monthKeyOf(new Date());

function MetricCard({
  title,
  value,
  caption,
  tone,
  icon: Icon,
}: {
  title: string;
  value: string;
  caption: string;
  tone: "blue" | "green" | "red" | "amber";
  icon: typeof Wallet;
}) {
  const tones = {
    blue: "bg-primary/10 text-primary",
    green: "bg-positive-soft text-positive",
    red: "bg-negative-soft text-negative",
    amber: "bg-warning-soft text-warning-foreground",
  };
  return (
    <Card className="surface-card overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {title}
          </p>
          <span
            className={`flex size-9 items-center justify-center rounded-lg ${tones[tone]}`}
          >
            <Icon className="size-[18px]" />
          </span>
        </div>
        <p className="num mt-5 text-2xl font-semibold tracking-tight">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  children,
  icon: Icon = Activity,
}: {
  children: string;
  icon?: typeof Activity;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 text-center">
      <Icon className="mb-3 size-7 text-muted-foreground/50" />
      <p className="max-w-xs text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function budgetStateText(state: BudgetState) {
  if (state === "exceeded") return "text-negative";
  if (state === "near" || state === "attention")
    return "text-warning-foreground";
  return "text-positive";
}

export function FinanceDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(monthKey);
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: obligations = [] } = useObligations();
  const { data: categories = [] } = useCategories();
  const { data: recurrings = [] } = useRecurrings();
  const { data: installments = [] } = useInstallments();
  const { data: debts = [] } = useDebts();
  const { data: goals = [] } = useGoals();
  const { data: budgets = [] } = useBudgets();
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const topBudgets = budgets
    .filter((budget) => budget.start_month.slice(0, 7) <= selectedMonth)
    .map((budget) => ({
      budget,
      category: categoryById.get(budget.category_id),
      usage: budgetUsage(budget, transactions, selectedMonth),
    }))
    .sort((a, b) => b.usage.ratio - a.usage.ratio)
    .slice(0, 3);
  const goalsInProgress = goals
    .map((goal) => ({ goal, progress: goalProgress(goal) }))
    .filter((item) => !item.progress.isCompleted)
    .slice(0, 3);
  const range = monthRange(selectedMonth);
  const totals = monthTotals(transactions, selectedMonth);
  const balances = accountBalances(accounts, transactions);
  const balance = availableBalance(accounts, balances);
  const committed = committedForMonth({
    monthKey: selectedMonth,
    transactions,
    obligations,
    recurrings,
    installments,
    debts,
  });
  const forecast = buildForecast({
    startingBalance: balance,
    fromMonthKey: selectedMonth,
    months: 4,
    transactions,
    obligations,
    recurrings,
    installments,
    debts,
  });
  const topInsights = buildDiagnostics({
    monthKey: selectedMonth,
    transactions,
    categories,
    recurrings,
    debts,
    installments,
    goals,
    budgets,
    forecast,
  }).slice(0, 5);
  const upcoming = upcomingOccurrences({
    fromISO: toISODate(new Date()),
    toISO: toISODate(new Date(Date.now() + 30 * 86400000)),
    transactions,
    obligations,
    recurrings,
    installments,
    debts,
  })
    .filter((item) => item.type === "expense")
    .slice(0, 4);
  const chartData = useMemo(() => {
    const days = new Map<
      number,
      { day: string; income: number; expense: number }
    >();
    transactions
      .filter(
        (tx) =>
          tx.date >= range.startISO &&
          tx.date <= range.endISO &&
          tx.status !== "canceled" &&
          tx.type !== "transfer",
      )
      .forEach((tx) => {
        const day = Number(tx.date.slice(8, 10));
        const row = days.get(day) ?? {
          day: String(day).padStart(2, "0"),
          income: 0,
          expense: 0,
        };
        row[tx.type === "income" ? "income" : "expense"] += Number(tx.amount);
        days.set(day, row);
      });
    return [...days.values()].sort((a, b) => Number(a.day) - Number(b.day));
  }, [transactions, range.endISO, range.startISO]);
  const hasData =
    transactions.length > 0 ||
    accounts.length > 0 ||
    recurrings.length > 0 ||
    installments.length > 0 ||
    debts.length > 0;
  const resultTone =
    totals.result > 0 ? "positive" : totals.result < 0 ? "negative" : "neutral";
  const commitmentRatio = totals.income > 0 ? committed / totals.income : 0;
  const alert = !hasData
    ? {
        title: "Comece pelo essencial",
        text: "Adicione sua primeira conta ou movimentação para criar uma visão real da sua vida financeira.",
        tone: "neutral",
      }
    : resultTone === "negative"
      ? {
          title: "Atenção ao fechamento do mês",
          text: "As despesas efetivadas superam as receitas neste período.",
          tone: "negative",
        }
      : commitmentRatio > 0.7
        ? {
            title: "Renda bastante comprometida",
            text: `${formatPercent(commitmentRatio)} da receita efetivada já está comprometida com despesas futuras.`,
            tone: "warning",
          }
        : {
            title: "Seu mês caminha bem",
            text: "Com os dados atuais, o período tende a fechar positivo.",
            tone: "positive",
          };

  return (
    <AppShell
      title="Visão geral"
      headerActions={
        <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-2 py-1 sm:flex">
          <button
            aria-label="Mês anterior"
            onClick={() => setSelectedMonth(addMonthsKey(selectedMonth, -1))}
          >
            <span className="sr-only">Mês anterior</span>
            <span aria-hidden="true">‹</span>
          </button>
          <span className="min-w-[112px] text-center text-sm font-medium">
            {formatMonthLong(selectedMonth)}
          </span>
          <button
            aria-label="Próximo mês"
            onClick={() => setSelectedMonth(addMonthsKey(selectedMonth, 1))}
          >
            <span className="sr-only">Próximo mês</span>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      }
    >
      <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10">
        <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              {formatMonthLong(selectedMonth)}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Seu dinheiro, em perspectiva.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Uma leitura clara do que entrou, saiu e do que vem pela frente.
            </p>
          </div>
          <TransactionDialog accounts={accounts} />
        </div>
        {!hasData && !accountsLoading && (
          <div className="mb-6 flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Bem-vindo ao My Finance Compass.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Vamos começar organizando suas finanças com dados reais.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline">
                <Plus /> Adicionar conta
              </Button>
              <Button size="sm" variant="outline">
                <CalendarDays /> Criar compromisso
              </Button>
            </div>
          </div>
        )}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Saldo atual"
            value={formatCurrency(balance)}
            caption="Disponível nas contas ativas"
            tone="blue"
            icon={Wallet}
          />
          <MetricCard
            title="Entradas"
            value={formatCurrency(totals.income)}
            caption={
              totals.pendingIncome
                ? `${formatCurrency(totals.pendingIncome)} pendentes`
                : "Recebido no período"
            }
            tone="green"
            icon={ArrowUpRight}
          />
          <MetricCard
            title="Saídas"
            value={formatCurrency(totals.expense)}
            caption={
              totals.pendingExpense
                ? `${formatCurrency(totals.pendingExpense)} pendentes`
                : "Pago no período"
            }
            tone="red"
            icon={ArrowDownLeft}
          />
          <MetricCard
            title="Resultado"
            value={formatSigned(totals.result)}
            caption="Entradas menos saídas"
            tone="amber"
            icon={Target}
          />
        </section>
        <section className="mt-6">
          <Card className="surface-card">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>
                  Resultado de {formatMonthLong(selectedMonth)}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Receitas e despesas efetivadas
                </p>
              </div>
              <Badge
                variant={
                  resultTone === "negative"
                    ? "destructive"
                    : resultTone === "positive"
                      ? "default"
                      : "secondary"
                }
              >
                {resultTone === "positive"
                  ? "Positivo"
                  : resultTone === "negative"
                    ? "Negativo"
                    : "Neutro"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 divide-x border-y py-5">
                <div className="px-3 first:pl-0">
                  <p className="text-xs text-muted-foreground">Receitas</p>
                  <p className="num mt-2 text-lg font-semibold text-positive">
                    {formatCurrency(totals.income)}
                  </p>
                </div>
                <div className="px-4">
                  <p className="text-xs text-muted-foreground">Despesas</p>
                  <p className="num mt-2 text-lg font-semibold text-negative">
                    {formatCurrency(totals.expense)}
                  </p>
                </div>
                <div className="px-4 last:pr-0">
                  <p className="text-xs text-muted-foreground">Resultado</p>
                  <p
                    className={`num mt-2 text-lg font-semibold ${totals.result >= 0 ? "text-positive" : "text-negative"}`}
                  >
                    {formatSigned(totals.result)}
                  </p>
                </div>
              </div>
              <div className="mt-5 h-[225px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="incomeFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="var(--color-positive)"
                            stopOpacity={0.22}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--color-positive)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="expenseFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="var(--color-negative)"
                            stopOpacity={0.16}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--color-negative)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                      />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fontSize: 11,
                          fill: "var(--color-muted-foreground)",
                        }}
                      />
                      <YAxis hide />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid var(--color-border)",
                          background: "var(--color-card)",
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        name="Receitas"
                        stroke="var(--color-positive)"
                        fill="url(#incomeFill)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        name="Despesas"
                        stroke="var(--color-negative)"
                        fill="url(#expenseFill)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState>
                    Você ainda não possui movimentações suficientes para gerar
                    este gráfico.
                  </EmptyState>
                )}
              </div>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span>
                  <i className="mr-1.5 inline-block size-2 rounded-full bg-positive" />
                  Receitas
                </span>
                <span>
                  <i className="mr-1.5 inline-block size-2 rounded-full bg-negative" />
                  Despesas
                </span>
              </div>
            </CardContent>
          </Card>
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="surface-card">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Próximos compromissos</CardTitle>
              <Button variant="link" className="h-auto p-0 text-xs">
                Ver todos
              </Button>
            </CardHeader>
            <CardContent>
              {upcoming.length ? (
                <div className="space-y-1">
                  {upcoming.map((item, index) => (
                    <div
                      key={`${item.date}-${item.description}-${index}`}
                      className="flex items-center gap-3 border-b py-3 last:border-0"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning-foreground">
                        <CalendarDays className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.date)}{" "}
                          <span className="mx-1">·</span> previsto
                        </p>
                      </div>
                      <p className="num text-sm font-semibold text-negative">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={CalendarDays}>
                  Nenhum pagamento previsto para os próximos 30 dias.
                </EmptyState>
              )}
            </CardContent>
          </Card>
          <Card
            className={`surface-card ${alert.tone === "negative" ? "border-negative/30 bg-negative-soft/30" : alert.tone === "warning" ? "border-warning/30 bg-warning-soft/30" : alert.tone === "positive" ? "border-positive/30 bg-positive-soft/30" : ""}`}
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <CircleAlert className="size-5" />
                <CardTitle>Leitura do mês</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{alert.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {alert.text}
              </p>
            </CardContent>
          </Card>
        </section>
        {topInsights.length > 0 && (
          <section className="mt-6">
            <Card className="surface-card">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Diagnóstico financeiro</CardTitle>
                <Button variant="link" className="h-auto p-0 text-xs" asChild>
                  <Link to="/diagnostico">Ver análise completa</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {topInsights.map((insight) => (
                    <DiagnosticCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
        {goals.length > 0 && (
          <section className="mt-6">
            <Card className="surface-card">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Metas em andamento</CardTitle>
                <Button variant="link" className="h-auto p-0 text-xs" asChild>
                  <Link to="/metas">Ver todas</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {goalsInProgress.length ? (
                  <div className="grid gap-5 sm:grid-cols-3">
                    {goalsInProgress.map(({ goal, progress }) => (
                      <div key={goal.id}>
                        <p className="truncate text-sm font-medium">
                          {goal.name}
                        </p>
                        <p className="num mt-1 text-xs text-muted-foreground">
                          {formatCurrency(goal.current_amount)} /{" "}
                          {formatCurrency(goal.target_amount)}
                        </p>
                        <Progress
                          value={progress.progress * 100}
                          className="mt-2"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatPercent(progress.progress)} concluído
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Target}>
                    Todas as suas metas já foram concluídas. Parabéns!
                  </EmptyState>
                )}
              </CardContent>
            </Card>
          </section>
        )}
        {budgets.length > 0 && (
          <section className="mt-6">
            <Card className="surface-card">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Limites de gastos</CardTitle>
                <Button variant="link" className="h-auto p-0 text-xs" asChild>
                  <Link to="/limites">Ver todos</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {topBudgets.length ? (
                  <div className="grid gap-5 sm:grid-cols-3">
                    {topBudgets.map(({ budget, category, usage }) => (
                      <div key={budget.id}>
                        <p className="truncate text-sm font-medium">
                          {category?.name ?? "Categoria removida"}
                        </p>
                        <p className="num mt-1 text-xs text-muted-foreground">
                          {formatCurrency(usage.spent)} /{" "}
                          {formatCurrency(usage.limit)}
                        </p>
                        <Progress
                          value={usage.progress * 100}
                          className="mt-2"
                        />
                        <p
                          className={`mt-1 text-xs ${budgetStateText(usage.state)}`}
                        >
                          {formatPercent(usage.ratio)} utilizado
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={SlidersHorizontal}>
                    Nenhum limite vigente neste mês.
                  </EmptyState>
                )}
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </AppShell>
  );
}
