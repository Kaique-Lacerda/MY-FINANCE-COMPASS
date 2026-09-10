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
import {
  ACCOUNT_TYPES,
  FINANCIAL_INSTITUTIONS,
  type Account,
  type InstitutionCode,
} from "@/lib/domain";
import { toISODate } from "@/lib/format";

type AccountDialogProps = {
  account?: Account;
  trigger?: ReactNode;
};

function institutionLabel(code: InstitutionCode) {
  return (
    FINANCIAL_INSTITUTIONS.find(
      (institution) => institution.value === code,
    )?.label.toUpperCase() ?? ""
  );
}

function accountInstitutionCode(account?: Account): InstitutionCode {
  const code = account?.institution_code as InstitutionCode | undefined;
  return FINANCIAL_INSTITUTIONS.some(
    (institution) => institution.value === code,
  )
    ? code!
    : "other";
}

function accountInstitutionName(account?: Account) {
  const code = accountInstitutionCode(account);
  return code === "other"
    ? (account?.institution_name ?? account?.institution ?? account?.name ?? "")
    : institutionLabel(code);
}

export function AccountDialog({ account, trigger }: AccountDialogProps) {
  const isEdit = Boolean(account);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(accountInstitutionName(account));
  const [type, setType] = useState(account?.type ?? "checking");
  const [institutionCode, setInstitutionCode] = useState<InstitutionCode>(
    accountInstitutionCode(account),
  );
  const [initialBalance, setInitialBalance] = useState(
    String(account?.initial_balance ?? 0),
  );
  const saveAccount = useSaveRow("accounts", {
    created: "Conta adicionada",
    updated: "Conta atualizada",
  });

  const resetFromAccount = () => {
    setName(accountInstitutionName(account));
    setType(account?.type ?? "checking");
    setInstitutionCode(accountInstitutionCode(account));
    setInitialBalance(String(account?.initial_balance ?? 0));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    const resolvedInstitutionName =
      institutionCode === "other"
        ? name.trim()
        : institutionLabel(institutionCode);
    if (!resolvedInstitutionName) return;
    saveAccount.mutate(
      {
        id: account?.id ?? null,
        values: {
          name: name.trim(),
          type,
          institution: resolvedInstitutionName,
          institution_code: institutionCode,
          institution_name: resolvedInstitutionName,
          initial_balance: Number(initialBalance) || 0,
          ...(isEdit ? {} : { initial_balance_date: toISODate(new Date()) }),
        },
      },
      {
        onSuccess: () => {
          resetFromAccount();
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
        if (nextOpen) resetFromAccount();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <Plus /> Adicionar conta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar conta" : "Nova conta"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados da conta."
              : "Cadastre uma conta para acompanhar seu saldo."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="account-name">Nome da instituição</Label>
            <Input
              id="account-name"
              required={institutionCode === "other"}
              disabled={institutionCode !== "other"}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Banco Inter"
            />
          </div>
          <div className="space-y-2">
            <Label>Instituição financeira</Label>
            <Select
              value={institutionCode}
              onValueChange={(value) => {
                const nextCode = value as InstitutionCode;
                setInstitutionCode(nextCode);
                setName(nextCode === "other" ? "" : institutionLabel(nextCode));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a instituição" />
              </SelectTrigger>
              <SelectContent>
                {FINANCIAL_INSTITUTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-initial-balance">Saldo inicial</Label>
            <Input
              id="account-initial-balance"
              type="number"
              step="0.01"
              value={initialBalance}
              onChange={(event) => setInitialBalance(event.target.value)}
              placeholder="0,00"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saveAccount.isPending}>
              {saveAccount.isPending
                ? "Salvando..."
                : isEdit
                  ? "Salvar alterações"
                  : "Adicionar conta"}
            </Button>
          </DialogFooter>
          {saveAccount.error && (
            <p className="text-sm text-negative" role="alert">
              Não foi possível salvar a conta: {saveAccount.error.message}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
