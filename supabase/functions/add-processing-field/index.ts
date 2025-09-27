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
    console.log('[ADD-PROCESSING-FIELD] Adding processing_date field to goals table');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Add the processing_date field to goals table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add processing_date field if it doesn't exist
        ALTER TABLE goals ADD COLUMN IF NOT EXISTS processing_date DATE;
        
        -- Add index for better query performance
        CREATE INDEX IF NOT EXISTS idx_goals_processing_date ON goals(processing_date);
        
        -- Show table structure to confirm
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'goals' 
        AND column_name IN ('last_motivation_date', 'processing_date')
        ORDER BY column_name;
      `
    });

    if (error) {
      console.error('[ADD-PROCESSING-FIELD] Error:', error);
      throw error;
    }

    console.log('[ADD-PROCESSING-FIELD] Successfully added processing_date field');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully added processing_date field to goals table',
        result: data
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[ADD-PROCESSING-FIELD] Fatal error:', error);
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