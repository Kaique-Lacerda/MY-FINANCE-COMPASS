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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSaveRow } from "@/hooks/useFinance";
import type { Category, CategoryBudget } from "@/lib/domain";

type BudgetDialogProps = {
  budget?: CategoryBudget;
  /** Categorias de despesa disponíveis para escolher (uma categoria só pode ter um limite). */
  categories: Category[];
  trigger?: ReactNode;
};

/** Limite mensal de gasto por categoria. Editar preserva a mesma linha (nunca duplica). */
export function BudgetDialog({
  budget,
  categories,
  trigger,
}: BudgetDialogProps) {
  const isEdit = Boolean(budget);
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(budget?.category_id ?? "");
  const [monthlyLimit, setMonthlyLimit] = useState(
    budget ? String(budget.monthly_limit) : "",
  );
  const [startMonth, setStartMonth] = useState(
    (budget?.start_month ?? new Date().toISOString().slice(0, 10)).slice(0, 7),
  );
  const saveBudget = useSaveRow("category_budgets", {
    created: "Limite criado",
    updated: "Limite atualizado",
  });

  const resetFromBudget = () => {
    setCategoryId(budget?.category_id ?? "");
    setMonthlyLimit(budget ? String(budget.monthly_limit) : "");
    setStartMonth(
      (budget?.start_month ?? new Date().toISOString().slice(0, 10)).slice(
        0,
        7,
      ),
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryId || !Number(monthlyLimit) || !startMonth) return;
    saveBudget.mutate(
      {
        id: budget?.id ?? null,
        values: {
          category_id: categoryId,
          monthly_limit: Number(monthlyLimit),
          start_month: `${startMonth}-01`,
        },
      },
      {
        onSuccess: () => {
          resetFromBudget();
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
        if (nextOpen) resetFromBudget();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="h-11 rounded-lg px-4">
            <Plus /> Novo limite
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar limite" : "Novo limite"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados do limite. O histórico de gastos não é afetado."
              : "Defina quanto pretende gastar por mês em uma categoria."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categories.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Todas as categorias de despesa já possuem um limite cadastrado.
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budget-monthly-limit">Limite mensal</Label>
              <Input
                id="budget-monthly-limit"
                required
                min="0.01"
                step="0.01"
                type="number"
                value={monthlyLimit}
                onChange={(event) => setMonthlyLimit(event.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-start-month">Vigente a partir de</Label>
              <Input
                id="budget-start-month"
                required
                type="month"
                value={startMonth}
                onChange={(event) => setStartMonth(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={saveBudget.isPending || categories.length === 0}
            >
              {saveBudget.isPending
                ? "Salvando..."
                : isEdit
                  ? "Salvar alterações"
                  : "Criar limite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
