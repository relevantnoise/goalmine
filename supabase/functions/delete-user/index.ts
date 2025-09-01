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
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`🧹 Deleting all data for user: ${email}`)

    // First, find the user's profile to get their ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error finding profile:', profileError)
      return new Response(
        JSON.stringify({ success: false, error: 'Error finding user profile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!profile) {
      console.log(`ℹ️ No profile found for ${email}`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `No user data found for ${email} - nothing to delete`,
          deletedRecords: { profiles: 0, goals: 0, motivation_history: 0, subscribers: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`📋 Found user profile:`, { id: profile.id, email: profile.email })

    // Delete all motivation history for this user (has foreign keys to goals and users)
    const { error: motivationError, count: motivationCount } = await supabaseAdmin
      .from('motivation_history')
      .delete({ count: 'exact' })
      .eq('user_id', profile.id)

    if (motivationError) {
      console.error('Error deleting motivation_history:', motivationError)
    } else {
      console.log(`✅ Deleted ${motivationCount || 0} motivation_history records`)
    }

    // Delete all goals for this user (has foreign keys to users)
    const { error: goalsError, count: goalsCount } = await supabaseAdmin
      .from('goals')
      .delete({ count: 'exact' })
      .eq('user_id', profile.id)

    if (goalsError) {
      console.error('Error deleting goals:', goalsError)
    } else {
      console.log(`✅ Deleted ${goalsCount || 0} goals records`)
    }

    // Delete subscriber record (if exists)
    const { error: subscriberError, count: subscriberCount } = await supabaseAdmin
      .from('subscribers')
      .delete({ count: 'exact' })
      .eq('email', email)

    if (subscriberError) {
      console.error('Error deleting subscriber:', subscriberError)
    } else {
      console.log(`✅ Deleted ${subscriberCount || 0} subscriber records`)
    }

    // Finally, delete the user profile
    const { error: profileDeleteError, count: profileCount } = await supabaseAdmin
      .from('profiles')
      .delete({ count: 'exact' })
      .eq('email', email)

    if (profileDeleteError) {
      console.error('Error deleting profile:', profileDeleteError)
      return new Response(
        JSON.stringify({ success: false, error: 'Error deleting user profile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    } else {
      console.log(`✅ Deleted ${profileCount || 0} profile records`)
    }

    const deletedRecords = {
      profiles: profileCount || 0,
      goals: goalsCount || 0,
      motivation_history: motivationCount || 0,
      subscribers: subscriberCount || 0
    }

    console.log(`🎉 Successfully deleted all data for ${email}:`, deletedRecords)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully deleted all data for ${email}`,
        deletedRecords,
        user: {
          id: profile.id,
          email: profile.email,
          created_at: profile.created_at
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Delete user failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Failed to delete user data. Check function logs for details.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})