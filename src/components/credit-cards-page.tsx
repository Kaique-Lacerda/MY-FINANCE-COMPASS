import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Check,
  CreditCard as CreditCardIcon,
  Pencil,
  Receipt,
  Trash2,
  Wallet,
} from "lucide-react";

import { CreditCardDialog } from "@/components/credit-card-dialog";
import { CreditCardPurchaseDialog } from "@/components/credit-card-purchase-dialog";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useAccounts,
  useCreditCardInvoices,
  useCreditCardTransactions,
  useCreditCards,
  useDeleteCreditCardPurchase,
  useSaveRow,
  useTransactions,
} from "@/hooks/useFinance";
import type {
  CreditCard,
  CreditCardInvoice,
  CreditCardTransaction,
  Transaction,
} from "@/lib/domain";
import { isInvoiceClosed } from "@/lib/finance";
import {
  formatCurrency,
  formatDate,
  formatMonthLong,
  toISODate,
} from "@/lib/format";

function cardVisual(
  institutionCode: string | null | undefined,
  institutionName: string | null | undefined,
) {
  const normalized = institutionName?.toLowerCase() ?? "";
  if (institutionCode === "nubank" || normalized.includes("nubank")) {
    return {
      background: "bg-gradient-to-br from-[#4c1d95] via-[#6d28d9] to-[#a855f7]",
      mark: "Nubank",
    };
  }
  if (institutionCode === "sicredi" || normalized.includes("sicredi")) {
    return {
      background: "bg-gradient-to-br from-[#14532d] via-[#15803d] to-[#84cc16]",
      mark: institutionName || "Sicredi",
    };
  }
  if (
    institutionCode === "banco_do_brasil" ||
    normalized.includes("banco do brasil")
  ) {
    return {
      background: "bg-gradient-to-br from-[#0c4a6e] via-[#0369a1] to-[#facc15]",
      mark: institutionName || "Banco do Brasil",
    };
  }
  if (
    institutionCode === "mercado_pago" ||
    normalized.includes("mercado pago")
  ) {
    return {
      background: "bg-gradient-to-br from-[#075985] via-[#0284c7] to-[#38bdf8]",
      mark: institutionName || "Mercado Pago",
    };
  }
  if (normalized.includes("inter")) {
    return {
      background: "bg-gradient-to-br from-[#7f1d1d] via-[#dc2626] to-[#fb923c]",
      mark: "Inter",
    };
  }
  if (normalized.includes("itaú") || normalized.includes("itau")) {
    return {
      background: "bg-gradient-to-br from-[#0f3d5e] via-[#075985] to-[#38bdf8]",
      mark: "Itaú",
    };
  }
  return {
    background: "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950",
    mark: institutionName || "Conta vinculada",
  };
}

function currentReferenceMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function InvoicePayment({
  card,
  invoice,
  total,
}: {
  card: CreditCard;
  invoice: CreditCardInvoice;
  total: number;
}) {
  const [date, setDate] = useState(toISODate(new Date()));
  const [paymentAmount, setPaymentAmount] = useState(
    String(total - Number(invoice.paid_amount ?? 0)),
  );

  useEffect(() => {
    const remainingBalance = Math.max(
      total - Number(invoice.paid_amount ?? 0),
      0,
    );
    setPaymentAmount(String(remainingBalance));
  }, [invoice.paid_amount, total]);

  const saveTransaction = useSaveRow("transactions", {
    created: "Pagamento de fatura registrado",
    updated: "Transaction atualizada",
  });
  const saveInvoice = useSaveRow("credit_card_invoices", {
    created: "Fatura criada",
    updated: "Fatura atualizada",
  });
  const { data: accounts = [] } = useAccounts();
  const account = accounts.find((item) => item.id === card.account_id);

  const remainingBalance = Math.max(
    total - Number(invoice.paid_amount ?? 0),
    0,
  );
  const isFullyPaid = remainingBalance <= 0;

  const pay = () => {
    if (!account || isFullyPaid || !total) return;
    const payAmount = Math.min(Number(paymentAmount), remainingBalance);
    if (payAmount <= 0) return;

    saveTransaction.mutate(
      {
        values: {
          type: "expense",
          description: `Pagamento fatura ${card.name}`,
          amount: payAmount,
          planned_amount: payAmount,
          real_amount: payAmount,
          date,
          planned_date: invoice.due_date,
          due_date: invoice.due_date,
          account_id: account.id,
          category_id: null,
          credit_card_invoice_id: invoice.id,
          status: "done",
          interest_amount: 0,
          fine_amount: 0,
          discount_amount: 0,
        },
      },
      {
        onSuccess: (transaction) => {
          const newPaidAmount = Number(invoice.paid_amount ?? 0) + payAmount;
          const isNowFullyPaid = newPaidAmount >= total;
          saveInvoice.mutate({
            id: invoice.id,
            values: {
              paid_amount: newPaidAmount,
              status: isNowFullyPaid ? "paid" : invoice.status,
              paid_transaction_id: isNowFullyPaid
                ? (transaction as { id: string }).id
                : invoice.paid_transaction_id,
            },
          });
          setPaymentAmount(String(Math.max(total - newPaidAmount, 0)));
        },
      },
    );
  };

  if (invoice.id.startsWith("virtual-")) return null;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <Label htmlFor={`invoice-payment-date-${invoice.id}`}>
          Data real do pagamento
        </Label>
        <Input
          id={`invoice-payment-date-${invoice.id}`}
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`invoice-payment-amount-${invoice.id}`}>
          Valor do pagamento
        </Label>
        <div className="flex gap-2">
          <Input
            id={`invoice-payment-amount-${invoice.id}`}
            type="number"
            min="0.01"
            step="0.01"
            max={remainingBalance}
            value={paymentAmount}
            onChange={(event) => setPaymentAmount(event.target.value)}
            placeholder="0,00"
            disabled={isFullyPaid}
          />
          <Button
            type="button"
            size="lg"
            disabled={
              isFullyPaid || saveTransaction.isPending || saveInvoice.isPending
            }
            onClick={pay}
          >
            {isFullyPaid ? "Fatura paga" : "Pagar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function InvoiceNavigation({
  selectedReference,
  selectedInvoiceId,
  orderedInvoices,
  previousInvoice,
  nextInvoice,
  availableReferences,
  invoiceListOpen,
  calendarOpen,
  calendarYear,
  onSelectReference,
  onInvoiceListOpenChange,
  onCalendarOpenChange,
  onCalendarYearChange,
}: {
  selectedReference: string;
  selectedInvoiceId?: string;
  orderedInvoices: CreditCardInvoice[];
  previousInvoice?: CreditCardInvoice;
  nextInvoice?: CreditCardInvoice;
  availableReferences: Set<string>;
  invoiceListOpen: boolean;
  calendarOpen: boolean;
  calendarYear: number;
  onSelectReference: (referenceMonth: string) => void;
  onInvoiceListOpenChange: (open: boolean) => void;
  onCalendarOpenChange: (open: boolean) => void;
  onCalendarYearChange: (year: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!previousInvoice}
        title="Fatura anterior"
        aria-label="Fatura anterior"
        onClick={() =>
          previousInvoice && onSelectReference(previousInvoice.reference_month)
        }
      >
        <ChevronLeft />
      </Button>
      <Popover open={invoiceListOpen} onOpenChange={onInvoiceListOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="min-w-0 flex-1 px-3 text-base font-semibold"
            aria-label="Selecionar fatura"
          >
            <span className="truncate">
              {formatMonthLong(selectedReference.slice(0, 7))}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-64 p-2">
          <div className="space-y-1">
            {orderedInvoices.map((invoice) => {
              const isSelected = invoice.id === selectedInvoiceId;
              return (
                <Button
                  key={invoice.id}
                  type="button"
                  variant={isSelected ? "secondary" : "ghost"}
                  className="w-full justify-between px-3"
                  aria-current={isSelected ? "true" : undefined}
                  onClick={() => {
                    onSelectReference(invoice.reference_month);
                    onInvoiceListOpenChange(false);
                  }}
                >
                  <span>
                    {formatMonthLong(invoice.reference_month.slice(0, 7))}
                  </span>
                  {isSelected && <Check />}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!nextInvoice}
        title="Próxima fatura"
        aria-label="Próxima fatura"
        onClick={() =>
          nextInvoice && onSelectReference(nextInvoice.reference_month)
        }
      >
        <ChevronRight />
      </Button>
      <Popover open={calendarOpen} onOpenChange={onCalendarOpenChange} modal>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="ml-auto"
            title="Selecionar mês da fatura"
            aria-label="Selecionar mês da fatura"
            onClick={() =>
              onCalendarYearChange(Number(selectedReference.slice(0, 4)))
            }
          >
            <CalendarDays />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Ano anterior"
              aria-label="Ano anterior"
              onClick={() => onCalendarYearChange(calendarYear - 1)}
            >
              <ChevronLeft />
            </Button>
            <p className="font-semibold">{calendarYear}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Próximo ano"
              aria-label="Próximo ano"
              onClick={() => onCalendarYearChange(calendarYear + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }, (_, monthIndex) => {
              const reference = `${calendarYear}-${String(monthIndex + 1).padStart(2, "0")}`;
              const isAvailable = availableReferences.has(reference);
              const isSelected = selectedReference.slice(0, 7) === reference;
              return (
                <Button
                  key={reference}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  disabled={!isAvailable}
                  className="h-auto min-h-10 px-2 py-2 text-xs"
                  onClick={() => {
                    onSelectReference(`${reference}-01`);
                    onCalendarOpenChange(false);
                  }}
                >
                  {formatMonthLong(reference).split(" de ")[0]}
                </Button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Apenas meses com fatura disponível podem ser selecionados.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function CreditCardsPage() {
  const { data: cards = [] } = useCreditCards();
  const { data: accounts = [] } = useAccounts();
  const {
    data: invoices = [],
    isLoading: invoicesLoading,
    isFetching: invoicesFetching,
    error: invoicesError,
  } = useCreditCardInvoices();
  const {
    data: entries = [],
    isLoading: entriesLoading,
    isFetching: entriesFetching,
    error: entriesError,
  } = useCreditCardTransactions();
  const { data: transactions = [] } = useTransactions();
  const [selectedCardId, setSelectedCardId] = useState("");
  const [selectedReference, setSelectedReference] = useState<string | null>(
    null,
  );
  const [invoiceListOpen, setInvoiceListOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState(0);
  const [pendingDelete, setPendingDelete] =
    useState<CreditCardTransaction | null>(null);
  const deletePurchase = useDeleteCreditCardPurchase();
  const selectedCard = cards.find(
    (card) => card.id === (selectedCardId || cards[0]?.id),
  );
  const cardInvoices = useMemo(() => {
    if (!selectedCard) return [];
    return invoices.filter((invoice) => invoice.card_id === selectedCard.id);
  }, [invoices, selectedCard]);
  const selectedCardKey = selectedCard?.id;
  useEffect(() => {
    if (selectedCardKey) setSelectedReference(currentReferenceMonth());
  }, [selectedCardKey]);
  const selectedInvoice = cardInvoices.find(
    (invoice) =>
      invoice.reference_month.slice(0, 7) === selectedReference?.slice(0, 7),
  );
  const orderedInvoices = [...cardInvoices].sort((a, b) =>
    a.reference_month.localeCompare(b.reference_month),
  );
  const selectedInvoiceIndex = orderedInvoices.findIndex(
    (invoice) => invoice.id === selectedInvoice?.id,
  );
  const previousInvoice =
    selectedInvoiceIndex > 0
      ? orderedInvoices[selectedInvoiceIndex - 1]
      : selectedInvoiceIndex === -1
        ? [...orderedInvoices]
            .reverse()
            .find(
              (invoice) =>
                invoice.reference_month.slice(0, 7) <
                selectedReference?.slice(0, 7),
            )
        : undefined;
  const nextInvoice =
    selectedInvoiceIndex >= 0 &&
    selectedInvoiceIndex < orderedInvoices.length - 1
      ? orderedInvoices[selectedInvoiceIndex + 1]
      : selectedInvoiceIndex === -1
        ? orderedInvoices.find(
            (invoice) =>
              invoice.reference_month.slice(0, 7) >
              selectedReference?.slice(0, 7),
          )
        : undefined;
  const availableReferences = useMemo(
    () =>
      new Set(
        cardInvoices.map((invoice) => invoice.reference_month.slice(0, 7)),
      ),
    [cardInvoices],
  );
  const selectedEntries = entries.filter(
    (entry) => entry.invoice_id === selectedInvoice?.id,
  );
  const selectedPayments = transactions.filter(
    (transaction) =>
      transaction.credit_card_invoice_id === selectedInvoice?.id &&
      transaction.type === "expense" &&
      transaction.category_id === null,
  );
  const allInvoiceItems = [
    ...selectedEntries.map((entry) => ({
      ...entry,
      isPayment: false as const,
      sortDate: entry.purchase_date,
    })),
    ...selectedPayments.map((payment) => ({
      ...payment,
      isPayment: true as const,
      sortDate: payment.date,
    })),
  ].sort(
    (a, b) =>
      new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime(),
  );
  const selectedInvoiceTotal = selectedEntries.reduce(
    (total, entry) => total + Number(entry.amount),
    0,
  );
  const cardDataLoading =
    invoicesLoading ||
    entriesLoading ||
    (invoicesFetching && invoices.length === 0) ||
    (entriesFetching && entries.length === 0);
  const cardDataError = invoicesError ?? entriesError;
  const openUsed = selectedCard
    ? invoices
        .filter((invoice) => invoice.card_id === selectedCard.id)
        .reduce((total, invoice) => {
          const invoiceBalance = Math.max(
            Number(invoice.total_amount) - Number(invoice.paid_amount ?? 0),
            0,
          );
          return total + invoiceBalance;
        }, 0)
    : 0;
  const available = Math.max(
    Number(selectedCard?.credit_limit ?? 0) - openUsed,
    0,
  );
  const confirmDelete = (deleteAllInstallments: boolean) => {
    if (!pendingDelete) return;
    deletePurchase.mutate(
      {
        entryId: pendingDelete.id,
        deleteAllInstallments,
      },
      { onSuccess: () => setPendingDelete(null) },
    );
  };

  return (
    <AppShell title="Cartões">
      <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10">
        <AlertDialog
          open={Boolean(pendingDelete)}
          onOpenChange={(open) => {
            if (!open && !deletePurchase.isPending) setPendingDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir lançamento</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDelete && pendingDelete.installment_total > 1
                  ? `Esta compra possui ${pendingDelete.installment_total} parcelas. Deseja excluir somente esta parcela ou todas as parcelas desta compra?`
                  : "Deseja excluir este lançamento da fatura?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletePurchase.isPending}>
                Cancelar
              </AlertDialogCancel>
              {pendingDelete && pendingDelete.installment_total > 1 ? (
                <>
                  <AlertDialogAction
                    disabled={deletePurchase.isPending}
                    onClick={() => confirmDelete(false)}
                  >
                    Somente esta parcela
                  </AlertDialogAction>
                  <AlertDialogAction
                    disabled={deletePurchase.isPending}
                    onClick={() => confirmDelete(true)}
                  >
                    Todas as parcelas
                  </AlertDialogAction>
                </>
              ) : (
                <AlertDialogAction
                  disabled={deletePurchase.isPending}
                  onClick={() => confirmDelete(false)}
                >
                  Excluir
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">
              Centro de cartões
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Cartões de crédito
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Acompanhe compras, faturas e pagamentos sem reduzir o saldo da
              conta antes da quitação.
            </p>
          </div>
          <CreditCardDialog
            accounts={accounts.filter((account) => account.is_active)}
          />
        </div>
        {cards.length === 0 ? (
          <Card className="surface-card">
            <CardContent className="flex min-h-56 flex-col items-center justify-center text-center">
              <CreditCardIcon className="mb-3 size-8 text-primary" />
              <h3 className="font-semibold">Nenhum cartão cadastrado.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Vincule um cartão a uma conta para começar a acompanhar suas
                faturas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="space-y-3">
              {cards.map((card) => {
                const account = accounts.find(
                  (item) => item.id === card.account_id,
                );
                const visual = cardVisual(
                  account?.institution_code,
                  account?.institution_name ??
                    account?.institution ??
                    account?.name,
                );
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setSelectedCardId(card.id);
                      setSelectedReference(currentReferenceMonth());
                      setInvoiceListOpen(false);
                      setCalendarOpen(false);
                    }}
                    className={`group relative aspect-[1.586] w-full overflow-hidden rounded-2xl border p-5 text-left text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:shadow-xl ${visual.background} ${selectedCard?.id === card.id ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background" : "border-white/20 opacity-90 hover:opacity-100"}`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,white/20,transparent_38%)]" />
                    <div className="relative flex h-full flex-col justify-between">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex size-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
                            <CreditCardIcon className="size-5" />
                          </span>
                          <span className="truncate text-xs font-medium text-white/80">
                            {visual.mark}
                          </span>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/90">
                          {card.card_brand}
                        </span>
                      </div>
                      <div>
                        <p className="truncate text-base font-semibold tracking-wide">
                          {card.name}
                        </p>
                        <div className="mt-3 flex items-end justify-between gap-3">
                          <span className="text-[10px] uppercase tracking-[0.16em] text-white/65">
                            {card.active ? "Ativo" : "Inativo"}
                          </span>
                          <span className="text-xs text-white/75">
                            {account?.name ?? "Conta removida"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedCard && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedCard.card_brand}
                    </p>
                    <h3 className="text-2xl font-semibold">
                      {selectedCard.name}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <CreditCardPurchaseDialog
                      card={selectedCard}
                      invoices={invoices}
                      usedAmount={openUsed}
                      onPurchaseCreated={(referenceMonth) => {
                        setSelectedReference(referenceMonth);
                        setInvoiceListOpen(false);
                        setCalendarOpen(false);
                      }}
                    />
                    <CreditCardDialog
                      accounts={accounts}
                      card={selectedCard}
                      trigger={
                        <Button variant="outline">
                          <Pencil /> Editar
                        </Button>
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Metric
                    title="Limite"
                    value={formatCurrency(Number(selectedCard.credit_limit))}
                    icon={CreditCardIcon}
                  />
                  <Metric
                    title="Utilizado"
                    value={formatCurrency(openUsed)}
                    icon={Receipt}
                  />
                  <Metric
                    title="Disponível"
                    value={formatCurrency(available)}
                    icon={Wallet}
                  />
                </div>
                <Card className="surface-card">
                  {cardDataLoading ? (
                    <CardContent className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
                      Carregando faturas e lançamentos...
                    </CardContent>
                  ) : cardDataError ? (
                    <CardContent className="flex min-h-56 items-center justify-center text-center text-sm text-negative">
                      Não foi possível carregar as faturas:{" "}
                      {cardDataError.message}
                    </CardContent>
                  ) : selectedInvoice ? (
                    <>
                      <CardHeader className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <CardTitle>
                            Fatura de{" "}
                            {formatMonthLong(
                              selectedInvoice.reference_month.slice(0, 7),
                            )}
                          </CardTitle>
                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                            <span>
                              Fecha em{" "}
                              <strong className="font-medium text-foreground">
                                {formatDate(selectedInvoice.closing_date)}
                              </strong>
                            </span>
                            <span>
                              Vencimento{" "}
                              <strong className="font-medium text-foreground">
                                {formatDate(selectedInvoice.due_date)}
                              </strong>
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 self-start">
                          <Badge
                            variant={
                              Number(selectedInvoice.paid_amount ?? 0) >=
                              selectedInvoiceTotal
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {Number(selectedInvoice.paid_amount ?? 0) >=
                            selectedInvoiceTotal
                              ? "Paga"
                              : Number(selectedInvoice.paid_amount ?? 0) > 0
                                ? "Parcialmente paga"
                                : isInvoiceClosed(selectedInvoice.closing_date)
                                  ? "Fechada - Não paga"
                                  : "Aberta"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex flex-col gap-2 border-b border-border pb-5">
                          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                            Valor da fatura
                          </p>
                          <p className="num text-4xl font-semibold tracking-tight">
                            {formatCurrency(selectedInvoiceTotal)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={!previousInvoice}
                            title="Fatura anterior"
                            aria-label="Fatura anterior"
                            onClick={() =>
                              previousInvoice &&
                              setSelectedReference(
                                previousInvoice.reference_month,
                              )
                            }
                          >
                            <ChevronLeft />
                          </Button>
                          <Popover
                            open={invoiceListOpen}
                            onOpenChange={setInvoiceListOpen}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                className="min-w-0 flex-1 px-3 text-base font-semibold"
                                aria-label="Selecionar fatura"
                              >
                                <span className="truncate">
                                  {formatMonthLong(
                                    selectedInvoice.reference_month.slice(0, 7),
                                  )}
                                </span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="center" className="w-64 p-2">
                              <div className="space-y-1">
                                {orderedInvoices.map((invoice) => {
                                  const isSelected =
                                    invoice.id === selectedInvoice.id;
                                  return (
                                    <Button
                                      key={invoice.id}
                                      type="button"
                                      variant={
                                        isSelected ? "secondary" : "ghost"
                                      }
                                      className="w-full justify-between px-3"
                                      aria-current={
                                        isSelected ? "true" : undefined
                                      }
                                      onClick={() => {
                                        setSelectedReference(
                                          invoice.reference_month,
                                        );
                                        setInvoiceListOpen(false);
                                      }}
                                    >
                                      <span>
                                        {formatMonthLong(
                                          invoice.reference_month.slice(0, 7),
                                        )}
                                      </span>
                                      {isSelected && <Check />}
                                    </Button>
                                  );
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={!nextInvoice}
                            title="Próxima fatura"
                            aria-label="Próxima fatura"
                            onClick={() =>
                              nextInvoice &&
                              setSelectedReference(nextInvoice.reference_month)
                            }
                          >
                            <ChevronRight />
                          </Button>
                          <Popover
                            open={calendarOpen}
                            onOpenChange={setCalendarOpen}
                            modal
                          >
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="ml-auto"
                                title="Selecionar mês da fatura"
                                aria-label="Selecionar mês da fatura"
                                onClick={() =>
                                  setCalendarYear(
                                    Number(
                                      selectedInvoice.reference_month.slice(
                                        0,
                                        4,
                                      ),
                                    ),
                                  )
                                }
                              >
                                <CalendarDays />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-80">
                              <div className="flex items-center justify-between">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  title="Ano anterior"
                                  aria-label="Ano anterior"
                                  onClick={() =>
                                    setCalendarYear((year) => year - 1)
                                  }
                                >
                                  <ChevronLeft />
                                </Button>
                                <p className="font-semibold">{calendarYear}</p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  title="Próximo ano"
                                  aria-label="Próximo ano"
                                  onClick={() =>
                                    setCalendarYear((year) => year + 1)
                                  }
                                >
                                  <ChevronRight />
                                </Button>
                              </div>
                              <div className="mt-3 grid grid-cols-3 gap-2">
                                {Array.from({ length: 12 }, (_, monthIndex) => {
                                  const reference = `${calendarYear}-${String(monthIndex + 1).padStart(2, "0")}`;
                                  const isAvailable =
                                    availableReferences.has(reference);
                                  const isSelected =
                                    selectedInvoice.reference_month.slice(
                                      0,
                                      7,
                                    ) === reference;
                                  return (
                                    <Button
                                      key={reference}
                                      type="button"
                                      variant={
                                        isSelected ? "default" : "outline"
                                      }
                                      disabled={!isAvailable}
                                      className="h-auto min-h-10 px-2 py-2 text-xs"
                                      onClick={() => {
                                        setSelectedReference(`${reference}-01`);
                                        setCalendarOpen(false);
                                      }}
                                    >
                                      {
                                        formatMonthLong(reference).split(
                                          " de ",
                                        )[0]
                                      }
                                    </Button>
                                  );
                                })}
                              </div>
                              <p className="mt-3 text-center text-xs text-muted-foreground">
                                Apenas meses com fatura disponível podem ser
                                selecionados.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold">
                              Lançamentos
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {allInvoiceItems.length}{" "}
                              {allInvoiceItems.length === 1 ? "item" : "itens"}
                            </span>
                          </div>
                          <div className="divide-y rounded-lg border border-border">
                            {allInvoiceItems.length === 0 ? (
                              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                                Nenhum lançamento nesta fatura.
                              </p>
                            ) : (
                              allInvoiceItems.map((item) => (
                                <div
                                  key={item.id}
                                  className={`flex items-center justify-between gap-4 px-4 py-3.5 text-sm ${
                                    item.isPayment
                                      ? "bg-secondary/30"
                                      : ""
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <p
                                      className={`truncate ${
                                        item.isPayment
                                          ? "text-green-700 dark:text-green-400"
                                          : ""
                                      } font-medium`}
                                    >
                                      {item.description}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {formatDate(item.sortDate)}
                                      {!item.isPayment &&
                                      (item as CreditCardTransaction)
                                        .installment_total > 1
                                        ? ` · ${
                                            (
                                              item as CreditCardTransaction
                                            ).installment_number
                                          }/${
                                            (
                                              item as CreditCardTransaction
                                            ).installment_total
                                          }`
                                        : ""}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-3">
                                    <span
                                      className={`num text-base font-semibold ${
                                        item.isPayment
                                          ? "text-green-700 dark:text-green-400"
                                          : ""
                                      }`}
                                    >
                                      {item.isPayment
                                        ? "-"
                                        : ""}
                                      {formatCurrency(Number(item.amount))}
                                    </span>
                                    {!item.isPayment && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        title={
                                          selectedInvoice?.is_closed
                                            ? "Não é possível excluir lançamentos de uma fatura fechada"
                                            : "Excluir lançamento"
                                        }
                                        aria-label={`Excluir ${item.description}`}
                                        disabled={selectedInvoice?.is_closed}
                                        onClick={() =>
                                          setPendingDelete(
                                            item as CreditCardTransaction,
                                          )
                                        }
                                      >
                                        <Trash2 />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="border-t border-border pt-5">
                          <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Total da fatura
                              </p>
                              <p className="num mt-1 text-2xl font-semibold">
                                {formatCurrency(selectedInvoiceTotal)}
                              </p>
                              <div className="mt-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Pago:
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(
                                      Number(selectedInvoice.paid_amount ?? 0),
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Restante:
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(
                                      Math.max(
                                        selectedInvoiceTotal -
                                          Number(
                                            selectedInvoice.paid_amount ?? 0,
                                          ),
                                        0,
                                      ),
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between border-t border-border pt-2">
                                  <span className="text-muted-foreground">
                                    Ciclo:
                                  </span>
                                  <span className="font-medium">
                                    {isInvoiceClosed(
                                      selectedInvoice.closing_date,
                                    )
                                      ? "Fechada"
                                      : "Aberta"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Pagamento:
                                  </span>
                                  <span className="font-medium">
                                    {Number(selectedInvoice.paid_amount ?? 0) >=
                                    selectedInvoiceTotal
                                      ? "Paga"
                                      : Number(
                                            selectedInvoice.paid_amount ?? 0,
                                          ) > 0
                                        ? "Parcialmente paga"
                                        : "Não paga"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <InvoicePayment
                              card={selectedCard}
                              invoice={selectedInvoice}
                              total={selectedInvoiceTotal}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </>
                  ) : cardInvoices.length > 0 ? (
                    <CardContent className="space-y-6">
                      <InvoiceNavigation
                        selectedReference={
                          selectedReference ?? currentReferenceMonth()
                        }
                        orderedInvoices={orderedInvoices}
                        previousInvoice={previousInvoice}
                        nextInvoice={nextInvoice}
                        availableReferences={availableReferences}
                        invoiceListOpen={invoiceListOpen}
                        calendarOpen={calendarOpen}
                        calendarYear={calendarYear}
                        onSelectReference={setSelectedReference}
                        onInvoiceListOpenChange={setInvoiceListOpen}
                        onCalendarOpenChange={setCalendarOpen}
                        onCalendarYearChange={setCalendarYear}
                      />
                      <div className="flex min-h-40 flex-col items-center justify-center text-center">
                        <Receipt className="mb-3 size-8 text-primary" />
                        <h3 className="font-semibold">
                          Nenhuma fatura disponível para{" "}
                          {formatMonthLong(
                            (
                              selectedReference ?? currentReferenceMonth()
                            ).slice(0, 7),
                          )}
                        </h3>
                        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                          Você possui {cardInvoices.length} fatura(s) em outros
                          períodos. Use a navegação para acessá-las.
                        </p>
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="flex min-h-56 flex-col items-center justify-center text-center">
                      <Receipt className="mb-3 size-8 text-primary" />
                      <h3 className="font-semibold">
                        Nenhuma fatura disponível
                      </h3>
                      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        Este cartão ainda não possui lançamentos. Adicione a
                        primeira compra para criar sua fatura.
                      </p>
                    </CardContent>
                  )}
                </Card>
                <p className="text-xs text-muted-foreground">
                  Conta de pagamento:{" "}
                  {accounts.find(
                    (account) => account.id === selectedCard.account_id,
                  )?.name ?? "não encontrada"}
                  . Compras do cartão não entram no saldo da conta até o
                  pagamento da fatura.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}

function Metric({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof Wallet;
}) {
  return (
    <Card className="surface-card">
      <CardContent className="p-5">
        <Icon className="size-5 text-primary" />
        <p className="mt-4 text-xs uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </p>
        <p className="num mt-1 text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
