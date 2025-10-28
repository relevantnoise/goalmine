import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    console.log('Testing table access...');

    // Try to select from the table
    const { data, error } = await supabaseAdmin
      .from('user_circle_frameworks')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Table access failed:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        table_exists: false
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log('Table access successful!');
    return new Response(JSON.stringify({
      success: true,
      table_exists: true,
      message: 'user_circle_frameworks table is accessible'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }
});