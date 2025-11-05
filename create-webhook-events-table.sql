-- Webhook Events Tracking Table for Stripe Integration
-- This table prevents duplicate webhook processing and provides audit trail

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_event JSONB,
  processing_status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON webhook_events(processed_at);

-- Add webhook tracking column to subscribers table
ALTER TABLE subscribers 
ADD COLUMN IF NOT EXISTS webhook_updated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Index for webhook updates
CREATE INDEX IF NOT EXISTS idx_subscribers_webhook_updated ON subscribers(webhook_updated);

-- Comments for documentation
COMMENT ON TABLE webhook_events IS 'Tracks Stripe webhook events to prevent duplicates and provide audit trail';
COMMENT ON COLUMN webhook_events.stripe_event_id IS 'Unique Stripe event ID for deduplication';
COMMENT ON COLUMN webhook_events.raw_event IS 'Complete Stripe event data for debugging';
COMMENT ON COLUMN subscribers.webhook_updated IS 'Flag indicating subscription was updated via webhook';
COMMENT ON COLUMN subscribers.stripe_subscription_id IS 'Stripe subscription ID for direct reference';

-- Grant access for Edge Functions
GRANT ALL ON webhook_events TO service_role;
GRANT ALL ON subscribers TO service_role;