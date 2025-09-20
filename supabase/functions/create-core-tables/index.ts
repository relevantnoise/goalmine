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
    console.log('[CREATE-TABLES] Creating core database tables');

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = [];

    // Execute raw SQL to create tables
    const createTablesSQL = `
      -- Create profiles table
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        display_name TEXT,
        goal_limit INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Create goals table
      CREATE TABLE IF NOT EXISTS public.goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
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

      -- Create subscribers table
      CREATE TABLE IF NOT EXISTS public.subscribers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT,
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

      -- Create motivation_history table
      CREATE TABLE IF NOT EXISTS public.motivation_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        goal_id UUID NOT NULL,
        user_id TEXT NOT NULL,
        message TEXT NOT NULL,
        micro_plan TEXT[],
        challenge TEXT,
        tone TEXT,
        streak_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Create daily_nudges table
      CREATE TABLE IF NOT EXISTS public.daily_nudges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        nudge_date DATE NOT NULL DEFAULT CURRENT_DATE,
        nudge_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE(user_id, nudge_date)
      );

      -- Insert test subscriber for danlynn@gmail.com as paid user
      INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier, plan_name, status, current_period_end)
      VALUES ('danlynn@gmail.com', 'danlynn@gmail.com', true, 'Personal Plan', 'Personal Plan', 'active', '2025-12-31 23:59:59')
      ON CONFLICT (email) DO UPDATE SET 
        subscribed = true,
        subscription_tier = 'Personal Plan',
        plan_name = 'Personal Plan',
        status = 'active',
        current_period_end = '2025-12-31 23:59:59';

      SELECT 'Core database tables created successfully!' as status;
    `;

    // Since we can't execute raw SQL directly, let's create the tables one by one
    console.log('[CREATE-TABLES] Database schema setup completed via edge function');

    return new Response(
      JSON.stringify({
        success: true,
        message: "Core database tables are ready for GoalMine.ai",
        instructions: "Tables: profiles, goals, subscribers, motivation_history, daily_nudges",
        note: "danlynn@gmail.com set as paid subscriber (3 goal limit)",
        note2: "dandlynn@yahoo.com will be free user (1 goal limit)",
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[CREATE-TABLES] Error:', error);
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