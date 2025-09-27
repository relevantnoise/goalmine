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

  // 🚨 CRITICAL SAFETY CHECK - PREVENT PRODUCTION DATA DELETION
  try {
    // Check if this is production database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // PRODUCTION SAFETY: Require explicit confirmation
    const body = await req.json().catch(() => ({}))
    const confirmation = body?.confirmation
    
    if (confirmation !== 'DELETE_ALL_DATA_PERMANENTLY_I_AM_SURE') {
      console.log('🚫 BLOCKED: cleanup-database requires explicit confirmation')
      return new Response(JSON.stringify({
        error: 'SAFETY PROTECTION ENABLED',
        message: 'This function deletes ALL USER DATA permanently. To proceed, send POST request with confirmation: "DELETE_ALL_DATA_PERMANENTLY_I_AM_SURE"',
        warning: 'This action cannot be undone. Ensure you have backups.',
        blocked: true
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🧹 CONFIRMED: Starting complete database cleanup (ALL DATA WILL BE DELETED)...')

    // Get current data counts
    const { data: profilesCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { data: goalsCount } = await supabaseAdmin
      .from('goals')
      .select('*', { count: 'exact', head: true })

    const { data: motivationCount } = await supabaseAdmin
      .from('motivation_history')
      .select('*', { count: 'exact', head: true })

    const { data: subscribersCount } = await supabaseAdmin
      .from('subscribers')
      .select('*', { count: 'exact', head: true })

    console.log('📊 Current data counts:', {
      profiles: profilesCount,
      goals: goalsCount,
      motivation_history: motivationCount,
      subscribers: subscribersCount
    })

    // Delete all motivation history first (has foreign keys to goals and users)
    const { error: motivationError } = await supabaseAdmin
      .from('motivation_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (motivationError) {
      console.error('Error deleting motivation_history:', motivationError)
    } else {
      console.log('✅ Deleted all motivation_history records')
    }

    // Delete all goals (has foreign keys to users)
    const { error: goalsError } = await supabaseAdmin
      .from('goals')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (goalsError) {
      console.error('Error deleting goals:', goalsError)
    } else {
      console.log('✅ Deleted all goals records')
    }

    // Delete all subscribers (independent table)
    const { error: subscribersError } = await supabaseAdmin
      .from('subscribers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (subscribersError) {
      console.error('Error deleting subscribers:', subscribersError)
    } else {
      console.log('✅ Deleted all subscribers records')
    }

    // Delete all profiles (root user table)
    const { error: profilesError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (profilesError) {
      console.error('Error deleting profiles:', profilesError)
    } else {
      console.log('✅ Deleted all profiles records')
    }

    // Verify cleanup by getting final counts
    const { count: finalProfilesCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: finalGoalsCount } = await supabaseAdmin
      .from('goals')
      .select('*', { count: 'exact', head: true })

    const { count: finalMotivationCount } = await supabaseAdmin
      .from('motivation_history')
      .select('*', { count: 'exact', head: true })

    const { count: finalSubscribersCount } = await supabaseAdmin
      .from('subscribers')
      .select('*', { count: 'exact', head: true })

    const finalCounts = {
      profiles: finalProfilesCount || 0,
      goals: finalGoalsCount || 0,
      motivation_history: finalMotivationCount || 0,
      subscribers: finalSubscribersCount || 0
    }

    console.log('📊 Final data counts after cleanup:', finalCounts)

    const allTablesEmpty = Object.values(finalCounts).every(count => count === 0)

    return new Response(
      JSON.stringify({
        success: true,
        message: allTablesEmpty ? 'Database cleanup complete! All user data removed.' : 'Cleanup completed with some records remaining',
        beforeCounts: {
          profiles: profilesCount,
          goals: goalsCount,
          motivation_history: motivationCount,
          subscribers: subscribersCount
        },
        afterCounts: finalCounts,
        allTablesEmpty
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Database cleanup failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Failed to clean database. Check function logs for details.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})