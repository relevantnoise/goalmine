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
    const { goalId, userId } = await req.json();

    console.log(`Getting daily motivation for goal: ${goalId}, user: ${userId}`);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Query for motivation created today for this goal
    const { data: motivationHistory, error } = await supabase
      .from('motivation_history')
      .select('*')
      .eq('goal_id', goalId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching motivation:', error);
      throw error;
    }

    if (!motivationHistory) {
      console.log('No motivation found for today');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No motivation found for today' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Found motivation:', motivationHistory.message);

    return new Response(JSON.stringify({ 
      success: true, 
      motivation: motivationHistory 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-daily-motivation function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});