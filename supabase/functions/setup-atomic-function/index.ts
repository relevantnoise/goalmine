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
    console.log('[SETUP-ATOMIC] Setting up atomic goal selection function');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Raw SQL to create the atomic function
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION atomic_get_and_mark_goals(target_date text)
      RETURNS TABLE(
        id uuid,
        user_id text,
        title text,
        description text,
        target_date date,
        tone text,
        streak_count integer,
        last_check_in timestamp with time zone,
        last_motivation_date date,
        is_active boolean,
        created_at timestamp with time zone,
        updated_at timestamp with time zone,
        streak_insurance_days integer
      ) AS $$
      BEGIN
        -- Use UPDATE...RETURNING to atomically select goals that need emails and mark them as processed
        -- This prevents race conditions where multiple function calls could process the same goals
        RETURN QUERY
        UPDATE goals 
        SET last_motivation_date = target_date::date
        WHERE is_active = true 
          AND (last_motivation_date IS NULL OR last_motivation_date < target_date::date)
        RETURNING 
          goals.id,
          goals.user_id,
          goals.title,
          goals.description,
          goals.target_date,
          goals.tone,
          goals.streak_count,
          goals.last_check_in,
          goals.last_motivation_date,
          goals.is_active,
          goals.created_at,
          goals.updated_at,
          goals.streak_insurance_days;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Execute the SQL directly using the PostgreSQL connection
    const { data, error } = await supabase
      .from('goals')
      .select('id')
      .limit(0); // Just to test connectivity

    if (error) {
      throw error;
    }

    console.log('[SETUP-ATOMIC] Database connection verified, function SQL ready');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Atomic function SQL generated successfully',
        sql: createFunctionSQL,
        instructions: [
          '1. Copy the SQL from the "sql" field below',
          '2. Go to Supabase Dashboard > SQL Editor',
          '3. Paste and execute the SQL to create the atomic function',
          '4. This will prevent duplicate email issues'
        ],
        nextStep: 'Execute the SQL in Supabase Dashboard, then redeploy send-daily-emails function'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[SETUP-ATOMIC] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        fallback: 'The current code will use the two-step fallback method until the atomic function is created'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);