import { useState, type ReactNode } from "react";

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
import { useSaveRow } from "@/hooks/useFinance";
import type { Account, Obligation } from "@/lib/domain";
import type { Occurrence } from "@/lib/finance";
import { formatCurrency, formatDate, toISODate } from "@/lib/format";

type ObligationSettlementDialogProps = {
  obligation?: Obligation;
  occurrence?: Occurrence;
  account?: Account;
  trigger?: ReactNode;
};

export function ObligationSettlementDialog({
  obligation,
  occurrence,
  account,
  trigger,
}: ObligationSettlementDialogProps) {
  const source =
    occurrence ??
    (obligation
      ? {
          sourceId: obligation.id,
          sourceType: "obligation" as const,
          description: obligation.description,
          type: obligation.type,
          amount: Number(obligation.planned_amount),
          date: obligation.due_date ?? obligation.planned_date,
          accountId: obligation.account_id,
          categoryId: obligation.category_id,
        }
      : null);
  const [open, setOpen] = useState(false);
  const [realDate, setRealDate] = useState(toISODate(new Date()));
  const [realAmount, setRealAmount] = useState("");
  const [interestAmount, setInterestAmount] = useState("");
  const [fineAmount, setFineAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const saveTransaction = useSaveRow("transactions", {
    created: "Movimentação realizada",
    updated: "Movimentação atualizada",
  });
  const saveObligation = useSaveRow("obligations", {
    created: "Obrigação criada",
    updated: "Obrigação realizada",
  });

  if (!source) return null;

  const reset = () => {
    setRealDate(toISODate(new Date()));
    setRealAmount("");
    setInterestAmount("");
    setFineAmount("");
    setDiscountAmount("");
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(realAmount);
    if (!realDate || !amount || amount <= 0) return;

    saveTransaction.mutate(
      {
        values: {
          type: source.type,
          description: source.description,
          amount,
          planned_amount: obligation?.planned_amount ?? source.amount,
          real_amount: amount,
          date: realDate,
          planned_date: obligation?.planned_date ?? source.date,
          due_date: obligation?.due_date ?? source.date,
          account_id: obligation?.account_id ?? source.accountId ?? null,
          to_account_id: null,
          category_id: obligation?.category_id ?? source.categoryId ?? null,
          obligation_id:
            source.sourceType === "obligation" ? source.sourceId : null,
          recurring_id:
            source.sourceType === "recurring" ? source.sourceId : null,
          installment_id:
            source.sourceType === "installment" ? source.sourceId : null,
          debt_id: source.sourceType === "debt" ? source.sourceId : null,
          status: "done",
          interest_amount: Number(interestAmount) || 0,
          fine_amount: Number(fineAmount) || 0,
          discount_amount: Number(discountAmount) || 0,
        },
      },
      {
        onSuccess: () => {
          const finish = () => {
            reset();
            setOpen(false);
          };
          if (obligation) {
            saveObligation.mutate(
              { id: obligation.id, values: { status: "done" } },
              { onSuccess: finish },
            );
          } else finish();
        },
      },
    );
  };

  const isSaving = saveTransaction.isPending || saveObligation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            Dar baixa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Dar baixa em {source.description}</DialogTitle>
          <DialogDescription>
            Registre os dados reais. A obrigação manterá o valor previsto e o
            vencimento original.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-3 rounded-lg bg-muted/50 p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Valor previsto</p>
              <p className="font-medium">
                {formatCurrency(
                  Number(obligation?.planned_amount ?? source.amount),
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Data prevista/vencimento</p>
              <p className="font-medium">
                {formatDate(obligation?.due_date ?? source.date)}
              </p>
            </div>
            {account && (
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Conta</p>
                <p className="font-medium">{account.name}</p>
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`settlement-date-${source.sourceId}`}>
                Data real
              </Label>
              <Input
                id={`settlement-date-${source.sourceId}`}
                required
                type="date"
                value={realDate}
                onChange={(event) => setRealDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`settlement-amount-${source.sourceId}`}>
                Valor real
              </Label>
              <Input
                id={`settlement-amount-${source.sourceId}`}
                required
                min="0.01"
                step="0.01"
                type="number"
                value={realAmount}
                onChange={(event) => setRealAmount(event.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`settlement-interest-${source.sourceId}`}>
                Juros
              </Label>
              <Input
                id={`settlement-interest-${source.sourceId}`}
                min="0"
                step="0.01"
                type="number"
                value={interestAmount}
                onChange={(event) => setInterestAmount(event.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`settlement-fine-${source.sourceId}`}>
                Multa
              </Label>
              <Input
                id={`settlement-fine-${source.sourceId}`}
                min="0"
                step="0.01"
                type="number"
                value={fineAmount}
                onChange={(event) => setFineAmount(event.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`settlement-discount-${source.sourceId}`}>
                Desconto
              </Label>
              <Input
                id={`settlement-discount-${source.sourceId}`}
                min="0"
                step="0.01"
                type="number"
                value={discountAmount}
                onChange={(event) => setDiscountAmount(event.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Valor real: {realAmount ? formatCurrency(Number(realAmount)) : "—"}
            {realDate ? ` · Data real: ${formatDate(realDate)}` : ""}
          </p>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Confirmar baixa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
