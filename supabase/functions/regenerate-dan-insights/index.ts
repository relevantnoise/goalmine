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
    // Allow GET requests for easy browser access
    if (req.method === "GET") {
    console.log('[REGENERATE-DAN] Regenerating AI insights for danlynn@gmail.com');

    // Call the updated AI generation function
    const { data, error } = await supabase.functions.invoke('generate-ai-direct-return', {
      body: { userEmail: 'danlynn@gmail.com' }
    });

    if (error) {
      console.error('[REGENERATE-DAN] Error calling AI function:', error);
      throw error;
    }

    console.log('[REGENERATE-DAN] AI insights regenerated successfully:', data);

    return new Response(JSON.stringify({
      success: true,
      message: 'AI insights regenerated for danlynn@gmail.com with new honest messaging',
      data: data
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[REGENERATE-DAN] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);