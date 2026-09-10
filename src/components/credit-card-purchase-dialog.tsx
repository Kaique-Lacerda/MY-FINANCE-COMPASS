import { useState, type FormEvent, type ReactNode } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategories, useSaveRow } from "@/hooks/useFinance";
import type { CreditCard, CreditCardInvoice } from "@/lib/domain";
import { addMonthsDate, isInvoiceClosed } from "@/lib/finance";
import { formatCurrency, parseISODate, toISODate } from "@/lib/format";

type CreditCardPurchaseDialogProps = {
  card: CreditCard;
  invoices: CreditCardInvoice[];
  usedAmount: number;
  onPurchaseCreated?: (referenceMonth: string) => void;
  trigger?: ReactNode;
};

function dateWithDay(base: Date, day: number) {
  const lastDay = new Date(
    base.getFullYear(),
    base.getMonth() + 1,
    0,
  ).getDate();
  return toISODate(
    new Date(base.getFullYear(), base.getMonth(), Math.min(day, lastDay)),
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function getCardInvoiceDates(card: CreditCard, purchaseDate: string) {
  const purchase = new Date(`${purchaseDate}T12:00:00`);
  const reference =
    purchase.getDate() > card.closing_day
      ? addMonthsDate(
          new Date(purchase.getFullYear(), purchase.getMonth(), 1),
          1,
        )
      : new Date(purchase.getFullYear(), purchase.getMonth(), 1);
  const closingDate = dateWithDay(reference, card.closing_day);
  const dueBase =
    card.due_day <= card.closing_day ? addMonthsDate(reference, 1) : reference;
  return {
    referenceMonth: `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, "0")}-01`,
    closingDate,
    dueDate: dateWithDay(dueBase, card.due_day),
  };
}

function calculateInstallmentAmounts(
  inputAmount: number,
  installmentTotal: number,
  mode: "total" | "installment",
) {
  const inputCents = Math.round(inputAmount * 100);
  if (mode === "installment") {
    return Array.from({ length: installmentTotal }, () => inputCents);
  }
  const baseCents = Math.floor(inputCents / installmentTotal);
  const remainder = inputCents % installmentTotal;
  return Array.from(
    { length: installmentTotal },
    (_, index) => baseCents + (index >= installmentTotal - remainder ? 1 : 0),
  );
}

export function CreditCardPurchaseDialog({
  card,
  invoices,
  usedAmount,
  onPurchaseCreated,
  trigger,
}: CreditCardPurchaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(toISODate(new Date()));
  const [amount, setAmount] = useState("");
  const [amountMode, setAmountMode] = useState<"total" | "installment">(
    "total",
  );
  const [categoryId, setCategoryId] = useState("");
  const [installmentTotal, setInstallmentTotal] = useState("1");
  const [error, setError] = useState("");
  const { data: categories = [] } = useCategories();
  const saveInvoice = useSaveRow("credit_card_invoices", {
    created: "Fatura criada",
    updated: "Fatura atualizada",
  });
  const savePurchase = useSaveRow("credit_card_transactions", {
    created: "Compra adicionada",
    updated: "Compra atualizada",
  });

  const reset = () => {
    setDescription("");
    setPurchaseDate(toISODate(new Date()));
    setAmount("");
    setAmountMode("total");
    setCategoryId("");
    setInstallmentTotal("1");
    setError("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const installmentCount = Math.max(Number(installmentTotal) || 1, 1);
    const inputAmount = Number(amount);
    if (
      !description.trim() ||
      !purchaseDate ||
      !inputAmount ||
      inputAmount <= 0 ||
      installmentCount > 60
    )
      return;

    const inputCents = Math.round(inputAmount * 100);
    const committedCents =
      amountMode === "total" ? inputCents : inputCents * installmentCount;
    const availableCents = Math.round(
      (Number(card.credit_limit) - usedAmount) * 100,
    );
    if (committedCents > availableCents) {
      setError(
        `Limite insuficiente. Você possui ${formatCurrency(availableCents / 100)} disponíveis, mas essa compra comprometeria ${formatCurrency(committedCents / 100)}.`,
      );
      return;
    }

    const installmentAmounts = calculateInstallmentAmounts(
      inputAmount,
      installmentCount,
      amountMode,
    );
    const invoiceByReference = new Map(
      invoices
        .filter((invoice) => invoice.card_id === card.id)
        .map((invoice) => [invoice.reference_month, invoice]),
    );
    let firstReferenceMonth: string | null = null;

    try {
      for (const [index, amountCents] of installmentAmounts.entries()) {
        const occurrenceDate = toISODate(
          addMonthsDate(parseISODate(purchaseDate), index),
        );
        const dates = getCardInvoiceDates(card, occurrenceDate);
        firstReferenceMonth ??= dates.referenceMonth;
        let invoice = invoiceByReference.get(dates.referenceMonth);
        if (!invoice) {
          invoice = (await saveInvoice.mutateAsync({
            values: {
              card_id: card.id,
              reference_month: dates.referenceMonth,
              closing_date: dates.closingDate,
              due_date: dates.dueDate,
              status: "open",
              total_amount: 0,
              paid_transaction_id: null,
              is_closed: false,
              paid_amount: 0,
            },
          })) as CreditCardInvoice;
          invoiceByReference.set(dates.referenceMonth, invoice);
        } else if (isInvoiceClosed(dates.closingDate)) {
          throw new Error(
            `A fatura de ${dates.referenceMonth.slice(0, 7)} está fechada e não pode receber novas compras. A compra será automaticamente alocada para a próxima fatura disponível.`,
          );
        }
        await savePurchase.mutateAsync({
          values: {
            card_id: card.id,
            invoice_id: invoice.id,
            description: description.trim(),
            purchase_date: occurrenceDate,
            amount: amountCents / 100,
            category_id: categoryId || null,
            installment_number: index + 1,
            installment_total: installmentCount,
          },
        });
      }
      if (firstReferenceMonth) {
        onPurchaseCreated?.(firstReferenceMonth);
      }
      reset();
      setOpen(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar a compra e a fatura.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus /> Compra
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Nova compra no cartão</DialogTitle>
          <DialogDescription>
            A compra entra na fatura definida pelo dia de fechamento e não reduz
            o saldo da conta.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p
            role="alert"
            className="rounded-md border border-negative/30 bg-negative-soft px-3 py-2 text-sm text-negative"
          >
            {error}
          </p>
        )}
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="card-purchase-description">Descrição</Label>
              <Input
                id="card-purchase-description"
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ex.: Mercado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-purchase-date">Data da compra</Label>
              <Input
                id="card-purchase-date"
                required
                type="date"
                value={purchaseDate}
                onChange={(event) => setPurchaseDate(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Valor informado</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={amountMode === "total" ? "default" : "outline"}
                  onClick={() => setAmountMode("total")}
                  className="flex-1"
                >
                  Total
                </Button>
                <Button
                  type="button"
                  variant={amountMode === "installment" ? "default" : "outline"}
                  onClick={() => setAmountMode("installment")}
                  className="flex-1"
                >
                  Parcela
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-purchase-amount">
                {amountMode === "total" ? "Valor total" : "Valor da parcela"}
              </Label>
              <Input
                id="card-purchase-amount"
                required
                min="0.01"
                step="0.01"
                type="number"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError("");
                }}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="">Sem categoria</option>
                {categories
                  .filter((category) => category.kind === "expense")
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-purchase-installments">Parcelas</Label>
              <Input
                id="card-purchase-installments"
                min="1"
                max="60"
                type="number"
                value={installmentTotal}
                onChange={(event) => setInstallmentTotal(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>
                {amountMode === "total" ? "Valor da parcela" : "Valor total"}
              </Label>
              <Input
                readOnly
                value={
                  amount && Number(amount) > 0
                    ? formatCurrency(
                        amountMode === "total"
                          ? calculateInstallmentAmounts(
                              Number(amount),
                              Math.max(Number(installmentTotal) || 1, 1),
                              amountMode,
                            )[0] / 100
                          : Number(amount) *
                              Math.max(Number(installmentTotal) || 1, 1),
                      )
                    : ""
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={saveInvoice.isPending || savePurchase.isPending}
            >
              Salvar compra
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
