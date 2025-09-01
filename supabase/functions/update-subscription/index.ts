import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { userId, planName, status } = await req.json();

    console.log(`Updating subscription for user: ${userId} to plan: ${planName} status: ${status}`);

    // Update or insert subscription - using correct column names
    const { data, error } = await supabase
      .from('subscribers')
      .upsert({
        user_id: userId,
        email: userId, // Since we're using email as user_id
        stripe_customer_id: `cus_test_${userId.replace('@', '_').replace('.', '_')}`,
        subscribed: status === 'active',
        subscription_tier: planName,
        subscription_end: '2025-12-31T23:59:59.000Z',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
      .select();

    if (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }

    console.log('Subscription updated successfully:', data);

    return new Response(JSON.stringify({ 
      success: true, 
      subscription: data[0],
      message: `User ${userId} updated to ${planName} with status ${status}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in update-subscription function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});