-- Add payment tracking fields to credit_card_invoices
-- Separates invoice cycle state (open/closed) from payment state (paid_amount)

ALTER TABLE public.credit_card_invoices
  ADD COLUMN is_closed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0;

-- Initialize data: paid_amount from transaction amounts
-- Note: is_closed remains false; it will be set to true based on closing_date >= today, not payment status
-- Invoices are considered closed only when their closing_date has passed, regardless of payment status
UPDATE public.credit_card_invoices
SET paid_amount = total_amount
WHERE status = 'paid';

-- Create index for common queries
CREATE INDEX credit_card_invoices_is_closed_idx ON public.credit_card_invoices(card_id, is_closed);
CREATE INDEX credit_card_invoices_paid_amount_idx ON public.credit_card_invoices(card_id, paid_amount);

-- Add comment for clarity
COMMENT ON COLUMN public.credit_card_invoices.is_closed IS 'Invoice cycle state: false=open (can receive new purchases until closing_date), true=closed (closing_date has passed)';
COMMENT ON COLUMN public.credit_card_invoices.paid_amount IS 'Total amount paid for this invoice, can be < total_amount for partial payments';
