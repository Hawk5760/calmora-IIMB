-- Fix 1: Recreate peer_support_posts_safe view WITHOUT SECURITY DEFINER
-- Mask author_id for anonymous posts, filter out flagged/unmoderated
DROP VIEW IF EXISTS peer_support_posts_safe;

CREATE VIEW peer_support_posts_safe AS
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

-- Fix 2: Add DELETE policies for peer_support_comments
CREATE POLICY "Authors can delete their own comments"
ON peer_support_comments FOR DELETE
USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete any comment"
ON peer_support_comments FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 3: Add DELETE policies for peer_support_posts
CREATE POLICY "Admins can delete any post"
ON peer_support_posts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authors can delete their own posts"
ON peer_support_posts FOR DELETE
USING (auth.uid() = author_id);