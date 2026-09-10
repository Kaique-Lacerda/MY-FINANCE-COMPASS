export type CpfProviderStatus =
  "valid" | "invalid" | "not_found" | "unavailable";

export type CpfValidationResult = {
  valid: boolean;
  status: CpfProviderStatus;
  provider?: string;
};

export function normalizeCpf(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function formatCpf(value: string) {
  const cpf = normalizeCpf(value);
  return cpf
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function isValidCpf(value: string) {
  const cpf = normalizeCpf(value);
  if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let index = 0; index < 9; index += 1)
    sum += Number(cpf[index]) * (10 - index);
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number(cpf[9])) return false;

  sum = 0;
  for (let index = 0; index < 10; index += 1)
    sum += Number(cpf[index]) * (11 - index);
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === Number(cpf[10]);
}

export function validateCpfMathematically(value: string): CpfValidationResult {
  return isValidCpf(value)
    ? {
        valid: true,
        status: "valid",
        provider: "local-mathematical-validation",
      }
    : {
        valid: false,
        status: "invalid",
        provider: "local-mathematical-validation",
      };
}

export interface CpfValidationProvider {
  validate(cpf: string): Promise<CpfValidationResult>;
}

export const unavailableCpfProvider: CpfValidationProvider = {
  async validate() {
    return { valid: false, status: "unavailable", provider: "not-configured" };
  },
};
