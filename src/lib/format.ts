export function formatCurrency(value: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatSigned(value: number, currency = "BRL") {
  const formatted = formatCurrency(Math.abs(value), currency);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? parseISODate(value) : value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

export function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(
    new Date(year, (month ?? 1) - 1, 1),
  );
  return label.replace(".", "");
}

export function formatMonthLong(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(year, (month ?? 1) - 1, 1),
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatPercent(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits).replace(".", ",")}%`;
}

/** Parses a `yyyy-MM-dd` string as a local date (avoids UTC shifting). */
export function parseISODate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
