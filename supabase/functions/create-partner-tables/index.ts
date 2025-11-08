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
    console.log('🚀 Creating strategic partner tables...');

    // Create strategic_partners table
    const createPartnersTable = `
      CREATE TABLE IF NOT EXISTS strategic_partners (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text NOT NULL,
        website_url text NOT NULL,
        affiliate_url text NOT NULL,
        cta_text text NOT NULL DEFAULT 'Learn More',
        
        -- Matching fields  
        keywords text[] NOT NULL,
        pillar_categories text[] NOT NULL,
        
        -- Management
        is_active boolean DEFAULT true,
        notes text,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `;

    // Create partner_clicks table
    const createClicksTable = `
      CREATE TABLE IF NOT EXISTS partner_clicks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email text,
        goal_id uuid,
        partner_id uuid REFERENCES strategic_partners(id),
        goal_title text,
        user_tier text,
        clicked_at timestamp DEFAULT now()
      );
    `;

    // Execute table creation
    const { error: partnersError } = await supabase.rpc('exec_sql', { 
      sql: createPartnersTable 
    });

    if (partnersError) {
      console.error('Error creating strategic_partners table:', partnersError);
      throw partnersError;
    }

    const { error: clicksError } = await supabase.rpc('exec_sql', { 
      sql: createClicksTable 
    });

    if (clicksError) {
      console.error('Error creating partner_clicks table:', clicksError);
      throw clicksError;
    }

    // Insert StartingIt.ai as first partner
    const { error: insertError } = await supabase
      .from('strategic_partners')
      .insert({
        name: 'StartingIt.ai',
        description: 'Complete business launch platform with legal setup, financial planning, and strategic guidance',
        website_url: 'https://startingit.ai',
        affiliate_url: 'https://startingit.ai?ref=goalmine&user={{USER_EMAIL}}',
        cta_text: 'Start Your Business - Free Trial',
        keywords: ['business', 'startup', 'entrepreneur', 'consulting', 'freelance', 'launch', 'company', 'llc', 'corporation', 'firm', 'agency'],
        pillar_categories: ['Work'],
        notes: 'First strategic partner - business/entrepreneurship focus',
        is_active: true
      });

    if (insertError) {
      console.error('Error inserting StartingIt.ai partner:', insertError);
      throw insertError;
    }

    console.log('✅ Successfully created partner tables and inserted StartingIt.ai');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Strategic partner system created successfully',
        tables: ['strategic_partners', 'partner_clicks'],
        initial_partner: 'StartingIt.ai'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Error creating partner tables:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
};

serve(handler);