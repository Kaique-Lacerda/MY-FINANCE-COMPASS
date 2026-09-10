import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { monthKeyOf } from "@/lib/finance";

type PeriodContextValue = {
  monthKey: string;
  setMonthKey: (value: string) => void;
  currentMonthKey: string;
};

const PeriodContext = createContext<PeriodContextValue | null>(null);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const currentMonthKey = monthKeyOf(new Date());
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const value = useMemo(
    () => ({ monthKey, setMonthKey, currentMonthKey }),
    [monthKey, currentMonthKey],
  );
  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (!context) throw new Error("usePeriod deve ser usado dentro de PeriodProvider");
  return context;
}
