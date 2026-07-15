
-- Add unique constraint for ON CONFLICT to work
ALTER TABLE user_achievements ADD CONSTRAINT user_achievements_user_achievement_unique UNIQUE (user_id, achievement_id);
