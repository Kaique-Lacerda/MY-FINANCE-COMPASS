import {
  addMonthsKey,
  budgetUsage,
  categoryBreakdown,
  debtOccurrences,
  debtRemaining,
  goalProgress,
  installmentOccurrences,
  monthRange,
  monthTotals,
  recurringOccurrences,
  type ForecastMonth,
} from "./finance";
import {
  formatCurrency,
  formatMonthLong,
  formatPercent,
  parseISODate,
} from "./format";
import type {
  Category,
  CategoryBudget,
  Debt,
  FinancialGoal,
  Installment,
  Recurring,
  Transaction,
} from "./domain";

/**
 * Diagnóstico Financeiro v1 — 100% determinístico, sem IA/API externa.
 * Toda mensagem é derivada dos mesmos helpers já usados no resto do app
 * (buildForecast, budgetUsage, goalProgress, categoryBreakdown, etc.);
 * este arquivo apenas interpreta esses resultados em texto e prioridade.
 */

export type DiagnosticType = "negative" | "warning" | "positive" | "info";

export type DiagnosticCategory =
  | "resultado"
  | "gastos"
  | "despesas_fixas"
  | "orcamento"
  | "previsao"
  | "metas"
  | "dividas";

export type Insight = {
  id: string;
  category: DiagnosticCategory;
  type: DiagnosticType;
  /** Menor = mais urgente. Usado apenas para ordenar; não é exibido. */
  severity: number;
  title: string;
  message: string;
  value?: number;
};

/**
 * Prioridade dos insights (menor número = mais urgente), conforme definido no
 * pedido: 1 problema financeiro grave · 2 limite excedido · 3 saldo projetado
 * negativo · 4 resultado mensal negativo · 5 limite próximo / resultado perto
 * de zero · 6 tendência de aumento de gastos · 7 informações positivas/fatos
 * neutros · 8 metas e progresso.
 */
const SEVERITY = {
  criticalFinance: 1,
  budgetExceeded: 2,
  forecastNegative: 3,
  monthResultNegative: 4,
  budgetNear: 5,
  monthResultAttention: 5,
  categoryTrendUp: 6,
  positive: 7,
  info: 7,
  goals: 8,
} as const;

const num = (value: unknown) =>
  typeof value === "number" ? value : Number(value ?? 0);

// ---------------------------------------------------------------------------
// 1. Saúde financeira do mês
// ---------------------------------------------------------------------------

/** Resultado positivo mas abaixo desta fração da renda ainda é tratado como "atenção". */
const RESULT_ATTENTION_RATIO = 0.05;
/** Usado quando não há renda no mês (evita dividir por zero). */
const RESULT_ATTENTION_FALLBACK = 100;

export function monthlyResultInsight(params: {
  monthKey: string;
  totals: { income: number; expense: number; result: number };
}): Insight | null {
  const { totals, monthKey } = params;
  // Sem nenhuma movimentação efetivada no mês não há o que diagnosticar.
  if (totals.income === 0 && totals.expense === 0) return null;

  const threshold =
    totals.income > 0
      ? totals.income * RESULT_ATTENTION_RATIO
      : RESULT_ATTENTION_FALLBACK;
  const monthLabel = formatMonthLong(monthKey);
  const base = `Você recebeu ${formatCurrency(totals.income)} e gastou ${formatCurrency(totals.expense)} em ${monthLabel}.`;

  if (totals.result < 0) {
    return {
      id: `month-result-${monthKey}`,
      category: "resultado",
      type: "negative",
      severity: SEVERITY.monthResultNegative,
      title: "Resultado negativo no mês",
      message: `${base} Resultado do mês: ${formatCurrency(totals.result)} negativo.`,
      value: totals.result,
    };
  }
  if (totals.result < threshold) {
    return {
      id: `month-result-${monthKey}`,
      category: "resultado",
      type: "warning",
      severity: SEVERITY.monthResultAttention,
      title: "Resultado próximo de zero",
      message: `${base} Resultado do mês: +${formatCurrency(totals.result)}.`,
      value: totals.result,
    };
  }
  return {
    id: `month-result-${monthKey}`,
    category: "resultado",
    type: "positive",
    severity: SEVERITY.positive,
    title: "Resultado positivo",
    message: `${base} Resultado do mês: +${formatCurrency(totals.result)}.`,
    value: totals.result,
  };
}

