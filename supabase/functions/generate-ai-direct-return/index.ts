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

    const prompt = `You are an AI coach analyzing this person's 6 Pillars of Life™ Framework assessment. Your job is to provide honest, helpful insights based on their actual data - no corporate jargon or exaggerated claims.

USER'S ASSESSMENT DATA:
${JSON.stringify(assessmentData, null, 2)}

ANALYSIS APPROACH:
Look at their assessment honestly and identify:
1. What pillar has the biggest gap between current and desired state
2. What patterns you notice in their ratings
3. How different pillars might be connected (e.g., sleep affects work performance)

PROVIDE EXACTLY 3 INSIGHTS:
Each insight should be helpful, specific, and honest - like advice from a knowledgeable friend who cares about their success.

Format each insight:
- insight_type: Choose from "gap_analysis", "pattern_recognition", or "connection_insight"  
- title: A clear, friendly title that explains the insight (8-15 words)
- content: 4-6 sentences explaining:
  - What you notice in their data
  - Why this matters for their life/goals
  - Specific suggestions for what to focus on
  - How this might help other areas too

Keep language conversational and supportive. Avoid buzzwords like "enterprise intelligence" or "advanced pattern recognition" - just be genuinely helpful.

Examples of good language:
- "Looking at your assessment..."
- "This often helps with..."  
- "You might find that..."
- "Consider focusing on..."

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
            content: 'You are a helpful AI coach analyzing life assessment data. Be honest, supportive, and practical. Focus on what the data actually shows and give specific, actionable advice. Avoid corporate jargon - write like a knowledgeable friend who wants to help them succeed. Your insights should help them understand their assessment results and guide them toward creating meaningful goals.'
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
      // Create helpful fallback insights when AI parsing fails
      insights = [
        {
          insight_type: "gap_analysis",
          title: "Your Biggest Opportunity for Positive Change",
          content: "Looking at your assessment, it appears you have significant room for improvement in one or more life areas. The good news is that focusing on your biggest gap often creates positive changes elsewhere too. Consider starting with the pillar where you rated yourself lowest compared to where you want to be. Small, consistent improvements in your weakest area can build momentum and confidence for tackling other goals. You might find that strengthening one pillar naturally supports the others."
        },
        {
          insight_type: "pattern_recognition", 
          title: "Building on Your Strengths",
          content: "Every assessment reveals both challenges and strengths. While it's important to address gaps, don't forget to leverage what's already working well in your life. Your stronger pillars can provide energy and confidence to tackle tougher areas. Consider how your successful habits or mindsets from high-performing areas might apply to struggling ones. This strength-based approach often feels more sustainable than trying to fix everything at once."
        },
        {
          insight_type: "connection_insight",
          title: "How Your Life Pillars Work Together",
          content: "Your life pillars don't exist in isolation - they influence each other in important ways. For example, better sleep often improves work performance, and regular exercise can boost both physical health and mental clarity. As you create goals, think about how improving one area might naturally support others. This interconnected approach can multiply your efforts and create positive momentum across multiple life areas."
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