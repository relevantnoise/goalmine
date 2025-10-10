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

    const { userEmail } = await req.json();
    console.log('🔍 Getting nudge status for:', userEmail);

    // 1. Get user profile to get the actual user_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)
      .single();

    if (profileError || !profile) {
      throw new Error(`Profile not found for ${userEmail}`);
    }

    console.log('✅ Profile found:', profile.id);

    // 2. Check subscription status (subscribers table uses email as user_id)
    const { data: subscription } = await supabase
      .from('subscribers')
      .select('subscribed')
      .eq('user_id', userEmail)
      .eq('subscribed', true)
      .single();

    const userSubscribed = !!subscription;
    const maxNudges = userSubscribed ? 3 : 1;

    console.log('💰 Subscription status:', { userSubscribed, maxNudges });

    // 3. Get today's nudge count
    const today = new Date().toISOString().split('T')[0];
    const { data: nudgeRecord } = await supabase
      .from('daily_nudges')
      .select('nudge_count')
      .eq('user_id', profile.id)
      .eq('nudge_date', today)
      .single();

    const currentCount = nudgeRecord?.nudge_count || 0;

    console.log('📊 Nudge count today:', currentCount);

    const result = {
      currentCount,
      maxNudges,
      userSubscribed,
      remaining: Math.max(0, maxNudges - currentCount),
      atLimit: currentCount >= maxNudges
    };

    console.log('📈 Final nudge status:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error getting nudge status:', error);
    return new Response(JSON.stringify({
      error: error.message,
      // Fallback for safety
      currentCount: 0,
      maxNudges: 1,
      userSubscribed: false,
      remaining: 1,
      atLimit: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});