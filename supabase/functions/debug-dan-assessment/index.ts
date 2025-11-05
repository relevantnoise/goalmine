import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const userEmail = "danlynn@gmail.com";
    console.log('[DEBUG-DAN] Fetching assessment data for:', userEmail);

    // Get framework data
    const { data: framework, error: frameworkError } = await supabaseClient
      .from('user_frameworks')
      .select('*')
      .eq('user_email', userEmail)
      .maybeSingle();

    if (frameworkError) {
      console.error('[DEBUG-DAN] Framework error:', frameworkError);
      return new Response(
        JSON.stringify({ error: 'Framework error', details: frameworkError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!framework) {
      return new Response(
        JSON.stringify({ error: 'No framework found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get pillar assessments
    const { data: pillars, error: pillarsError } = await supabaseClient
      .from('pillar_assessments')
      .select('*')
      .eq('framework_id', framework.id);

    // Get work happiness
    const { data: workHappiness, error: workError } = await supabaseClient
      .from('work_happiness')
      .select('*')
      .eq('framework_id', framework.id)
      .maybeSingle();

    // Get AI insights
    const { data: aiInsights, error: aiError } = await supabaseClient
      .from('ai_insights')
      .select('*')
      .eq('framework_id', framework.id);

    console.log('[DEBUG-DAN] Data fetched:');
    console.log('Framework:', framework);
    console.log('Pillars:', pillars);
    console.log('Work Happiness:', workHappiness);
    console.log('AI Insights:', aiInsights?.length || 0);

    // Analyze the data like the frontend algorithm would
    const elements = pillars?.map(pillar => ({
      name: pillar.pillar_name,
      current: pillar.current_hours_per_week || 0,
      desired: pillar.ideal_hours_per_week || 0,
      importance: pillar.importance_level || 0,
      gap: (pillar.ideal_hours_per_week || 0) - (pillar.current_hours_per_week || 0)
    })) || [];

    // Calculate key metrics that algorithm uses
    const biggestGap = elements.reduce((max, element) => 
      Math.abs(element.gap) > Math.abs(max.gap) ? element : max, 
      elements[0] || { name: 'None', gap: 0 }
    );

    const totalCurrentHours = elements.reduce((sum, el) => sum + el.current, 0);
    const totalDesiredHours = elements.reduce((sum, el) => sum + el.desired, 0);

    const workElement = elements.find(el => el.name === 'Work') || {};
    const sleepElement = elements.find(el => el.name === 'Sleep') || {};
    const healthElement = elements.find(el => el.name === 'Health & Fitness') || {};

    const workOverload = workElement.current > 50;
    const sleepDeprived = sleepElement.current < 49;
    const neglectingHealth = healthElement.current < 5;
    const burnoutPattern = workOverload && (sleepDeprived || neglectingHealth);

    // Work happiness analysis
    let workInsights = { focus: null, pattern: null, severity: 'normal' };
    if (workHappiness) {
      const gaps = {
        impact: workHappiness.impact_desired - workHappiness.impact_current,
        enjoyment: workHappiness.enjoyment_desired - workHappiness.enjoyment_current,
        income: workHappiness.income_desired - workHappiness.income_current,
        flexibility: workHappiness.remote_desired - workHappiness.remote_current
      };
      const maxGap = Math.max(...Object.values(gaps));
      workInsights.focus = Object.keys(gaps).find(key => gaps[key] === maxGap);
      
      if (maxGap >= 6) workInsights.severity = 'high';
      else if (maxGap >= 3) workInsights.severity = 'medium';
      else workInsights.severity = 'low';
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        rawData: {
          framework,
          pillars,
          workHappiness,
          aiInsightsCount: aiInsights?.length || 0
        },
        processedData: {
          elements,
          biggestGap,
          totalCurrentHours,
          totalDesiredHours,
          workOverload,
          sleepDeprived,
          neglectingHealth,
          burnoutPattern,
          workInsights
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DEBUG-DAN] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})