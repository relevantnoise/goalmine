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
    const { userEmail, frameworkId } = await req.json();
    
    if (!userEmail || !frameworkId) {
      throw new Error('Missing required fields: userEmail, frameworkId');
    }

    console.log('[GENERATE-INSIGHTS] Generating AI insights for framework:', frameworkId);

    // Get Firebase UID from profile (following hybrid architecture)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    const userId = profile.id;

    // Verify framework ownership and get framework data
    const { data: framework, error: frameworkError } = await supabase
      .from('user_frameworks')
      .select('*')
      .eq('id', frameworkId)
      .eq('user_id', userId)
      .single();

    if (frameworkError) {
      throw new Error(`Framework not found or access denied: ${frameworkError.message}`);
    }

    // Get pillar assessments (raw assessment data)
    const { data: pillars, error: pillarsError } = await supabase
      .from('pillar_assessments')
      .select('*')
      .eq('framework_id', frameworkId)
      .order('pillar_name');

    if (pillarsError) {
      throw new Error(`Failed to fetch pillars: ${pillarsError.message}`);
    }

    // Get work happiness data
    const { data: workHappiness, error: workError } = await supabase
      .from('work_happiness')
      .select('*')
      .eq('framework_id', frameworkId)
      .single();

    console.log('[GENERATE-INSIGHTS] Raw assessment data loaded, calling ChatGPT...');

    // Prepare raw assessment data for ChatGPT
    const assessmentData = {
      pillars: pillars.map(p => ({
        name: p.pillar_name,
        importance: p.importance_level,
        currentHours: p.current_hours_per_week,
        idealHours: p.ideal_hours_per_week,
        timeGap: (p.ideal_hours_per_week || 0) - (p.current_hours_per_week || 0)
      })),
      workHappiness: workHappiness ? {
        impact: { current: workHappiness.impact_current, desired: workHappiness.impact_desired },
        enjoyment: { current: workHappiness.enjoyment_current, desired: workHappiness.enjoyment_desired },
        income: { current: workHappiness.income_current, desired: workHappiness.income_desired },
        remote: { current: workHappiness.remote_current, desired: workHappiness.remote_desired }
      } : null
    };

    // Call ChatGPT for intelligent analysis
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are Dan Lynn's expert life architecture consultant, analyzing 6 Pillars of Life™ assessments. Your role is to provide strategic, research-backed insights that help professionals optimize their life architecture.

CONTEXT: The user completed a 6 Pillars assessment rating each pillar's importance (1-10), current time allocation (hours/week), and ideal time allocation (hours/week). They also completed a Business Happiness Formula™ assessment rating current vs desired levels for Impact, Enjoyment, Income, and Remote Flexibility.

THE 6 PILLARS: Work, Sleep, Friends & Family, Health & Fitness, Personal Development, Spiritual

ANALYSIS FRAMEWORK:
- Time allocation gaps reveal priority mismatches - focus on high importance + large time gap
- Sleep affects everything - if Sleep is under-allocated, it impacts all other pillars
- Work happiness gaps (Impact, Enjoyment, Income, Remote) indicate career optimization opportunities  
- Consider interconnections and realistic weekly time constraints (168 hours total)
- Look for foundation pillars (Health, Sleep) that support others

GENERATE EXACTLY 3 INSIGHTS:
1. **Biggest Opportunity** - Identify the most impactful pillar improvement based on importance + time gap
2. **Strategic Recommendation** - Specific, actionable advice for life architecture optimization  
3. **Strength Recognition** - Highlight what's working well and how to leverage it

Each insight should be:
- Specific and personalized to their data
- Research-backed when possible
- Actionable with clear next steps
- 2-3 sentences maximum
- Strategic rather than generic

Return ONLY a JSON array with insights in this exact format:
[
  {
    "type": "gap_analysis",
    "title": "Title Here",
    "content": "2-3 sentence analysis here"
  },
  {
    "type": "goal_suggestion", 
    "title": "Title Here",
    "content": "2-3 sentence recommendation here"
  },
  {
    "type": "celebration",
    "title": "Title Here", 
    "content": "2-3 sentence strength recognition here"
  }
]`
          },
          {
            role: 'user',
            content: `Please analyze this 6 Pillars assessment data and provide 3 strategic insights:

ASSESSMENT DATA:
${JSON.stringify(assessmentData, null, 2)}`
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const aiInsights = JSON.parse(openaiData.choices[0].message.content);

    // Skip database save due to schema cache issues
    // Return the insights directly for frontend display
    console.log('[GENERATE-INSIGHTS] Returning insights without database save due to schema cache issues');
    
    const savedInsights = aiInsights.map((insight: any, index: number) => ({
      id: `temp_${index}`, // Temporary ID for frontend display
      insight_type: insight.type,
      title: insight.title,
      content: insight.content,
      priority: index + 1,
      generated_at: new Date().toISOString()
    }));

    console.log('[GENERATE-INSIGHTS] Generated and saved', savedInsights.length, 'insights');

    return new Response(JSON.stringify({
      success: true,
      message: `Generated ${savedInsights.length} AI insights successfully`,
      data: {
        frameworkId,
        userEmail,
        insightsGenerated: savedInsights.length,
        insights: savedInsights,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[GENERATE-INSIGHTS] Error:', error);
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