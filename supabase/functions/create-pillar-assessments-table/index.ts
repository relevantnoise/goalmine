import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🏛️ Creating pillar_assessments table...')

    // Create only the missing pillar_assessments table
    await supabaseClient.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS pillar_assessments (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          framework_id uuid REFERENCES user_frameworks(id) ON DELETE CASCADE,
          pillar_name text NOT NULL,
          importance_level integer NOT NULL CHECK (importance_level >= 1 AND importance_level <= 10),
          current_hours_per_week numeric NOT NULL CHECK (current_hours_per_week >= 0),
          ideal_hours_per_week numeric NOT NULL CHECK (ideal_hours_per_week >= 0),
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now(),
          
          CONSTRAINT unique_framework_pillar UNIQUE (framework_id, pillar_name)
        );
        
        ALTER TABLE pillar_assessments ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Unrestricted access" ON pillar_assessments FOR ALL USING (true) WITH CHECK (true);
      `
    })

    console.log('✅ pillar_assessments table created successfully!')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'pillar_assessments table created',
        table: 'pillar_assessments'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Table creation failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})