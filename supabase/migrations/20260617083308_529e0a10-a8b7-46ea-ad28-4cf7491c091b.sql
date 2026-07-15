ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS primary_goal text,
  ADD COLUMN IF NOT EXISTS preferred_language text,
  ADD COLUMN IF NOT EXISTS notification_opt_in boolean NOT NULL DEFAULT false;