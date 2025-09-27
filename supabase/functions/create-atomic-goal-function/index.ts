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
    console.log('[CREATE-ATOMIC-FUNCTION] Creating atomic goal selection function');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create a database function that atomically selects and updates goals
    const createFunctionSQL = `
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
    `;

    // Execute the SQL to create the function
    const { error: createError } = await supabase.rpc('exec', {
      sql: createFunctionSQL
    });

    if (createError) {
      console.log('[CREATE-ATOMIC-FUNCTION] RPC exec not available, trying direct execution');
      
      // Alternative: Try using a simpler approach with raw SQL
      const { error: directError } = await supabase
        .from('goals')
        .select('id')
        .limit(0); // Just test connection
      
      if (directError) {
        throw new Error(`Database connection failed: ${directError.message}`);
      }
      
      // Since we can't create functions directly via the client, let's document the SQL
      console.log('[CREATE-ATOMIC-FUNCTION] SQL to be executed manually:');
      console.log(createFunctionSQL);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Function creation SQL generated - needs manual execution',
          sql: createFunctionSQL,
          instructions: 'This SQL needs to be executed in the Supabase SQL editor to create the atomic function'
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('[CREATE-ATOMIC-FUNCTION] Successfully created atomic_get_and_mark_goals function');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Atomic goal selection function created successfully',
        functionName: 'atomic_get_and_mark_goals'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[CREATE-ATOMIC-FUNCTION] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        sql: `
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
        `
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);