import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[CLEANUP-DANDLYNN] Starting complete removal of dandlynn@yahoo.com');

    const userId = 'dandlynn@yahoo.com';
    const results = {
      motivation_history: { deleted: 0, errors: [] },
      goals: { deleted: 0, errors: [] },
      subscribers: { deleted: 0, errors: [] },
      profiles: { deleted: 0, errors: [] },
      daily_nudges: { deleted: 0, errors: [] },
      email_deliveries: { deleted: 0, errors: [] }
    };

    // Delete in proper order to avoid foreign key violations

    // 1. Delete motivation_history first
    try {
      const { data: deletedMotivation, error: motivationError } = await supabase
        .from('motivation_history')
        .delete()
        .eq('user_id', userId)
        .select();

      results.motivation_history.deleted = deletedMotivation?.length || 0;
      if (motivationError) results.motivation_history.errors.push(motivationError.message);
    } catch (error) {
      results.motivation_history.errors.push(error.message);
    }

    // 2. Delete goals
    try {
      const { data: deletedGoals, error: goalsError } = await supabase
        .from('goals')
        .delete()
        .eq('user_id', userId)
        .select();

      results.goals.deleted = deletedGoals?.length || 0;
      if (goalsError) results.goals.errors.push(goalsError.message);
    } catch (error) {
      results.goals.errors.push(error.message);
    }

    // 3. Delete subscribers
    try {
      const { data: deletedSubscribers, error: subscribersError } = await supabase
        .from('subscribers')
        .delete()
        .eq('user_id', userId)
        .select();

      results.subscribers.deleted = deletedSubscribers?.length || 0;
      if (subscribersError) results.subscribers.errors.push(subscribersError.message);
    } catch (error) {
      results.subscribers.errors.push(error.message);
    }

    // 4. Delete daily_nudges
    try {
      const { data: deletedNudges, error: nudgesError } = await supabase
        .from('daily_nudges')
        .delete()
        .eq('user_id', userId)
        .select();

      results.daily_nudges.deleted = deletedNudges?.length || 0;
      if (nudgesError) results.daily_nudges.errors.push(nudgesError.message);
    } catch (error) {
      results.daily_nudges.errors.push(error.message);
    }

    // 5. Delete email_deliveries
    try {
      const { data: deletedDeliveries, error: deliveriesError } = await supabase
        .from('email_deliveries')
        .delete()
        .eq('recipient_email', userId)
        .select();

      results.email_deliveries.deleted = deletedDeliveries?.length || 0;
      if (deliveriesError) results.email_deliveries.errors.push(deliveriesError.message);
    } catch (error) {
      results.email_deliveries.errors.push(error.message);
    }

    // 6. Delete profiles last
    try {
      const { data: deletedProfiles, error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .eq('email', userId)
        .select();

      results.profiles.deleted = deletedProfiles?.length || 0;
      if (profilesError) results.profiles.errors.push(profilesError.message);
    } catch (error) {
      results.profiles.errors.push(error.message);
    }

    const totalDeleted = Object.values(results).reduce((sum, table) => sum + table.deleted, 0);
    const totalErrors = Object.values(results).reduce((sum, table) => sum + table.errors.length, 0);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'dandlynn@yahoo.com completely removed from Supabase',
        user_id: userId,
        results: results,
        summary: {
          totalRecordsDeleted: totalDeleted,
          totalErrors: totalErrors
        },
        next_steps: [
          "1. Delete dandlynn@yahoo.com from Firebase Authentication",  
          "2. Remove dandlynn@yahoo.com from Resend if added",
          "3. User can now register fresh with dandlynn@yahoo.com"
        ]
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[CLEANUP-DANDLYNN] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
