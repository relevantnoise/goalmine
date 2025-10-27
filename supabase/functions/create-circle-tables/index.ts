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
    console.log('[CREATE-CIRCLE-TABLES] Creating circle framework tables');
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing environment variables');
    }
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    // Test if tables already exist by attempting to query them
    console.log('🔍 Checking if tables already exist...');
    
    const { data: existingFramework, error: frameworkCheckError } = await supabaseAdmin
      .from('user_circle_frameworks')
      .select('id')
      .limit(1);
    
    if (!frameworkCheckError) {
      console.log('✅ Tables already exist and are accessible!');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Circle framework tables already exist and are working!'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log('📝 Tables need to be created. Error was:', frameworkCheckError.message);

    // If we get here, tables don't exist - but let's use a simpler approach
    // Create a test record to see exactly what's missing
    console.log('🔄 Testing table access...');

    const testInsert = {
      user_email: 'test@example.com',
      work_hours_per_week: 40,
      sleep_hours_per_night: 8.0,
      commute_hours_per_week: 5,
      available_hours_per_week: 70
    };

    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('user_circle_frameworks')
      .insert([testInsert])
      .select();

    if (insertError) {
      console.error('❌ Table access failed:', insertError.message);
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Tables do not exist. Need to create: ${insertError.message}`,
        solution: 'Tables need to be created via database migration or manual SQL'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Clean up test record if insert succeeded
    if (insertResult && insertResult.length > 0) {
      await supabaseAdmin
        .from('user_circle_frameworks')
        .delete()
        .eq('id', insertResult[0].id);
    }

    console.log('✅ Tables exist and working perfectly!');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Circle framework tables are ready!'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error in create-circle-tables:', errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});