// ---------------------------------------------------------------------------
// 2. Limites de gastos (reaproveita budgetUsage)
// ---------------------------------------------------------------------------

export function budgetInsights(params: {
  monthKey: string;
  budgets: CategoryBudget[];
  transactions: Transaction[];
  categories: Category[];
}): Insight[] {
  const categoryById = new Map(
    params.categories.map((category) => [category.id, category]),
  );
  return params.budgets
    .filter((budget) => budget.start_month.slice(0, 7) <= params.monthKey)
    .map((budget) => {
      const usage = budgetUsage(budget, params.transactions, params.monthKey);
      const name =
        categoryById.get(budget.category_id)?.name ?? "Categoria removida";
      if (usage.state === "exceeded") {
        return {
          id: `budget-${budget.id}`,
          category: "orcamento" as const,
          type: "negative" as const,
          severity: SEVERITY.budgetExceeded,
          title: "Limite excedido",
          message: `${name} ultrapassou o limite mensal em ${formatCurrency(usage.overspent)}.`,
          value: usage.overspent,
        };
      }
      if (usage.state === "near" || usage.state === "attention") {
        return {
          id: `budget-${budget.id}`,
          category: "orcamento" as const,
          type: "warning" as const,
          severity: SEVERITY.budgetNear,
          title: "Próximo do limite",
          message: `Você já utilizou ${formatPercent(usage.ratio)} do limite de ${name}.`,
          value: usage.spent,
        };
      }
      return {
        id: `budget-${budget.id}`,
        category: "orcamento" as const,
        type: "positive" as const,
        severity: SEVERITY.positive,
        title: "Dentro do limite",
        message: `${name} está dentro do limite, com ${formatCurrency(usage.remaining)} disponíveis.`,
        value: usage.remaining,
      };
    });
}

// ---------------------------------------------------------------------------
// 3. Variação de gastos por categoria (mês atual x mês anterior)
// ---------------------------------------------------------------------------

/** Variação percentual mínima para ser considerada relevante. */
const CATEGORY_VARIATION_MIN_RATIO = 0.15;
/** Diferença mínima em reais — evita alarde sobre valores pequenos (ex.: R$10 -> R$12 é +20%, mas irrelevante). */
const CATEGORY_VARIATION_MIN_DIFF = 50;
/** Nunca gerar mais que isto ao mesmo tempo, para não "mostrar dezenas de mensagens". */
const CATEGORY_VARIATION_MAX_INSIGHTS = 3;

export function categoryVariationInsights(params: {
  monthKey: string;
  transactions: Transaction[];
  categories: Category[];
}): Insight[] {
  const previousMonthKey = addMonthsKey(params.monthKey, -1);
  const current = categoryBreakdown(
    params.transactions,
    params.monthKey,
    params.categories,
  );
  const previous = categoryBreakdown(
    params.transactions,
    previousMonthKey,
    params.categories,
  );
  const previousByCategory = new Map(
    previous.map((item) => [item.id, item.value]),
  );

  return current
    .filter((item) => item.id !== "none")
    .map((item) => {
      const prevValue = previousByCategory.get(item.id) ?? 0;
      // Sem gasto no mês anterior não há base de comparação — não inventamos tendência.
      if (prevValue <= 0) return null;
      const diff = item.value - prevValue;
      const ratio = diff / prevValue;
      return { name: item.name, diff, ratio };
    })
    .filter((item): item is { name: string; diff: number; ratio: number } =>
      Boolean(
        item &&
        Math.abs(item.ratio) >= CATEGORY_VARIATION_MIN_RATIO &&
        Math.abs(item.diff) >= CATEGORY_VARIATION_MIN_DIFF,
      ),
    )
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, CATEGORY_VARIATION_MAX_INSIGHTS)
    .map((item) => {
      const increased = item.ratio > 0;
      return {
        id: `category-variation-${item.name}`,
        category: "gastos" as const,
        type: increased ? ("warning" as const) : ("positive" as const),
        severity: increased ? SEVERITY.categoryTrendUp : SEVERITY.positive,
        title: increased ? "Gasto em alta" : "Gasto em queda",
        message: `${item.name} ${increased ? "aumentou" : "caiu"} ${formatPercent(Math.abs(item.ratio))} em relação ao mês anterior.`,
        value: item.diff,
      };
    });
}

