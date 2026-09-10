import { useId, useState, type FormEvent, type ReactNode } from "react";
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
import { FREQUENCIES, type Account } from "@/lib/domain";
import { toISODate } from "@/lib/format";

type ObligationType = "income" | "expense";
type CommitmentMode = "single" | "fixed" | "installment";

type ObligationDialogProps = {
  accounts: Account[];
  trigger?: ReactNode;
};

export function ObligationDialog({ accounts, trigger }: ObligationDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CommitmentMode>("single");
  const [type, setType] = useState<ObligationType>("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [plannedDate, setPlannedDate] = useState(toISODate(new Date()));
  const [dueDate, setDueDate] = useState(toISODate(new Date()));
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [endDate, setEndDate] = useState("");
  const [installmentsCount, setInstallmentsCount] = useState("2");
  const fieldId = useId();
  const { data: categories = [] } = useCategories();
  const saveObligation = useSaveRow("obligations", {
    created: "Compromisso adicionado",
    updated: "Compromisso atualizado",
  });
  const saveRecurring = useSaveRow("recurring_transactions", {
    created: "Compromisso fixo adicionado",
    updated: "Compromisso fixo atualizado",
  });
  const saveInstallment = useSaveRow("installments", {
    created: "Compromisso parcelado adicionado",
    updated: "Compromisso parcelado atualizado",
  });

  const availableCategories = categories.filter(
    (category) => category.kind === type,
  );

  const reset = () => {
    setMode("single");
    setType("expense");
    setDescription("");
    setAmount("");
    setPlannedDate(toISODate(new Date()));
    setDueDate(toISODate(new Date()));
    setAccountId("");
    setCategoryId("");
    setFrequency("monthly");
    setEndDate("");
    setInstallmentsCount("2");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    const count = Number(installmentsCount);
    if (!description.trim() || numericAmount <= 0 || !plannedDate) return;
    const onSuccess = () => {
      reset();
      setOpen(false);
    };

    if (mode === "fixed") {
      saveRecurring.mutate(
        {
          values: {
            type,
            description: description.trim(),
            amount: numericAmount,
            account_id: accountId || null,
            category_id: categoryId || null,
            frequency,
            start_date: plannedDate,
            end_date: endDate || null,
          },
        },
        { onSuccess },
      );
      return;
    }
    if (mode === "installment") {
      if (!Number.isInteger(count) || count < 2) return;
      saveInstallment.mutate(
        {
          values: {
            description: description.trim(),
            total_amount: numericAmount,
            installment_amount: numericAmount / count,
            installments_count: count,
            first_due_date: plannedDate,
            account_id: accountId || null,
            category_id: categoryId || null,
            paid_count: 0,
            status: "active",
          },
        },
        { onSuccess },
      );
      return;
    }
    saveObligation.mutate(
      {
        values: {
          type,
          description: description.trim(),
          planned_amount: numericAmount,
          planned_date: plannedDate,
          due_date: dueDate || null,
          account_id: accountId || null,
          category_id: categoryId || null,
          status: "pending",
        },
      },
      { onSuccess },
    );
  };

  const isSaving =
    saveObligation.isPending ||
    saveRecurring.isPending ||
    saveInstallment.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="h-11 rounded-lg px-4">
            <Plus /> Novo compromisso
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Novo compromisso</DialogTitle>
          <DialogDescription>
            Cadastre algo que ainda vai acontecer. O registro real será criado
            separadamente quando você der baixa.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {(
              [
                { value: "single", label: "Único" },
                { value: "fixed", label: "Fixo" },
                { value: "installment", label: "Parcelado" },
              ] as const
            ).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setMode(item.value)}
                className={`h-10 rounded-md text-sm font-medium transition ${mode === item.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {mode !== "installment" && (
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
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`${fieldId}-description`}>Descrição</Label>
              <Input
                id={`${fieldId}-description`}
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ex.: Faculdade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-amount`}>Valor planejado</Label>
              <Input
                id={`${fieldId}-amount`}
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
              <Label htmlFor={`${fieldId}-planned-date`}>
                {mode === "fixed" ? "Primeira ocorrência" : "Primeira data"}
              </Label>
              <Input
                id={`${fieldId}-planned-date`}
                required
                type="date"
                value={plannedDate}
                onChange={(event) => setPlannedDate(event.target.value)}
              />
            </div>
            {mode === "single" && (
              <div className="space-y-2">
                <Label htmlFor={`${fieldId}-due-date`}>Vencimento</Label>
                <Input
                  id={`${fieldId}-due-date`}
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
            )}
            {mode === "fixed" && (
              <>
                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.filter((item) => item.value !== "once").map(
                        (item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${fieldId}-end-date`}>
                    Término (opcional)
                  </Label>
                  <Input
                    id={`${fieldId}-end-date`}
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </>
            )}
            {mode === "installment" && (
              <div className="space-y-2">
                <Label htmlFor={`${fieldId}-installments-count`}>
                  Quantidade de parcelas
                </Label>
                <Input
                  id={`${fieldId}-installments-count`}
                  required
                  min="2"
                  step="1"
                  type="number"
                  value={installmentsCount}
                  onChange={(event) => setInstallmentsCount(event.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Conta (opcional)</Label>
              <Select value={accountId} onValueChange={setAccountId}>
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
            <div className="space-y-2">
              <Label>Categoria (opcional)</Label>
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
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar compromisso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
