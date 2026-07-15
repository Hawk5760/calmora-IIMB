ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender_identity text CHECK (gender_identity IN ('woman','man','non_binary','prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS personalization_scope text NOT NULL DEFAULT 'off' CHECK (personalization_scope IN ('cloud','local','off')),
  ADD COLUMN IF NOT EXISTS life_context jsonb NOT NULL DEFAULT '{}'::jsonb;