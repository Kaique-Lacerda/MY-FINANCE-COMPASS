import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  Account,
  Category,
  CategoryBudget,
  CreditCard,
  CreditCardInvoice,
  CreditCardTransaction,
  Debt,
  FinancialGoal,
  Installment,
  Investment,
  Obligation,
  Recurring,
  Reconciliation,
  Transaction,
} from "@/lib/domain";
import {
  deleteRow,
  deleteCreditCardPurchase,
  deleteCardPaymentTransaction,
  getProfile,
  insertRow,
  listRows,
  updateRow,
  type TableName,
} from "@/services/finance-service";

export const financeKeys = {
  accounts: ["accounts"] as const,
  categories: ["categories"] as const,
  transactions: ["transactions"] as const,
  obligations: ["obligations"] as const,
  recurrings: ["recurring_transactions"] as const,
  installments: ["installments"] as const,
  debts: ["debts"] as const,
  investments: ["investments"] as const,
  reconciliations: ["reconciliations"] as const,
  profile: ["profile"] as const,
  goals: ["financial_goals"] as const,
  budgets: ["category_budgets"] as const,
  creditCards: ["credit_cards"] as const,
  creditCardInvoices: ["credit_card_invoices"] as const,
  creditCardTransactions: ["credit_card_transactions"] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: financeKeys.accounts,
    queryFn: () => listRows<Account>("accounts", "name", true),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: financeKeys.categories,
    queryFn: () => listRows<Category>("categories", "name", true),
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: financeKeys.transactions,
    queryFn: () => listRows<Transaction>("transactions", "date", false),
  });
}

export function useObligations() {
  return useQuery({
    queryKey: financeKeys.obligations,
    queryFn: () => listRows<Obligation>("obligations", "planned_date", true),
  });
}

export function useRecurrings() {
  return useQuery({
    queryKey: financeKeys.recurrings,
    queryFn: () =>
      listRows<Recurring>("recurring_transactions", "start_date", true),
  });
}

export function useInstallments() {
  return useQuery({
    queryKey: financeKeys.installments,
    queryFn: () =>
      listRows<Installment>("installments", "first_due_date", true),
  });
}

export function useDebts() {
  return useQuery({
    queryKey: financeKeys.debts,
    queryFn: () => listRows<Debt>("debts", "start_date", true),
  });
}

export function useInvestments() {
  return useQuery({
    queryKey: financeKeys.investments,
    queryFn: () => listRows<Investment>("investments", "start_date", false),
  });
}

export function useReconciliations() {
  return useQuery({
    queryKey: financeKeys.reconciliations,
    queryFn: () => listRows<Reconciliation>("reconciliations", "date", false),
  });
}

export function useProfile() {
  return useQuery({ queryKey: financeKeys.profile, queryFn: getProfile });
}

export function useGoals() {
  return useQuery({
    queryKey: financeKeys.goals,
    queryFn: () =>
      listRows<FinancialGoal>("financial_goals", "created_at", false),
  });
}

export function useBudgets() {
  return useQuery({
    queryKey: financeKeys.budgets,
    queryFn: () =>
      listRows<CategoryBudget>("category_budgets", "created_at", false),
  });
}

export function useCreditCards() {
  return useQuery({
    queryKey: financeKeys.creditCards,
    queryFn: () => listRows<CreditCard>("credit_cards", "name", true),
  });
}

export function useCreditCardInvoices() {
  return useQuery({
    queryKey: financeKeys.creditCardInvoices,
    queryFn: () =>
      listRows<CreditCardInvoice>("credit_card_invoices", "due_date", true),
    refetchOnMount: "always",
  });
}

export function useCreditCardTransactions() {
  return useQuery({
    queryKey: financeKeys.creditCardTransactions,
    queryFn: () =>
      listRows<CreditCardTransaction>(
        "credit_card_transactions",
        "purchase_date",
        false,
      ),
    refetchOnMount: "always",
  });
}

/** Após qualquer alteração, todos os indicadores derivados são recalculados. */
function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of Object.values(financeKeys)) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };
}

export function useSaveRow(
  table: TableName,
  labels: { created: string; updated: string },
) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string | null;
      values: Record<string, unknown>;
    }) => (id ? updateRow(table, id, values) : insertRow(table, values)),
    onSuccess: (_data, variables) => {
      invalidate();
      toast.success(variables.id ? labels.updated : labels.created);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteRow(table: TableName, label: string) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => deleteRow(table, id),
    onSuccess: () => {
      invalidate();
      toast.success(label);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteCreditCardPurchase() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({
      entryId,
      deleteAllInstallments,
    }: {
      entryId: string;
      deleteAllInstallments: boolean;
    }) => deleteCreditCardPurchase(entryId, deleteAllInstallments),
    onSuccess: (_data, variables) => {
      invalidate();
      toast.success(
        variables.deleteAllInstallments
          ? "Compra e parcelas excluídas"
          : "Lançamento excluído",
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteCardPaymentTransaction() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (transactionId: string) =>
      deleteCardPaymentTransaction(transactionId),
    onSuccess: () => {
      invalidate();
      toast.success("Pagamento de fatura cancelado e fatura atualizada");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
