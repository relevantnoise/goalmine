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
    const DAN_EMAIL = 'danlynn@gmail.com';
    
    console.log('[RESET-DAN] Starting reset for testing purposes...');

    // Get Dan's profile for Firebase UID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', DAN_EMAIL)
      .single();

    if (!profile) {
      throw new Error('Dan profile not found');
    }

    const danUserId = profile.id;
    console.log('[RESET-DAN] Found Dan profile:', DAN_EMAIL, 'UID:', danUserId);

    // Get framework ID before deletion
    const { data: framework } = await supabase
      .from('user_frameworks')
      .select('id')
      .eq('user_id', danUserId)
      .single();

    const deletions = [];

    if (framework) {
      console.log('[RESET-DAN] Found framework to clean:', framework.id);

      // Delete AI insights
      const { error: insightsError } = await supabase
        .from('ai_insights')
        .delete()
        .eq('framework_id', framework.id);

      if (insightsError) {
        console.log('[RESET-DAN] AI insights error (may not exist):', insightsError);
      } else {
        deletions.push('AI insights');
      }

      // Delete weekly check-ins
      const { error: checkinsError } = await supabase
        .from('weekly_checkins')
        .delete()
        .eq('framework_id', framework.id);

      if (checkinsError) {
        console.log('[RESET-DAN] Weekly check-ins error (may not exist):', checkinsError);
      } else {
        deletions.push('Weekly check-ins');
      }

      // Delete work happiness
      const { error: workError } = await supabase
        .from('work_happiness')
        .delete()
        .eq('framework_id', framework.id);

      if (workError) {
        console.log('[RESET-DAN] Work happiness error (may not exist):', workError);
      } else {
        deletions.push('Work happiness');
      }

      // Delete framework elements
      const { error: elementsError } = await supabase
        .from('framework_elements')
        .delete()
        .eq('framework_id', framework.id);

      if (elementsError) {
        console.log('[RESET-DAN] Framework elements error (may not exist):', elementsError);
      } else {
        deletions.push('Framework elements');
      }

      // Delete user framework
      const { error: frameworkError } = await supabase
        .from('user_frameworks')
        .delete()
        .eq('id', framework.id);

      if (frameworkError) {
        throw new Error(`Failed to delete framework: ${frameworkError.message}`);
      } else {
        deletions.push('User framework');
      }
    }

    // Delete goals (hybrid system - check both email and UID)
    const { error: goalsError } = await supabase
      .from('goals')
      .delete()
      .or(`user_id.eq.${DAN_EMAIL},user_id.eq.${danUserId}`);

    if (goalsError) {
      console.log('[RESET-DAN] Goals error (may not exist):', goalsError);
    } else {
      deletions.push('Goals');
    }

    // Delete motivation history
    const { error: motivationError } = await supabase
      .from('motivation_history')
      .delete()
      .or(`user_id.eq.${DAN_EMAIL},user_id.eq.${danUserId}`);

    if (motivationError) {
      console.log('[RESET-DAN] Motivation history error (may not exist):', motivationError);
    } else {
      deletions.push('Motivation history');
    }

    console.log('[RESET-DAN] Reset completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Dan data reset for testing completed successfully',
      data: {
        userEmail: DAN_EMAIL,
        userId: danUserId,
        deletedItems: deletions,
        note: 'Profile and subscription preserved',
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[RESET-DAN] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);