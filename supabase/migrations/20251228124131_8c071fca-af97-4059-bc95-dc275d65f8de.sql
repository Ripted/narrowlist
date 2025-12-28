-- Add unique constraint on level_feedback to ensure one feedback per user per level
ALTER TABLE public.level_feedback 
ADD CONSTRAINT level_feedback_user_level_unique 
UNIQUE (user_id, level_id);