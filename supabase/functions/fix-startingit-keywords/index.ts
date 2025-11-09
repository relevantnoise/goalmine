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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔧 Fixing StartingIt.ai keywords...');

    // First, check current state
    const { data: currentPartner, error: fetchError } = await supabase
      .from('strategic_partners')
      .select('*')
      .eq('name', 'StartingIt.ai')
      .single();

    if (fetchError) {
      throw new Error(`Could not find StartingIt.ai: ${fetchError.message}`);
    }

    console.log('📋 Current StartingIt.ai record:', currentPartner);

    // Update with proper keywords array
    const { data: updatedPartner, error: updateError } = await supabase
      .from('strategic_partners')
      .update({
        keywords: ['business', 'startup', 'entrepreneur', 'consulting', 'freelance', 'launch', 'company', 'llc', 'corporation', 'firm', 'agency', 'venture', 'own business'],
        pillar_categories: ['Work'],
        cta_text: 'Start Your Business - Free Trial'
      })
      .eq('name', 'StartingIt.ai')
      .select()
      .single();

    if (updateError) {
      throw new Error(`Update failed: ${updateError.message}`);
    }

    console.log('✅ Updated StartingIt.ai record:', updatedPartner);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'StartingIt.ai keywords updated successfully',
        before: currentPartner,
        after: updatedPartner
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('❌ Fix error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);