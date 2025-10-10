import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Debugging nudge issue for both test users...');

    const testUsers = ['danlynn@gmail.com', 'dandlynn@yahoo.com'];
    const today = new Date().toISOString().split('T')[0];
    const results = {};

    for (const email of testUsers) {
      console.log(`\n--- Investigating ${email} ---`);
      
      // 1. Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError) {
        console.log(`❌ Profile error for ${email}:`, profileError);
        results[email] = { error: 'Profile not found', profileError };
        continue;
      }

      console.log(`✅ Profile found for ${email}:`, {
        id: profile.id,
        email: profile.email,
        created_at: profile.created_at
      });

      // 2. Check daily_nudges table
      const { data: nudgeRecords, error: nudgeError } = await supabase
        .from('daily_nudges')
        .select('*')
        .eq('user_id', profile.id)
        .eq('nudge_date', today);

      console.log(`📊 Nudge records for ${email} on ${today}:`, nudgeRecords);

      // 3. Test the get_daily_nudge_status function
      const { data: statusData, error: statusError } = await supabase
        .rpc('get_daily_nudge_status', {
          target_user_id: profile.id
        });

      console.log(`📈 Nudge status function result for ${email}:`, statusData, statusError);

      // 4. Check subscription status
      const { data: subscription, error: subError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', email); // Note: subscribers uses email as user_id

      console.log(`💰 Subscription data for ${email}:`, subscription);

      results[email] = {
        profile: profile,
        nudgeRecords: nudgeRecords,
        nudgeStatus: statusData,
        statusError: statusError,
        subscription: subscription,
        subError: subError
      };
    }

    return new Response(JSON.stringify({
      success: true,
      investigation: results,
      today: today
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Debug failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});