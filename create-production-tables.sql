-- Core GoalMine.ai database schema for production
-- Run this to create all essential tables

-- Profiles table (user info)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  goal_limit INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Goals table (user goals)  
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  tone TEXT DEFAULT 'kind_encouraging',
  email_time TIME DEFAULT '07:00:00',
  streak_count INTEGER DEFAULT 0,
  last_check_in DATE,
  is_active BOOLEAN DEFAULT true,
  last_motivation_date DATE,
  streak_insurance_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Subscribers table (subscription status)
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscribed BOOLEAN DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMP WITH TIME ZONE,
  plan_name TEXT,
  status TEXT DEFAULT 'inactive',
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Motivation history table (AI content)
CREATE TABLE IF NOT EXISTS public.motivation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  micro_plan TEXT[],
  challenge TEXT,
  tone TEXT,
  streak_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Daily nudges table (nudge tracking)
CREATE TABLE IF NOT EXISTS public.daily_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  nudge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  nudge_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, nudge_date)
);

-- Set up test users for subscription testing
-- danlynn@gmail.com = Paid subscriber (3 goal limit)
INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier, plan_name, status, current_period_end)
VALUES ('danlynn@gmail.com', 'danlynn@gmail.com', true, 'Personal Plan', 'Personal Plan', 'active', '2025-12-31 23:59:59')
ON CONFLICT (email) DO UPDATE SET 
  subscribed = true,
  subscription_tier = 'Personal Plan',
  plan_name = 'Personal Plan',  
  status = 'active',
  current_period_end = '2025-12-31 23:59:59';

-- Verify table creation
SELECT 
  'profiles' as table_name,
  COUNT(*) as record_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'profiles'
UNION ALL
SELECT 
  'goals' as table_name,
  COUNT(*) as record_count  
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'goals'
UNION ALL
SELECT 
  'subscribers' as table_name,
  COUNT(*) as record_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'subscribers'
UNION ALL
SELECT
  'motivation_history' as table_name,
  COUNT(*) as record_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'motivation_history'
UNION ALL  
SELECT
  'daily_nudges' as table_name,
  COUNT(*) as record_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'daily_nudges';

SELECT 'GoalMine.ai database setup complete! 🎯' as status;