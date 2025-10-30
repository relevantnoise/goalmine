-- Drop existing incorrect tables
DROP TABLE IF EXISTS framework_elements CASCADE;
DROP TABLE IF EXISTS user_frameworks CASCADE;
DROP TABLE IF EXISTS work_happiness CASCADE;

-- Create user_frameworks table
CREATE TABLE user_frameworks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  user_email text,
  onboarding_completed boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create pillar_assessments table (matches our actual data)
CREATE TABLE pillar_assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  framework_id uuid REFERENCES user_frameworks(id) ON DELETE CASCADE,
  pillar_name text NOT NULL,
  importance_level integer NOT NULL CHECK (importance_level >= 1 AND importance_level <= 10),
  current_hours_per_week numeric NOT NULL CHECK (current_hours_per_week >= 0),
  ideal_hours_per_week numeric NOT NULL CHECK (ideal_hours_per_week >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT unique_framework_pillar UNIQUE (framework_id, pillar_name)
);

-- Create work_happiness table (matches our actual data)
CREATE TABLE work_happiness (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  framework_id uuid REFERENCES user_frameworks(id) ON DELETE CASCADE,
  user_email text,
  impact_current integer NOT NULL CHECK (impact_current >= 1 AND impact_current <= 10),
  impact_desired integer NOT NULL CHECK (impact_desired >= 1 AND impact_desired <= 10),
  enjoyment_current integer NOT NULL CHECK (enjoyment_current >= 1 AND enjoyment_current <= 10),
  enjoyment_desired integer NOT NULL CHECK (enjoyment_desired >= 1 AND enjoyment_desired <= 10),
  income_current integer NOT NULL CHECK (income_current >= 1 AND income_current <= 10),
  income_desired integer NOT NULL CHECK (income_desired >= 1 AND income_desired <= 10),
  remote_current integer NOT NULL CHECK (remote_current >= 1 AND remote_current <= 10),
  remote_desired integer NOT NULL CHECK (remote_desired >= 1 AND remote_desired <= 10),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT unique_framework_work_happiness UNIQUE (framework_id)
);

-- Add RLS and make tables unrestricted
ALTER TABLE user_frameworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unrestricted access" ON user_frameworks FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE pillar_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unrestricted access" ON pillar_assessments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE work_happiness ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unrestricted access" ON work_happiness FOR ALL USING (true) WITH CHECK (true);