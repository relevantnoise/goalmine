import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[ADD-PILLAR-TYPE] Function started');
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing environment variables');
    }
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    // Add pillar_type column to goals table
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'goals' AND column_name = 'pillar_type'
          ) THEN
            ALTER TABLE goals ADD COLUMN pillar_type TEXT;
            COMMENT ON COLUMN goals.pillar_type IS 'Current 6 Pillars terminology (replaces circle_type/element_type)';
          END IF;
        END $$;
      `
    });

    if (error) {
      console.error('Error adding pillar_type column:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('✅ pillar_type column added successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'pillar_type column added to goals table'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error:', errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});