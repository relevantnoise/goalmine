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
    const { goalId, userId, updates } = await req.json();

    if (!goalId || !userId || !updates) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required parameters" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log('🔧 Hybrid update attempt:', { goalId, userId, updates });

    // HYBRID: Try both user ID approaches
    let data, error;
    
    // First, try with the provided userId (could be email or Firebase UID)
    const result1 = await supabase
      .from('goals')
      .update({
        target_date: updates.target_date,
        tone: updates.tone,
        title: updates.title,
        description: updates.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .eq('user_id', userId)
      .select();
    
    if (result1.data && result1.data.length > 0) {
      // Success with first approach
      data = result1.data;
      error = result1.error;
      console.log('✅ Updated using direct userId approach');
    } else {
      // If userId looks like email, try to find Firebase UID and try again
      if (userId.includes('@')) {
        console.log('🔄 First attempt failed, trying Firebase UID lookup for email:', userId);
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userId);
        
        if (profileData && profileData.length > 0) {
          const firebaseUID = profileData[0].id;
          console.log('🔍 Found Firebase UID:', firebaseUID);
          
          const result2 = await supabase
            .from('goals')
            .update({
              target_date: updates.target_date,
              tone: updates.tone,
              title: updates.title,
              description: updates.description,
              updated_at: new Date().toISOString()
            })
            .eq('id', goalId)
            .eq('user_id', firebaseUID)
            .select();
          
          data = result2.data;
          error = result2.error;
          console.log('✅ Updated using Firebase UID approach');
        } else {
          data = result1.data;
          error = result1.error || new Error('Profile not found');
        }
      } else {
        data = result1.data;
        error = result1.error;
      }
    }

    console.log('📊 Simple update result:', { data, error });

    if (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Goal not found or permission denied'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      goal: data[0]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});