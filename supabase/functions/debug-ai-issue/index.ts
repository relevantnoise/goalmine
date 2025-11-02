import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[DEBUG-AI] Starting OpenAI API test...');

    // Check if API key exists
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('[DEBUG-AI] API Key exists:', !!apiKey);
    console.log('[DEBUG-AI] API Key length:', apiKey?.length || 0);

    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment');
    }

    // Test simple OpenAI call
    console.log('[DEBUG-AI] Making OpenAI API call...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Respond with exactly: "API working correctly"'
          },
          {
            role: 'user',
            content: 'Test message'
          }
        ],
        max_tokens: 10,
        temperature: 0
      })
    });

    clearTimeout(timeoutId);

    console.log('[DEBUG-AI] OpenAI response status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[DEBUG-AI] OpenAI error response:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const result = await openaiResponse.json();
    console.log('[DEBUG-AI] OpenAI success:', result);

    return new Response(JSON.stringify({
      success: true,
      message: 'OpenAI API is working correctly',
      openaiResponse: result,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[DEBUG-AI] Error:', error);
    
    let errorDetails = {
      message: error.message,
      name: error.name
    };

    if (error.name === 'AbortError') {
      errorDetails.message = 'OpenAI API call timed out after 10 seconds';
    }

    return new Response(JSON.stringify({
      success: false,
      error: errorDetails,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);
