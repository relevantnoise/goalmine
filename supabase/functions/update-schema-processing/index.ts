import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[UPDATE-SCHEMA] Adding processing_date field to goals table');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First check if the column already exists
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'goals')
      .eq('column_name', 'processing_date');

    if (checkError) {
      console.error('[UPDATE-SCHEMA] Error checking columns:', checkError);
    }

    console.log('[UPDATE-SCHEMA] Existing processing_date columns:', columns?.length || 0);

    if (!columns || columns.length === 0) {
      console.log('[UPDATE-SCHEMA] Adding processing_date column...');
      
      // Execute raw SQL to add the column
      const { data: addResult, error: addError } = await supabase
        .rpc('sql', {
          query: `
            ALTER TABLE goals ADD COLUMN processing_date DATE;
            CREATE INDEX IF NOT EXISTS idx_goals_processing_date ON goals(processing_date);
          `
        });

      if (addError) {
        console.error('[UPDATE-SCHEMA] Error adding column:', addError);
        
        // Try alternative approach - direct SQL execution
        try {
          const response = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/exec`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json',
                'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
              },
              body: JSON.stringify({
                sql: 'ALTER TABLE goals ADD COLUMN IF NOT EXISTS processing_date DATE;'
              })
            }
          );
          
          const result = await response.text();
          console.log('[UPDATE-SCHEMA] Direct SQL result:', result);
        } catch (directError) {
          console.error('[UPDATE-SCHEMA] Direct SQL also failed:', directError);
        }
      } else {
        console.log('[UPDATE-SCHEMA] Successfully added processing_date column');
      }
    } else {
      console.log('[UPDATE-SCHEMA] processing_date column already exists');
    }

    // Verify the schema
    const { data: finalColumns, error: finalError } = await supabase
      .from('goals')
      .select('*')
      .limit(1);

    console.log('[UPDATE-SCHEMA] Schema verification:', { finalColumns, finalError });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Schema update process completed',
        columnExists: columns?.length > 0,
        verification: { finalColumns, finalError }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[UPDATE-SCHEMA] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);