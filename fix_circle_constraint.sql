-- Fix circle_type constraint to support all 6 Elements with correct names
-- Run this in the Supabase SQL Editor

-- Drop the old constraint first
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_circle_type_check;

-- Add new constraint with correct 6 Elements names matching frontend
ALTER TABLE goals ADD CONSTRAINT goals_circle_type_check 
CHECK (circle_type IN (
  'Work',
  'Sleep', 
  'Friends & Family',
  'Health & Fitness',
  'Personal Development',
  'Spiritual'
));