import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  FileSearch,
  Filter,
  Landmark,
  LockKeyhole,
  Monitor,
  PiggyBank,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Moon,
  Pencil,
  Sun,
  Target,
  Trash2,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { AccountDialog } from "@/components/account-dialog";
import { AppShell } from "@/components/app-shell";
import { BudgetDialog } from "@/components/budget-dialog";
import { AddGoalAmountDialog, GoalDialog } from "@/components/goal-dialog";
import { RecurringDialog } from "@/components/recurring-dialog";
import { TransactionDialog } from "@/components/transaction-dialog";
import { ObligationSettlementDialog } from "@/components/obligation-settlement-dialog";
import { ObligationDialog } from "@/components/obligation-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTheme, type Theme } from "@/components/theme-provider";
import { isValidCpf, formatCpf, normalizeCpf } from "@/lib/cpf";
import { countAccountUsage, updateProfile } from "@/services/finance-service";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAccounts,
  useCategories,
  useBudgets,
  useDebts,
  useDeleteRow,
  useDeleteCardPaymentTransaction,
  useGoals,
  useInstallments,
  useInvestments,
  useObligations,
  useProfile,
  useRecurrings,
  useReconciliations,
  useSaveRow,
  useTransactions,
} from "@/hooks/useFinance";
import {
  ACCOUNT_TYPES,
  FREQUENCIES,
  INVESTMENT_TYPES,
  TRANSACTION_TYPES,
  labelFor,
  type Account,
  type Category,
  type CategoryBudget,
  type Debt,
  type FinancialGoal,
  type Installment,
  type Obligation,
  type Recurring,
} from "@/lib/domain";
import {
  accountBalances,
  addMonthsKey,
  budgetUsage,
  categoryBreakdown,
  debtOccurrences,
  debtRemaining,
  goalProgress,
  installmentOccurrences,
  monthRange,
  monthKeyOf,
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

type ModuleHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

function ModuleHeader({ title, description, action }: ModuleHeaderProps) {
  return (
    <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-sm font-medium text-primary">
          Centro de {title.toLowerCase()}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

export { ModuleHeader };

function ModulePage({
  title,
  showGlobalPeriodSelector = true,
  children,
}: {
  title: string;
  showGlobalPeriodSelector?: boolean;
  children: ReactNode;
}) {
  return (
    <AppShell title={title} showGlobalPeriodSelector={showGlobalPeriodSelector}>
      <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10">
        {children}
      </main>
    </AppShell>
  );
}

export { ModulePage };

function EmptyModuleState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-6" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export { EmptyModuleState };

function SummaryStat({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "positive" | "negative";
}) {
  const color =
    tone === "positive"
      ? "text-positive"
      : tone === "negative"
        ? "text-negative"
        : "text-primary";
  return (
    <Card className="surface-card">
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted ${color}`}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`num mt-1 text-xl font-semibold ${color}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export { SummaryStat };

function DisabledAction({ children }: { children: ReactNode }) {
  return (
    <Button disabled variant="outline">
      <Plus />
      {children}
    </Button>
  );
}

export function MovimentacoesPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [account, setAccount] = useState("all");
  const [category, setCategory] = useState("all");
  const selectedAccount = accounts.find((item) => item.id === account);
  const filteredTransactions = transactions.filter((transaction) => {
    const normalizedSearch = search.trim().toLowerCase();
    const belongsToAccount =
      account === "all" ||
      transaction.account_id === account ||
      (transaction.type === "transfer" &&
        transaction.to_account_id === account);
    return (
      transaction.status === "done" &&
      (!normalizedSearch ||
        transaction.description.toLowerCase().includes(normalizedSearch)) &&
      (type === "all" || transaction.type === type) &&
      belongsToAccount &&
      (category === "all" || transaction.category_id === category)
    );
  });
  const accountName = new Map(accounts.map((item) => [item.id, item.name]));
  const categoryName = new Map(categories.map((item) => [item.id, item.name]));
  const activeAccounts = accounts.filter((item) => item.is_active);
  const deleteTransaction = useDeleteRow(
    "transactions",
    "Movimentação excluída",
  );
  const deleteCardPayment = useDeleteCardPaymentTransaction();

  const handleDeleteTransaction = (transaction: Transaction) => {
    if (transaction.credit_card_invoice_id) {
      deleteCardPayment.mutate(transaction.id);
    } else {
      deleteTransaction.mutate(transaction.id);
    }
  };

  return (
    <ModulePage title="Movimentações">
      <ModuleHeader
        title="Movimentações"
        description="Controle suas receitas, despesas e transferências."
        action={<TransactionDialog accounts={activeAccounts} />}
      />
      <Card className="surface-card mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Contas</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div
              className="flex min-w-max gap-2"
              role="tablist"
              aria-label="Selecionar conta do extrato"
            >
              <Button
                type="button"
                variant={account === "all" ? "default" : "outline"}
                className="shrink-0"
                onClick={() => setAccount("all")}
                role="tab"
                aria-selected={account === "all"}
              >
                Todas
              </Button>
              {accounts.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={account === item.id ? "default" : "outline"}
                  className="shrink-0"
                  onClick={() => setAccount(item.id)}
                  role="tab"
                  aria-selected={account === item.id}
                >
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="surface-card mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4 text-primary" />
            Filtros do extrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative lg:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Buscar descrição"
              />
            </div>
            <FilterSelect
              value={type}
              onChange={setType}
              placeholder="Tipo"
              options={[
                { value: "all", label: "Todos os tipos" },
                ...TRANSACTION_TYPES,
              ]}
            />
            <FilterSelect
              value={category}
              onChange={setCategory}
              placeholder="Categoria"
              options={[
                { value: "all", label: "Todas as categorias" },
                ...categories.map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]}
            />
          </div>
        </CardContent>
      </Card>
      {filteredTransactions.length === 0 ? (
        <EmptyModuleState
          icon={FileSearch}
          title="Nenhuma movimentação encontrada."
          description="Comece registrando sua primeira receita ou despesa."
          action={<TransactionDialog accounts={activeAccounts} />}
        />
      ) : (
        <Card className="surface-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">
              {selectedAccount
                ? `Extrato — ${selectedAccount.name}`
                : "Extrato — Todas as contas"}{" "}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {filteredTransactions.length} registro(s)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-y bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  {[
                    "Data",
                    "Descrição",
                    "Categoria",
                    "Conta",
                    "Tipo",
                    "Valor",
                    "Ações",
                  ].map((heading) => (
                    <th key={heading} className="px-6 py-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b last:border-0">
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {transaction.type === "transfer"
                        ? account === "all"
                          ? "Transferência entre contas"
                          : transaction.account_id === account
                            ? `Transferência para ${accountName.get(transaction.to_account_id ?? "") ?? "conta de destino"}`
                            : `Transferência recebida de ${accountName.get(transaction.account_id ?? "") ?? "conta de origem"}`
                        : transaction.description}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {categoryName.get(transaction.category_id ?? "") ??
                        "Sem categoria"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {transaction.type === "transfer" && account === "all"
                        ? `${accountName.get(transaction.account_id ?? "") ?? "Conta de origem"} → ${accountName.get(transaction.to_account_id ?? "") ?? "Conta de destino"}`
                        : (accountName.get(
                            account === transaction.to_account_id
                              ? transaction.to_account_id
                              : (transaction.account_id ?? ""),
                          ) ?? "Sem conta")}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          transaction.type === "income"
                            ? "default"
                            : transaction.type === "expense"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {labelFor(TRANSACTION_TYPES, transaction.type)}
                      </Badge>
                    </td>
                    <td
                      className={`num px-6 py-4 font-semibold ${transaction.type === "income" || (transaction.type === "transfer" && account === transaction.to_account_id) ? "text-positive" : transaction.type === "expense" || transaction.type === "transfer" ? "text-negative" : ""}`}
                    >
                      {transaction.type === "transfer" && account === "all" ? (
                        <span className="flex flex-col items-end gap-1">
                          <span className="text-negative">
                            -{formatCurrency(transaction.amount)}
                          </span>
                          <span className="text-positive">
                            +{formatCurrency(transaction.amount)}
                          </span>
                        </span>
                      ) : (
                        <>
                          {transaction.type === "expense" ||
                          (transaction.type === "transfer" &&
                            account === transaction.account_id)
                            ? "-"
                            : "+"}
                          {formatCurrency(transaction.amount)}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-negative"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Excluir movimentação?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. "
                              {transaction.description}" será excluída
                              permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDeleteTransaction(transaction)
                              }
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </ModulePage>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ContasPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const balances = accountBalances(accounts, transactions);
  const total = accounts
    .filter((account) => account.include_in_total && account.is_active)
    .reduce((sum, account) => sum + (balances.get(account.id) ?? 0), 0);
  return (
    <ModulePage title="Contas">
      <ModuleHeader
        title="Contas"
        description="Veja onde seu dinheiro está e acompanhe os saldos."
        action={<AccountDialog />}
      />
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        <SummaryStat
          label="Saldo total"
          value={formatCurrency(total)}
          icon={WalletCards}
          tone={total >= 0 ? "positive" : "negative"}
        />
        <SummaryStat
          label="Contas ativas"
          value={String(accounts.filter((account) => account.is_active).length)}
          icon={Landmark}
        />
        <SummaryStat
          label="Quantidade de contas"
          value={String(accounts.length)}
          icon={CircleDollarSign}
        />
      </div>
      {accounts.length === 0 ? (
        <EmptyModuleState
          icon={Landmark}
          title="Você ainda não cadastrou nenhuma conta."
          description="Adicione suas contas para saber onde seu dinheiro está."
          action={<AccountDialog />}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="surface-card overflow-hidden">
              <div className="h-1" style={{ backgroundColor: account.color }} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-primary">
                      <Landmark className="size-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base">
                        {account.name}
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {labelFor(ACCOUNT_TYPES, account.type)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={account.is_active ? "secondary" : "outline"}>
                    {account.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="num text-2xl font-semibold">
                  {formatCurrency(balances.get(account.id) ?? 0)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Saldo inicial: {formatCurrency(account.initial_balance)}
                </p>
                <Button variant="link" className="mt-3 h-auto px-0 text-sm">
                  Ver extrato <ArrowUpRight className="size-3" />
                </Button>
                <AccountCardActions account={account} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ModulePage>
  );
}

function AccountCardActions({ account }: { account: Account }) {
  const [checking, setChecking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const deleteAccount = useDeleteRow("accounts", "Conta excluída");
  const toggleActive = useSaveRow("accounts", {
    created: "Conta adicionada",
    updated: account.is_active ? "Conta inativada" : "Conta reativada",
  });

  const handleDeleteClick = async () => {
    setChecking(true);
    try {
      const usage = await countAccountUsage(account.id);
      if (usage > 0) setBlockedOpen(true);
      else setConfirmOpen(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível verificar as movimentações da conta.",
      );
    } finally {
      setChecking(false);
    }
  };

  const inactivate = () => {
    toggleActive.mutate({ id: account.id, values: { is_active: false } });
    setBlockedOpen(false);
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <AccountDialog
        account={account}
        trigger={
          <Button variant="outline" size="sm">
            <Pencil className="size-3.5" /> Editar
          </Button>
        }
      />
      {account.is_active ? (
        <Button
          variant="outline"
          size="sm"
          disabled={toggleActive.isPending}
          onClick={() =>
            toggleActive.mutate({
              id: account.id,
              values: { is_active: false },
            })
          }
        >
          Inativar
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={toggleActive.isPending}
          onClick={() =>
            toggleActive.mutate({ id: account.id, values: { is_active: true } })
          }
        >
          Reativar
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="text-negative hover:text-negative"
        disabled={checking}
        onClick={handleDeleteClick}
      >
        <Trash2 className="size-3.5" /> Excluir
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>
              "{account.name}" não possui movimentações vinculadas. Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAccount.mutate(account.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={blockedOpen} onOpenChange={setBlockedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Não é possível excluir esta conta
            </AlertDialogTitle>
            <AlertDialogDescription>
              "{account.name}" possui movimentações vinculadas. Para preservar o
              histórico financeiro, a exclusão foi bloqueada. Você pode
              inativá-la: ela deixa de aparecer para novos lançamentos, mas o
              histórico continua disponível e pode ser reativada depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={inactivate}>
              Inativar conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function CompromissosPage() {
  const [selectedMonth, setSelectedMonth] = useState(monthKeyOf(new Date()));
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const { data: obligations = [] } = useObligations();
  const { data: recurrings = [] } = useRecurrings();
  const { data: installments = [] } = useInstallments();
  const { data: debts = [] } = useDebts();
  const month = monthRange(selectedMonth);
  const todayISO = toISODate(new Date());
  const fromISO =
    selectedMonth === monthKeyOf(new Date()) && todayISO > month.startISO
      ? todayISO
      : month.startISO;
  const allUpcoming = upcomingOccurrences({
    fromISO,
    toISO: month.endISO,
    transactions,
    obligations,
    recurrings,
    installments,
    debts,
  });
  const activeAccounts = accounts.filter((account) => account.is_active);
  const accountName = new Map(accounts.map((item) => [item.id, item.name]));
  const categoryName = new Map(categories.map((item) => [item.id, item.name]));
  const visibleCommitments = allUpcoming;
  const visibleNextWeek = visibleCommitments.filter(
    (item) => item.date <= toISODate(new Date(Date.now() + 7 * 86400000)),
  );
  return (
    <ModulePage title="Compromissos" showGlobalPeriodSelector={false}>
      <ModuleHeader
        title="Compromissos"
        description="Dinheiro que ainda vai acontecer: uma vez, continuamente ou até terminar as parcelas."
        action={<ObligationDialog accounts={activeAccounts} />}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <SummaryStat
            label="Pendente no mês"
            value={formatCurrency(
              allUpcoming.reduce(
                (total, item) =>
                  total + (item.type === "expense" ? item.amount : 0),
                0,
              ),
            )}
            icon={CalendarClock}
            tone="negative"
          />
          <SummaryStat
            label="Compromissos pendentes"
            value={String(allUpcoming.length)}
            icon={ClipboardCheck}
          />
          <div className="hidden sm:block">
            <SummaryStat
              label="Próximos 7 dias"
              value={String(visibleNextWeek.length)}
              icon={Bell}
            />
          </div>
        </div>
        <MonthSwitcher monthKey={selectedMonth} onChange={setSelectedMonth} />
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3 sm:inline-flex">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="fixed">Fixos</TabsTrigger>
          <TabsTrigger value="installments">Parcelados</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <CommitmentSection
              title="Próximos 7 dias"
              items={visibleNextWeek}
            />
            <CommitmentSection
              title={formatMonthLong(selectedMonth)}
              items={allUpcoming}
            />
          </div>
        </TabsContent>
        <TabsContent value="fixed">
          <FixedCommitmentsSection
            recurrings={recurrings}
            accounts={accounts}
            activeAccounts={activeAccounts}
            accountName={accountName}
            categoryName={categoryName}
          />
        </TabsContent>
        <TabsContent value="installments">
          <InstallmentCommitmentsSection
            installments={installments}
            debts={debts}
            accounts={accounts}
            categoryName={categoryName}
          />
        </TabsContent>
      </Tabs>
    </ModulePage>
  );
}

function FixedCommitmentsSection({
  recurrings,
  accounts,
  activeAccounts,
  accountName,
  categoryName,
}: {
  recurrings: Recurring[];
  accounts: Account[];
  activeAccounts: Account[];
  accountName: Map<string, string>;
  categoryName: Map<string, string>;
}) {
  return recurrings.length === 0 ? (
    <EmptyModuleState
      icon={RefreshCcw}
      title="Nenhum compromisso fixo."
      description="Cadastre uma entrada ou saída que continuará acontecendo ao longo do tempo."
      action={<ObligationDialog accounts={activeAccounts} />}
    />
  ) : (
    <Card className="surface-card">
      <CardContent className="divide-y p-0">
        {recurrings.map((recurring) => {
          const account = accounts.find(
            (item) => item.id === recurring.account_id,
          );
          const editableAccounts =
            account && !account.is_active
              ? [...activeAccounts, account]
              : activeAccounts;
          return (
            <div
              key={recurring.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {recurring.description}
                  </p>
                  <Badge
                    variant={recurring.is_active ? "secondary" : "outline"}
                  >
                    {recurring.is_active ? "Vigente" : "Inativo"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Próxima ocorrência: {formatDate(recurring.start_date)} ·{" "}
                  {labelFor(FREQUENCIES, recurring.frequency)}
                  {recurring.end_date
                    ? ` · até ${formatDate(recurring.end_date)}`
                    : " · sem término"}
                  {recurring.account_id
                    ? ` · ${accountName.get(recurring.account_id) ?? "Conta removida"}`
                    : ""}
                  {recurring.category_id
                    ? ` · ${categoryName.get(recurring.category_id) ?? "Categoria removida"}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <p
                  className={`num text-sm font-semibold ${recurring.type === "income" ? "text-positive" : "text-negative"}`}
                >
                  {recurring.type === "income" ? "+" : "-"}
                  {formatCurrency(recurring.amount)}
                </p>
                <RecurringCardActions
                  recurring={recurring}
                  accounts={editableAccounts}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function InstallmentCommitmentsSection({
  installments,
  debts,
  accounts,
  categoryName,
}: {
  installments: Installment[];
  debts: Debt[];
  accounts: Account[];
  categoryName: Map<string, string>;
}) {
  if (!installments.length && !debts.length) {
    return (
      <EmptyModuleState
        icon={CreditCard}
        title="Nenhum compromisso parcelado."
        description="Escolha Parcelado ao criar um compromisso para acompanhar seu progresso aqui."
        action={
          <ObligationDialog
            accounts={accounts.filter((account) => account.is_active)}
          />
        }
      />
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {installments.map((item) => {
        const next = installmentOccurrences(item)[0];
        return (
          <Card key={item.id} className="surface-card">
            <CardHeader>
              <CardTitle className="text-base">{item.description}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {item.paid_count}/{item.installments_count} realizadas · próxima{" "}
                {next ? formatDate(next.date) : "concluída"}
              </p>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="num text-lg font-semibold">
                  {formatCurrency(item.installment_amount)} / parcela
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.account_id
                    ? accounts.find((account) => account.id === item.account_id)
                        ?.name
                    : "Sem conta"}
                  {item.category_id
                    ? ` · ${categoryName.get(item.category_id) ?? "Categoria removida"}`
                    : ""}
                </p>
              </div>
              {next && <ObligationSettlementDialog occurrence={next} />}
            </CardContent>
          </Card>
        );
      })}
      {debts.map((debt) => {
        const next = debtOccurrences(debt)[0];
        return (
          <Card key={debt.id} className="surface-card">
            <CardHeader>
              <CardTitle className="text-base">{debt.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {debt.paid_installments}/{debt.installments_count} realizadas ·
                próxima {next ? formatDate(next.date) : "concluída"}
              </p>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="num text-lg font-semibold">
                {formatCurrency(debt.installment_amount)} / parcela
              </p>
              {next && <ObligationSettlementDialog occurrence={next} />}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function RecurringCardActions({
  recurring,
  accounts,
}: {
  recurring: Recurring;
  accounts: Account[];
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteRecurring = useDeleteRow(
    "recurring_transactions",
    "Valor fixo excluído",
  );
  const toggleActive = useSaveRow("recurring_transactions", {
    created: "Valor fixo adicionado",
    updated: recurring.is_active
      ? "Valor fixo desativado"
      : "Valor fixo reativado",
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <RecurringDialog
        recurring={recurring}
        accounts={accounts}
        trigger={
          <Button variant="outline" size="sm">
            <Pencil className="size-3.5" /> Editar
          </Button>
        }
      />
      <Button
        variant="outline"
        size="sm"
        disabled={toggleActive.isPending}
        onClick={() =>
          toggleActive.mutate({
            id: recurring.id,
            values: { is_active: !recurring.is_active },
          })
        }
      >
        {recurring.is_active ? "Desativar" : "Reativar"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-negative hover:text-negative"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="size-3.5" /> Excluir
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir valor fixo?</AlertDialogTitle>
            <AlertDialogDescription>
              "{recurring.description}" deixará de aparecer na previsão
              financeira. Movimentações já realizadas não são afetadas. Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRecurring.mutate(recurring.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CommitmentSection({
  title,
  items,
}: {
  title: string;
  items: {
    date: string;
    amount: number;
    description: string;
    type: "income" | "expense";
    obligation?: Obligation;
  }[];
}) {
  return (
    <Card className="surface-card">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4 text-primary" />
          {title}
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length ? (
          <div className="divide-y">
            {items.map((item, index) => {
              console.log("[CommitmentSection] item", {
                description: item.description,
                date: item.date,
                amount: item.amount,
                obligationId: item.obligation?.id,
                obligationStatus: item.obligation?.status,
              });
              return (
                <div
                  key={`${item.date}-${item.description}-${index}`}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-xs">
                    <span className="font-semibold">
                      {item.date.slice(8, 10)}
                    </span>
                    <span className="text-muted-foreground">
                      {item.date.slice(5, 7)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(item.date)} ·{" "}
                      {item.type === "income" ? "Recebimento" : "Pagamento"}
                    </p>
                  </div>
                  <p
                    className={`num text-sm font-semibold ${item.type === "income" ? "text-positive" : "text-negative"}`}
                  >
                    {item.type === "income" ? "+" : "-"}
                    {formatCurrency(item.amount)}
                  </p>
                  {(!item.obligation ||
                    item.obligation.status === "pending") && (
                    <ObligationSettlementDialog
                      obligation={item.obligation}
                      occurrence={item}
                      trigger={
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                        >
                          Dar baixa
                        </Button>
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhum item neste período.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function DividasPage() {
  const { data: debts = [] } = useDebts();
  const activeDebts = debts.filter((debt) => debt.status === "active");
  const details = activeDebts.map((debt) => ({
    debt,
    remaining: debtRemaining(debt),
  }));
  const total = details.reduce(
    (sum, item) => sum + item.remaining.remainingAmount,
    0,
  );
  const monthly = details.reduce(
    (sum, item) => sum + Number(item.debt.installment_amount),
    0,
  );
  return (
    <ModulePage title="Dívidas">
      <ModuleHeader
        title="Dívidas"
        description="Acompanhe seus compromissos e veja quando estará livre deles."
        action={<DisabledAction>Nova dívida</DisabledAction>}
      />
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        <SummaryStat
          label="Total devido"
          value={formatCurrency(total)}
          icon={CreditCard}
          tone="negative"
        />
        <SummaryStat
          label="Parcelas este mês"
          value={formatCurrency(monthly)}
          icon={CalendarClock}
        />
        <SummaryStat
          label="Dívidas ativas"
          value={String(activeDebts.length)}
          icon={ShieldCheck}
        />
      </div>
      {details.length === 0 ? (
        <EmptyModuleState
          icon={CreditCard}
          title="Nenhuma dívida ativa."
          description="Registre suas dívidas para acompanhar o progresso até a quitação."
          action={<DisabledAction>Nova dívida</DisabledAction>}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {details.map(({ debt, remaining }) => (
            <Card key={debt.id} className="surface-card">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{debt.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {debt.creditor ?? "Credor não informado"}
                    </p>
                  </div>
                  <Badge variant="destructive">Ativa</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Valor restante
                    </p>
                    <p className="num mt-1 text-2xl font-semibold text-negative">
                      {formatCurrency(remaining.remainingAmount)}
                    </p>
                  </div>
                  <p className="text-right text-xs text-muted-foreground">
                    Parcela
                    <br />
                    <strong className="num text-sm text-foreground">
                      {formatCurrency(debt.installment_amount)}
                    </strong>
                  </p>
                </div>
                <Progress
                  value={remaining.progress * 100}
                  className="mt-5 bg-negative-soft"
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>{formatPercent(remaining.progress)} quitado</span>
                  <span>Previsão: {formatDate(remaining.endDate)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ModulePage>
  );
}

export function InvestimentosPage() {
  const { data: investments = [] } = useInvestments();
  const invested = investments.reduce(
    (sum, item) => sum + Number(item.invested_amount),
    0,
  );
  const current = investments.reduce(
    (sum, item) => sum + Number(item.current_value),
    0,
  );
  const result = current - invested;
  const allocation = INVESTMENT_TYPES.map((type) => ({
    ...type,
    value: investments
      .filter((item) => item.type === type.value)
      .reduce((sum, item) => sum + Number(item.current_value), 0),
  })).filter((item) => item.value > 0);
  return (
    <ModulePage title="Investimentos">
      <ModuleHeader
        title="Investimentos"
        description="Acompanhe seu patrimônio e a evolução dos seus investimentos."
        action={<DisabledAction>Adicionar investimento</DisabledAction>}
      />
      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryStat
          label="Total investido"
          value={formatCurrency(invested)}
          icon={PiggyBank}
        />
        <SummaryStat
          label="Valor atual"
          value={formatCurrency(current)}
          icon={TrendingUp}
          tone={current >= invested ? "positive" : "negative"}
        />
        <SummaryStat
          label="Resultado"
          value={formatSigned(result)}
          icon={result >= 0 ? ArrowUpRight : ArrowDownLeft}
          tone={result >= 0 ? "positive" : "negative"}
        />
        <SummaryStat
          label="Investimentos"
          value={String(investments.length)}
          icon={WalletCards}
        />
      </div>
      {investments.length === 0 ? (
        <EmptyModuleState
          icon={TrendingUp}
          title="Você ainda não possui investimentos cadastrados."
          description="Adicione seus investimentos para acompanhar seu patrimônio."
          action={<DisabledAction>Adicionar investimento</DisabledAction>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="text-base">
                Distribuição da carteira
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {allocation.map((item) => (
                <div key={item.value}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="num font-medium">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                  <Progress
                    value={current ? (item.value / current) * 100 : 0}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            {investments.map((investment) => (
              <Card key={investment.id} className="surface-card">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">
                    {labelFor(INVESTMENT_TYPES, investment.type)}
                  </p>
                  <h3 className="mt-2 font-semibold">{investment.name}</h3>
                  <p className="num mt-5 text-xl font-semibold">
                    {formatCurrency(investment.current_value)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Investido: {formatCurrency(investment.invested_amount)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </ModulePage>
  );
}

export function MetasPage() {
  const { data: goals = [] } = useGoals();
  const details = goals.map((goal) => ({ goal, progress: goalProgress(goal) }));
  const completedCount = details.filter(
    (item) => item.progress.isCompleted,
  ).length;
  const totalSaved = details.reduce(
    (sum, item) => sum + Number(item.goal.current_amount),
    0,
  );
  return (
    <ModulePage title="Metas">
      <ModuleHeader
        title="Metas"
        description="Acompanhe seus objetivos financeiros até serem concluídos."
        action={<GoalDialog />}
      />
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        <SummaryStat
          label="Metas ativas"
          value={String(goals.length)}
          icon={Target}
        />
        <SummaryStat
          label="Metas concluídas"
          value={String(completedCount)}
          icon={CheckCircle2}
          tone={completedCount > 0 ? "positive" : "default"}
        />
        <SummaryStat
          label="Total acumulado"
          value={formatCurrency(totalSaved)}
          icon={PiggyBank}
        />
      </div>
      {details.length === 0 ? (
        <EmptyModuleState
          icon={Target}
          title="Você ainda não possui metas cadastradas."
          description="Crie metas para acompanhar objetivos como reserva de emergência, viagens ou compras."
          action={<GoalDialog />}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {details.map(({ goal, progress }) => (
            <Card key={goal.id} className="surface-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{goal.name}</CardTitle>
                  {progress.isCompleted && (
                    <Badge className="gap-1 bg-positive-soft text-positive hover:bg-positive-soft">
                      <CheckCircle2 className="size-3.5" /> Concluída
                    </Badge>
                  )}
                </div>
                {goal.target_date && (
                  <p className="text-xs text-muted-foreground">
                    Prazo: {formatDate(goal.target_date)}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <p className="num text-sm text-muted-foreground">
                  {formatCurrency(goal.current_amount)} /{" "}
                  {formatCurrency(goal.target_amount)}
                </p>
                <Progress
                  value={progress.progress * 100}
                  className={`mt-3 ${progress.isCompleted ? "bg-positive-soft" : ""}`}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatPercent(progress.progress)} concluído</span>
                  <span>
                    {progress.isCompleted
                      ? "Meta concluída"
                      : `Faltam ${formatCurrency(progress.remaining)}`}
                  </span>
                </div>
                <GoalCardActions goal={goal} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ModulePage>
  );
}

function GoalCardActions({ goal }: { goal: FinancialGoal }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteGoal = useDeleteRow("financial_goals", "Meta excluída");

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <AddGoalAmountDialog goal={goal} />
      <GoalDialog
        goal={goal}
        trigger={
          <Button variant="outline" size="sm">
            <Pencil className="size-3.5" /> Editar
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="sm"
        className="text-negative hover:text-negative"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="size-3.5" /> Excluir
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
            <AlertDialogDescription>
              "{goal.name}" será removida. Suas movimentações financeiras não
              são afetadas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteGoal.mutate(goal.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const BUDGET_STATE_META: Record<
  BudgetState,
  { label: string; text: string; track: string }
> = {
  normal: { label: "Normal", text: "text-positive", track: "" },
  attention: {
    label: "Atenção",
    text: "text-warning-foreground",
    track: "bg-warning-soft",
  },
  near: {
    label: "Próximo do limite",
    text: "text-warning-foreground",
    track: "bg-warning-soft",
  },
  exceeded: {
    label: "Excedido",
    text: "text-negative",
    track: "bg-negative-soft",
  },
};

export function MonthSwitcher({
  monthKey,
  onChange,
}: {
  monthKey: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1">
      <button
        type="button"
        aria-label="Mês anterior"
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        onClick={() => onChange(addMonthsKey(monthKey, -1))}
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-[150px] text-center text-sm font-medium">
        {formatMonthLong(monthKey)}
      </span>
      <button
        type="button"
        aria-label="Próximo mês"
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        onClick={() => onChange(addMonthsKey(monthKey, 1))}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

export function LimitesPage() {
  const [selectedMonth, setSelectedMonth] = useState(monthKeyOf(new Date()));
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const { data: budgets = [] } = useBudgets();
  const expenseCategories = categories.filter(
    (category) => category.kind === "expense",
  );
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const budgetedCategoryIds = new Set(
    budgets.map((budget) => budget.category_id),
  );
  const availableCategories = expenseCategories.filter(
    (category) => !budgetedCategoryIds.has(category.id),
  );
  const details = budgets
    .filter((budget) => monthKeyOf(budget.start_month) <= selectedMonth)
    .map((budget) => ({
      budget,
      category: categoryById.get(budget.category_id),
      usage: budgetUsage(budget, transactions, selectedMonth),
    }))
    .sort((a, b) => b.usage.ratio - a.usage.ratio);
  const exceededCount = details.filter(
    (item) => item.usage.state === "exceeded",
  ).length;
  const totalSpent = details.reduce((sum, item) => sum + item.usage.spent, 0);

  return (
    <ModulePage title="Limites">
      <ModuleHeader
        title="Limites"
        description="Defina quanto pretende gastar por categoria e acompanhe a utilização mês a mês."
        action={<BudgetDialog categories={availableCategories} />}
      />
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <MonthSwitcher monthKey={selectedMonth} onChange={setSelectedMonth} />
      </div>
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        <SummaryStat
          label="Limites cadastrados"
          value={String(details.length)}
          icon={SlidersHorizontal}
        />
        <SummaryStat
          label="Categorias excedidas"
          value={String(exceededCount)}
          icon={AlertTriangle}
          tone={exceededCount > 0 ? "negative" : "default"}
        />
        <SummaryStat
          label="Gasto no mês (categorias com limite)"
          value={formatCurrency(totalSpent)}
          icon={CircleDollarSign}
        />
      </div>
      {details.length === 0 ? (
        <EmptyModuleState
          icon={SlidersHorizontal}
          title="Nenhum limite cadastrado para este mês."
          description="Cadastre limites por categoria para acompanhar quanto você pretende gastar."
          action={<BudgetDialog categories={availableCategories} />}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {details.map(({ budget, category, usage }) => {
            const meta = BUDGET_STATE_META[usage.state];
            const editableCategories = expenseCategories.filter(
              (item) =>
                item.id === budget.category_id ||
                !budgetedCategoryIds.has(item.id),
            );
            return (
              <Card key={budget.id} className="surface-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: category?.color ?? "#94a3b8",
                        }}
                      />
                      <CardTitle className="text-base">
                        {category?.name ?? "Categoria removida"}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className={meta.text}>
                      {meta.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="num text-sm text-muted-foreground">
                    {formatCurrency(usage.spent)} /{" "}
                    {formatCurrency(usage.limit)}
                  </p>
                  <Progress
                    value={usage.progress * 100}
                    className={`mt-3 ${meta.track}`}
                  />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className={meta.text}>
                      {formatPercent(usage.ratio)} utilizado
                    </span>
                    <span className="text-muted-foreground">
                      {usage.state === "exceeded"
                        ? `Excedente de ${formatCurrency(usage.overspent)}`
                        : `Restam ${formatCurrency(usage.remaining)}`}
                    </span>
                  </div>
                  <BudgetCardActions
                    budget={budget}
                    categories={editableCategories}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </ModulePage>
  );
}

function BudgetCardActions({
  budget,
  categories,
}: {
  budget: CategoryBudget;
  categories: Category[];
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteBudget = useDeleteRow("category_budgets", "Limite excluído");

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <BudgetDialog
        budget={budget}
        categories={categories}
        trigger={
          <Button variant="outline" size="sm">
            <Pencil className="size-3.5" /> Editar
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="sm"
        className="text-negative hover:text-negative"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="size-3.5" /> Excluir
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir limite?</AlertDialogTitle>
            <AlertDialogDescription>
              Este limite deixará de ser acompanhado. Suas movimentações
              financeiras não são afetadas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteBudget.mutate(budget.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function RelatoriosPage() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const [period, setPeriod] = useState(monthKeyOf(new Date()));
  const totals = monthTotals(transactions, period);
  const breakdown = categoryBreakdown(transactions, period, categories);
  return (
    <ModulePage title="Relatórios">
      <ModuleHeader
        title="Relatórios"
        description="Entenda como seu dinheiro está sendo utilizado."
      />
      <Card className="surface-card mb-6">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
          <div className="w-full max-w-xs space-y-2">
            <Label>Período de análise</Label>
            <Input
              type="month"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            />
          </div>
          <Button variant="outline" className="sm:mb-0">
            <SlidersHorizontal /> Aplicar filtros
          </Button>
        </CardContent>
      </Card>
      {transactions.length === 0 ? (
        <EmptyModuleState
          icon={BarChart3}
          title="Não existem dados suficientes para gerar relatórios."
          description="Adicione movimentações para gerar seus primeiros relatórios."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="text-base">Receitas x Despesas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <ReportBar
                label="Receitas"
                value={totals.income}
                max={Math.max(totals.income, totals.expense)}
                color="bg-positive"
              />
              <ReportBar
                label="Despesas"
                value={totals.expense}
                max={Math.max(totals.income, totals.expense)}
                color="bg-negative"
              />
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  Resultado de {formatMonthLong(period)}
                </p>
                <p
                  className={`num mt-1 text-2xl font-semibold ${totals.result >= 0 ? "text-positive" : "text-negative"}`}
                >
                  {formatSigned(totals.result)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="text-base">Gastos por categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {breakdown.length ? (
                breakdown.map((item) => (
                  <ReportBar
                    key={item.id}
                    label={item.name}
                    value={item.value}
                    max={totals.expense}
                    color="bg-primary"
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma despesa paga neste período.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </ModulePage>
  );
}

function ReportBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="num font-medium">{formatCurrency(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${max ? Math.min((value / max) * 100, 100) : 0}%` }}
        />
      </div>
    </div>
  );
}

export function ConciliacaoPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: reconciliations = [] } = useReconciliations();
  const [accountId, setAccountId] = useState("");
  const selectedAccount =
    accounts.find((account) => account.id === accountId) ?? accounts[0];
  const balances = accountBalances(accounts, transactions);
  const latest = reconciliations.find(
    (item) => item.account_id === selectedAccount?.id,
  );
  const systemBalance = selectedAccount
    ? (balances.get(selectedAccount.id) ?? 0)
    : 0;
  const informedBalance = latest?.real_balance ?? 0;
  const difference = informedBalance - systemBalance;
  const pending = transactions.filter(
    (item) => item.status === "pending",
  ).length;
  return (
    <ModulePage title="Conciliação">
      <ModuleHeader
        title="Conciliação"
        description="Compare os registros do sistema com os valores reais das suas contas."
      />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="size-4 text-primary" />
              Conferência de saldo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Conta</Label>
              <Select
                value={selectedAccount?.id ?? accountId}
                onValueChange={setAccountId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <ReconciliationValue
                label="Saldo no sistema"
                value={systemBalance}
              />
              <ReconciliationValue
                label="Saldo informado"
                value={informedBalance}
              />
              <ReconciliationValue
                label="Diferença"
                value={difference}
                emphasis
              />
            </div>
            {selectedAccount ? (
              <div
                className={`flex items-center gap-3 rounded-lg p-4 ${Math.abs(difference) < 0.01 ? "bg-positive-soft text-positive" : "bg-warning-soft text-warning-foreground"}`}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-background/70">
                  {Math.abs(difference) < 0.01 ? (
                    <Check className="size-4" />
                  ) : (
                    "!"
                  )}
                </span>
                <div>
                  <p className="font-medium">
                    {Math.abs(difference) < 0.01
                      ? "Tudo conferido"
                      : "Existe uma diferença"}
                  </p>
                  <p className="mt-1 text-xs opacity-80">
                    {latest
                      ? `Última conferência em ${formatDate(latest.date)}`
                      : "Ainda não há uma conferência registrada."}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyModuleState
                icon={Landmark}
                title="Nenhuma conta disponível para conciliação."
                description="Cadastre uma conta para começar a conferir seus saldos."
              />
            )}
          </CardContent>
        </Card>
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="text-base">Itens para revisar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReviewItem
              label="Movimentações pendentes"
              value={String(pending)}
            />
            <ReviewItem
              label="Movimentações não conferidas"
              value={String(
                transactions.filter((item) => !item.reconciled).length,
              )}
            />
            <ReviewItem
              label="Possíveis divergências"
              value={
                latest && Math.abs(Number(latest.difference)) > 0.01 ? "1" : "0"
              }
            />
          </CardContent>
        </Card>
      </div>
    </ModulePage>
  );
}

function ReconciliationValue({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`num mt-2 text-lg font-semibold ${emphasis && value !== 0 ? "text-warning-foreground" : ""}`}
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="num rounded-full bg-muted px-2.5 py-1 text-sm font-semibold">
        {value}
      </span>
    </div>
  );
}

export function ConfiguracoesPage() {
  const { data: profile } = useProfile();
  const { theme, setTheme } = useTheme();
  return (
    <ModulePage title="Configurações">
      <ModuleHeader
        title="Configurações"
        description="Personalize sua experiência no My Finance Compass."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="surface-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sun className="size-4 text-primary" />
              Aparência
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Escolha como o My Finance Compass deve aparecer.
            </p>
          </CardHeader>
          <CardContent>
            <div
              className="grid gap-3 sm:grid-cols-3"
              role="radiogroup"
              aria-label="Tema da aplicação"
            >
              <ThemeOption
                theme="light"
                selected={theme}
                onSelect={setTheme}
                icon={Sun}
                label="Claro"
                description="Fundo claro e confortável"
              />
              <ThemeOption
                theme="dark"
                selected={theme}
                onSelect={setTheme}
                icon={Moon}
                label="Escuro"
                description="Ideal para ambientes com pouca luz"
              />
              <ThemeOption
                theme="system"
                selected={theme}
                onSelect={setTheme}
                icon={Monitor}
                label="Sistema"
                description="Acompanha o dispositivo"
              />
            </div>
          </CardContent>
        </Card>
        <SettingsSection
          icon={CircleDollarSign}
          title="Perfil"
          description="Informações básicas da sua conta."
        >
          <ProfileFields profile={profile} />
        </SettingsSection>
        <SettingsSection
          icon={SlidersHorizontal}
          title="Preferências"
          description="Como os valores e períodos devem aparecer."
        >
          <SettingField label="Moeda" value={profile?.currency ?? "BRL"} />
          <SettingField
            label="Primeiro dia do mês"
            value={String(profile?.first_day_of_month ?? 1)}
          />
        </SettingsSection>
        <SettingsSection
          icon={Bell}
          title="Notificações"
          description="Avisos importantes para acompanhar sua rotina."
          disabled
        >
          <SettingField
            label="Próximos compromissos"
            value={profile?.notify_upcoming ? "Ativo" : "Desativado"}
          />
          <SettingField
            label="Alertas financeiros"
            value={profile?.notify_negative_forecast ? "Ativo" : "Desativado"}
          />
        </SettingsSection>
        <SettingsSection
          icon={LockKeyhole}
          title="Segurança"
          description="Controles de acesso e sessão."
          disabled
        >
          <SettingField
            label="Senha"
            value="Gerenciada pelo provedor de autenticação"
          />
          <SettingField label="Sessão" value="Sessão atual" />
        </SettingsSection>
        <SettingsSection
          icon={FileSearch}
          title="Dados"
          description="Ferramentas futuras para portabilidade dos seus dados."
          disabled
        >
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <LockKeyhole className="size-4" /> Exportação e importação estarão
            disponíveis em uma próxima etapa.
          </div>
        </SettingsSection>
      </div>
    </ModulePage>
  );
}

function ThemeOption({
  theme,
  selected,
  onSelect,
  icon: Icon,
  label,
  description,
}: {
  theme: Theme;
  selected: Theme;
  onSelect: (theme: Theme) => void;
  icon: LucideIcon;
  label: string;
  description: string;
}) {
  const isSelected = theme === selected;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={() => onSelect(theme)}
      className={`flex min-h-20 items-center gap-3 rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isSelected ? "border-primary bg-primary/10 text-foreground" : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"}`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${isSelected ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}
      >
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
  disabled = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Card className={`surface-card ${disabled ? "opacity-70" : ""}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function ProfileFields({
  profile,
}: {
  profile: ReturnType<typeof useProfile>["data"];
}) {
  const [name, setName] = useState(profile?.full_name ?? "");
  const [cpf, setCpf] = useState(profile?.cpf ?? "");
  const [error, setError] = useState("");
  const save = useMutation({
    mutationFn: () =>
      updateProfile({
        full_name: name.trim() || null,
        cpf: cpf ? normalizeCpf(cpf) : null,
      }),
  });

  useEffect(() => {
    setName(profile?.full_name ?? "");
    setCpf(profile?.cpf ?? "");
  }, [profile?.cpf, profile?.full_name]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (cpf && !isValidCpf(cpf)) {
      setError("Informe um CPF válido.");
      return;
    }
    await save.mutateAsync();
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <SettingField
        label="Nome"
        value={name}
        onChange={setName}
        disabled={false}
      />
      <SettingField label="E-mail" value="Disponível na sessão autenticada" />
      <div className="grid gap-2">
        <Label htmlFor="profile-cpf">CPF</Label>
        <Input
          id="profile-cpf"
          value={formatCpf(cpf)}
          onChange={(event) => setCpf(normalizeCpf(event.target.value))}
          inputMode="numeric"
          placeholder="000.000.000-00"
          maxLength={14}
        />
        <p className="text-xs text-muted-foreground">
          Armazenado com 11 dígitos, sem máscara. A validação cadastral externa
          será adicionada no backend futuramente.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-negative">
          {error}
        </p>
      )}
      {save.isSuccess && (
        <p role="status" className="text-sm text-positive">
          Perfil atualizado.
        </p>
      )}
      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Salvando..." : "Salvar perfil"}
      </Button>
    </form>
  );
}

function SettingField({
  label,
  value,
  onChange,
  disabled = true,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </div>
  );
}
