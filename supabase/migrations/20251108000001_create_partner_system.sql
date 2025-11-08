-- Create Strategic Partners System
-- Migration for partner recommendations and tracking

-- Create strategic_partners table
CREATE TABLE IF NOT EXISTS strategic_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  website_url text NOT NULL,
  affiliate_url text NOT NULL,
  cta_text text NOT NULL DEFAULT 'Learn More',
  keywords text[] NOT NULL,
  pillar_categories text[] NOT NULL,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create partner_clicks table for tracking
CREATE TABLE IF NOT EXISTS partner_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text,
  goal_id uuid,
  partner_id uuid REFERENCES strategic_partners(id),
  goal_title text,
  user_tier text,
  clicked_at timestamp DEFAULT now()
);

-- Insert StartingIt.ai as first partner
INSERT INTO strategic_partners (
  name, 
  description, 
  website_url, 
  affiliate_url, 
  cta_text, 
  keywords, 
  pillar_categories,
  notes
) VALUES (
  'StartingIt.ai',
  'Complete business launch platform with legal setup, financial planning, and strategic guidance',
  'https://startingit.ai',
  'https://startingit.ai?ref=goalmine&user={{USER_EMAIL}}',
  'Start Your Business - Free Trial',
  ARRAY['business', 'startup', 'entrepreneur', 'consulting', 'freelance', 'launch', 'company', 'llc', 'corporation', 'firm', 'agency', 'venture', 'own business'],
  ARRAY['Work'],
  'First strategic partner - business/entrepreneurship focus'
)
ON CONFLICT (name) DO NOTHING;