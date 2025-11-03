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

    console.log('🔄 Update goal request:', { goalId, userId, updates });

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

    // HYBRID: Try both user ID approaches
    let updateResult = null;
    let updateError = null;
    
    // First, try with the provided userId (could be email or Firebase UID)
    console.log('🔄 Attempting direct update with userId:', userId);
    const directUpdate = await supabase
      .from('goals')
      .update({
        title: updates.title,
        description: updates.description,
        target_date: updates.target_date,
        tone: updates.tone,
        pillar_type: updates.pillar_type,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .eq('user_id', userId)
      .select();
    
    if (directUpdate.data && directUpdate.data.length > 0) {
      // Success with direct approach
      updateResult = directUpdate.data[0];
      console.log('✅ Updated using direct userId approach');
    } else {
      // If userId looks like email, try to find Firebase UID and try again
      if (userId.includes('@')) {
        console.log('🔄 Trying Firebase UID lookup for email:', userId);
        
        const profileLookup = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userId);
        
        if (profileLookup.data && profileLookup.data.length > 0) {
          const firebaseUID = profileLookup.data[0].id;
          console.log('🔍 Found Firebase UID:', firebaseUID);
          
          const firebaseUpdate = await supabase
            .from('goals')
            .update({
              title: updates.title,
              description: updates.description,
              target_date: updates.target_date,
              tone: updates.tone,
              updated_at: new Date().toISOString()
            })
            .eq('id', goalId)
            .eq('user_id', firebaseUID)
            .select();
          
          if (firebaseUpdate.data && firebaseUpdate.data.length > 0) {
            updateResult = firebaseUpdate.data[0];
            console.log('✅ Updated using Firebase UID approach');
          } else {
            updateError = firebaseUpdate.error || new Error('Goal not found with Firebase UID');
          }
        } else {
          updateError = new Error('Profile not found for email');
        }
      } else {
        updateError = directUpdate.error || new Error('Goal not found');
      }
    }

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      return new Response(JSON.stringify({
        success: false,
        error: updateError.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!updateResult) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Goal not found or permission denied'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log('✅ Goal updated successfully:', updateResult.id);

    return new Response(JSON.stringify({
      success: true,
      goal: updateResult
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});