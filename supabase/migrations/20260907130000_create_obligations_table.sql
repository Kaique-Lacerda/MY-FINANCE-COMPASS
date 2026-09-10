CREATE TABLE IF NOT EXISTS public.obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'expense',
  planned_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  planned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.obligations TO authenticated;
GRANT ALL ON public.obligations TO service_role;
ALTER TABLE public.obligations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own obligations" ON public.obligations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER obligations_updated BEFORE UPDATE ON public.obligations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
