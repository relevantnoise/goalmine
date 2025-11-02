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
    const { userEmail, frameworkId, fullInsights } = await req.json();
    
    if (!userEmail || !frameworkId || !fullInsights) {
      throw new Error('Missing required fields: userEmail, frameworkId, fullInsights');
    }

    console.log('[DASHBOARD-SUMMARY] Generating dashboard summary for framework:', frameworkId);

    // Extract key insights from full analysis
    const insightTexts = fullInsights.map((insight: any) => {
      const content = insight.description || insight.content || '';
      const mainContent = content.split('IMMEDIATE RESOURCES:')[0]?.trim() || content;
      return `${insight.title}: ${mainContent}`;
    }).join('\n\n');

    // Generate concise dashboard summary using OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `You are tasked with creating a concise dashboard summary from a detailed life assessment analysis.

FULL ANALYSIS TO SUMMARIZE:
${insightTexts}

CREATE A DASHBOARD SUMMARY:
- Maximum 200 words
- Capture the most important insights and patterns
- Be direct and actionable
- Focus on the top 2-3 key findings
- Maintain the honest, direct tone of the original analysis
- End with a clear next step or recommendation

The summary should feel like the "executive summary" version of the full analysis - hitting the most critical points without losing the impact and specificity.

Format as a single paragraph of flowing text (not bullet points).`;

    console.log('[DASHBOARD-SUMMARY] Calling OpenAI for summary generation...');

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
            content: 'You are an expert at creating concise executive summaries that capture the essence of detailed analysis. Your summaries maintain the impact and directness of the original while being significantly more concise.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[DASHBOARD-SUMMARY] OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorText}`);
    }

    const openaiResult = await openaiResponse.json();
    const summaryContent = openaiResult.choices[0]?.message?.content;

    if (!summaryContent) {
      throw new Error('No summary content received from OpenAI');
    }

    console.log('[DASHBOARD-SUMMARY] Generated summary:', summaryContent.length, 'characters');

    // Store the summary in database
    const { data: storedSummary, error: insertError } = await supabase
      .from('ai_insights')
      .insert([{
        framework_id: frameworkId,
        user_email: userEmail,
        insight_type: 'dashboard_summary',
        title: 'Your Personalized Strategy',
        description: summaryContent,
        priority: 'Critical',
        is_read: false
      }])
      .select()
      .single();

    if (insertError) {
      console.error('[DASHBOARD-SUMMARY] Failed to store summary:', insertError);
      throw new Error('Failed to store dashboard summary');
    }

    console.log('[DASHBOARD-SUMMARY] Successfully stored dashboard summary');

    return new Response(JSON.stringify({
      success: true,
      summary: {
        id: storedSummary.id,
        framework_id: frameworkId,
        user_email: userEmail,
        insight_type: 'dashboard_summary',
        title: 'Your Personalized Strategy',
        description: summaryContent,
        priority: 'Critical',
        is_read: false,
        created_at: storedSummary.created_at
      },
      message: 'Dashboard summary generated successfully',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[DASHBOARD-SUMMARY] Error:', error);
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