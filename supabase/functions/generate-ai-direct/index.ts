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
    console.log('[GENERATE-AI-DIRECT] Starting direct AI generation for Dan');
    
    const userEmail = 'danlynn@gmail.com';
    
    // Step 1: Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    console.log('[GENERATE-AI-DIRECT] Profile found:', profile.id);

    // Step 2: Get framework
    const { data: frameworks } = await supabase
      .from('user_frameworks')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!frameworks || frameworks.length === 0) {
      throw new Error('No framework found');
    }

    const framework = frameworks[0];
    const frameworkId = framework.id;
    console.log('[GENERATE-AI-DIRECT] Framework found:', frameworkId);

    // Step 3: Get assessment data
    const { data: pillars } = await supabase
      .from('pillar_assessments')
      .select('*')
      .eq('framework_id', frameworkId)
      .order('pillar_name');

    const { data: workHappiness } = await supabase
      .from('work_happiness')
      .select('*')
      .eq('framework_id', frameworkId)
      .single();

    console.log('[GENERATE-AI-DIRECT] Data loaded:', {
      pillars: pillars?.length || 0,
      workHappiness: !!workHappiness
    });

    // Step 4: Prepare assessment data for ChatGPT
    const assessmentData = {
      pillars: pillars?.map(p => ({
        name: p.pillar_name,
        importance: p.importance_level,
        currentHours: p.current_hours_per_week,
        idealHours: p.ideal_hours_per_week,
        timeGap: (p.ideal_hours_per_week || 0) - (p.current_hours_per_week || 0)
      })) || [],
      workHappiness: workHappiness ? {
        impact: { current: workHappiness.impact_current, desired: workHappiness.impact_desired },
        enjoyment: { current: workHappiness.enjoyment_current, desired: workHappiness.enjoyment_desired },
        income: { current: workHappiness.income_current, desired: workHappiness.income_desired },
        remote: { current: workHappiness.remote_current, desired: workHappiness.remote_desired }
      } : null
    };

    console.log('[GENERATE-AI-DIRECT] Assessment data prepared:', assessmentData);

    // Step 5: Call ChatGPT directly
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('[GENERATE-AI-DIRECT] Calling OpenAI with API key present:', !!openaiApiKey);
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    console.log('[GENERATE-AI-DIRECT] Making request to OpenAI...');
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
      const errorText = await openaiResponse.text();
      console.error('[GENERATE-AI-DIRECT] OpenAI error response:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('[GENERATE-AI-DIRECT] OpenAI response:', openaiData);
    
    if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
      console.error('[GENERATE-AI-DIRECT] Invalid OpenAI response structure:', openaiData);
      throw new Error('Invalid OpenAI response structure');
    }
    
    const aiInsights = JSON.parse(openaiData.choices[0].message.content);

    console.log('[GENERATE-AI-DIRECT] AI insights generated:', aiInsights);

    // Step 6: Save insights to database
    if (!aiInsights || !Array.isArray(aiInsights)) {
      console.error('[GENERATE-AI-DIRECT] AI insights is not an array:', aiInsights);
      throw new Error('AI insights response is not a valid array');
    }

    // Test with a simple insert first
    console.log('[GENERATE-AI-DIRECT] Testing simple insert...');
    const testInsight = {
      framework_id: frameworkId,
      user_email: userEmail,
      insight_type: 'test',
      title: 'Test Insight',
      content: 'Test content',
      priority: 1
    };
    
    const { data: testResult, error: testError } = await supabase
      .from('ai_insights')
      .insert(testInsight)
      .select()
      .single();
    
    if (testError) {
      console.error('[GENERATE-AI-DIRECT] Test insert failed:', testError);
      throw new Error(`Schema test failed: ${testError.message}`);
    }
    
    console.log('[GENERATE-AI-DIRECT] Test insert successful, now processing AI insights...');
    
    const insights = aiInsights.map((insight: any, index: number) => ({
      framework_id: frameworkId,
      user_email: userEmail,
      insight_type: insight.type || 'analysis',
      title: insight.title || 'AI Insight',
      content: insight.content || 'Content not available',
      priority: index + 1
    }));

    console.log('[GENERATE-AI-DIRECT] Preparing to save', insights.length, 'insights');

    // Save each insight
    const savedInsights = [];
    for (const insight of insights) {
      console.log('[GENERATE-AI-DIRECT] Saving insight:', insight.title);
      const { data: savedInsight, error: saveError } = await supabase
        .from('ai_insights')
        .insert(insight)
        .select()
        .single();

      if (saveError) {
        console.error('[GENERATE-AI-DIRECT] Failed to save insight:', saveError);
        throw new Error(`Failed to save insight: ${saveError.message}`);
      } else {
        savedInsights.push(savedInsight);
        console.log('[GENERATE-AI-DIRECT] Saved insight successfully:', insight.title);
      }
    }

    console.log('[GENERATE-AI-DIRECT] Successfully generated and saved', savedInsights.length, 'insights');

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully generated ${savedInsights.length} AI insights!`,
      data: {
        frameworkId,
        userEmail,
        insightsGenerated: savedInsights.length,
        insights: savedInsights.map(insight => ({
          id: insight.id,
          type: insight.insight_type,
          title: insight.title,
          content: insight.content,
          priority: insight.priority
        })),
        assessmentData
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[GENERATE-AI-DIRECT] Error:', error);
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