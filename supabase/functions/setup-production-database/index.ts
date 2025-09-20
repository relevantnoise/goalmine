import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[SETUP-DB] Setting up production database schema');

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = [];

    // Create profiles table
    console.log('[SETUP-DB] Creating profiles table...');
    const profilesSQL = `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        display_name TEXT,
        goal_limit INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;
    
    const { error: profilesError } = await supabase.rpc('exec_sql', { sql: profilesSQL });
    if (profilesError) {
      console.error('Profiles table error:', profilesError);
      results.push({ table: 'profiles', success: false, error: profilesError.message });
    } else {
      results.push({ table: 'profiles', success: true });
      console.log('[SETUP-DB] ✅ Profiles table created');
    }

    // Create goals table
    console.log('[SETUP-DB] Creating goals table...');
    const goalsSQL = `
      CREATE TABLE IF NOT EXISTS public.goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        target_date DATE,
        tone TEXT DEFAULT 'kind_encouraging',
        email_time TIME DEFAULT '07:00:00',
        streak_count INTEGER DEFAULT 0,
        last_check_in DATE,
        is_active BOOLEAN DEFAULT true,
        last_motivation_date DATE,
        streak_insurance_days INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;
    
    const { error: goalsError } = await supabase.rpc('exec_sql', { sql: goalsSQL });
    if (goalsError) {
      console.error('Goals table error:', goalsError);
      results.push({ table: 'goals', success: false, error: goalsError.message });
    } else {
      results.push({ table: 'goals', success: true });
      console.log('[SETUP-DB] ✅ Goals table created');
    }

    // Create subscribers table
    console.log('[SETUP-DB] Creating subscribers table...');
    const subscribersSQL = `
      CREATE TABLE IF NOT EXISTS public.subscribers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        subscribed BOOLEAN DEFAULT false,
        subscription_tier TEXT,
        subscription_end TIMESTAMP WITH TIME ZONE,
        plan_name TEXT,
        status TEXT DEFAULT 'inactive',
        current_period_end TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;
    
    const { error: subscribersError } = await supabase.rpc('exec_sql', { sql: subscribersSQL });
    if (subscribersError) {
      console.error('Subscribers table error:', subscribersError);
      results.push({ table: 'subscribers', success: false, error: subscribersError.message });
    } else {
      results.push({ table: 'subscribers', success: true });
      console.log('[SETUP-DB] ✅ Subscribers table created');
    }

    // Create motivation_history table
    console.log('[SETUP-DB] Creating motivation_history table...');
    const motivationSQL = `
      CREATE TABLE IF NOT EXISTS public.motivation_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        message TEXT NOT NULL,
        micro_plan TEXT[],
        challenge TEXT,
        tone TEXT,
        streak_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;
    
    const { error: motivationError } = await supabase.rpc('exec_sql', { sql: motivationSQL });
    if (motivationError) {
      console.error('Motivation history table error:', motivationError);
      results.push({ table: 'motivation_history', success: false, error: motivationError.message });
    } else {
      results.push({ table: 'motivation_history', success: true });
      console.log('[SETUP-DB] ✅ Motivation history table created');
    }

    // Create daily_nudges table
    console.log('[SETUP-DB] Creating daily_nudges table...');
    const nudgesSQL = `
      CREATE TABLE IF NOT EXISTS public.daily_nudges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        nudge_date DATE NOT NULL DEFAULT CURRENT_DATE,
        nudge_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE(user_id, nudge_date)
      );
    `;
    
    const { error: nudgesError } = await supabase.rpc('exec_sql', { sql: nudgesSQL });
    if (nudgesError) {
      console.error('Daily nudges table error:', nudgesError);
      results.push({ table: 'daily_nudges', success: false, error: nudgesError.message });
    } else {
      results.push({ table: 'daily_nudges', success: true });
      console.log('[SETUP-DB] ✅ Daily nudges table created');
    }

    const successCount = results.filter(r => r.success).length;
    const totalTables = results.length;

    console.log(`[SETUP-DB] Database setup complete: ${successCount}/${totalTables} tables created successfully`);

    return new Response(
      JSON.stringify({
        success: successCount === totalTables,
        message: `Database setup complete: ${successCount}/${totalTables} tables created`,
        results,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[SETUP-DB] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);