-- Add nudge tracking table for server-side limit enforcement
CREATE TABLE daily_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nudge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  nudge_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user per day
  CONSTRAINT unique_user_date UNIQUE(user_id, nudge_date)
);

-- Enable RLS
ALTER TABLE daily_nudges ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own nudge records"
  ON daily_nudges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nudge records" 
  ON daily_nudges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nudge records"
  ON daily_nudges FOR UPDATE
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_daily_nudges_user_date ON daily_nudges(user_id, nudge_date);
CREATE INDEX idx_daily_nudges_date ON daily_nudges(nudge_date);

-- Add email delivery tracking table
CREATE TABLE email_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL, -- 'daily_motivation', 'nudge', 'trial_warning', etc.
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced'
  external_id VARCHAR(255), -- Resend email ID
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0
);

-- Enable RLS for email deliveries
ALTER TABLE email_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email deliveries"
  ON email_deliveries FOR SELECT
  USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_email_deliveries_user_id ON email_deliveries(user_id);
CREATE INDEX idx_email_deliveries_status ON email_deliveries(status);
CREATE INDEX idx_email_deliveries_type ON email_deliveries(email_type);
CREATE INDEX idx_email_deliveries_created_at ON email_deliveries(created_at);

-- Function to safely increment nudge count
CREATE OR REPLACE FUNCTION increment_daily_nudge_count(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  current_count INTEGER := 0;
  max_nudges INTEGER := 1; -- Default for free users
  user_subscribed BOOLEAN := FALSE;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Check if user is subscribed
  SELECT subscribed INTO user_subscribed
  FROM subscribers 
  WHERE user_id = target_user_id AND subscribed = TRUE
  LIMIT 1;
  
  -- Set max nudges based on subscription
  IF user_subscribed THEN
    max_nudges := 3;
  END IF;
  
  -- Get current count for today
  SELECT COALESCE(nudge_count, 0) INTO current_count
  FROM daily_nudges
  WHERE user_id = target_user_id AND nudge_date = today_date;
  
  -- Check if limit would be exceeded
  IF current_count >= max_nudges THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Daily nudge limit reached',
      'current_count', current_count,
      'max_nudges', max_nudges,
      'user_subscribed', user_subscribed
    );
  END IF;
  
  -- Increment count (upsert)
  INSERT INTO daily_nudges (user_id, nudge_date, nudge_count)
  VALUES (target_user_id, today_date, 1)
  ON CONFLICT (user_id, nudge_date) 
  DO UPDATE SET 
    nudge_count = daily_nudges.nudge_count + 1,
    updated_at = NOW();
  
  -- Return success with new count
  RETURN json_build_object(
    'success', TRUE,
    'current_count', current_count + 1,
    'max_nudges', max_nudges,
    'user_subscribed', user_subscribed,
    'remaining', max_nudges - (current_count + 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current nudge status
CREATE OR REPLACE FUNCTION get_daily_nudge_status(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  current_count INTEGER := 0;
  max_nudges INTEGER := 1;
  user_subscribed BOOLEAN := FALSE;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Check if user is subscribed
  SELECT subscribed INTO user_subscribed
  FROM subscribers 
  WHERE user_id = target_user_id AND subscribed = TRUE
  LIMIT 1;
  
  -- Set max nudges based on subscription
  IF user_subscribed THEN
    max_nudges := 3;
  END IF;
  
  -- Get current count for today
  SELECT COALESCE(nudge_count, 0) INTO current_count
  FROM daily_nudges
  WHERE user_id = target_user_id AND nudge_date = today_date;
  
  RETURN json_build_object(
    'current_count', current_count,
    'max_nudges', max_nudges,
    'user_subscribed', user_subscribed,
    'remaining', max_nudges - current_count,
    'at_limit', current_count >= max_nudges
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;