// ---------------------------------------------------------------------------
// 4. Despesas fixas (reaproveita recurringOccurrences)
// ---------------------------------------------------------------------------

/** A partir daqui, despesas fixas comprometendo a renda recorrente é tratado como problema grave. */
const FIXED_EXPENSE_CRITICAL_RATIO = 1;
/** Abaixo disso e acima do valor acima, é só um alerta de atenção. */
const FIXED_EXPENSE_WARNING_RATIO = 0.7;

function sumRecurringForMonth(
  recurrings: Recurring[],
  monthKey: string,
  type: "income" | "expense",
) {
  const { startISO, endISO } = monthRange(monthKey);
  return recurrings
    .filter((recurring) => recurring.type === type)
    .reduce(
      (sum, recurring) =>
        sum +
        recurringOccurrences(recurring, startISO, endISO).reduce(
          (occurrenceSum, occurrence) => occurrenceSum + occurrence.amount,
          0,
        ),
      0,
    );
}

export function fixedExpensesInsight(params: {
  monthKey: string;
  recurrings: Recurring[];
}): Insight | null {
  if (params.recurrings.length === 0) return null;
  const fixedExpense = sumRecurringForMonth(
    params.recurrings,
    params.monthKey,
    "expense",
  );
  const recurringIncome = sumRecurringForMonth(
    params.recurrings,
    params.monthKey,
    "income",
  );
  // Sem despesa fixa ou sem entrada fixa para comparar, o percentual não é confiável.
  if (fixedExpense <= 0 || recurringIncome <= 0) return null;

  const ratio = fixedExpense / recurringIncome;
  const critical = ratio >= FIXED_EXPENSE_CRITICAL_RATIO;
  const attention = ratio >= FIXED_EXPENSE_WARNING_RATIO;
  return {
    id: `fixed-expenses-${params.monthKey}`,
    category: "despesas_fixas",
    type: critical ? "negative" : attention ? "warning" : "info",
    severity: critical
      ? SEVERITY.criticalFinance
      : attention
        ? SEVERITY.budgetNear
        : SEVERITY.info,
    title: critical
      ? "Despesas fixas comprometem toda a renda"
      : "Peso das despesas fixas",
    message: `Suas despesas fixas representam aproximadamente ${formatPercent(ratio)} das suas entradas recorrentes.`,
    value: fixedExpense,
  };
}

// ---------------------------------------------------------------------------
// 5. Previsão financeira (reaproveita buildForecast — nunca recalculado aqui)
// ---------------------------------------------------------------------------

export function forecastInsight(params: {
  forecast: ForecastMonth[];
}): Insight | null {
  const current = params.forecast[0];
  if (!current) return null;
  const negative = current.endingBalance < 0;
  return {
    id: `forecast-${current.monthKey}`,
    category: "previsao",
    type: negative ? "negative" : "info",
    severity: negative ? SEVERITY.forecastNegative : SEVERITY.info,
    title: negative ? "Saldo projetado negativo" : "Previsão financeira",
    message: negative
      ? `Com os lançamentos previstos, seu saldo projetado ficará negativo em ${formatCurrency(Math.abs(current.endingBalance))}.`
      : `Seu saldo projetado para o fim do mês é ${formatCurrency(current.endingBalance)}.`,
    value: current.endingBalance,
  };
}

