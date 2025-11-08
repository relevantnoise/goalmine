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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? '',
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ''
    );

    // Check current partner data
    const { data: currentPartner, error: fetchError } = await supabase
      .from('strategic_partners')
      .select('*')
      .eq('name', 'StartingIt.ai')
      .single();

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return new Response(JSON.stringify({ error: 'Could not fetch partner', details: fetchError }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    console.log('Current partner data:', currentPartner);

    // Update the CTA text to ensure it says "Learn More"
    const { data: updatedPartner, error: updateError } = await supabase
      .from('strategic_partners')
      .update({ 
        cta_text: 'Learn More'
      })
      .eq('name', 'StartingIt.ai')
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(JSON.stringify({ error: 'Could not update partner', details: updateError }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Partner CTA text updated to "Learn More"',
      before: currentPartner,
      after: updatedPartner
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});