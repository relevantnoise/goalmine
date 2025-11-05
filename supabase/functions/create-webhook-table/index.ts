import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('[CREATE-WEBHOOK-TABLE] Creating webhook events table...');

    // Create webhook_events table
    const { error: tableError } = await supabaseClient.rpc('exec_sql', {
      sql: `
        -- Webhook Events Tracking Table for Stripe Integration
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
      `
    });

    if (tableError) {
      console.error('[CREATE-WEBHOOK-TABLE] Table creation error:', tableError);
    } else {
      console.log('[CREATE-WEBHOOK-TABLE] ✅ webhook_events table created successfully');
    }

    // Add columns to subscribers table
    const { error: alterError } = await supabaseClient.rpc('exec_sql', {
      sql: `
        -- Add webhook tracking columns to subscribers table
        ALTER TABLE subscribers 
        ADD COLUMN IF NOT EXISTS webhook_updated BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

        -- Index for webhook updates
        CREATE INDEX IF NOT EXISTS idx_subscribers_webhook_updated ON subscribers(webhook_updated);
      `
    });

    if (alterError) {
      console.error('[CREATE-WEBHOOK-TABLE] Alter table error:', alterError);
    } else {
      console.log('[CREATE-WEBHOOK-TABLE] ✅ subscribers table updated successfully');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook table and indexes created successfully',
        tableCreated: !tableError,
        subscribersUpdated: !alterError
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CREATE-WEBHOOK-TABLE] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})