// ---------------------------------------------------------------------------
// 6. Metas (reaproveita goalProgress)
// ---------------------------------------------------------------------------

/** Meta com prazo dentro desta janela é considerada "próxima do prazo". */
const GOAL_NEAR_DEADLINE_DAYS = 30;
/** Só avaliamos "pouco progresso" depois de metade do prazo original ter passado. */
const GOAL_LOW_PROGRESS_ELAPSED_RATIO = 0.5;
const GOAL_LOW_PROGRESS_THRESHOLD = 0.3;
const MS_PER_DAY = 86400000;

export function goalInsights(
  goals: FinancialGoal[],
  today: Date = new Date(),
): Insight[] {
  const insights: Insight[] = [];
  for (const goal of goals) {
    const progress = goalProgress(goal);
    if (progress.isCompleted) {
      insights.push({
        id: `goal-${goal.id}`,
        category: "metas",
        type: "positive",
        severity: SEVERITY.goals,
        title: "Meta concluída",
        message: `"${goal.name}" foi concluída.`,
        value: num(goal.current_amount),
      });
      continue;
    }

    let daysRemaining: number | null = null;
    let elapsedRatio: number | null = null;
    if (goal.target_date) {
      const targetDate = parseISODate(goal.target_date);
      const createdAt = new Date(goal.created_at);
      daysRemaining = Math.ceil(
        (targetDate.getTime() - today.getTime()) / MS_PER_DAY,
      );
      const totalSpanMs = targetDate.getTime() - createdAt.getTime();
      // Prazo já vencido ou inconsistente (antes da criação) - não avaliamos elapsedRatio.
      if (totalSpanMs > 0) {
        elapsedRatio = Math.min(
          Math.max((today.getTime() - createdAt.getTime()) / totalSpanMs, 0),
          1,
        );
      }
    }

    if (
      daysRemaining !== null &&
      daysRemaining >= 0 &&
      daysRemaining <= GOAL_NEAR_DEADLINE_DAYS
    ) {
      insights.push({
        id: `goal-${goal.id}`,
        category: "metas",
        type: "warning",
        severity: SEVERITY.goals,
        title: "Meta próxima do prazo",
        message: `"${goal.name}" vence em ${daysRemaining} dia${daysRemaining === 1 ? "" : "s"} e você está a ${formatCurrency(progress.remaining)} do valor-alvo.`,
        value: progress.remaining,
      });
      continue;
    }

    if (
      elapsedRatio !== null &&
      elapsedRatio >= GOAL_LOW_PROGRESS_ELAPSED_RATIO &&
      progress.progress < GOAL_LOW_PROGRESS_THRESHOLD
    ) {
      insights.push({
        id: `goal-${goal.id}`,
        category: "metas",
        type: "warning",
        severity: SEVERITY.goals,
        title: "Meta com pouco progresso",
        message: `"${goal.name}" está ${formatPercent(progress.progress)} concluída, já passada metade do prazo previsto.`,
        value: progress.remaining,
      });
      continue;
    }

    insights.push({
      id: `goal-${goal.id}`,
      category: "metas",
      type: "info",
      severity: SEVERITY.goals,
      title: "Meta em andamento",
      message: `"${goal.name}" está ${formatPercent(progress.progress)} concluída. Você está a ${formatCurrency(progress.remaining)} da meta.`,
      value: progress.remaining,
    });
  }
  return insights;
}

// ---------------------------------------------------------------------------
// 7. Dívidas (reaproveita debtRemaining/debtOccurrences/installmentOccurrences)
// ---------------------------------------------------------------------------

