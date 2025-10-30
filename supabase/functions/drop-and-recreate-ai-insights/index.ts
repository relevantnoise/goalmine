import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[DROP-RECREATE] Starting ai_insights table recreation...');

    // Drop the existing table
    const dropResult = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS ai_insights CASCADE;'
    });

    console.log('[DROP-RECREATE] Drop table result:', dropResult);

    // Create the table fresh
    const createResult = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE ai_insights (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          framework_id UUID NOT NULL,
          user_email TEXT NOT NULL,
          insight_type TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          priority INTEGER DEFAULT 1,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add indexes for performance
        CREATE INDEX ai_insights_framework_id_idx ON ai_insights(framework_id);
        CREATE INDEX ai_insights_user_email_idx ON ai_insights(user_email);
        CREATE INDEX ai_insights_created_at_idx ON ai_insights(created_at);
        
        -- Add RLS policy
        ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
        
        -- Policy to allow service role full access
        CREATE POLICY "Service role can manage ai_insights" ON ai_insights
        FOR ALL USING (true);
      `
    });

    console.log('[DROP-RECREATE] Create table result:', createResult);

    return new Response(JSON.stringify({
      success: true,
      message: 'ai_insights table recreated successfully',
      dropResult,
      createResult,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[DROP-RECREATE] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);