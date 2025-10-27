-- Add circle framework columns to goals table
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS circle_type TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS circle_interview_data JSONB;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS weekly_commitment_hours INTEGER;