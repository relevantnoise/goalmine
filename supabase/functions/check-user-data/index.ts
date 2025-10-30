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

    const userEmail = 'danlynn@gmail.com'
    console.log('🔍 Checking user data for:', userEmail)

    // Check what columns the profiles table actually has
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single()

    console.log('👤 Profile data:', JSON.stringify(profileData, null, 2))
    console.log('👤 Profile error:', profileError)

    if (profileError) {
      throw new Error(`Profile lookup failed: ${profileError.message}`)
    }

    // Check what tables exist
    const { data: tables, error: tablesError } = await supabaseClient
      .rpc('exec', {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('user_frameworks', 'pillar_assessments', 'work_happiness')
          ORDER BY table_name;
        `
      })

    console.log('📋 Tables check:', { tables, tablesError })

    return new Response(
      JSON.stringify({
        success: true,
        userEmail,
        profile: profileData,
        tablesInfo: { tables, tablesError }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Check failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})