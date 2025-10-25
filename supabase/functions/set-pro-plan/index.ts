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
    const { email } = await req.json()
    
    if (!email) {
      throw new Error('Email is required')
    }

    // Only allow danlynn@gmail.com for security
    if (email !== 'danlynn@gmail.com') {
      throw new Error('Unauthorized: This function is only for testing purposes')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔧 Setting Pro Plan for:', email)

    // First, check if subscriber record exists
    const { data: existing, error: checkError } = await supabaseClient
      .from('subscribers')
      .select('*')
      .eq('user_id', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existing) {
      // Update existing record
      const { data, error } = await supabaseClient
        .from('subscribers')
        .update({
          subscribed: true,
          subscription_tier: 'Pro Plan',
          subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
        })
        .eq('user_id', email)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Updated existing subscription:', data)
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Pro Plan activated for testing',
        subscription: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      // Create new subscription record
      const { data, error } = await supabaseClient
        .from('subscribers')
        .insert({
          user_id: email,
          subscribed: true,
          subscription_tier: 'Pro Plan',
          subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
        })
        .select()
        .single()

      if (error) throw error

      console.log('✅ Created new Pro Plan subscription:', data)
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Pro Plan activated for testing',
        subscription: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

  } catch (error) {
    console.error('❌ Error setting Pro Plan:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})