ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS obligation_id UUID REFERENCES public.obligations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS transactions_obligation_id_idx
  ON public.transactions(obligation_id);
