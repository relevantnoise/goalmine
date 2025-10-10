import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log('[LEGACY-NUDGE] ⚠️ OLD LEGACY NUDGE FUNCTION CALLED - This should NOT be happening!');
    
    // Generate general motivational content
    const prompt = `Generate motivational content for someone who needs an instant boost. Format as JSON:
    {
      "message": "An encouraging 2-3 sentence message",
      "microPlan": ["Action step 1", "Action step 2", "Action step 3"],
      "challenge": "A quick 2-minute challenge they can do right now"
    }
    
    Keep it positive, actionable, and energizing.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const content = JSON.parse(aiResponse.choices[0].message.content);
      
      return new Response(JSON.stringify({
        message: content.message,
        microPlan: content.microPlan,
        challenge: content.challenge,
        tone: 'encouraging'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } catch (aiError) {
      // Fallback content if AI fails
      return new Response(JSON.stringify({
        message: "You've got this! Every small step forward is progress worth celebrating.",
        microPlan: [
          "Take 3 deep breaths and center yourself",
          "Write down one thing you're grateful for today",
          "Do something that makes you smile"
        ],
        challenge: "Spend 2 minutes doing something that energizes you - stretch, dance, or step outside.",
        tone: 'encouraging'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});