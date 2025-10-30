import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[RECREATE-DIRECT] Starting ai_insights table recreation...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Direct SQL execution using REST API
    const dropSql = 'DROP TABLE IF EXISTS ai_insights CASCADE;';
    
    const dropResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      },
      body: JSON.stringify({ sql: dropSql })
    });

    console.log('[RECREATE-DIRECT] Drop response status:', dropResponse.status);

    // Use postgres:// connection instead
    const createSql = `
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

      CREATE INDEX ai_insights_framework_id_idx ON ai_insights(framework_id);
      CREATE INDEX ai_insights_user_email_idx ON ai_insights(user_email);
      CREATE INDEX ai_insights_created_at_idx ON ai_insights(created_at);
      
      ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Service role can manage ai_insights" ON ai_insights
      FOR ALL USING (true);
    `;

    // Use direct postgres connection
    const createResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      },
      body: JSON.stringify({ sql: createSql })
    });

    console.log('[RECREATE-DIRECT] Create response status:', createResponse.status);

    return new Response(JSON.stringify({
      success: true,
      message: 'ai_insights table recreated using direct SQL',
      dropStatus: dropResponse.status,
      createStatus: createResponse.status,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[RECREATE-DIRECT] Error:', error);
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