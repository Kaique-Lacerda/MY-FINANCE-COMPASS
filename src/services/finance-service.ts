import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CATEGORIES } from "@/lib/domain";
import { addMonthsDate } from "@/lib/finance";
import { parseISODate, toISODate } from "@/lib/format";

export type TableName =
  | "accounts"
  | "categories"
  | "transactions"
  | "obligations"
  | "recurring_transactions"
  | "installments"
  | "debts"
  | "investments"
  | "reconciliations"
  | "financial_goals"
  | "category_budgets"
  | "credit_cards"
  | "credit_card_invoices"
  | "credit_card_transactions";

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sessão expirada. Entre novamente.");
  return data.user.id;
}

export async function listRows<T>(
  table: TableName,
  orderBy = "created_at",
  ascending = false,
) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order(orderBy, { ascending });
  if (error) throw error;
  return (data ?? []) as T[];
}

export async function insertRow<T extends Record<string, unknown>>(
  table: TableName,
  values: T,
) {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from(table)
    .insert({ ...values, user_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRow<T extends Record<string, unknown>>(
  table: TableName,
  id: string,
  values: T,
) {
  const { data, error } = await supabase
    .from(table)
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRow(table: TableName, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

type CardTransactionRow = {
  id: string;
  card_id: string;
  invoice_id: string | null;
  description: string;
  purchase_date: string;
  amount: number;
  category_id: string | null;
  installment_number: number;
  installment_total: number;
};

function samePurchaseInstallment(
  candidate: CardTransactionRow,
  target: CardTransactionRow,
) {
  if (
    candidate.card_id !== target.card_id ||
    candidate.description !== target.description ||
    candidate.category_id !== target.category_id ||
    candidate.installment_total !== target.installment_total
  ) {
    return false;
  }
  const baseDate = addMonthsDate(
    parseISODate(target.purchase_date),
    -(target.installment_number - 1),
  );
  const expectedDate = addMonthsDate(
    baseDate,
    candidate.installment_number - 1,
  );
  return (
    candidate.installment_number >= 1 &&
    candidate.installment_number <= target.installment_total &&
    candidate.purchase_date === toISODate(expectedDate)
  );
}

export async function deleteCreditCardPurchase(
  entryId: string,
  deleteAllInstallments: boolean,
) {
  const { data: target, error: targetError } = await supabase
    .from("credit_card_transactions")
    .select(
      "id, card_id, invoice_id, description, purchase_date, amount, category_id, installment_number, installment_total",
    )
    .eq("id", entryId)
    .single();
  if (targetError) throw targetError;

  const typedTarget = target as CardTransactionRow;
  const { data: cardTransactions, error: entriesError } = await supabase
    .from("credit_card_transactions")
    .select(
      "id, card_id, invoice_id, description, purchase_date, amount, category_id, installment_number, installment_total",
    )
    .eq("card_id", typedTarget.card_id);
  if (entriesError) throw entriesError;

  const entriesToDelete = deleteAllInstallments
    ? (cardTransactions as CardTransactionRow[]).filter((entry) =>
        samePurchaseInstallment(entry, typedTarget),
      )
    : [typedTarget];
  const idsToDelete = entriesToDelete.map((entry) => entry.id);
  const affectedInvoiceIds = [
    ...new Set(
      entriesToDelete
        .map((entry) => entry.invoice_id)
        .filter((invoiceId): invoiceId is string => Boolean(invoiceId)),
    ),
  ];

  const { error: deleteError } = await supabase
    .from("credit_card_transactions")
    .delete()
    .in("id", idsToDelete);
  if (deleteError) throw deleteError;

  for (const invoiceId of affectedInvoiceIds) {
    const { data: remainingEntries, error: remainingError } = await supabase
      .from("credit_card_transactions")
      .select("amount")
      .eq("invoice_id", invoiceId);
    if (remainingError) throw remainingError;
    const totalAmount = (remainingEntries ?? []).reduce(
      (total, entry) => total + Number(entry.amount),
      0,
    );
    const { error: invoiceError } = await supabase
      .from("credit_card_invoices")
      .update({ total_amount: totalAmount })
      .eq("id", invoiceId);
    if (invoiceError) throw invoiceError;
  }
}

export async function getProfile() {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user_id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(values: Record<string, unknown>) {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: user_id, user_id, ...values })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Garante que a conta do usuário tenha perfil e categorias padrão.
 * Executado após o login (idempotente).
 */
export async function ensureUserSetup(fullName?: string | null) {
  const user_id = await currentUserId();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user_id)
    .maybeSingle();
  if (!profile) {
    await supabase
      .from("profiles")
      .insert({ id: user_id, user_id, full_name: fullName ?? null });
  } else if (fullName) {
    await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user_id);
  }

  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user_id);
  if (!count) {
    await supabase
      .from("categories")
      .insert(DEFAULT_CATEGORIES.map((category) => ({ ...category, user_id })));
  }
}

export async function countCategoryUsage(categoryId: string) {
  const tables: TableName[] = [
    "transactions",
    "obligations",
    "credit_card_transactions",
    "recurring_transactions",
    "installments",
    "debts",
    "category_budgets",
  ];
  let total = 0;
  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId);
    total += count ?? 0;
  }
  return total;
}

