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
    console.log('[CLEANUP-DANDLYNN] Starting dandlynn@yahoo.com cleanup');

    // Initialize Supabase client with service role for full database access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const email = 'dandlynn@yahoo.com';
    let deletedCounts = {
      motivation_history: 0,
      goals: 0,
      daily_nudges: 0,
      subscribers: 0,
      profiles: 0
    };

    // Delete motivation_history first (has foreign keys)
    console.log('[CLEANUP-DANDLYNN] Deleting motivation_history...');
    const { count: motivationCount, error: motivationError } = await supabase
      .from('motivation_history')
      .delete({ count: 'exact' })
      .eq('user_id', email);
    
    if (motivationError) {
      console.error('motivation_history error:', motivationError);
    } else {
      deletedCounts.motivation_history = motivationCount || 0;
      console.log(`[CLEANUP-DANDLYNN] Deleted ${deletedCounts.motivation_history} motivation records`);
    }

    // Delete goals next
    console.log('[CLEANUP-DANDLYNN] Deleting goals...');
    const { count: goalsCount, error: goalsError } = await supabase
      .from('goals')
      .delete({ count: 'exact' })
      .eq('user_id', email);
    
    if (goalsError) {
      console.error('goals error:', goalsError);
    } else {
      deletedCounts.goals = goalsCount || 0;
      console.log(`[CLEANUP-DANDLYNN] Deleted ${deletedCounts.goals} goals`);
    }

    // Delete daily_nudges records
    console.log('[CLEANUP-DANDLYNN] Deleting daily_nudges...');
    const { count: nudgesCount, error: nudgesError } = await supabase
      .from('daily_nudges')
      .delete({ count: 'exact' })
      .eq('user_id', email);
    
    if (nudgesError) {
      console.error('daily_nudges error:', nudgesError);
    } else {
      deletedCounts.daily_nudges = nudgesCount || 0;
      console.log(`[CLEANUP-DANDLYNN] Deleted ${deletedCounts.daily_nudges} nudge records`);
    }

    // Delete subscribers (both by user_id and email)
    console.log('[CLEANUP-DANDLYNN] Deleting subscribers...');
    const { count: subscribersCount, error: subscribersError } = await supabase
      .from('subscribers')
      .delete({ count: 'exact' })
      .or(`user_id.eq.${email},email.eq.${email}`);
    
    if (subscribersError) {
      console.error('subscribers error:', subscribersError);
    } else {
      deletedCounts.subscribers = subscribersCount || 0;
      console.log(`[CLEANUP-DANDLYNN] Deleted ${deletedCounts.subscribers} subscription records`);
    }

    // Delete profiles by email
    console.log('[CLEANUP-DANDLYNN] Deleting profiles...');
    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .delete({ count: 'exact' })
      .eq('email', email);
    
    if (profilesError) {
      console.error('profiles error:', profilesError);
    } else {
      deletedCounts.profiles = profilesCount || 0;
      console.log(`[CLEANUP-DANDLYNN] Deleted ${deletedCounts.profiles} profile records`);
    }

    const totalDeleted = Object.values(deletedCounts).reduce((sum, count) => sum + count, 0);
    
    console.log(`[CLEANUP-DANDLYNN] Complete! Deleted ${totalDeleted} total records for ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully cleaned ${email} from production database`,
        deletedCounts,
        totalDeleted,
        email,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[CLEANUP-DANDLYNN] Error:', error);
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