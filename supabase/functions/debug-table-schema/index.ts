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
    console.log('[DEBUG-SCHEMA] Checking ai_insights table schema...');

    // Query the information schema to see what columns exist
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'ai_insights')
      .order('ordinal_position');

    console.log('[DEBUG-SCHEMA] Columns query result:', columns, columnsError);

    // Also try a simple select to see what the client thinks exists
    const { data: selectTest, error: selectError } = await supabase
      .from('ai_insights')
      .select('*')
      .limit(1);

    console.log('[DEBUG-SCHEMA] Select test result:', selectTest, selectError);

    // Try to insert with only basic fields that should definitely exist
    const basicInsert = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    const { data: insertTest, error: insertError } = await supabase
      .from('ai_insights')
      .insert(basicInsert)
      .select();

    console.log('[DEBUG-SCHEMA] Basic insert test:', insertTest, insertError);

    return new Response(JSON.stringify({
      success: true,
      schema: {
        columns: columns,
        columnsError: columnsError,
        selectTest: selectTest,
        selectError: selectError,
        insertTest: insertTest,
        insertError: insertError
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[DEBUG-SCHEMA] Error:', error);
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