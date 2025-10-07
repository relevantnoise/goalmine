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
    console.log('[PRE-GENERATE] Starting AI content generation for all active goals');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const todayDate = new Date().toISOString().split('T')[0];
    
    // Find goals that need AI content generation
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true)
      .or(`last_motivation_date.is.null,last_motivation_date.lt.${todayDate}`);

    if (error) {
      console.error('[PRE-GENERATE] Error fetching goals:', error);
      throw error;
    }

    console.log(`[PRE-GENERATE] Found ${goals?.length || 0} goals needing content generation`);
    
    let contentGenerated = 0;
    let errors = 0;

    // Generate AI content for each goal
    for (const goal of goals || []) {
      try {
        console.log(`[PRE-GENERATE] Generating content for: ${goal.title}`);
        
        const aiResponse = await supabase.functions.invoke('generate-daily-motivation', {
          body: {
            goalId: goal.id,
            goalTitle: goal.title,
            goalDescription: goal.description || '',
            tone: goal.tone || 'kind_encouraging',
            streakCount: goal.streak_count || 0,
            userId: goal.user_id,
            isNudge: false,
            targetDate: goal.target_date
          }
        });

        if (aiResponse.error || !aiResponse.data) {
          console.error(`[PRE-GENERATE] AI generation failed for ${goal.title}:`, aiResponse.error);
          errors++;
        } else {
          console.log(`[PRE-GENERATE] ✅ Content generated for ${goal.title}`);
          contentGenerated++;
        }

      } catch (error) {
        console.error(`[PRE-GENERATE] Error processing ${goal.title}:`, error);
        errors++;
      }
    }

    console.log(`[PRE-GENERATE] Complete. Generated: ${contentGenerated}, Errors: ${errors}`);

    return new Response(JSON.stringify({
      success: true,
      contentGenerated,
      errors,
      message: `AI content generation completed. Generated ${contentGenerated} with ${errors} errors.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[PRE-GENERATE] Fatal error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);