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
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log('🔧 Updating StartingIt.ai partner with enhanced keywords and pillars');

    // Enhanced keyword phrases (strategic, specific terms)
    const enhancedKeywords = [
      'start business', 'build business', 'launch startup', 'entrepreneur', 
      'side hustle', 'freelance business', 'consulting firm', 'business plan',
      'startup idea', 'business venture', 'entrepreneurial', 'small business',
      'business model', 'revenue stream', 'business launch', 'start company',
      'build company', 'launch company', 'create business', 'own business',
      'business formation', 'startup launch', 'entrepreneurship', 'self employed'
    ];

    // Multi-pillar targeting (Work + Personal Development)
    const pillarCategories = ['Work', 'Personal Development'];

    const { data, error } = await supabase
      .from('strategic_partners')
      .update({
        keywords: enhancedKeywords,
        pillar_categories: pillarCategories,
        description: 'Complete business launch platform with legal setup, financial planning, and strategic guidance for entrepreneurs and aspiring business owners',
        updated_at: new Date().toISOString()
      })
      .eq('name', 'StartingIt.ai')
      .select()
      .single();

    if (error) {
      console.error('❌ Update error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log('✅ StartingIt.ai partner updated successfully:', {
      name: data.name,
      keywordCount: data.keywords.length,
      pillars: data.pillar_categories,
      sampleKeywords: data.keywords.slice(0, 5)
    });

    return new Response(JSON.stringify({ 
      success: true,
      partner: data,
      message: 'StartingIt.ai updated with enhanced keyword phrases and multi-pillar targeting',
      changes: {
        keywordsUpdated: true,
        pillarsUpdated: true,
        newKeywordCount: enhancedKeywords.length,
        newPillars: pillarCategories
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});