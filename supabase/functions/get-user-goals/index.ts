import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()
    
    console.log('🔍 Fetching goals for user:', userId)
    
    // Create Supabase client with service role key for direct DB access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    
    // Debug logging for goal lookup
    console.log('🔍 Looking up goals for user ID:', userId)

    // Fetch goals directly from database bypassing RLS
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Database error fetching goals:', error)
      throw error
    }

    console.log('✅ Goals fetched for userId', userId, ':', goals?.length || 0)
    
    // If no goals found with Firebase UID, try with email for test users
    let finalGoals = goals || []
    if ((!goals || goals.length === 0)) {
      console.log('🔄 No goals found with user ID, trying alternative lookups...')
      
      // No goals found with primary user ID
      console.log('❌ No goals found for this user in the database')
    }

    return new Response(JSON.stringify({ 
      success: true, 
      goals: finalGoals || [],
      count: finalGoals?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Error in get-user-goals function:', error)
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      goals: [],
      count: 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})