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
    console.log('[CREATE-ATOMIC-DIRECT] Attempting to create atomic function directly');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Let me try to execute the SQL using a simple query approach
    // First, check if we can create the function by testing with a simple SQL statement
    
    try {
      // Test basic SQL execution capability
      const { data: testData, error: testError } = await supabase
        .from('goals')
        .select('count', { count: 'exact', head: true });
      
      if (testError) {
        throw testError;
      }
      
      console.log('[CREATE-ATOMIC-DIRECT] Database connection verified');
      
      // Since we can't directly execute CREATE FUNCTION via the client,
      // let's create a SQL file that can be run manually
      const atomicSQL = `
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

-- Verify the function was created
\\echo 'Atomic function created successfully!'
      `;
      
      console.log('[CREATE-ATOMIC-DIRECT] SQL prepared for manual execution');
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'SQL ready for manual execution in Supabase Dashboard',
          sql: atomicSQL,
          steps: [
            '1. Go to https://supabase.com/dashboard/project/dhlcycjnzwfnadmsptof/sql',
            '2. Paste the SQL from the "sql" field above',
            '3. Click "Run" to create the atomic function',
            '4. The send-daily-emails function is already deployed with atomic support',
            '5. Tomorrow morning, you should get only 1 email per goal (not 2)'
          ],
          technical_explanation: 'The atomic function uses UPDATE...RETURNING to select and mark goals in a single database transaction, preventing race conditions that cause duplicate emails.'
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
      
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError}`);
    }

  } catch (error: any) {
    console.error('[CREATE-ATOMIC-DIRECT] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        fallback_info: 'The updated send-daily-emails function will use fallback logic until the atomic function is created'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);