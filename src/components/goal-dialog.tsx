import { useState, type FormEvent, type ReactNode } from "react";
import { Plus, Wallet } from "lucide-react";

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
import type { FinancialGoal } from "@/lib/domain";
import { formatCurrency } from "@/lib/format";

type GoalDialogProps = {
  goal?: FinancialGoal;
  trigger?: ReactNode;
};

/** Meta financeira (ex.: reserva de emergência). Editar não altera o progresso já acumulado. */
export function GoalDialog({ goal, trigger }: GoalDialogProps) {
  const isEdit = Boolean(goal);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(goal?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(
    goal ? String(goal.target_amount) : "",
  );
  const [currentAmount, setCurrentAmount] = useState(
    goal ? String(goal.current_amount) : "0",
  );
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? "");
  const saveGoal = useSaveRow("financial_goals", {
    created: "Meta criada",
    updated: "Meta atualizada",
  });

  const resetFromGoal = () => {
    setName(goal?.name ?? "");
    setTargetAmount(goal ? String(goal.target_amount) : "");
    setCurrentAmount(goal ? String(goal.current_amount) : "0");
    setTargetDate(goal?.target_date ?? "");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !Number(targetAmount)) return;
    saveGoal.mutate(
      {
        id: goal?.id ?? null,
        values: {
          name: name.trim(),
          target_amount: Number(targetAmount),
          target_date: targetDate || null,
          // Progresso só é definido na criação; editar nunca sobrescreve o valor atual.
          ...(isEdit ? {} : { current_amount: Number(currentAmount) || 0 }),
        },
      },
      {
        onSuccess: () => {
          resetFromGoal();
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) resetFromGoal();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="h-11 rounded-lg px-4">
            <Plus /> Nova meta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar meta" : "Nova meta"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados da meta. O progresso acumulado é preservado."
              : "Defina um objetivo financeiro para acompanhar."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="goal-name">Nome da meta</Label>
            <Input
              id="goal-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Reserva de emergência"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="goal-target-amount">Valor-alvo</Label>
              <Input
                id="goal-target-amount"
                required
                min="0.01"
                step="0.01"
                type="number"
                value={targetAmount}
                onChange={(event) => setTargetAmount(event.target.value)}
                placeholder="0,00"
              />
            </div>
            {!isEdit && (
              <div className="space-y-2">
                <Label htmlFor="goal-current-amount">Valor inicial</Label>
                <Input
                  id="goal-current-amount"
                  min="0"
                  step="0.01"
                  type="number"
                  value={currentAmount}
                  onChange={(event) => setCurrentAmount(event.target.value)}
                  placeholder="0,00"
                />
              </div>
            )}
            <div className={isEdit ? "sm:col-span-2 space-y-2" : "space-y-2"}>
              <Label htmlFor="goal-target-date">Prazo (opcional)</Label>
              <Input
                id="goal-target-date"
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saveGoal.isPending}>
              {saveGoal.isPending
                ? "Salvando..."
                : isEdit
                  ? "Salvar alterações"
                  : "Criar meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type AddGoalAmountDialogProps = {
  goal: FinancialGoal;
  trigger?: ReactNode;
};

/** Incrementa o progresso da meta sem gerar nenhuma movimentação financeira. */
export function AddGoalAmountDialog({
  goal,
  trigger,
}: AddGoalAmountDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const saveGoal = useSaveRow("financial_goals", {
    created: "Meta criada",
    updated: "Valor adicionado à meta",
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const delta = Number(amount);
    if (!delta) return;
    saveGoal.mutate(
      {
        id: goal.id,
        values: { current_amount: Number(goal.current_amount) + delta },
      },
      {
        onSuccess: () => {
          setAmount("");
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setAmount("");
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Wallet className="size-3.5" /> Adicionar valor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar valor à meta</DialogTitle>
          <DialogDescription>
            "{goal.name}" — progresso atual de{" "}
            {formatCurrency(goal.current_amount)}.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="goal-add-amount">Valor a adicionar</Label>
            <Input
              id="goal-add-amount"
              required
              autoFocus
              min="0.01"
              step="0.01"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0,00"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saveGoal.isPending}>
              {saveGoal.isPending ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
