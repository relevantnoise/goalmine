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
    console.log('[CLEANUP-TEST-DATA] Starting cleanup of test data');
    
    // SAFETY: Only delete specific test data
    const testEmail = 'test@example.com';
    
    // Find test goals
    const { data: testGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', testEmail);
    
    console.log(`[CLEANUP-TEST-DATA] Found ${testGoals?.length || 0} test goals`);
    
    let deletedGoals = 0;
    let deletedMotivation = 0;
    
    if (testGoals && testGoals.length > 0) {
      // Delete related motivation history first
      for (const goal of testGoals) {
        const { error: motivationError } = await supabase
          .from('motivation_history')
          .delete()
          .eq('goal_id', goal.id);
        
        if (!motivationError) {
          deletedMotivation++;
        }
      }
      
      // Delete test goals
      const { error: deleteError } = await supabase
        .from('goals')
        .delete()
        .eq('user_id', testEmail);
      
      if (!deleteError) {
        deletedGoals = testGoals.length;
      } else {
        throw new Error(`Failed to delete test goals: ${deleteError.message}`);
      }
    }
    
    // Check for orphaned goals with broken profiles
    const { data: orphanedGoals } = await supabase
      .from('goals')
      .select('user_id')
      .eq('is_active', true)
      .not('user_id', 'like', '%@%'); // Firebase UIDs only
    
    const orphanedUserIds = [...new Set(orphanedGoals?.map(g => g.user_id) || [])];
    const brokenProfiles = [];
    
    for (const userId of orphanedUserIds) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (!profile?.email) {
        brokenProfiles.push(userId);
      }
    }
    
    const result = {
      success: true,
      message: 'Test data cleanup completed',
      deletedGoals,
      deletedMotivation,
      brokenProfiles: brokenProfiles.length,
      brokenProfileIds: brokenProfiles,
      timestamp: new Date().toISOString()
    };
    
    console.log('[CLEANUP-TEST-DATA] Cleanup complete:', result);
    
    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[CLEANUP-TEST-DATA] Error:', error);
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