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

  // 🚨 CRITICAL SAFETY CHECK - PREVENT PRODUCTION DATA DELETION
  try {
    // PRODUCTION SAFETY: Require explicit confirmation
    const body = await req.json().catch(() => ({}))
    const confirmation = body?.confirmation
    
    if (confirmation !== 'DELETE_ALL_DATA_PERMANENTLY_I_AM_SURE') {
      console.log('🚫 BLOCKED: cleanup-all-data requires explicit confirmation')
      return new Response(JSON.stringify({
        error: 'SAFETY PROTECTION ENABLED',
        message: 'This function deletes ALL USER DATA permanently. To proceed, send POST request with confirmation: "DELETE_ALL_DATA_PERMANENTLY_I_AM_SURE"',
        warning: 'This action cannot be undone. Ensure you have backups.',
        blocked: true
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      })
    }

    console.log('🧹 CONFIRMED: Starting complete database cleanup (ALL DATA WILL BE DELETED)...');

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Delete in correct order (foreign key constraints)
    console.log('🗑️ Deleting motivation_history...');
    const { error: motivationError } = await supabase
      .from('motivation_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (motivationError) {
      console.error('Error deleting motivation_history:', motivationError);
    }

    console.log('🗑️ Deleting goals...');
    const { error: goalsError } = await supabase
      .from('goals')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (goalsError) {
      console.error('Error deleting goals:', goalsError);
    }

    console.log('🗑️ Deleting subscribers...');
    const { error: subscribersError } = await supabase
      .from('subscribers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (subscribersError) {
      console.error('Error deleting subscribers:', subscribersError);
    }

    console.log('🗑️ Deleting profiles...');
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (profilesError) {
      console.error('Error deleting profiles:', profilesError);
    }

    // Get counts to verify
    const { count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: goalCount } = await supabase
      .from('goals')
      .select('*', { count: 'exact', head: true });

    const { count: motivationCount } = await supabase
      .from('motivation_history')
      .select('*', { count: 'exact', head: true });

    const { count: subscriberCount } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true });

    console.log('✅ Database cleanup complete!');
    console.log(`Remaining counts - Profiles: ${profileCount}, Goals: ${goalCount}, Motivation: ${motivationCount}, Subscribers: ${subscriberCount}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Database cleaned successfully',
      counts: {
        profiles: profileCount,
        goals: goalCount,
        motivation_history: motivationCount,
        subscribers: subscriberCount
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Cleanup function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Unknown error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});