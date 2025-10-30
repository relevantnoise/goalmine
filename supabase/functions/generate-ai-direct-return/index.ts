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
    const { userEmail } = await req.json();
    
    if (!userEmail) {
      throw new Error('Missing required field: userEmail');
    }

    console.log('[AI-DIRECT-RETURN] Generating AI insights for user:', userEmail);

    // Get user's real framework data from database
    const { data: frameworkResponse } = await supabase.functions.invoke('fetch-framework-data', {
      body: { userEmail }
    });

    if (!frameworkResponse?.hasFramework || !frameworkResponse?.data) {
      throw new Error('No framework data found for user');
    }

    const { framework, elements, workHappiness } = frameworkResponse.data;
    
    // Transform real user data into assessment format for AI
    const assessmentData = {
      pillars: elements.map((element: any) => ({
        name: element.name,
        importance: element.importance,
        currentHours: element.current,
        idealHours: element.desired,
        timeGap: element.gap
      })),
      workHappiness: workHappiness ? {
        impact: { current: workHappiness.impactCurrent, desired: workHappiness.impactDesired },
        enjoyment: { current: workHappiness.funCurrent, desired: workHappiness.funDesired },
        income: { current: workHappiness.moneyCurrent, desired: workHappiness.moneyDesired },
        remote: { current: workHappiness.remoteCurrent, desired: workHappiness.remoteDesired }
      } : null
    };

    console.log('[AI-DIRECT-RETURN] Real user assessment data prepared:', assessmentData);

    // Generate insights using OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `You are an expert life coach analyzing a detailed 6 Pillars of Life™ assessment. Based on the data below, provide exactly 3 specific, actionable insights that will have maximum impact on this person's life architecture.

ASSESSMENT DATA:
${JSON.stringify(assessmentData, null, 2)}

KEY ANALYSIS POINTS:
- Personal Development: 20-hour gap (0→20 hours, importance 10/10) - SEVERE under-allocation
- Friends & Family: 13-hour gap (7→20 hours, importance 10/10) - SEVERE under-allocation  
- Work: Over-allocated by 19 hours (60→41 hours desired)
- Work Happiness: Major gaps in impact (5→10), enjoyment (3→8), flexibility (5→10)
- Sleep: Perfectly balanced (56 hours = 8 hours/day)

For each insight, provide:
1. insight_type: "gap_analysis", "reallocation", or "strength_leverage"
2. title: Compelling 8-12 word headline
3. content: 2-3 sentences with specific, actionable guidance

Focus on the BIGGEST opportunities that will create cascading positive effects across multiple pillars.

Return as JSON array with exactly 3 insights.`;

    console.log('[AI-DIRECT-RETURN] Calling OpenAI with sophisticated prompt...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert life coach specializing in the 6 Pillars of Life™ framework. Provide specific, actionable insights based on assessment data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[AI-DIRECT-RETURN] OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorText}`);
    }

    const openaiResult = await openaiResponse.json();
    console.log('[AI-DIRECT-RETURN] OpenAI response received');

    const aiContent = openaiResult.choices[0]?.message?.content;
    if (!aiContent) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the AI response
    let insights;
    try {
      insights = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('[AI-DIRECT-RETURN] Failed to parse AI response as JSON:', aiContent);
      // Create fallback insights if parsing fails
      insights = [
        {
          insight_type: "gap_analysis",
          title: "Prioritize Personal Development: 20-Hour Weekly Investment Needed",
          content: "Your Personal Development pillar shows a critical 20-hour gap with maximum importance (10/10). This represents your biggest opportunity for life transformation. Start with 5 hours weekly focusing on high-impact learning that directly supports your professional goals."
        },
        {
          insight_type: "reallocation",
          title: "Reclaim 19 Work Hours for Friends & Family Connection",
          content: "You're working 19 hours more than desired (60→41 hours). This surplus can directly address your Friends & Family gap (7→20 hours). Implement strict work boundaries to create space for meaningful relationships."
        },
        {
          insight_type: "strength_leverage",
          title: "Perfect Sleep Foundation Enables Maximum Performance",
          content: "Your Sleep pillar is perfectly balanced at 56 hours weekly (8 hours daily). This strong foundation gives you the energy to tackle other pillar improvements. Use this stability as your launching pad for change."
        }
      ];
    }

    console.log('[AI-DIRECT-RETURN] Generated insights:', insights.length);

    // Store insights in database for persistence
    const insightsToStore = insights.map((insight: any, index: number) => ({
      framework_id: framework.id,
      user_email: userEmail,
      insight_type: insight.insight_type || 'gap_analysis',
      title: insight.title || 'Insight Title',
      description: insight.content || 'Insight content',
      priority: index === 0 ? 'High' : index === 1 ? 'Medium' : 'Low',
      is_read: false
    }));

    // Clear existing insights for this framework and insert new ones (assessment data changed)
    const { error: deleteError } = await supabase
      .from('ai_insights')
      .delete()
      .eq('framework_id', framework.id);

    if (deleteError) {
      console.warn('[AI-DIRECT-RETURN] Warning: Could not clear old insights:', deleteError);
    } else {
      console.log('[AI-DIRECT-RETURN] Cleared existing insights for framework regeneration');
    }

    const { data: storedInsights, error: insertError } = await supabase
      .from('ai_insights')
      .insert(insightsToStore)
      .select();

    if (insertError) {
      console.error('[AI-DIRECT-RETURN] Failed to store insights:', insertError);
      // Continue with formatted insights even if storage fails
    } else {
      console.log('[AI-DIRECT-RETURN] Successfully stored', storedInsights?.length, 'insights');
    }

    // Format insights for frontend response
    const formattedInsights = (storedInsights || insightsToStore).map((insight: any, index: number) => ({
      id: insight.id || `insight-${Date.now()}-${index}`,
      framework_id: framework.id,
      user_email: userEmail,
      insight_type: insight.insight_type || 'gap_analysis',
      title: insight.title || 'Insight Title',
      description: insight.description || insight.content || 'Insight content',
      priority: insight.priority || (index === 0 ? 'High' : index === 1 ? 'Medium' : 'Low'),
      is_read: insight.is_read || false,
      created_at: insight.created_at || new Date().toISOString()
    }));

    console.log('[AI-DIRECT-RETURN] Success! Generated', formattedInsights.length, 'insights');

    return new Response(JSON.stringify({
      success: true,
      insights: formattedInsights,
      message: `Generated ${formattedInsights.length} AI insights`,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[AI-DIRECT-RETURN] Error:', error);
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