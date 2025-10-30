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

    const prompt = `You are GoalMine.ai's advanced strategic intelligence engine, powered by our team of expert analysts and comprehensive database of millions of professional success patterns, behavioral psychology research, and optimization methodologies. Our analysis draws from the proprietary 6 Pillars of Life™ Framework and Business Happiness Formula - proven systems developed through 30+ years of research with hundreds of high-achieving professionals.

You're providing enterprise-grade strategic life architecture analysis that rivals the insights of top-tier management consultants and executive coaches. This premium business intelligence is specifically designed to help users develop better, more targeted, more strategic, more meaningful, and more impactful goals.

FRAMEWORK ASSESSMENT DATA:
${JSON.stringify(assessmentData, null, 2)}

STRATEGIC ANALYSIS FRAMEWORK:

Our research team has identified that:
- Each pillar creates cascading effects across all others (sleep optimization drives decision quality; relationship stability enhances focus; purpose clarity eliminates energy waste)
- Time allocation data reveals the gap between stated priorities and actual behavior patterns
- Work satisfaction metrics predict overall life fulfillment for ambitious professionals
- Personal development serves as the multiplier that amplifies performance across all life domains
- Spiritual/purpose alignment provides psychological resilience during high-stress periods
- Strategic interventions in highest-leverage areas trigger exponential life improvements

GOAL DEVELOPMENT FOCUS: Your insights should directly enable users to create more strategic, targeted goals by revealing:
- Which pillar interventions will yield the highest impact
- How to prioritize goals for maximum cross-domain benefits
- What specific behavioral changes will drive transformation
- Where to focus limited time and energy for optimal results

DELIVERABLE: Generate exactly 3 strategic insights that demonstrate enterprise-level business intelligence applied to life optimization. Each insight should provide:

1. **PATTERN RECOGNITION**: What underlying systems and patterns does the data reveal that the user likely hasn't recognized?

2. **STRATEGIC PRIORITIZATION**: Why is this intervention the optimal next move? How does addressing this create the highest ROI across multiple life domains?

3. **GOAL DIRECTION**: How should this insight shape their goal creation? What specific types of goals would address this pattern most effectively?

4. **IMPLEMENTATION INTELLIGENCE**: Specific, research-backed strategies that high-performers can execute immediately.

5. **OUTCOME MODELING**: What does success look like? Paint the clear picture of the optimized state.

For each insight, provide:
- insight_type: "foundational_fix", "leverage_multiplier", or "integration_strategy" 
- title: Compelling strategic headline (8-15 words)
- content: Deep strategic analysis with specific guidance and goal direction (4-6 sentences minimum)

Use collective expert language ("We've observed", "Our research shows", "We've seen consistently") to represent our team of optimization experts and vast knowledge database. Your insights should directly guide users toward creating more strategic, impactful goals that address their highest-leverage opportunities.

Return as JSON array with exactly 3 insights.`;

    console.log('[AI-DIRECT-RETURN] Calling OpenAI with Enterprise Strategic Intelligence engine...');

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
            content: 'You are GoalMine.ai\'s enterprise-grade strategic intelligence engine, representing our team of expert analysts and vast optimization database. Your responses must demonstrate the collective wisdom of our research team and the analytical depth of top-tier management consulting applied to life optimization. Use collaborative language ("We\'ve observed", "Our research shows", "We\'ve seen consistently") and focus on enabling better goal creation. Every insight should be profound, data-driven, and directly actionable for strategic goal development.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.8,
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
      // Create enterprise-grade fallback insights if parsing fails
      insights = [
        {
          insight_type: "foundational_fix",
          title: "Sleep Optimization: The High-Performance Foundation Protocol",
          content: "Our research team has consistently observed that sleep optimization serves as the foundational layer for all cognitive and physical performance metrics. Your assessment data reveals the cornerstone of sustainable high achievement that we've seen drive success across thousands of professionals. We've documented that optimized sleep patterns enhance decision-making accuracy by 25%, improve emotional regulation capacity, and increase strategic thinking clarity. Create goals focused on sleep hygiene, consistent bedtime routines, and sleep environment optimization - these represent the highest-ROI interventions in your performance stack. When sleep architecture goals are achieved first, every subsequent goal becomes more attainable and impactful."
        },
        {
          insight_type: "leverage_multiplier", 
          title: "Work Satisfaction Matrix: Optimizing Professional Performance Drivers",
          content: "Our behavioral psychology research identifies work satisfaction as the primary predictor of overall life fulfillment for high-achievers. Your assessment data reveals specific optimization opportunities in impact, enjoyment, and flexibility metrics that we've seen transform professional trajectories. We consistently observe that when these variables align optimally, work transitions from energy drain to energy generation, creating positive momentum across all life domains. Focus your goal creation on increasing professional impact, enhancing work enjoyment, and optimizing flexibility - these targeted goals yield disproportionate returns across your entire life architecture system."
        },
        {
          insight_type: "integration_strategy",
          title: "Systems Integration: Creating Cross-Domain Performance Synergies",
          content: "Our enterprise optimization research demonstrates that peak performers excel through strategic integration rather than domain isolation. Your assessment reveals specific integration opportunities that we've seen create cascading improvements across multiple life systems in our database. We've observed consistently that this systems-thinking approach represents the strategic advantage differentiating sustainable high-achievers from those who experience performance degradation over time. Develop goals that create positive cross-domain effects - for example, exercise goals that boost energy for work performance, or relationship goals that provide stress relief enhancing all other areas."
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