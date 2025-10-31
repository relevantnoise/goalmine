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
    const { userEmail, frameworkId, elements, workHappiness } = await req.json();
    
    if (!userEmail || !frameworkId) {
      throw new Error('Missing required fields: userEmail, frameworkId');
    }

    console.log('[UPDATE-FRAMEWORK] Updating framework for user:', userEmail, 'framework:', frameworkId);

    // Get Firebase UID from profile (following hybrid architecture)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    const userId = profile.id;

    // Verify framework ownership
    const { data: framework, error: frameworkError } = await supabase
      .from('user_frameworks')
      .select('*')
      .eq('id', frameworkId)
      .eq('user_id', userId)
      .single();

    if (frameworkError) {
      throw new Error(`Framework not found or access denied: ${frameworkError.message}`);
    }

    console.log('[UPDATE-FRAMEWORK] Framework ownership verified');

    const updates = [];

    // Update framework elements if provided
    if (elements && Array.isArray(elements)) {
      console.log('[UPDATE-FRAMEWORK] Updating framework elements...');
      
      for (const element of elements) {
        const { error: elementError } = await supabase
          .from('pillar_assessments')
          .update({
            importance_level: element.importance || element.priority || 5,
            current_hours_per_week: element.currentHours || element.current || 0,
            ideal_hours_per_week: element.idealHours || element.desired || 0,
            updated_at: new Date().toISOString()
          })
          .eq('framework_id', frameworkId)
          .eq('pillar_name', element.name);

        if (elementError) {
          throw new Error(`Failed to update element "${element.name}": ${elementError.message}`);
        }

        console.log(`[UPDATE-FRAMEWORK] Updated element: ${element.name}`);
        updates.push(`Updated ${element.name}`);
      }
    }

    // Update work happiness if provided
    if (workHappiness) {
      console.log('[UPDATE-FRAMEWORK] Updating work happiness assessment...');
      
      const { error: workError } = await supabase
        .from('work_happiness')
        .update({
          impact_current: workHappiness.impactCurrent,
          impact_desired: workHappiness.impactDesired,
          fun_current: workHappiness.funCurrent,
          fun_desired: workHappiness.funDesired,
          money_current: workHappiness.moneyCurrent,
          money_desired: workHappiness.moneyDesired,
          remote_current: workHappiness.remoteCurrent,
          remote_desired: workHappiness.remoteDesired,
          updated_at: new Date().toISOString()
        })
        .eq('framework_id', frameworkId);

      if (workError) {
        throw new Error(`Failed to update work happiness: ${workError.message}`);
      }

      console.log('[UPDATE-FRAMEWORK] Work happiness assessment updated');
      updates.push('Updated work happiness assessment');
    }

    // Update framework timestamp
    const { error: frameworkUpdateError } = await supabase
      .from('user_frameworks')
      .update({
        last_updated: new Date().toISOString()
      })
      .eq('id', frameworkId);

    if (frameworkUpdateError) {
      console.log('[UPDATE-FRAMEWORK] Framework timestamp update failed (non-critical):', frameworkUpdateError);
    }

    console.log('[UPDATE-FRAMEWORK] Framework update completed successfully');

    // 🧠 ENTERPRISE AI STRATEGIC INTELLIGENCE: Regenerate AI insights after assessment edits
    console.log('🧠 Regenerating Enterprise AI Strategic Intelligence after assessment edits...');
    try {
      const { data: aiResult, error: aiError } = await supabase.functions.invoke('generate-ai-insights', {
        body: {
          userEmail: userEmail,
          frameworkId: frameworkId
        }
      });
      
      if (aiError) {
        console.error('⚠️ AI insights regeneration failed (non-critical):', aiError);
        updates.push('⚠️ AI insights regeneration failed');
      } else {
        console.log('✅ Enterprise AI Strategic Intelligence regenerated successfully!');
        console.log('🔍 Updated AI Insights Result:', aiResult);
        updates.push('✅ AI insights regenerated with latest assessment data');
      }
    } catch (aiGenerationError) {
      console.error('⚠️ AI insights regeneration error (non-critical):', aiGenerationError);
      updates.push('⚠️ AI insights regeneration encountered an error');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Framework data updated successfully',
      data: {
        frameworkId,
        userEmail,
        updatesApplied: updates,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[UPDATE-FRAMEWORK] Error:', error);
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