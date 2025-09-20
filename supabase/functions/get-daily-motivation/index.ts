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
    
    // Get the current goal to check streak count
    const { data: currentGoal, error: goalError } = await supabase
      .from('goals')
      .select('streak_count, title, description, tone, target_date')
      .eq('id', goalId)
      .single();

    if (goalError) {
      console.error('Error fetching goal:', goalError);
      throw goalError;
    }

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

    // Check if we need fresh content due to streak change
    const needsFreshContent = !motivationHistory || 
      (motivationHistory.streak_count !== currentGoal.streak_count);

    if (needsFreshContent) {
      console.log(motivationHistory ? 
        `Streak changed from ${motivationHistory.streak_count} to ${currentGoal.streak_count} - generating fresh content` :
        'No motivation found for today - generating fresh content');
      
      // Generate fresh motivation with current streak
      try {
        const { data: newMotivation, error: genError } = await supabase.functions.invoke('generate-daily-motivation', {
          body: {
            goalId: goalId,
            goalTitle: currentGoal.title,
            goalDescription: currentGoal.description || '',
            tone: currentGoal.tone || 'kind_encouraging',
            streakCount: currentGoal.streak_count,
            targetDate: currentGoal.target_date,
            userId: userId,
            isNudge: false
          }
        });

        if (genError) {
          console.error('Error generating fresh motivation:', genError);
          // Fall back to existing content if available
          if (motivationHistory) {
            return new Response(JSON.stringify({ 
              success: true, 
              motivation: motivationHistory 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          throw genError;
        }

        console.log('Generated fresh motivation with current streak');
        return new Response(JSON.stringify(newMotivation), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Failed to generate fresh motivation:', error);
        // Fall back to existing content if available
        if (motivationHistory) {
          console.log('Falling back to existing content');
          return new Response(JSON.stringify({ 
            success: true, 
            motivation: motivationHistory 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw error;
      }
    }

    console.log('Using existing motivation (streak unchanged):', motivationHistory.message);

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