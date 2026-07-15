-- FIX 1: Protect 2FA secrets from client-side reads
-- Remove all existing permissive policies on user_2fa
DROP POLICY IF EXISTS "Users can view their own 2FA settings" ON user_2fa;
DROP POLICY IF EXISTS "Users can insert their own 2FA settings" ON user_2fa;
DROP POLICY IF EXISTS "Users can update their own 2FA settings" ON user_2fa;
DROP POLICY IF EXISTS "Users can delete their own 2FA settings" ON user_2fa;

-- No SELECT/INSERT/UPDATE/DELETE policies for regular users
-- All 2FA operations must go through the TOTP edge function (which uses service role or user context)
-- The edge function already uses supabase client with user's auth header, so RLS applies
-- We need to allow the edge function's authenticated user to perform operations
-- But we should NOT allow SELECT of secret/backup_codes columns

-- Create a secure view that hides sensitive columns
CREATE OR REPLACE VIEW public.user_2fa_status AS
SELECT user_id, is_enabled, created_at, updated_at
FROM public.user_2fa;

ALTER VIEW public.user_2fa_status SET (security_invoker = true);

-- Restore policies but only allow status check (no secret exposure)
-- The TOTP edge function accesses user_2fa through the Supabase client with user's JWT
-- so we need the user to be able to read/write their own rows
-- But we use column-level security via a wrapper function instead

-- Create a SECURITY DEFINER function for all 2FA operations
CREATE OR REPLACE FUNCTION public.totp_get_status(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_enabled FROM public.user_2fa WHERE user_id = _user_id),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.totp_upsert_secret(
  _user_id uuid,
  _secret text,
  _backup_codes text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot modify other users 2FA settings';
  END IF;
  
  INSERT INTO public.user_2fa (user_id, secret, is_enabled, backup_codes)
  VALUES (_user_id, _secret, false, _backup_codes)
  ON CONFLICT (user_id) DO UPDATE SET
    secret = EXCLUDED.secret,
    is_enabled = false,
    backup_codes = EXCLUDED.backup_codes,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.totp_get_secret(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _secret text;
BEGIN
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot access other users 2FA settings';
  END IF;
  
  SELECT secret INTO _secret FROM public.user_2fa WHERE user_id = _user_id;
  RETURN _secret;
END;
$$;

CREATE OR REPLACE FUNCTION public.totp_enable(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot modify other users 2FA settings';
  END IF;
  
  UPDATE public.user_2fa SET is_enabled = true, updated_at = now()
  WHERE user_id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.totp_disable(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot modify other users 2FA settings';
  END IF;
  
  DELETE FROM public.user_2fa WHERE user_id = _user_id;
END;
$$;

-- Add unique constraint on user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_2fa_user_id_unique'
  ) THEN
    ALTER TABLE public.user_2fa ADD CONSTRAINT user_2fa_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- FIX 2: Prevent privilege escalation on user_roles
-- Add explicit INSERT policy that only allows admins
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add explicit UPDATE policy that only allows admins
CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add explicit DELETE policy that only allows admins
CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- FIX 3: Fix security definer view
DROP VIEW IF EXISTS public.peer_support_posts_safe;

CREATE VIEW public.peer_support_posts_safe
WITH (security_invoker = true)
AS
SELECT
  id,
  CASE WHEN is_anonymous = true THEN NULL ELSE author_id END AS author_id,
  pseudo_id,
  title,
  content,
  is_anonymous,
  is_flagged,
  is_moderated,
  likes_count,
  comments_count,
  tags,
  created_at,
  updated_at
FROM peer_support_posts
WHERE is_moderated = true AND is_flagged = false;