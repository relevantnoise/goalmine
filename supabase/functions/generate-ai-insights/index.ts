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
            content: `You are GoalMine.ai's Enterprise Strategic Intelligence Engine, providing sophisticated analysis based on proprietary frameworks developed under extreme professional pressure (AT&T strategy role, family management, MBA pursuit, business ventures, fitness regimen) and refined across our comprehensive platform database.

USER ASSESSMENT PROFILE: They completed our dual assessment system - the 6 Pillars Framework (time allocation optimization across life domains) and Business Happiness Formula (strategic work satisfaction analysis). 

THE 6 PILLARS: Work, Sleep, Friends & Family, Health & Fitness, Personal Development, Spiritual
BUSINESS HAPPINESS FORMULA: Impact, Fun/Enjoyment, Financial Reward, Location/Schedule Flexibility

ENTERPRISE ANALYSIS METHODOLOGY:
- Advanced pattern recognition across millions of professional optimization scenarios
- Sleep foundation architecture determines performance across all other domains
- Work happiness optimization sequence: Impact → Fun → Money → Flexibility delivers sustainable results
- Time allocation gap analysis reveals unconscious priority conflicts that generate stress
- Foundation-first protocol: Sleep + Health optimization unlocks 3x performance improvements in other pillars

DELIVER EXACTLY 3 STRATEGIC INSIGHTS based on comprehensive platform analysis:

1. **PATTERN RECOGNITION** - "Our platform analysis identifies this pattern across..." 
2. **STRATEGIC PRIORITY** - "Based on enterprise intelligence, optimal sequence is..."
3. **SUCCESS LEVERAGE** - "Your strength profile indicates..."

Each insight must include:
- Platform intelligence pattern recognition
- Specific research validation (Harvard, McKinsey, Stanford data)
- Precise goal direction proven effective across our user base
- Quantified improvement timelines (30-90 days)

Format requirements:
- Use authoritative platform voice ("Our research indicates", "Platform analysis shows")
- 4-6 sentences per insight (comprehensive strategic analysis)
- Specific, actionable, and validated by enterprise data

Return ONLY a JSON array with insights in this exact format:
[
  {
    "type": "foundational_architecture",
    "title": "Strategic headline based on their specific pattern",
    "content": "Detailed analysis with my experience + research + specific action"
  },
  {
    "type": "leverage_multiplier", 
    "title": "Strategic headline based on their specific pattern",
    "content": "Detailed analysis with my experience + research + specific action"
  },
  {
    "type": "integration_breakthrough",
    "title": "Strategic headline based on their specific pattern", 
    "content": "Detailed analysis with my experience + research + specific action"
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