/** Conta com movimentações vinculadas não pode ser excluída fisicamente (só inativada). */
export async function countAccountUsage(accountId: string) {
  const [transactions, obligations, cards] = await Promise.all([
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`),
    supabase
      .from("obligations")
      .select("id", { count: "exact", head: true })
      .or(`account_id.eq.${accountId}`),
    supabase
      .from("credit_cards")
      .select("id", { count: "exact", head: true })
      .eq("account_id", accountId),
  ]);
  const { count, error } = transactions;
  const obligationCount = obligations.count ?? 0;
  const cardCount = cards.count ?? 0;
  if (transactions.error) throw transactions.error;
  if (obligations.error) throw obligations.error;
  if (cards.error) throw cards.error;
  return (count ?? 0) + obligationCount + cardCount;
}

export async function replaceCategory(fromId: string, toId: string | null) {
  const tables: TableName[] = [
    "transactions",
    "obligations",
    "credit_card_transactions",
    "recurring_transactions",
    "installments",
    "debts",
  ];
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .update({ category_id: toId })
      .eq("category_id", fromId);
    if (error) throw error;
  }
}

export async function deleteAllUserData() {
  const user_id = await currentUserId();
  const tables: TableName[] = [
    "reconciliations",
    "credit_card_transactions",
    "credit_card_invoices",
    "credit_cards",
    "transactions",
    "obligations",
    "investments",
    "installments",
    "recurring_transactions",
    "debts",
    "categories",
    "accounts",
  ];
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("user_id", user_id);
    if (error) throw error;
  }
}

export async function deleteCardPaymentTransaction(transactionId: string) {
  // Find the transaction to get invoice_id and amount
  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .select("credit_card_invoice_id, real_amount")
    .eq("id", transactionId)
    .single();
  if (transactionError) throw transactionError;

  // Delete the transaction
  const { error: deleteError } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);
  if (deleteError) throw deleteError;

  // If transaction is linked to an invoice, update the paid_amount
  if (transaction.credit_card_invoice_id) {
    const invoiceId = transaction.credit_card_invoice_id;
    const paymentAmount = Number(transaction.real_amount ?? 0);

    const { data: invoice, error: invoiceError } = await supabase
      .from("credit_card_invoices")
      .select("total_amount, paid_amount")
      .eq("id", invoiceId)
      .single();
    if (invoiceError) throw invoiceError;

    const newPaidAmount = Math.max(
      Number(invoice.paid_amount ?? 0) - paymentAmount,
      0,
    );
    const isNoLongerFullyPaid = newPaidAmount < Number(invoice.total_amount);

    const { error: updateError } = await supabase
      .from("credit_card_invoices")
      .update({
        paid_amount: newPaidAmount,
        status: isNoLongerFullyPaid ? "open" : "paid",
      })
      .eq("id", invoiceId);
    if (updateError) throw updateError;
  }
}

export async function deleteDemoData() {
  const user_id = await currentUserId();
  const tables: TableName[] = [
    "reconciliations",
    "transactions",
    "investments",
    "installments",
    "recurring_transactions",
    "debts",
    "categories",
    "accounts",
  ];
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("user_id", user_id)
      .eq("is_demo", true);
    if (error) throw error;
  }
}
