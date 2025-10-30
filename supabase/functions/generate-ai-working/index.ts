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
    console.log('[GENERATE-AI-WORKING] Starting AI generation with database save...');
    
    const userEmail = 'danlynn@gmail.com';
    const frameworkId = '95d14c45-ac88-422d-bb9a-82e32da691f7';
    
    // Use Dan's known excellent assessment data
    const assessmentData = {
      pillars: [
        {
          name: "Friends & Family",
          importance: 10,
          currentHours: 7,
          idealHours: 20,
          timeGap: 13
        },
        {
          name: "Health & Fitness",
          importance: 10,
          currentHours: 2,
          idealHours: 10,
          timeGap: 8
        },
        {
          name: "Personal Development",
          importance: 10,
          currentHours: 0,
          idealHours: 20,
          timeGap: 20
        },
        {
          name: "Sleep",
          importance: 8,
          currentHours: 56,
          idealHours: 56,
          timeGap: 0
        },
        {
          name: "Spiritual",
          importance: 5,
          currentHours: 2,
          idealHours: 4,
          timeGap: 2
        },
        {
          name: "Work",
          importance: 8,
          currentHours: 60,
          idealHours: 41,
          timeGap: -19
        }
      ],
      workHappiness: {
        impact: { current: 5, desired: 10 },
        enjoyment: { current: 3, desired: 8 },
        income: { current: 8, desired: 8 },
        remote: { current: 5, desired: 10 }
      }
    };

    console.log('[GENERATE-AI-WORKING] Calling ChatGPT...');
    
    // Call ChatGPT directly
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
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
      console.error('[GENERATE-AI-WORKING] OpenAI error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('[GENERATE-AI-WORKING] ChatGPT response received successfully!');
    
    if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
      throw new Error('Invalid OpenAI response structure');
    }
    
    const aiInsights = JSON.parse(openaiData.choices[0].message.content);
    console.log('[GENERATE-AI-WORKING] AI insights generated:', aiInsights.length, 'insights');

    // Try to save insights using direct SQL execution
    console.log('[GENERATE-AI-WORKING] Saving insights using direct SQL...');
    
    // First, clear any existing insights for this user to avoid duplicates
    const deleteSQL = `DELETE FROM ai_insights WHERE user_email = $1`;
    const { error: deleteError } = await supabase.rpc('exec_sql', {
      sql: deleteSQL,
      params: [userEmail]
    });
    
    if (deleteError) {
      console.error('[GENERATE-AI-WORKING] Failed to clear existing insights:', deleteError);
    } else {
      console.log('[GENERATE-AI-WORKING] Cleared existing insights');
    }

    // Save new insights using raw SQL
    const savedInsights = [];
    for (let i = 0; i < aiInsights.length; i++) {
      const insight = aiInsights[i];
      const insertSQL = `
        INSERT INTO ai_insights (
          id, 
          created_at, 
          framework_id, 
          user_email, 
          insight_type, 
          title, 
          content, 
          priority, 
          is_read, 
          expires_at, 
          metadata
        ) VALUES (
          gen_random_uuid(),
          now(),
          $1::uuid,
          $2::text,
          $3::text,
          $4::text,
          $5::text,
          $6::integer,
          false,
          now() + interval '7 days',
          $7::jsonb
        ) RETURNING id, title, content, insight_type, priority;
      `;
      
      const params = [
        frameworkId,
        userEmail,
        insight.type || 'analysis',
        insight.title || 'AI Insight',
        insight.content || 'Content not available',
        i + 1,
        JSON.stringify({ 
          generated_by: 'chatgpt-working', 
          assessment_data_summary: `${assessmentData.pillars.length} pillars analyzed`,
          generation_timestamp: new Date().toISOString()
        })
      ];

      console.log('[GENERATE-AI-WORKING] Saving insight:', insight.title);
      const { data: insertResult, error: insertError } = await supabase.rpc('exec_sql', {
        sql: insertSQL,
        params: params
      });

      if (insertError) {
        console.error('[GENERATE-AI-WORKING] Failed to save insight:', insertError);
        throw new Error(`Failed to save insight: ${insertError.message}`);
      }

      if (insertResult && insertResult.length > 0) {
        savedInsights.push(insertResult[0]);
        console.log('[GENERATE-AI-WORKING] Saved insight successfully:', insight.title);
      }
    }

    console.log('[GENERATE-AI-WORKING] Successfully generated and saved', savedInsights.length, 'insights');

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully generated and saved ${savedInsights.length} AI insights!`,
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
    console.error('[GENERATE-AI-WORKING] Error:', error);
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