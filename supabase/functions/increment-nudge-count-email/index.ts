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
    console.log('📈 Incrementing nudge count for:', userEmail);

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

    // 3. Get current nudge count for today
    const today = new Date().toISOString().split('T')[0];
    const { data: nudgeRecord } = await supabase
      .from('daily_nudges')
      .select('nudge_count')
      .eq('user_id', profile.id)
      .eq('nudge_date', today)
      .single();

    const currentCount = nudgeRecord?.nudge_count || 0;

    console.log('📊 Current nudge count:', currentCount);

    // 4. Check if limit would be exceeded
    if (currentCount >= maxNudges) {
      const error = userSubscribed 
        ? `You've reached your daily nudge limit of ${maxNudges}.`
        : 'You get 1 free nudge per day, but you can upgrade to get up to 3 nudges daily!';
      
      console.log('🚫 Nudge limit reached:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error,
        current_count: currentCount,
        max_nudges: maxNudges,
        user_subscribed: userSubscribed,
        remaining: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Increment nudge count (manual upsert since table has UUID constraint)
    let upsertError = null;
    
    if (currentCount === 0) {
      // First nudge of the day - insert new record
      const { error: insertError } = await supabase
        .from('daily_nudges')
        .insert({
          user_id: profile.id,
          nudge_date: today,
          nudge_count: 1
        });
      upsertError = insertError;
    } else {
      // Update existing record
      const { error: updateError } = await supabase
        .from('daily_nudges')
        .update({ 
          nudge_count: currentCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.id)
        .eq('nudge_date', today);
      upsertError = updateError;
    }

    if (upsertError) {
      throw new Error(`Failed to update nudge count: ${upsertError.message}`);
    }

    const newCount = currentCount + 1;
    console.log('✅ Nudge count updated to:', newCount);

    return new Response(JSON.stringify({
      success: true,
      current_count: newCount,
      max_nudges: maxNudges,
      user_subscribed: userSubscribed,
      remaining: maxNudges - newCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error incrementing nudge count:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});