import { parseISODate, toISODate } from "./format";
import type {
  Account,
  CategoryBudget,
  Debt,
  FinancialGoal,
  Installment,
  Obligation,
  Recurring,
  Transaction,
} from "./domain";

export function monthKeyOf(date: Date | string) {
  const d = typeof date === "string" ? parseISODate(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start, end, startISO: toISODate(start), endISO: toISODate(end) };
}

export function addMonthsKey(monthKey: string, count: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + count, 1);
  return monthKeyOf(date);
}

export function addMonthsDate(date: Date, count: number) {
  const day = date.getDate();
  const result = new Date(date.getFullYear(), date.getMonth() + count, 1);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

/**
 * Determina se uma fatura está efetivamente fechada.
 * Uma fatura é considerada fechada quando a data atual (ou fornecida) é >= closing_date.
 * Isso é independente do pagamento ou do campo is_closed persistido.
 * @param closingDate - Data de fechamento da fatura (ISO string ou Date)
 * @param today - Data de referência (padrão: hoje)
 * @returns true se a fatura está fechada, false se ainda está aberta
 */
export function isInvoiceClosed(
  closingDate: string | Date,
  today: Date = new Date(),
): boolean {
  const closing =
    typeof closingDate === "string" ? parseISODate(closingDate) : closingDate;
  // Comparar apenas a data (sem hora)
  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const closingDateOnly = new Date(
    closing.getFullYear(),
    closing.getMonth(),
    closing.getDate(),
  );
  return todayDate >= closingDateOnly;
}

const num = (value: unknown) =>
  typeof value === "number" ? value : Number(value ?? 0);

export function transactionPlannedDate(tx: Transaction) {
  return tx.planned_date ?? tx.date ?? tx.due_date ?? "";
}

export function transactionRealDate(tx: Transaction) {
  return tx.date ?? tx.planned_date ?? tx.due_date ?? "";
}

export function transactionPlannedAmount(tx: Transaction) {
  return num(tx.planned_amount ?? tx.amount ?? 0);
}

export function transactionRealAmount(tx: Transaction) {
  const value = tx.real_amount ?? tx.amount ?? tx.planned_amount ?? 0;
  return num(value);
}

export function obligationPlannedDate(item: Obligation) {
  return item.planned_date ?? item.due_date ?? "";
}

export function obligationForecastDate(item: Obligation) {
  return item.due_date ?? item.planned_date ?? "";
}

export function obligationPlannedAmount(item: Obligation) {
  return num(item.planned_amount ?? 0);
}

function occurrenceHasRealTransaction(
  occurrence: Occurrence,
  transactions: Transaction[],
) {
  return transactions.some((transaction) => {
    if (transaction.status !== "done") return false;
    if (transactionPlannedDate(transaction) !== occurrence.date) return false;
    if (transactionPlannedAmount(transaction) !== occurrence.amount)
      return false;
    if (occurrence.sourceType === "recurring")
      return transaction.recurring_id === occurrence.sourceId;
    if (occurrence.sourceType === "installment")
      return transaction.installment_id === occurrence.sourceId;
    if (occurrence.sourceType === "debt")
      return transaction.debt_id === occurrence.sourceId;
    return transaction.obligation_id === occurrence.sourceId;
  });
}

/**
 * SALDO REAL: apenas movimentações efetivadas (status "done").
 * SALDO PROJETADO: inclui também as pendentes.
 * Nunca guardamos saldo no banco — sempre derivado do saldo inicial + movimentações.
 */
export function accountBalances(
  accounts: Account[],
  transactions: Transaction[],
  options: { projected?: boolean; untilISO?: string } = {},
) {
  const balances = new Map<string, number>();
  for (const account of accounts)
    balances.set(account.id, num(account.initial_balance));

  for (const tx of transactions) {
    if (tx.status === "canceled") continue;
    if (!options.projected && tx.status !== "done") continue;
    const date =
      tx.status === "pending"
        ? transactionPlannedDate(tx)
        : transactionRealDate(tx);
    if (options.untilISO && date > options.untilISO) continue;
    const amount =
      tx.status === "done"
        ? transactionRealAmount(tx)
        : transactionPlannedAmount(tx);

    if (tx.type === "income" && tx.account_id) {
      balances.set(tx.account_id, (balances.get(tx.account_id) ?? 0) + amount);
    } else if (tx.type === "expense" && tx.account_id) {
      balances.set(tx.account_id, (balances.get(tx.account_id) ?? 0) - amount);
    } else if (tx.type === "transfer") {
      if (tx.account_id)
        balances.set(
          tx.account_id,
          (balances.get(tx.account_id) ?? 0) - amount,
        );
      if (tx.to_account_id)
        balances.set(
          tx.to_account_id,
          (balances.get(tx.to_account_id) ?? 0) + amount,
        );
    }
  }
  return balances;
}

/** Soma dos saldos das contas ativas marcadas como dinheiro disponível. */
export function availableBalance(
  accounts: Account[],
  balances: Map<string, number>,
) {
  return accounts
    .filter((account) => account.is_active && account.include_in_total)
    .reduce((total, account) => total + (balances.get(account.id) ?? 0), 0);
}

export function inMonth(tx: Transaction, monthKey: string) {
  const date =
    tx.status === "pending"
      ? transactionPlannedDate(tx)
      : transactionRealDate(tx);
  return monthKeyOf(date) === monthKey;
}

/** Transferências nunca entram em receitas/despesas do resultado. */
export function monthTotals(transactions: Transaction[], monthKey: string) {
  let income = 0;
  let expense = 0;
  let pendingIncome = 0;
  let pendingExpense = 0;

  for (const tx of transactions) {
    if (tx.status === "canceled" || tx.type === "transfer") continue;
    if (!inMonth(tx, monthKey)) continue;
    const amount =
      tx.status === "done"
        ? transactionRealAmount(tx)
        : transactionPlannedAmount(tx);
    if (tx.type === "income") {
      if (tx.status === "done") income += amount;
      else pendingIncome += amount;
    } else if (tx.type === "expense") {
      if (tx.status === "done") expense += amount;
      else pendingExpense += amount;
    }
  }
  return {
    income,
    expense,
    pendingIncome,
    pendingExpense,
    result: income - expense,
  };
}

export function categoryBreakdown(
  transactions: Transaction[],
  monthKey: string | null,
  categories: { id: string; name: string; color: string }[],
) {
  const totals = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== "expense" || tx.status !== "done") continue;
    if (monthKey && !inMonth(tx, monthKey)) continue;
    const key = tx.category_id ?? "none";
    totals.set(key, (totals.get(key) ?? 0) + transactionRealAmount(tx));
  }
  return [...totals.entries()]
    .map(([id, value]) => {
      const category = categories.find((c) => c.id === id);
      return {
        id,
        name: category?.name ?? "Sem categoria",
        color: category?.color ?? "#94a3b8",
        value,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export type Occurrence = {
  date: string;
  amount: number;
  description: string;
  type: "income" | "expense";
  sourceType: "obligation" | "recurring" | "installment" | "debt";
  sourceId: string;
  accountId?: string | null;
  categoryId?: string | null;
  obligation?: Obligation;
};

export type BudgetState = "normal" | "attention" | "near" | "exceeded";

/**
 * Gasto de uma categoria no mês selecionado x limite mensal configurado.
 * Considera apenas movimentações de despesa já efetivadas (status "done");
 * valores fixos/recorrentes não contam como gasto realizado.
 */
export function budgetUsage(
  budget: CategoryBudget,
  transactions: Transaction[],
  monthKey: string,
) {
  const limit = num(budget.monthly_limit);
  const spent = transactions
    .filter(
      (tx) =>
        tx.type === "expense" &&
        tx.status === "done" &&
        tx.category_id === budget.category_id &&
        inMonth(tx, monthKey),
    )
    .reduce((sum, tx) => sum + transactionRealAmount(tx), 0);
  const ratio = limit > 0 ? spent / limit : spent > 0 ? Infinity : 0;
  const state: BudgetState =
    ratio > 1
      ? "exceeded"
      : ratio >= 0.9
        ? "near"
        : ratio >= 0.7
          ? "attention"
          : "normal";
  return {
    limit,
    spent,
    ratio,
    progress: Math.min(ratio, 1),
    remaining: Math.max(limit - spent, 0),
    overspent: Math.max(spent - limit, 0),
    state,
  };
}

/** Gera as ocorrências previstas de um compromisso recorrente dentro de um intervalo. */
export function recurringOccurrences(
  rec: Recurring,
  fromISO: string,
  toISO: string,
): Occurrence[] {
  if (!rec.is_active) return [];
  const out: Occurrence[] = [];
  const start = parseISODate(rec.start_date);
  const limit = parseISODate(toISO);
  const endLimit = rec.end_date ? parseISODate(rec.end_date) : null;
  const maxOccurrences = rec.occurrences ?? 600;
  let cursor = new Date(start);

  for (let index = 0; index < maxOccurrences; index += 1) {
    if (cursor > limit) break;
    if (endLimit && cursor > endLimit) break;
    const iso = toISODate(cursor);
    if (iso >= fromISO) {
      out.push({
        date: iso,
        amount: num(rec.amount),
        description: rec.description,
        type: rec.type === "income" ? "income" : "expense",
        sourceType: "recurring",
        sourceId: rec.id,
        accountId: rec.account_id,
        categoryId: rec.category_id,
      });
    }
    if (rec.frequency === "once") break;
    if (rec.frequency === "daily")
      cursor = new Date(cursor.getTime() + 86400000);
    else if (rec.frequency === "weekly")
      cursor = new Date(cursor.getTime() + 7 * 86400000);
    else if (rec.frequency === "monthly") cursor = addMonthsDate(cursor, 1);
    else if (rec.frequency === "yearly") cursor = addMonthsDate(cursor, 12);
    else break;
  }
  return out;
}

/** Parcelas ainda em aberto de um parcelamento. */
export function installmentOccurrences(
  item: Installment,
): (Occurrence & { number: number })[] {
  if (item.status !== "active") return [];
  const first = parseISODate(item.first_due_date);
  const out: (Occurrence & { number: number })[] = [];
  for (
    let index = item.paid_count;
    index < item.installments_count;
    index += 1
  ) {
    out.push({
      date: toISODate(addMonthsDate(first, index)),
      amount: num(item.installment_amount),
      description: `${item.description} (${index + 1}/${item.installments_count})`,
      type: "expense",
      sourceType: "installment",
      sourceId: item.id,
      accountId: item.account_id,
      categoryId: item.category_id,
      number: index + 1,
    });
  }
  return out;
}

/** Parcelas ainda em aberto de uma dívida. */
export function debtOccurrences(
  debt: Debt,
): (Occurrence & { number: number })[] {
  if (debt.status !== "active") return [];
  const first = parseISODate(debt.start_date);
  const out: (Occurrence & { number: number })[] = [];
  for (
    let index = debt.paid_installments;
    index < debt.installments_count;
    index += 1
  ) {
    out.push({
      date: toISODate(addMonthsDate(first, index)),
      amount: num(debt.installment_amount),
      description: `${debt.name} (${index + 1}/${debt.installments_count})`,
      type: "expense",
      sourceType: "debt",
      sourceId: debt.id,
      accountId: debt.account_id,
      categoryId: debt.category_id,
      number: index + 1,
    });
  }
  return out;
}

/** Progresso de uma meta financeira — nunca ultrapassa 100% visualmente. */
export function goalProgress(goal: FinancialGoal) {
  const target = num(goal.target_amount);
  const current = num(goal.current_amount);
  const isCompleted = target > 0 ? current >= target : current > 0;
  const progress =
    target > 0 ? Math.min(current / target, 1) : isCompleted ? 1 : 0;
  return {
    remaining: Math.max(target - current, 0),
    progress,
    isCompleted,
  };
}

export function debtRemaining(debt: Debt) {
  const remainingInstallments = Math.max(
    debt.installments_count - debt.paid_installments,
    0,
  );
  return {
    remainingInstallments,
    remainingAmount: remainingInstallments * num(debt.installment_amount),
    progress:
      debt.installments_count > 0
        ? debt.paid_installments / debt.installments_count
        : 0,
    endDate: toISODate(
      addMonthsDate(
        parseISODate(debt.start_date),
        Math.max(debt.installments_count - 1, 0),
      ),
    ),
  };
}

export type ForecastMonth = {
  monthKey: string;
  income: number;
  expense: number;
  result: number;
  endingBalance: number;
};

/**
 * Previsão dos próximos meses: parte do saldo real atual (que já inclui todas as
 * transações "done") e projeta apenas o que ainda NÃO está refletido nesse saldo:
 * transações pendentes + recorrências + parcelas + dívidas futuras.
 */
export function buildForecast(params: {
  startingBalance: number;
  fromMonthKey: string;
  months: number;
  transactions: Transaction[];
  obligations: Obligation[];
  recurrings: Recurring[];
  installments: Installment[];
  debts: Debt[];
}): ForecastMonth[] {
  const {
    startingBalance,
    fromMonthKey,
    months,
    transactions,
    obligations,
    recurrings,
    installments,
    debts,
  } = params;
  const first = monthRange(fromMonthKey);
  const last = monthRange(addMonthsKey(fromMonthKey, months - 1));

  const buckets = new Map<string, { income: number; expense: number }>();
  for (let index = 0; index < months; index += 1) {
    buckets.set(addMonthsKey(fromMonthKey, index), { income: 0, expense: 0 });
  }
  const push = (
    dateISO: string,
    amount: number,
    type: "income" | "expense",
  ) => {
    const bucket = buckets.get(monthKeyOf(dateISO));
    if (!bucket) return;
    if (type === "income") bucket.income += amount;
    else bucket.expense += amount;
  };

  // startingBalance já soma todas as transações "done" (accountBalances), então só
  // entram aqui as obrigações pendentes e os eventos futuros: mudanças ainda não
  // refletidas no saldo atual.
  for (const obligation of obligations) {
    if (obligation.status !== "pending") continue;
    const date = obligationForecastDate(obligation);
    if (!date || date < first.startISO || date > last.endISO) continue;
    push(
      date,
      obligationPlannedAmount(obligation),
      obligation.type === "income" ? "income" : "expense",
    );
  }
  for (const rec of recurrings) {
    for (const occurrence of recurringOccurrences(
      rec,
      first.startISO,
      last.endISO,
    )) {
      push(occurrence.date, occurrence.amount, occurrence.type);
    }
  }
  for (const item of installments) {
    for (const occurrence of installmentOccurrences(item)) {
      if (occurrence.date < first.startISO || occurrence.date > last.endISO)
        continue;
      push(occurrence.date, occurrence.amount, "expense");
    }
  }
  for (const debt of debts) {
    for (const occurrence of debtOccurrences(debt)) {
      if (occurrence.date < first.startISO || occurrence.date > last.endISO)
        continue;
      push(occurrence.date, occurrence.amount, "expense");
    }
  }

  let running = startingBalance;
  const out: ForecastMonth[] = [];
  for (let index = 0; index < months; index += 1) {
    const monthKey = addMonthsKey(fromMonthKey, index);
    const bucket = buckets.get(monthKey)!;
    const result = bucket.income - bucket.expense;
    running += result;
    out.push({
      monthKey,
      income: bucket.income,
      expense: bucket.expense,
      result,
      endingBalance: running,
    });
  }
  return out;
}

/** Compromissos previstos (não efetivados) de um mês — usado no card "Comprometido". */
export function committedForMonth(params: {
  monthKey: string;
  transactions: Transaction[];
  obligations: Obligation[];
  recurrings: Recurring[];
  installments: Installment[];
  debts: Debt[];
}) {
  const { startISO, endISO } = monthRange(params.monthKey);
  let total = 0;
  for (const obligation of params.obligations) {
    if (obligation.type !== "expense" || obligation.status !== "pending")
      continue;
    const date = obligationForecastDate(obligation);
    if (!date || date < startISO || date > endISO) continue;
    total += obligationPlannedAmount(obligation);
  }
  for (const rec of params.recurrings) {
    if (rec.type !== "expense") continue;
    total += recurringOccurrences(rec, startISO, endISO).reduce(
      (sum, o) => sum + o.amount,
      0,
    );
  }
  for (const item of params.installments) {
    total += installmentOccurrences(item)
      .filter((o) => o.date >= startISO && o.date <= endISO)
      .reduce((sum, o) => sum + o.amount, 0);
  }
  for (const debt of params.debts) {
    total += debtOccurrences(debt)
      .filter((o) => o.date >= startISO && o.date <= endISO)
      .reduce((sum, o) => sum + o.amount, 0);
  }
  return total;
}

export function expectedIncomeForMonth(params: {
  monthKey: string;
  transactions: Transaction[];
  obligations: Obligation[];
  recurrings: Recurring[];
}) {
  const { startISO, endISO } = monthRange(params.monthKey);
  let total = 0;
  for (const obligation of params.obligations) {
    if (obligation.type !== "income" || obligation.status !== "pending")
      continue;
    const date = obligationForecastDate(obligation);
    if (!date || date < startISO || date > endISO) continue;
    total += obligationPlannedAmount(obligation);
  }
  for (const tx of params.transactions) {
    if (tx.type !== "income" || tx.status === "canceled") continue;
    if (tx.status !== "done") continue;
    const date = transactionRealDate(tx);
    if (date < startISO || date > endISO) continue;
    total += transactionRealAmount(tx);
  }
  for (const rec of params.recurrings) {
    if (rec.type !== "income") continue;
    total += recurringOccurrences(rec, startISO, endISO).reduce(
      (sum, o) => sum + o.amount,
      0,
    );
  }
  return total;
}

export function upcomingOccurrences(params: {
  fromISO: string;
  toISO: string;
  transactions: Transaction[];
  obligations: Obligation[];
  recurrings: Recurring[];
  installments: Installment[];
  debts: Debt[];
}): Occurrence[] {
  const out: Occurrence[] = [];
  for (const obligation of params.obligations) {
    if (obligation.status !== "pending") continue;
    const date = obligationForecastDate(obligation);
    if (!date || date < params.fromISO || date > params.toISO) continue;
    const amount = obligationPlannedAmount(obligation);
    console.log("[UPCOMING][OBLIGATION]", {
      id: obligation.id,
      description: obligation.description,
      date,
      amount,
      status: obligation.status,
    });
    const occurrence: Occurrence = {
      date,
      amount,
      description: obligation.description,
      type: obligation.type === "income" ? "income" : "expense",
      sourceType: "obligation",
      sourceId: obligation.id,
      accountId: obligation.account_id,
      categoryId: obligation.category_id,
      obligation,
    };
    if (!occurrenceHasRealTransaction(occurrence, params.transactions))
      out.push(occurrence);
  }
  for (const rec of params.recurrings) {
    for (const occurrence of recurringOccurrences(
      rec,
      params.fromISO,
      params.toISO,
    )) {
      if (occurrenceHasRealTransaction(occurrence, params.transactions))
        continue;
      console.log("[UPCOMING][RECURRING]", {
        id: rec.id,
        description: occurrence.description,
        date: occurrence.date,
        amount: occurrence.amount,
      });
      out.push(occurrence);
    }
  }
  for (const item of params.installments) {
    for (const occurrence of installmentOccurrences(item).filter(
      (o) => o.date >= params.fromISO && o.date <= params.toISO,
    )) {
      if (occurrenceHasRealTransaction(occurrence, params.transactions))
        continue;
      console.log("[UPCOMING][INSTALLMENT]", {
        id: item.id,
        description: occurrence.description,
        date: occurrence.date,
        amount: occurrence.amount,
      });
      out.push(occurrence);
    }
  }
  for (const debt of params.debts) {
    for (const occurrence of debtOccurrences(debt).filter(
      (o) => o.date >= params.fromISO && o.date <= params.toISO,
    )) {
      if (occurrenceHasRealTransaction(occurrence, params.transactions))
        continue;
      console.log("[UPCOMING][DEBT]", {
        id: debt.id,
        description: occurrence.description,
        date: occurrence.date,
        amount: occurrence.amount,
      });
      out.push(occurrence);
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
