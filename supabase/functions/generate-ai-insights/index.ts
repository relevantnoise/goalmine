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

// Fallback analysis function for when OpenAI fails
function generateFallbackAnalysis(assessmentData: any) {
  console.log('[GENERATE-INSIGHTS] Generating fallback analysis...');
  
  // Find the pillar with biggest gap
  const pillars = assessmentData.pillars || [];
  const biggestGap = pillars.reduce((max: any, pillar: any) => 
    Math.abs(pillar.timeGap) > Math.abs(max.timeGap) ? pillar : max, 
    pillars[0] || { name: 'Health & Fitness', timeGap: -10 }
  );
  
  // Find strongest pillar
  const strongestPillar = pillars.reduce((max: any, pillar: any) => 
    (pillar.currentHours || 0) > (max.currentHours || 0) ? pillar : max,
    pillars[0] || { name: 'Work', currentHours: 40 }
  );
  
  return [
    {
      type: "priority_focus",
      title: `Your Biggest Opportunity: ${biggestGap.name}`,
      content: `Your ${biggestGap.name} pillar shows a significant gap of ${Math.abs(biggestGap.timeGap)} hours per week. Research shows that addressing your biggest gap first creates momentum across all other life areas. IMMEDIATE RESOURCES: • Book: 'Atomic Habits' by James Clear • Course: 'Building Better Habits' online course`
    },
    {
      type: "leverage_strength", 
      title: `Leverage Your ${strongestPillar.name} Success`,
      content: `You're investing ${strongestPillar.currentHours} hours weekly in ${strongestPillar.name}, showing strong commitment. Studies indicate successful habits in one area can be leveraged to build others through habit stacking. IMMEDIATE RESOURCES: • Course: 'The Science of Well-Being' on Coursera • Book: 'The Power of Habit' by Charles Duhigg`
    },
    {
      type: "strategic_sequence",
      title: "Your Optimal Improvement Sequence", 
      content: `Data shows starting with your biggest gap (${biggestGap.name}) while maintaining your ${strongestPillar.name} strength creates sustainable progress. Focus on one pillar at a time for 30-day periods. IMMEDIATE RESOURCES: • Podcast: 'The Tim Ferriss Show' for optimization strategies • Book: 'Essentialism' by Greg McKeown`
    }
  ];
}

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

    // Get pillar assessments (raw assessment data) - CORRECTED TABLE NAME
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
        fun: { current: workHappiness.fun_current, desired: workHappiness.fun_desired },
        money: { current: workHappiness.income_current, desired: workHappiness.income_desired },
        flexibility: { current: workHappiness.remote_current, desired: workHappiness.remote_desired }
      } : null
    };

    // Try OpenAI first, fallback to local analysis if it fails
    let aiInsights;
    
    try {
      console.log('[GENERATE-INSIGHTS] Attempting OpenAI API call...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an expert life optimization strategist analyzing TWO COMPLEMENTARY ASSESSMENTS: 6 Pillars of Life Framework (life optimization system) and Business Happiness Formula (work satisfaction).

CRITICAL: Analyze BOTH assessments equally. The 6 Pillars reveal life optimization patterns. The Business Happiness Formula reveals work satisfaction drivers using Impact + Fun + Money + Flexibility.

6 PILLARS ANALYSIS - Look for:
- Time allocation gaps (current vs ideal hours)
- Cascade effects (work overflow → sleep sacrifice → health neglect)
- Priority mismatches (high importance, low time allocation)
- Foundation issues (sleep <7 hours affecting everything)

BUSINESS HAPPINESS ANALYSIS - Look for:
- Low scores in Impact, Fun, Money, or Flexibility (multiplicative effect - any low score tanks happiness)
- Work satisfaction gaps vs life balance issues
- Professional fulfillment vs personal time management
- Career trajectory vs life optimization alignment

BE DIRECT AND SPECIFIC. Call out patterns like:
- "Your work happiness formula shows low Fun (3/10) - this explains why 50+ work hours feel draining"
- "High Impact desire (9/10) but low current (4/10) suggests misaligned role, not time management issue"
- "Perfect life balance won't fix 2/10 work flexibility - you need location/schedule changes"

Generate EXACTLY 3 insights analyzing BOTH assessments:

[
  {
    "type": "priority_focus",
    "title": "Your Strategic Priority: [Life or Work Focus]",
    "content": "6 PILLARS ANALYSIS: [specific time gaps and patterns]. BUSINESS HAPPINESS ANALYSIS: [specific Impact/Fun/Money/Flexibility scores and gaps]. THE INTEGRATION: [how life optimization connects to work satisfaction]. This isn't just time management - it's [specific strategic intervention needed]. IMMEDIATE RESOURCES: • Book: '[Specific book title]' • Course: '[Specific online course]'"
  },
  {
    "type": "leverage_strength", 
    "title": "Your Success Pattern Decoded",
    "content": "LIFE OPTIMIZATION STRENGTH: [strongest pillar with hours]. WORK SATISFACTION STRENGTH: [highest Business Happiness factor]. THE STRATEGIC INSIGHT: [how to leverage existing strength to fix biggest gap]. Your [specific pattern] creates [specific opportunity]. Action plan: [concrete steps using strength to address weakness]. IMMEDIATE RESOURCES: • Book: '[Specific to their situation]' • Podcast: '[Specific podcast recommendation]'"
  },
  {
    "type": "strategic_sequence",
    "title": "Your Integrated 30-Day Strategy",
    "content": "LIFE OPTIMIZATION ISSUE: [biggest pillar gap]. WORK SATISFACTION ISSUE: [lowest Business Happiness factor]. THE CONNECTION: [how they affect each other]. Phase 1: [address foundation]. Phase 2: [leverage for work satisfaction]. Why this sequence works: [specific reasoning]. IMMEDIATE RESOURCES: • Book: '[Specific book for their situation]' • Course: '[Relevant online course]'"
  }
]

Use their ACTUAL NUMBERS. Be specific about hours, gaps, and patterns. No generic advice.

RESOURCE GUIDELINES:
- Only recommend books, online courses, or podcasts (NO APPS)
- Limit to exactly 2 resources per insight
- Mix resource types: books, courses, podcasts
- Choose well-known, reputable resources`
            },
            {
              role: 'user',
              content: `Analyze: ${JSON.stringify(assessmentData, null, 2)}`
            }
          ],
          max_tokens: 800,
          temperature: 0.7
        })
      });

      clearTimeout(timeoutId);
      
      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      aiInsights = JSON.parse(openaiData.choices[0].message.content);
      console.log('[GENERATE-INSIGHTS] OpenAI analysis successful');
      
    } catch (error) {
      console.log('[GENERATE-INSIGHTS] OpenAI failed, using fallback analysis:', error);
      aiInsights = generateFallbackAnalysis(assessmentData);
    }

    // Save insights to database for persistence and real AI intelligence
    console.log('[GENERATE-INSIGHTS] Saving insights to database for persistence...');
    
    const savedInsights = [];
    for (let i = 0; i < aiInsights.length; i++) {
      const insight = aiInsights[i];
      
      try {
        const { data: savedInsight, error: saveError } = await supabase
          .from('ai_insights')
          .insert([{
            framework_id: frameworkId,
            user_email: userEmail,
            insight_type: insight.type,
            title: insight.title,
            description: insight.content,
            priority: i === 0 ? 'High' : i === 1 ? 'Medium' : 'Low',
            is_read: false
          }])
          .select()
          .single();
          
        if (saveError) {
          console.error('[GENERATE-INSIGHTS] Database save error for insight', i, ':', saveError);
          // Create temporary insight for return even if save fails
          savedInsights.push({
            id: `temp_${i}`,
            insight_type: insight.type,
            title: insight.title,
            content: insight.content,
            priority: i + 1,
            generated_at: new Date().toISOString()
          });
        } else {
          console.log('[GENERATE-INSIGHTS] Successfully saved insight', i, 'to database');
          savedInsights.push({
            id: savedInsight.id,
            insight_type: savedInsight.insight_type,
            title: savedInsight.title,
            content: savedInsight.description,
            priority: i + 1,
            generated_at: savedInsight.created_at
          });
        }
      } catch (dbError: any) {
        console.error('[GENERATE-INSIGHTS] Database operation failed for insight', i, ':', dbError);
        // Fallback to temporary insight
        savedInsights.push({
          id: `temp_${i}`,
          insight_type: insight.type,
          title: insight.title,
          content: insight.content,
          priority: i + 1,
          generated_at: new Date().toISOString()
        });
      }
    }

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