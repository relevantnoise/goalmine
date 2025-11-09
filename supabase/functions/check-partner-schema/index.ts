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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔍 Checking strategic_partners table schema...');

    // Check if table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase.rpc('get_table_info', {
      table_name: 'strategic_partners'
    });

    if (tableError) {
      console.log('Using alternative method to check schema...');
      
      // Try to get sample data to see actual structure
      const { data: sampleData, error: sampleError } = await supabase
        .from('strategic_partners')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        throw new Error(`Table might not exist: ${sampleError.message}`);
      }

      console.log('Sample data from strategic_partners:', sampleData);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          method: 'sample_data',
          schema: sampleData?.[0] ? Object.keys(sampleData[0]) : 'No data',
          sample_record: sampleData?.[0] || 'No records found'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        method: 'table_info',
        schema: tableInfo
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('❌ Schema check error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);