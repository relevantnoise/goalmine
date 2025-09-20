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
    console.log('[CLEANUP] Starting test user cleanup');

    // Allow both POST with body or GET with query param for easier testing
    let email;
    if (req.method === 'POST') {
      const body = await req.json();
      email = body.email;
    } else {
      const url = new URL(req.url);
      email = url.searchParams.get('email');
    }
    
    if (!email) {
      throw new Error('Email is required (use POST with {"email": "..."} or GET with ?email=...)');
    }

    // Initialize Supabase client with service role for full database access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`[CLEANUP] Cleaning up user: ${email}`);

    let deletedCounts = {
      motivation_history: 0,
      goals: 0,
      daily_nudges: 0,
      subscribers: 0,
      profiles: 0
    };

    // Delete motivation_history first (has foreign keys)
    const { count: motivationCount, error: motivationError } = await supabase
      .from('motivation_history')
      .delete({ count: 'exact' })
      .eq('user_id', email);
    
    if (motivationError) throw motivationError;
    deletedCounts.motivation_history = motivationCount || 0;
    console.log(`[CLEANUP] Deleted ${deletedCounts.motivation_history} motivation records`);

    // Delete goals next
    const { count: goalsCount, error: goalsError } = await supabase
      .from('goals')
      .delete({ count: 'exact' })
      .eq('user_id', email);
    
    if (goalsError) throw goalsError;
    deletedCounts.goals = goalsCount || 0;
    console.log(`[CLEANUP] Deleted ${deletedCounts.goals} goals`);

    // Delete daily_nudges records
    const { count: nudgesCount, error: nudgesError } = await supabase
      .from('daily_nudges')
      .delete({ count: 'exact' })
      .eq('user_id', email);
    
    if (nudgesError) throw nudgesError;
    deletedCounts.daily_nudges = nudgesCount || 0;
    console.log(`[CLEANUP] Deleted ${deletedCounts.daily_nudges} nudge records`);

    // Delete subscribers
    const { count: subscribersCount, error: subscribersError } = await supabase
      .from('subscribers')
      .delete({ count: 'exact' })
      .or(`user_id.eq.${email},email.eq.${email}`);
    
    if (subscribersError) throw subscribersError;
    deletedCounts.subscribers = subscribersCount || 0;
    console.log(`[CLEANUP] Deleted ${deletedCounts.subscribers} subscription records`);

    // Delete profiles by email
    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .delete({ count: 'exact' })
      .eq('email', email);
    
    if (profilesError) throw profilesError;
    deletedCounts.profiles = profilesCount || 0;
    console.log(`[CLEANUP] Deleted ${deletedCounts.profiles} profile records`);

    const totalDeleted = Object.values(deletedCounts).reduce((sum, count) => sum + count, 0);
    
    console.log(`[CLEANUP] Complete! Deleted ${totalDeleted} total records for ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully cleaned ${email} from database`,
        deletedCounts,
        totalDeleted,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[CLEANUP] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);