/** Parcelas do mês acima desta fração da renda efetivada já pesam no orçamento. */
const DEBT_LOAD_WARNING_RATIO = 0.3;

export function debtInsights(params: {
  monthKey: string;
  debts: Debt[];
  installments: Installment[];
  monthIncome: number;
}): Insight[] {
  const insights: Insight[] = [];
  const activeDebts = params.debts.filter((debt) => debt.status === "active");

  if (activeDebts.length > 0) {
    const [biggest] = activeDebts
      .map((debt) => ({ debt, remaining: debtRemaining(debt) }))
      .sort(
        (a, b) => b.remaining.remainingAmount - a.remaining.remainingAmount,
      );
    insights.push({
      id: `debt-largest-${biggest.debt.id}`,
      category: "dividas",
      type: "info",
      severity: SEVERITY.info,
      title: "Maior dívida em aberto",
      message: `"${biggest.debt.name}" é sua maior dívida em aberto, com ${formatCurrency(biggest.remaining.remainingAmount)} restantes.`,
      value: biggest.remaining.remainingAmount,
    });
  }

  const { startISO, endISO } = monthRange(params.monthKey);
  const inMonth = (occurrence: { date: string }) =>
    occurrence.date >= startISO && occurrence.date <= endISO;
  const monthDebtLoad =
    activeDebts
      .flatMap((debt) => debtOccurrences(debt))
      .filter(inMonth)
      .reduce((sum, occurrence) => sum + occurrence.amount, 0) +
    params.installments
      .flatMap((item) => installmentOccurrences(item))
      .filter(inMonth)
      .reduce((sum, occurrence) => sum + occurrence.amount, 0);

  if (monthDebtLoad > 0) {
    const ratio =
      params.monthIncome > 0 ? monthDebtLoad / params.monthIncome : null;
    const heavy = ratio !== null && ratio >= DEBT_LOAD_WARNING_RATIO;
    insights.push({
      id: `debt-load-${params.monthKey}`,
      category: "dividas",
      type: heavy ? "warning" : "info",
      severity: heavy ? SEVERITY.categoryTrendUp : SEVERITY.info,
      title: heavy
        ? "Parcelas pesam no orçamento"
        : "Parcelas previstas no mês",
      message: `Suas parcelas representam ${formatCurrency(monthDebtLoad)} das despesas previstas em ${formatMonthLong(params.monthKey)}.`,
      value: monthDebtLoad,
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Agregador - junta tudo e ordena por severidade (menor = mais urgente)
// ---------------------------------------------------------------------------

export function buildDiagnostics(params: {
  monthKey: string;
  transactions: Transaction[];
  categories: Category[];
  recurrings: Recurring[];
  debts: Debt[];
  installments: Installment[];
  goals: FinancialGoal[];
  budgets: CategoryBudget[];
  forecast: ForecastMonth[];
}): Insight[] {
  const {
    monthKey,
    transactions,
    categories,
    recurrings,
    debts,
    installments,
    goals,
    budgets,
    forecast,
  } = params;
  const totals = monthTotals(transactions, monthKey);

  const insights: Insight[] = [];

  const monthInsight = monthlyResultInsight({ monthKey, totals });
  if (monthInsight) insights.push(monthInsight);

  insights.push(
    ...budgetInsights({ monthKey, budgets, transactions, categories }),
  );

  insights.push(
    ...categoryVariationInsights({ monthKey, transactions, categories }),
  );

  const fixed = fixedExpensesInsight({ monthKey, recurrings });
  if (fixed) insights.push(fixed);

  const forecastIns = forecastInsight({ forecast });
  if (forecastIns) insights.push(forecastIns);

  insights.push(...goalInsights(goals));

  insights.push(
    ...debtInsights({
      monthKey,
      debts,
      installments,
      monthIncome: totals.income,
    }),
  );

  return insights.sort((a, b) => a.severity - b.severity);
}
