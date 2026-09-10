CREATE TABLE public.credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  card_brand TEXT NOT NULL DEFAULT 'Outro',
  credit_limit NUMERIC(14,2) NOT NULL DEFAULT 0,
  closing_day INT NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
  due_day INT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.credit_card_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  reference_month DATE NOT NULL,
  closing_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paid')),
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (card_id, reference_month)
);

CREATE TABLE public.credit_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.credit_card_invoices(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  installment_number INT NOT NULL DEFAULT 1,
  installment_total INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions
  ADD COLUMN credit_card_invoice_id UUID REFERENCES public.credit_card_invoices(id) ON DELETE SET NULL;

CREATE INDEX transactions_credit_card_invoice_id_idx
  ON public.transactions(credit_card_invoice_id);

CREATE INDEX credit_cards_user_id_idx ON public.credit_cards(user_id);
CREATE INDEX credit_card_invoices_card_id_idx ON public.credit_card_invoices(card_id);
CREATE INDEX credit_card_transactions_invoice_id_idx ON public.credit_card_transactions(invoice_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_cards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_card_invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_card_transactions TO authenticated;
GRANT ALL ON public.credit_cards, public.credit_card_invoices, public.credit_card_transactions TO service_role;

ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own credit cards" ON public.credit_cards FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own credit card invoices" ON public.credit_card_invoices FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own credit card transactions" ON public.credit_card_transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER credit_cards_updated BEFORE UPDATE ON public.credit_cards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER credit_card_invoices_updated BEFORE UPDATE ON public.credit_card_invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER credit_card_transactions_updated BEFORE UPDATE ON public.credit_card_transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
