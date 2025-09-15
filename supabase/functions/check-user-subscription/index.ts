import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

    // Get user_id from query params or body
    const url = new URL(req.url)
    const userId = url.searchParams.get('user_id') || 'danlynn@gmail.com'

    console.log(`Checking subscription for user: ${userId}`)

    // Check subscribers table
    const { data: subscriberData, error: subscriberError } = await supabaseClient
      .from('subscribers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (subscriberError) {
      console.error('Subscriber query error:', subscriberError)
    }

    // Check profiles table
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('email', userId)
      .order('created_at', { ascending: false })

    if (profileError) {
      console.error('Profile query error:', profileError)
    }

    // Check goals table
    const { data: goalsData, error: goalsError } = await supabaseClient
      .from('goals')
      .select('id, title, user_id, is_active, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (goalsError) {
      console.error('Goals query error:', goalsError)
    }

    return new Response(
      JSON.stringify({
        user_id: userId,
        subscriber_records: subscriberData || [],
        profile_records: profileData || [],
        goals_records: goalsData || [],
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})