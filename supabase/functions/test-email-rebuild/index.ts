import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[TEST-REBUILD] 🧪 Testing email system with current data');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const todayUTC = now.toISOString().split('T')[0];
    
    console.log('[TEST-REBUILD] 📅 Today UTC:', todayUTC);

    // Check current goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true);

    console.log('[TEST-REBUILD] 🎯 Active goals:', goals?.length || 0);
    
    if (goals) {
      for (const goal of goals) {
        console.log(`[TEST-REBUILD] Goal: "${goal.title}"`, {
          id: goal.id,
          user_id: goal.user_id,
          last_motivation_date: goal.last_motivation_date,
          needsEmail: goal.last_motivation_date !== todayUTC
        });
      }
    }

    // Check profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, trial_expires_at')
      .limit(10);

    console.log('[TEST-REBUILD] 👥 Profiles:', profiles?.length || 0);
    if (profiles) {
      for (const profile of profiles) {
        console.log(`[TEST-REBUILD] Profile:`, {
          id: profile.id,
          email: profile.email,
          trial_expires_at: profile.trial_expires_at
        });
      }
    }

    // Now test the actual email function
    console.log('[TEST-REBUILD] 🚀 Testing send-daily-emails-simple-rebuild...');
    
    const emailResponse = await supabase.functions.invoke('send-daily-emails-simple-rebuild', {
      body: {}
    });

    console.log('[TEST-REBUILD] 📧 Email function response:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      todayUTC,
      goals: goals?.length || 0,
      profiles: profiles?.length || 0,
      emailResponse: emailResponse.data,
      emailError: emailResponse.error
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('[TEST-REBUILD] ❌ Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);