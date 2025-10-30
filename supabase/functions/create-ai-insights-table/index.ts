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
    console.log('[CREATE-AI-INSIGHTS-TABLE] Creating ai_insights table...');

    // Create ai_insights table with proper schema
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ai_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        framework_id UUID NOT NULL REFERENCES user_frameworks(id) ON DELETE CASCADE,
        user_email TEXT NOT NULL,
        insight_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ai_insights_framework_id ON ai_insights(framework_id);
      CREATE INDEX IF NOT EXISTS idx_ai_insights_email ON ai_insights(user_email);
      CREATE INDEX IF NOT EXISTS idx_ai_insights_unread ON ai_insights(framework_id, is_read);

      COMMENT ON TABLE ai_insights IS 'AI-generated insights and recommendations for users';
    `;

    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: createTableQuery 
    });

    if (error) {
      console.error('[CREATE-AI-INSIGHTS-TABLE] Error creating table:', error);
      
      // Fallback: Try direct SQL execution
      const { error: directError } = await supabase
        .from('ai_insights')
        .select('id')
        .limit(1);

      if (directError?.message?.includes('relation "ai_insights" does not exist')) {
        return new Response(JSON.stringify({
          success: false,
          error: `Table creation failed: ${error.message}`,
          suggestion: 'ai_insights table needs to be created manually or via migration'
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    console.log('[CREATE-AI-INSIGHTS-TABLE] Table created successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'ai_insights table created successfully',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[CREATE-AI-INSIGHTS-TABLE] Error:', error);
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