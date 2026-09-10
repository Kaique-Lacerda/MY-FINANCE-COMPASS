CREATE TABLE public.category_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  monthly_limit NUMERIC(14,2) NOT NULL DEFAULT 0,
  start_month DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_budgets TO authenticated;
GRANT ALL ON public.category_budgets TO service_role;

ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own category budgets"
ON public.category_budgets
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER category_budgets_updated
BEFORE UPDATE ON public.category_budgets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
