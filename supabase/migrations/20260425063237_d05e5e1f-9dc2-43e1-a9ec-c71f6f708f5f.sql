DROP VIEW IF EXISTS public.peer_support_posts_safe CASCADE;
DROP VIEW IF EXISTS public.peer_support_comments_safe CASCADE;

CREATE VIEW public.peer_support_posts_safe
WITH (security_invoker = true)
AS
SELECT
  id,
  title,
  content,
  tags,
  is_anonymous,
  CASE WHEN is_anonymous THEN NULL ELSE author_id END AS author_id,
  pseudo_id,
  likes_count,
  comments_count,
  is_moderated,
  is_flagged,
  moderated_by,
  moderated_at,
  created_at,
  updated_at
FROM public.peer_support_posts;

CREATE VIEW public.peer_support_comments_safe
WITH (security_invoker = true)
AS
SELECT
  id,
  post_id,
  content,
  is_anonymous,
  CASE WHEN is_anonymous THEN NULL ELSE author_id END AS author_id,
  likes_count,
  is_flagged,
  created_at,
  updated_at
FROM public.peer_support_comments;

GRANT SELECT ON public.peer_support_posts_safe TO authenticated, anon;
GRANT SELECT ON public.peer_support_comments_safe TO authenticated, anon;