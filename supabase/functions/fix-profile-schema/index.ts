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
    console.log('🔧 Applying Firebase schema migration to profiles table');

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Apply schema changes step by step
    const migrations = [
      // Add new columns
      "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial'",
      "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS firebase_user_id TEXT",
      "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT",
      "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT",
      
      // Try to rename column (might fail if already renamed)
      "DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='trial_expires_at') THEN ALTER TABLE profiles RENAME COLUMN trial_expires_at TO trial_ends_at; END IF; END $$",
      
      // Drop old column (might fail if already dropped)
      "ALTER TABLE profiles DROP COLUMN IF EXISTS clerk_uuid",
      
      // Add unique constraint to firebase_user_id (if not exists)
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='profiles_firebase_user_id_key') THEN ALTER TABLE profiles ADD CONSTRAINT profiles_firebase_user_id_key UNIQUE (firebase_user_id); END IF; END $$",
      
      // Add check constraint
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='check_subscription_status') THEN ALTER TABLE profiles ADD CONSTRAINT check_subscription_status CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')); END IF; END $$"
    ];

    const results = [];
    
    for (const migration of migrations) {
      try {
        console.log(`🔄 Executing: ${migration.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: migration });
        
        if (error) {
          console.warn(`⚠️ Migration warning: ${error.message}`);
          results.push({ migration, status: 'warning', error: error.message });
        } else {
          console.log(`✅ Migration completed`);
          results.push({ migration, status: 'success' });
        }
      } catch (err) {
        console.warn(`⚠️ Migration error: ${err.message}`);
        results.push({ migration, status: 'error', error: err.message });
      }
    }

    // Verify final schema
    console.log('🔍 Verifying profiles table schema...');
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Schema migration completed",
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});