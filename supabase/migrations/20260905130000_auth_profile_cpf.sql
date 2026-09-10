ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS cpf VARCHAR(11);

UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN user_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique ON public.profiles(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_unique ON public.profiles(cpf) WHERE cpf IS NOT NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_cpf_digits_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_cpf_digits_check CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$');

DROP POLICY IF EXISTS "own profile" ON public.profiles;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
