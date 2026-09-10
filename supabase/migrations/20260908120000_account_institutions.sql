ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS institution_code TEXT NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS institution_name TEXT;

UPDATE public.accounts
SET
  institution_code = CASE
    WHEN lower(coalesce(institution, '')) LIKE '%nubank%' THEN 'nubank'
    WHEN lower(coalesce(institution, '')) LIKE '%sicredi%' THEN 'sicredi'
    WHEN lower(coalesce(institution, '')) LIKE '%brasil%' THEN 'banco_do_brasil'
    WHEN lower(coalesce(institution, '')) LIKE '%mercado pago%' THEN 'mercado_pago'
    ELSE 'other'
  END,
  institution_name = COALESCE(NULLIF(trim(institution), ''), institution_name)
WHERE institution_code = 'other' AND institution_name IS NULL;

UPDATE public.accounts
SET institution_name = CASE institution_code
  WHEN 'nubank' THEN 'NUBANK'
  WHEN 'sicredi' THEN 'SICREDI'
  WHEN 'banco_do_brasil' THEN 'BANCO DO BRASIL'
  WHEN 'mercado_pago' THEN 'MERCADO PAGO'
  ELSE institution_name
END
WHERE institution_name IS NULL;

UPDATE public.accounts
SET institution_name = CASE institution_code
  WHEN 'nubank' THEN 'NUBANK'
  WHEN 'sicredi' THEN 'SICREDI'
  WHEN 'banco_do_brasil' THEN 'BANCO DO BRASIL'
  WHEN 'mercado_pago' THEN 'MERCADO PAGO'
  ELSE institution_name
END
WHERE institution_code IN ('nubank', 'sicredi', 'banco_do_brasil', 'mercado_pago');
