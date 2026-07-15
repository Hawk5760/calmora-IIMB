
-- 1. Fix user_2fa_status view: recreate with security_invoker and row filtering
DROP VIEW IF EXISTS public.user_2fa_status;
CREATE VIEW public.user_2fa_status
WITH (security_invoker = true)
AS
SELECT user_id, is_enabled, created_at, updated_at
FROM public.user_2fa
WHERE user_id = auth.uid();

-- 2. Replace broad ALL policy on user_roles with explicit per-operation policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- 3. Attach moderation triggers to peer_support_posts and peer_support_comments
-- The function moderate_community_content() exists but triggers may be missing
DROP TRIGGER IF EXISTS moderate_post_content ON public.peer_support_posts;
CREATE TRIGGER moderate_post_content
  BEFORE INSERT OR UPDATE ON public.peer_support_posts
  FOR EACH ROW EXECUTE FUNCTION public.moderate_community_content();

DROP TRIGGER IF EXISTS moderate_comment_content ON public.peer_support_comments;
CREATE TRIGGER moderate_comment_content
  BEFORE INSERT OR UPDATE ON public.peer_support_comments
  FOR EACH ROW EXECUTE FUNCTION public.moderate_community_content();
