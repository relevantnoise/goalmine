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
    console.log('[GENERATE-AI-SQL] Starting direct AI generation with raw SQL...');
    
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

    console.log('[GENERATE-AI-SQL] Profile found:', profile.id);

    // Use Dan's known framework ID since we found it earlier
    const frameworkId = '95d14c45-ac88-422d-bb9a-82e32da691f7';
    console.log('[GENERATE-AI-SQL] Using known framework ID:', frameworkId);

    // Step 3: Get assessment data using raw SQL
    const { data: pillarsResult } = await supabase.rpc('exec_sql', {
      sql: `SELECT * FROM pillar_assessments WHERE framework_id = $1 ORDER BY pillar_name`,
      params: [frameworkId]
    });

    const { data: workHappinessResult } = await supabase.rpc('exec_sql', {
      sql: `SELECT * FROM work_happiness WHERE framework_id = $1 LIMIT 1`,
      params: [frameworkId]
    });

    const pillars = pillarsResult || [];
    const workHappiness = workHappinessResult?.[0] || null;

    console.log('[GENERATE-AI-SQL] Data loaded via SQL:', {
      pillars: pillars.length,
      workHappiness: !!workHappiness
    });

    // Step 4: Prepare assessment data for ChatGPT (same as before)
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

    console.log('[GENERATE-AI-SQL] Assessment data prepared:', assessmentData);

    // Step 5: Call ChatGPT (same as before)
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    console.log('[GENERATE-AI-SQL] Calling OpenAI...');
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
      console.error('[GENERATE-AI-SQL] OpenAI error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('[GENERATE-AI-SQL] OpenAI response received');
    
    if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
      throw new Error('Invalid OpenAI response structure');
    }
    
    const aiInsights = JSON.parse(openaiData.choices[0].message.content);
    console.log('[GENERATE-AI-SQL] AI insights parsed:', aiInsights.length);

    // Step 6: Save insights using raw SQL to bypass schema cache
    const savedInsights = [];
    for (let i = 0; i < aiInsights.length; i++) {
      const insight = aiInsights[i];
      const insertSQL = `
        INSERT INTO ai_insights (framework_id, user_email, insight_type, title, content, priority, is_read, expires_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, title, content;
      `;
      
      const params = [
        frameworkId,
        userEmail,
        insight.type || 'analysis',
        insight.title || 'AI Insight',
        insight.content || 'Content not available',
        i + 1,
        false,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        JSON.stringify({ generated_by: 'chatgpt-sql', assessment_data_summary: `${assessmentData.pillars.length} pillars analyzed` })
      ];

      console.log('[GENERATE-AI-SQL] Saving insight:', insight.title);
      const { data: insertResult, error: insertError } = await supabase.rpc('exec_sql', {
        sql: insertSQL,
        params: params
      });

      if (insertError) {
        console.error('[GENERATE-AI-SQL] Failed to save insight:', insertError);
        throw new Error(`Failed to save insight: ${insertError.message}`);
      }

      if (insertResult && insertResult.length > 0) {
        savedInsights.push(insertResult[0]);
        console.log('[GENERATE-AI-SQL] Saved insight successfully:', insight.title);
      }
    }

    console.log('[GENERATE-AI-SQL] Successfully generated and saved', savedInsights.length, 'insights');

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully generated ${savedInsights.length} AI insights using raw SQL!`,
      data: {
        frameworkId,
        userEmail,
        insightsGenerated: savedInsights.length,
        insights: savedInsights,
        assessmentData
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[GENERATE-AI-SQL] Error:', error);
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