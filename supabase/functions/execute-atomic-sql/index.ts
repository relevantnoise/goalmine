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
    console.log('[EXECUTE-ATOMIC-SQL] Creating atomic goal selection function');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Execute raw SQL to create the function
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        CREATE OR REPLACE FUNCTION atomic_get_and_mark_goals(target_date text)
        RETURNS SETOF goals AS $$
        BEGIN
          RETURN QUERY
          UPDATE goals 
          SET last_motivation_date = target_date::date
          WHERE is_active = true 
            AND (last_motivation_date IS NULL OR last_motivation_date < target_date::date)
          RETURNING *;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (error) {
      console.error('[EXECUTE-ATOMIC-SQL] Error creating function:', error);
      // Try alternative SQL execution method
      throw error;
    }

    console.log('[EXECUTE-ATOMIC-SQL] Atomic function created successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Atomic goal selection function created successfully',
        functionName: 'atomic_get_and_mark_goals',
        description: 'Function atomically selects and marks goals to prevent duplicate email processing'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[EXECUTE-ATOMIC-SQL] Error:', error);
    
    // Provide the SQL for manual execution
    const manualSQL = `
CREATE OR REPLACE FUNCTION atomic_get_and_mark_goals(target_date text)
RETURNS SETOF goals AS $$
BEGIN
  -- Use UPDATE...RETURNING to atomically select goals that need emails and mark them as processed
  -- This prevents race conditions where multiple function calls could process the same goals
  RETURN QUERY
  UPDATE goals 
  SET last_motivation_date = target_date::date
  WHERE is_active = true 
    AND (last_motivation_date IS NULL OR last_motivation_date < target_date::date)
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT 'Function created successfully' as status;
    `;
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        manual_sql: manualSQL,
        instructions: [
          "Copy the SQL above and execute it in Supabase Dashboard > SQL Editor",
          "This will create the atomic function to prevent duplicate emails",
          "Then redeploy the send-daily-emails function"
        ]
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);