ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS planned_date DATE,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS planned_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS real_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS interest_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fine_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0;

UPDATE public.transactions
SET
  planned_date = COALESCE(planned_date, date),
  planned_amount = COALESCE(planned_amount, amount),
  real_amount = COALESCE(real_amount, amount),
  interest_amount = COALESCE(interest_amount, 0),
  fine_amount = COALESCE(fine_amount, 0),
  discount_amount = COALESCE(discount_amount, 0)
WHERE planned_date IS NULL
   OR planned_amount IS NULL
   OR real_amount IS NULL;
