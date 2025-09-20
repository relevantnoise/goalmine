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
    console.log('[CLEANUP-PROFILES] Starting duplicate profile cleanup');

    // Get all profiles for danlynn@gmail.com
    const { data: danlynProfiles, error: danlynError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'danlynn@gmail.com')
      .order('created_at', { ascending: false }); // Keep the most recent

    if (danlynError) {
      throw new Error(`Error fetching danlynn profiles: ${danlynError.message}`);
    }

    console.log(`[CLEANUP-PROFILES] Found ${danlynProfiles.length} profiles for danlynn@gmail.com`);

    const results = {
      danlynn: {
        totalProfiles: danlynProfiles.length,
        keptProfile: null,
        deletedProfiles: []
      }
    };

    if (danlynProfiles.length > 1) {
      // Keep the most recent profile (first in array due to DESC order)
      const keepProfile = danlynProfiles[0];
      const deleteProfiles = danlynProfiles.slice(1);
      
      results.danlynn.keptProfile = {
        id: keepProfile.id,
        created_at: keepProfile.created_at,
        trial_expires_at: keepProfile.trial_expires_at
      };

      console.log(`[CLEANUP-PROFILES] Keeping profile: ${keepProfile.id} (created: ${keepProfile.created_at})`);

      // Delete the older duplicate profiles
      for (const profile of deleteProfiles) {
        console.log(`[CLEANUP-PROFILES] Deleting duplicate profile: ${profile.id} (created: ${profile.created_at})`);
        
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profile.id);

        if (deleteError) {
          console.error(`[CLEANUP-PROFILES] Error deleting profile ${profile.id}:`, deleteError);
          results.danlynn.deletedProfiles.push({
            id: profile.id,
            error: deleteError.message
          });
        } else {
          results.danlynn.deletedProfiles.push({
            id: profile.id,
            success: true
          });
        }
      }
    }

    // Also reset last_motivation_date for all goals to allow fresh email testing
    console.log('[CLEANUP-PROFILES] Resetting last_motivation_date for all goals');
    
    const { error: resetError } = await supabase
      .from('goals')
      .update({ last_motivation_date: null })
      .in('user_id', ['danlynn@gmail.com', 'dandlynn@yahoo.com']);

    if (resetError) {
      console.error('[CLEANUP-PROFILES] Error resetting last_motivation_date:', resetError);
    } else {
      console.log('[CLEANUP-PROFILES] Successfully reset last_motivation_date for testing');
    }

    console.log('[CLEANUP-PROFILES] Cleanup completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Profile cleanup completed',
        results: results,
        emailDateReset: !resetError
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[CLEANUP-PROFILES] Error:', error);
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