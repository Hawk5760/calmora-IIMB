
-- Fix 1: Restrict direct SELECT on peer_support_posts to authors, volunteers, and admins only
-- Regular users should use peer_support_posts_safe view instead
DROP POLICY IF EXISTS "Everyone can view moderated posts" ON peer_support_posts;

CREATE POLICY "Authors can view their own posts"
ON peer_support_posts FOR SELECT
USING (auth.uid() = author_id);

CREATE POLICY "Volunteers can view moderated posts"
ON peer_support_posts FOR SELECT
USING (has_role(auth.uid(), 'volunteer'::app_role));

CREATE POLICY "Admins can view all posts"
ON peer_support_posts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Remove direct INSERT on user_achievements, replace with server-side function
DROP POLICY IF EXISTS "Users can create their own achievements" ON user_achievements;

-- Create a secure function to grant achievements
CREATE OR REPLACE FUNCTION public.grant_achievement(
  _user_id uuid,
  _achievement_id text,
  _achievement_name text,
  _achievement_description text,
  _achievement_icon text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow granting to the calling user
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot grant achievements to other users';
  END IF;

  -- Validate achievement_id against known achievements
  IF _achievement_id NOT IN (
    'first_game', 'puzzle_master', 'speed_solver', 'word_wizard',
    'efficient_mind', 'streak_3', 'streak_7', 'streak_30',
    'games_25', 'games_50', 'games_100', 'calm_player', 'improving'
  ) THEN
    RAISE EXCEPTION 'Invalid achievement_id';
  END IF;

  -- Prevent duplicate achievements
  INSERT INTO user_achievements (user_id, achievement_id, achievement_name, achievement_description, achievement_icon)
  VALUES (_user_id, _achievement_id, _achievement_name, _achievement_description, _achievement_icon)
  ON CONFLICT DO NOTHING;
END;
$$;
