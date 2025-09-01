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
    console.log('🧹 Starting test user cleanup...');

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Test user identifiers to clean up
    const testUsers = [
      '5R1UvfoYxnSTICHttpvxTTvMSk13',
      'cXNtDKZ87jNlwpLawRcJlABjNGJ3', 
      'dandlynn@yahoo.com',
      'danlynn@gmail.com',
      'Zei702fkNMfJMr938dTHxdSNczE2'
    ];

    const results = [];

    // Step 1: Delete motivation_history (has foreign keys)
    console.log('🗑️ Deleting motivation_history records...');
    const { error: motivationError, count: motivationCount } = await supabase
      .from('motivation_history')
      .delete()
      .in('user_id', testUsers);
      
    if (motivationError) {
      console.error('Error deleting motivation_history:', motivationError);
    } else {
      console.log(`✅ Deleted ${motivationCount} motivation_history records`);
      results.push({ table: 'motivation_history', deleted: motivationCount });
    }

    // Step 2: Delete goals
    console.log('🗑️ Deleting goals records...');
    const { error: goalsError, count: goalsCount } = await supabase
      .from('goals')
      .delete()
      .in('user_id', testUsers);
      
    if (goalsError) {
      console.error('Error deleting goals:', goalsError);
    } else {
      console.log(`✅ Deleted ${goalsCount} goals records`);
      results.push({ table: 'goals', deleted: goalsCount });
    }

    // Step 3: Delete subscribers
    console.log('🗑️ Deleting subscribers records...');
    const { error: subscribersError, count: subscribersCount } = await supabase
      .from('subscribers')
      .delete()
      .in('user_id', testUsers);
      
    if (subscribersError) {
      console.error('Error deleting subscribers:', subscribersError);
    } else {
      console.log(`✅ Deleted ${subscribersCount} subscribers records`);
      results.push({ table: 'subscribers', deleted: subscribersCount });
    }

    // Step 4: Delete profiles by ID
    console.log('🗑️ Deleting profiles records by ID...');
    const { error: profilesIdError, count: profilesIdCount } = await supabase
      .from('profiles')
      .delete()
      .in('id', testUsers);
      
    if (profilesIdError) {
      console.error('Error deleting profiles by ID:', profilesIdError);
    } else {
      console.log(`✅ Deleted ${profilesIdCount} profiles records by ID`);
      results.push({ table: 'profiles (by ID)', deleted: profilesIdCount });
    }

    // Step 5: Delete profiles by email
    console.log('🗑️ Deleting profiles records by email...');
    const testEmails = ['dandlynn@yahoo.com', 'danlynn@gmail.com'];
    const { error: profilesEmailError, count: profilesEmailCount } = await supabase
      .from('profiles')
      .delete()
      .in('email', testEmails);
      
    if (profilesEmailError) {
      console.error('Error deleting profiles by email:', profilesEmailError);
    } else {
      console.log(`✅ Deleted ${profilesEmailCount} profiles records by email`);
      results.push({ table: 'profiles (by email)', deleted: profilesEmailCount });
    }

    console.log('✅ Test user cleanup completed successfully');
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Test user cleanup completed",
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});