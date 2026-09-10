CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  currency TEXT NOT NULL DEFAULT 'BRL',
  first_day_of_month INT NOT NULL DEFAULT 1,
  date_format TEXT NOT NULL DEFAULT 'dd/MM/yyyy',
  notify_upcoming BOOLEAN NOT NULL DEFAULT true,
  notify_negative_forecast BOOLEAN NOT NULL DEFAULT true,
  notify_reconciliation BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  institution TEXT,
  type TEXT NOT NULL DEFAULT 'checking',
  initial_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  initial_balance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  include_in_total BOOLEAN NOT NULL DEFAULT true,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'MANUAL',
  external_institution_id TEXT,
  external_account_id TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own accounts" ON public.accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER accounts_updated BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'expense',
  color TEXT NOT NULL DEFAULT '#94a3b8',
  icon TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own categories" ON public.categories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  creditor TEXT,
  original_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  installment_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  installments_count INT NOT NULL DEFAULT 1,
  paid_installments INT NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debts TO authenticated;
GRANT ALL ON public.debts TO service_role;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own debts" ON public.debts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER debts_updated BEFORE UPDATE ON public.debts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  installments_count INT NOT NULL DEFAULT 1,
  installment_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_count INT NOT NULL DEFAULT 0,
  first_due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.installments TO authenticated;
GRANT ALL ON public.installments TO service_role;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own installments" ON public.installments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER installments_updated BEFORE UPDATE ON public.installments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'expense',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  occurrences INT,
  day_of_month INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_transactions TO authenticated;
GRANT ALL ON public.recurring_transactions TO service_role;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recurring" ON public.recurring_transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER recurring_updated BEFORE UPDATE ON public.recurring_transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  institution TEXT,
  type TEXT NOT NULL DEFAULT 'fixed_income',
  invested_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  current_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  yield_rate NUMERIC(8,4),
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investments TO authenticated;
GRANT ALL ON public.investments TO service_role;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own investments" ON public.investments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER investments_updated BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'expense',
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'done',
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'MANUAL',
  external_id TEXT,
  external_institution_id TEXT,
  external_account_id TEXT,
  synced_at TIMESTAMPTZ,
  reconciled BOOLEAN NOT NULL DEFAULT false,
  recurring_id UUID REFERENCES public.recurring_transactions(id) ON DELETE SET NULL,
  installment_id UUID REFERENCES public.installments(id) ON DELETE SET NULL,
  debt_id UUID REFERENCES public.debts(id) ON DELETE SET NULL,
  investment_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,
  installment_number INT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions" ON public.transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER transactions_updated BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX transactions_user_date_idx ON public.transactions (user_id, date DESC);
CREATE UNIQUE INDEX transactions_external_uniq ON public.transactions (user_id, source, external_id) WHERE external_id IS NOT NULL;

CREATE TABLE public.investment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'deposit',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investment_transactions TO authenticated;
GRANT ALL ON public.investment_transactions TO service_role;
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own investment tx" ON public.investment_transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER investment_tx_updated BEFORE UPDATE ON public.investment_transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  real_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  system_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  difference NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reconciliations TO authenticated;
GRANT ALL ON public.reconciliations TO service_role;
ALTER TABLE public.reconciliations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reconciliations" ON public.reconciliations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER reconciliations_updated BEFORE UPDATE ON public.reconciliations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  current_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_goals TO authenticated;
GRANT ALL ON public.financial_goals TO service_role;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals" ON public.financial_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER goals_updated BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();