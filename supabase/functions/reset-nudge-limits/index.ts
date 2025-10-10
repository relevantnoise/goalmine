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

    console.log('🔄 Resetting nudge limits for test users...');

    const testUsers = ['danlynn@gmail.com', 'dandlynn@yahoo.com'];
    const today = new Date().toISOString().split('T')[0];

    for (const email of testUsers) {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profile) {
        // Reset or delete today's nudge record
        const { error: deleteError } = await supabase
          .from('daily_nudges')
          .delete()
          .eq('user_id', profile.id)
          .eq('nudge_date', today);

        if (deleteError) {
          console.log(`⚠️ No nudge record to delete for ${email} on ${today}`);
        } else {
          console.log(`✅ Reset nudge limit for ${email} (user_id: ${profile.id})`);
        }
      } else {
        console.log(`❌ User not found: ${email}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Nudge limits reset for test users',
      resetDate: today,
      users: testUsers
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Reset failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});