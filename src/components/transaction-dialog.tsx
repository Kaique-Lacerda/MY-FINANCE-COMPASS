import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Plus,
} from "lucide-react";

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
import {
  TRANSACTION_STATUS,
  TRANSACTION_TYPES,
  type Account,
  type TransactionType,
} from "@/lib/domain";
import { toISODate } from "@/lib/format";

type TransactionDialogProps = { accounts: Account[] };

export function TransactionDialog({ accounts }: TransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toISODate(new Date()));
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("done");
  const { data: categories = [] } = useCategories();
  const saveTransaction = useSaveRow("transactions", {
    created: "Movimentação adicionada",
    updated: "Movimentação atualizada",
  });

  const availableCategories = categories.filter(
    (category) => category.kind === (type === "income" ? "income" : "expense"),
  );
  const reset = () => {
    setDescription("");
    setAmount("");
    setDate(toISODate(new Date()));
    setAccountId("");
    setToAccountId("");
    setCategoryId("");
    setStatus("done");
    setType("expense");
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !description ||
      !Number(amount) ||
      !date ||
      !accountId ||
      (type === "transfer" && !toAccountId)
    )
      return;
    saveTransaction.mutate(
      {
        values: {
          type,
          description,
          amount: Number(amount),
          planned_amount: Number(amount),
          real_amount: Number(amount),
          date,
          planned_date: date,
          due_date: null,
          account_id: accountId,
          to_account_id: type === "transfer" ? toAccountId : null,
          category_id: type === "transfer" ? null : categoryId || null,
          status: type === "transfer" ? "done" : status,
          interest_amount: 0,
          fine_amount: 0,
          discount_amount: 0,
        },
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-lg px-4 shadow-[0_8px_20px_-10px_var(--color-primary)]">
          <Plus /> Nova movimentação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Nova movimentação</DialogTitle>
          <DialogDescription>
            Registre um lançamento. Transferências não alteram receitas ou
            despesas.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-1">
            {TRANSACTION_TYPES.map((item) => {
              const Icon =
                item.value === "income"
                  ? ArrowUpRight
                  : item.value === "expense"
                    ? ArrowDownLeft
                    : ArrowLeftRight;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setType(item.value)}
                  className={`flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition ${type === item.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Icon className="size-4" /> {item.label}
                </button>
              );
            })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ex.: Mercado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
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
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                required
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Conta {type === "transfer" ? "de origem" : "principal"}
              </Label>
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
            {type === "transfer" ? (
              <div className="space-y-2">
                <Label>Conta de destino</Label>
                <Select value={toAccountId} onValueChange={setToAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((account) => account.id !== accountId)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
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
            )}
            {type !== "transfer" && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_STATUS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={saveTransaction.isPending || accounts.length === 0}
            >
              {saveTransaction.isPending
                ? "Salvando..."
                : "Adicionar movimentação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
