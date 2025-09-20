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
    console.log('🔄 Setting up RLS policies');

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Set up simple RLS policies
    const setupQueries = [
      // Enable RLS
      'ALTER TABLE goals ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE motivation_history ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;',
      
      // Drop existing policies to avoid conflicts
      'DROP POLICY IF EXISTS "Users can manage their own goals" ON goals;',
      'DROP POLICY IF EXISTS "Users can manage their own motivation history" ON motivation_history;',
      'DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;',
      
      // Create simple permissive policies
      `CREATE POLICY "Users can manage their own goals" ON goals
       FOR ALL USING (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_id);`,
      
      `CREATE POLICY "Users can manage their own motivation history" ON motivation_history
       FOR ALL USING (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_id);`,
      
      `CREATE POLICY "Users can manage their own profile" ON profiles
       FOR ALL USING (auth.uid()::text = id OR auth.jwt() ->> 'email' = email);`
    ];

    const results = [];
    for (const query of setupQueries) {
      try {
        console.log('🔄 Executing:', query.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.error('❌ Query failed:', query, error);
          results.push({ query: query.substring(0, 50), success: false, error: error.message });
        } else {
          results.push({ query: query.substring(0, 50), success: true });
        }
      } catch (queryError) {
        console.error('❌ Query error:', queryError);
        results.push({ query: query.substring(0, 50), success: false, error: queryError.message });
      }
    }

    console.log('✅ RLS setup completed');
    return new Response(JSON.stringify({ 
      success: true,
      results: results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Error in setup-rls:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Unknown error occurred" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});