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
import type { Account, CreditCard } from "@/lib/domain";

type CreditCardDialogProps = {
  accounts: Account[];
  card?: CreditCard;
  trigger?: ReactNode;
};

const BRANDS = ["Visa", "Mastercard", "Elo", "American Express", "Outro"];

export function CreditCardDialog({
  accounts,
  card,
  trigger,
}: CreditCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(card?.name ?? "");
  const [accountId, setAccountId] = useState(card?.account_id ?? "");
  const [brand, setBrand] = useState(card?.card_brand ?? "Outro");
  const [limit, setLimit] = useState(String(card?.credit_limit ?? ""));
  const [closingDay, setClosingDay] = useState(String(card?.closing_day ?? 5));
  const [dueDay, setDueDay] = useState(String(card?.due_day ?? 10));
  const saveCard = useSaveRow("credit_cards", {
    created: "Cartão adicionado",
    updated: "Cartão atualizado",
  });

  const reset = () => {
    setName(card?.name ?? "");
    setAccountId(card?.account_id ?? "");
    setBrand(card?.card_brand ?? "Outro");
    setLimit(String(card?.credit_limit ?? ""));
    setClosingDay(String(card?.closing_day ?? 5));
    setDueDay(String(card?.due_day ?? 10));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !accountId) return;
    saveCard.mutate(
      {
        id: card?.id ?? null,
        values: {
          name: name.trim(),
          account_id: accountId,
          card_brand: brand,
          credit_limit: Number(limit) || 0,
          closing_day: Math.min(Math.max(Number(closingDay) || 1, 1), 31),
          due_day: Math.min(Math.max(Number(dueDay) || 1, 1), 31),
          active: card?.active ?? true,
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus /> Novo cartão
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>{card ? "Editar cartão" : "Novo cartão"}</DialogTitle>
          <DialogDescription>
            Vincule o limite de crédito a uma conta que fará o pagamento das
            faturas.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="card-name">Nome</Label>
              <Input
                id="card-name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Nubank Crédito"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Conta para pagamento</Label>
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
              <Label>Bandeira</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRANDS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-limit">Limite</Label>
              <Input
                id="card-limit"
                required
                min="0"
                step="0.01"
                type="number"
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-closing-day">Fechamento</Label>
              <Input
                id="card-closing-day"
                required
                min="1"
                max="31"
                type="number"
                value={closingDay}
                onChange={(event) => setClosingDay(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-due-day">Vencimento</Label>
              <Input
                id="card-due-day"
                required
                min="1"
                max="31"
                type="number"
                value={dueDay}
                onChange={(event) => setDueDay(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saveCard.isPending}>
              {saveCard.isPending ? "Salvando..." : "Salvar cartão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
