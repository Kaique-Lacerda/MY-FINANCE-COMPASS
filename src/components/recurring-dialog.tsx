import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories, useSaveRow } from "@/hooks/useFinance";
import { FREQUENCIES, type Account, type Recurring } from "@/lib/domain";
import { toISODate } from "@/lib/format";

type RecurringType = "income" | "expense";

type RecurringDialogProps = {
  recurring?: Recurring;
  accounts: Account[];
  trigger?: ReactNode;
};

/** Valor fixo recorrente (ex.: salário, aluguel): projeta receitas/despesas futuras sem lançar uma movimentação já realizada. */
export function RecurringDialog({
  recurring,
  accounts,
  trigger,
}: RecurringDialogProps) {
  const isEdit = Boolean(recurring);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<RecurringType>(
    recurring?.type === "income" ? "income" : "expense",
  );
  const [description, setDescription] = useState(recurring?.description ?? "");
  const [amount, setAmount] = useState(
    recurring ? String(recurring.amount) : "",
  );
  const [accountId, setAccountId] = useState(recurring?.account_id ?? "");
  const [categoryId, setCategoryId] = useState(recurring?.category_id ?? "");
  const [frequency, setFrequency] = useState(recurring?.frequency ?? "monthly");
  const [startDate, setStartDate] = useState(
    recurring?.start_date ?? toISODate(new Date()),
  );
  const [endDate, setEndDate] = useState(recurring?.end_date ?? "");
  const { data: categories = [] } = useCategories();
  const saveRecurring = useSaveRow("recurring_transactions", {
    created: "Valor fixo adicionado",
    updated: "Valor fixo atualizado",
  });

  const availableCategories = categories.filter(
    (category) => category.kind === type,
  );

  const resetFromRecurring = () => {
    setType(recurring?.type === "income" ? "income" : "expense");
    setDescription(recurring?.description ?? "");
    setAmount(recurring ? String(recurring.amount) : "");
    setAccountId(recurring?.account_id ?? "");
    setCategoryId(recurring?.category_id ?? "");
    setFrequency(recurring?.frequency ?? "monthly");
    setStartDate(recurring?.start_date ?? toISODate(new Date()));
    setEndDate(recurring?.end_date ?? "");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!description.trim() || !Number(amount) || !accountId || !startDate)
      return;
    saveRecurring.mutate(
      {
        id: recurring?.id ?? null,
        values: {
          type,
          description: description.trim(),
          amount: Number(amount),
          account_id: accountId,
          category_id: categoryId || null,
          frequency,
          start_date: startDate,
          end_date: endDate || null,
        },
      },
      {
        onSuccess: () => {
          resetFromRecurring();
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
        if (nextOpen) resetFromRecurring();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="h-11 rounded-lg px-4">
            <Plus /> Novo valor fixo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar valor fixo" : "Novo valor fixo"}
          </DialogTitle>
          <DialogDescription>
            Entradas e saídas fixas recorrentes (ex.: salário, aluguel,
            faculdade). Aparecem apenas na previsão financeira — não geram uma
            movimentação já realizada.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            {(
              [
                { value: "income", label: "Entrada", icon: ArrowUpRight },
                { value: "expense", label: "Saída", icon: ArrowDownLeft },
              ] as const
            ).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setType(item.value)}
                className={`flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition ${type === item.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <item.icon className="size-4" /> {item.label}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="recurring-description">Descrição</Label>
              <Input
                id="recurring-description"
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ex.: Salário"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring-amount">Valor</Label>
              <Input
                id="recurring-amount"
                required
                min="0.01"
                step="0.01"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conta</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                      {!account.is_active ? " (inativa)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring-start-date">Início</Label>
              <Input
                id="recurring-start-date"
                required
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring-end-date">Término (opcional)</Label>
              <Input
                id="recurring-end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={saveRecurring.isPending || accounts.length === 0}
            >
              {saveRecurring.isPending
                ? "Salvando..."
                : isEdit
                  ? "Salvar alterações"
                  : "Adicionar valor fixo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
