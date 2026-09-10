import type { Database } from "@/integrations/supabase/types";

export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Obligation = Database["public"]["Tables"]["obligations"]["Row"];
export type Recurring =
  Database["public"]["Tables"]["recurring_transactions"]["Row"];
export type Installment = Database["public"]["Tables"]["installments"]["Row"];
export type Debt = Database["public"]["Tables"]["debts"]["Row"];
export type Investment = Database["public"]["Tables"]["investments"]["Row"];
export type Reconciliation =
  Database["public"]["Tables"]["reconciliations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type FinancialGoal =
  Database["public"]["Tables"]["financial_goals"]["Row"];
export type CategoryBudget =
  Database["public"]["Tables"]["category_budgets"]["Row"];
export type CreditCard = Database["public"]["Tables"]["credit_cards"]["Row"];
export type CreditCardInvoice =
  Database["public"]["Tables"]["credit_card_invoices"]["Row"];
export type CreditCardTransaction =
  Database["public"]["Tables"]["credit_card_transactions"]["Row"];

export type TransactionType = "income" | "expense" | "transfer";
export type TransactionStatus = "pending" | "done" | "canceled";
export type ObligationStatus = "pending" | "done" | "canceled";
export type Frequency = "once" | "daily" | "weekly" | "monthly" | "yearly";
export type InstitutionCode =
  "nubank" | "sicredi" | "banco_do_brasil" | "mercado_pago" | "other";

export const FINANCIAL_INSTITUTIONS: {
  value: InstitutionCode;
  label: string;
}[] = [
  { value: "nubank", label: "Nubank" },
  { value: "sicredi", label: "Sicredi" },
  { value: "banco_do_brasil", label: "Banco do Brasil" },
  { value: "mercado_pago", label: "Mercado Pago" },
  { value: "other", label: "Outro" },
];

export const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: "income", label: "Receita" },
  { value: "expense", label: "Despesa" },
  { value: "transfer", label: "Transferência" },
];

export const TRANSACTION_STATUS: { value: TransactionStatus; label: string }[] =
  [
    { value: "pending", label: "Pendente" },
    { value: "done", label: "Pago/Recebido" },
    { value: "canceled", label: "Cancelado" },
  ];

export const OBLIGATION_STATUS: { value: ObligationStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "done", label: "Realizado" },
  { value: "canceled", label: "Cancelado" },
];

export const ACCOUNT_TYPES = [
  { value: "checking", label: "Conta corrente" },
  { value: "digital", label: "Conta digital" },
  { value: "savings", label: "Poupança" },
  { value: "wallet", label: "Carteira" },
  { value: "cash", label: "Dinheiro físico" },
  { value: "investment", label: "Conta de investimento" },
];

export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "once", label: "Única" },
  { value: "daily", label: "Diária" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
];

export const INVESTMENT_TYPES = [
  { value: "fixed_income", label: "Renda fixa" },
  { value: "stocks", label: "Ações" },
  { value: "funds", label: "Fundos" },
  { value: "crypto", label: "Cripto" },
  { value: "savings", label: "Poupança" },
  { value: "other", label: "Outros" },
];

export const DEBT_STATUS = [
  { value: "active", label: "Ativa" },
  { value: "paid", label: "Quitada" },
  { value: "paused", label: "Pausada" },
];

/** Origem da movimentação — preparado para futura integração bancária. */
export const TRANSACTION_SOURCES = [
  { value: "MANUAL", label: "Manual" },
  { value: "IMPORTACAO", label: "Importação" },
  { value: "BANCO_API", label: "Banco (API)" },
];

export const DEFAULT_CATEGORIES: {
  name: string;
  kind: "income" | "expense";
  color: string;
}[] = [
  { name: "Salário", kind: "income", color: "#0f766e" },
  { name: "Freelance", kind: "income", color: "#0891b2" },
  { name: "Outras receitas", kind: "income", color: "#65a30d" },
  { name: "Moradia", kind: "expense", color: "#4f46e5" },
  { name: "Alimentação", kind: "expense", color: "#ea580c" },
  { name: "Transporte", kind: "expense", color: "#0284c7" },
  { name: "Faculdade", kind: "expense", color: "#7c3aed" },
  { name: "Saúde", kind: "expense", color: "#059669" },
  { name: "Lazer", kind: "expense", color: "#db2777" },
  { name: "Assinaturas", kind: "expense", color: "#475569" },
  { name: "Dívidas", kind: "expense", color: "#dc2626" },
  { name: "Compras", kind: "expense", color: "#ca8a04" },
  { name: "Outros", kind: "expense", color: "#94a3b8" },
];

export function labelFor(
  list: { value: string; label: string }[],
  value: string | null,
) {
  return list.find((item) => item.value === value)?.label ?? value ?? "—";
}
