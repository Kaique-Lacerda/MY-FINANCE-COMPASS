export type BankAccountSnapshot = {
  externalAccountId: string;
  institutionId?: string;
  balance?: number;
  capturedAt: string;
};

export type BankTransactionSnapshot = {
  externalId: string;
  description: string;
  amount: number;
  date: string;
  type: "income" | "expense" | "transfer";
  accountExternalId?: string;
};

export interface BankIntegrationProvider {
  readonly name: string;
  listAccounts(): Promise<BankAccountSnapshot[]>;
  listTransactions(
    fromISO: string,
    toISO: string,
  ): Promise<BankTransactionSnapshot[]>;
}

export const unavailableBankProvider: BankIntegrationProvider = {
  name: "not-configured",
  async listAccounts() {
    return [];
  },
  async listTransactions() {
    return [];
  },
};
