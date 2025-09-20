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
    // Use service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log('🗑️ Starting COMPLETE database cleanup - deleting ALL user data...');

    let totalDeleted = {
      motivation_history: 0,
      goals: 0,
      subscribers: 0,
      profiles: 0
    };

    // Delete ALL motivation_history first (has foreign keys to goals and users)
    const { data: motivationData, error: motivationError } = await supabaseAdmin
      .from('motivation_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
      .select('id');

    if (!motivationError && motivationData) {
      totalDeleted.motivation_history = motivationData.length;
      console.log(`✅ Deleted ${motivationData.length} motivation_history records`);
    } else if (motivationError) {
      console.log(`⚠️ Error deleting motivation_history:`, motivationError);
    }

    // Delete ALL goals (has foreign keys to users)  
    const { data: goalsData, error: goalsError } = await supabaseAdmin
      .from('goals')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
      .select('id, title');

    if (!goalsError && goalsData) {
      totalDeleted.goals = goalsData.length;
      console.log(`✅ Deleted ${goalsData.length} goals:`, goalsData.map(g => g.title));
    } else if (goalsError) {
      console.log(`⚠️ Error deleting goals:`, goalsError);
    }

    // Delete ALL subscribers
    const { data: subscriberData, error: subscriberError } = await supabaseAdmin
      .from('subscribers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
      .select('id');

    if (!subscriberError && subscriberData) {
      totalDeleted.subscribers = subscriberData.length;
      console.log(`✅ Deleted ${subscriberData.length} subscriber records`);
    } else if (subscriberError) {
      console.log(`⚠️ Error deleting subscribers:`, subscriberError);
    }

    // Delete ALL profiles (root user table)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
      .select('id');

    if (!profileError && profileData) {
      totalDeleted.profiles = profileData.length;
      console.log(`✅ Deleted ${profileData.length} profile records`);
    } else if (profileError) {
      console.log(`⚠️ Error deleting profiles:`, profileError);
    }

    console.log('🎯 Complete database cleanup finished!');
    console.log('📊 Total records deleted:', totalDeleted);

    return new Response(JSON.stringify({ 
      success: true,
      message: "🚀 Database completely cleaned! Ready for fresh testing!",
      totalDeleted,
      note: "ALL user data has been wiped clean"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error in delete-test-users function:', errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});