import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Set up dandlynn@yahoo.com as a test user with expired trial
    const testEmail = 'dandlynn@yahoo.com';
    
    // Set trial_expires_at to 31 days ago
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 31);
    
    // Update or create profile with expired trial
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: testEmail,
        email: testEmail,
        display_name: 'Test User (Trial Expired)',
        trial_expires_at: expiredDate.toISOString(),
        created_at: expiredDate.toISOString(), // Also set created_at to match
        updated_at: new Date().toISOString(),
        goal_limit: 1
      }, {
        onConflict: 'email'
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw profileError;
    }

    // Make sure user is NOT subscribed
    const { error: deleteSubError } = await supabase
      .from('subscribers')
      .delete()
      .eq('user_id', testEmail);

    if (deleteSubError) {
      console.error('Error removing subscription:', deleteSubError);
    }

    // Check if user has any goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', testEmail)
      .eq('is_active', true);

    if (goalsError) {
      console.error('Error checking goals:', goalsError);
    }

    // If no goals, create one for testing
    if (!goals || goals.length === 0) {
      const { data: newGoal, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: testEmail,
          title: 'Test Goal for Expired Trial',
          description: 'This goal is to test trial expiration behavior',
          target_date: '2025-12-31',
          tone: 'kind_encouraging',
          is_active: true,
          streak_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (goalError) {
        console.error('Error creating test goal:', goalError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test user ${testEmail} set up with expired trial`,
        profile: {
          email: profile.email,
          trial_expires_at: profile.trial_expires_at,
          created_at: profile.created_at
        },
        hasSubscription: false,
        goalCount: goals?.length || 1
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in test-expired-trial:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

Deno.serve(handler);