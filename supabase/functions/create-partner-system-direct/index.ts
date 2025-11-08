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
    console.log('🚀 Creating partner system tables directly...');

    // Test if tables already exist
    const { data: existingTable } = await supabase
      .from('strategic_partners')
      .select('id')
      .limit(1);

    if (existingTable) {
      console.log('Tables already exist');
    } else {
      console.log('Tables need to be created - will do manually in Supabase dashboard');
    }

    // For now, just try to insert the partner data
    const { data: existingPartner } = await supabase
      .from('strategic_partners')
      .select('id')
      .eq('name', 'StartingIt.ai')
      .maybeSingle();

    if (!existingPartner) {
      const { error: insertError } = await supabase
        .from('strategic_partners')
        .insert({
          name: 'StartingIt.ai',
          description: 'Complete business launch platform with legal setup, financial planning, and strategic guidance',
          website_url: 'https://startingit.ai',
          affiliate_url: 'https://startingit.ai?ref=goalmine&user={{USER_EMAIL}}',
          cta_text: 'Start Your Business - Free Trial',
          keywords: ['business', 'startup', 'entrepreneur', 'consulting', 'freelance', 'launch', 'company', 'llc', 'corporation', 'firm', 'agency', 'venture'],
          pillar_categories: ['Work'],
          notes: 'First strategic partner - business/entrepreneurship focus',
          is_active: true
        });

      if (insertError) {
        console.error('Error inserting partner:', insertError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Need to create tables first in Supabase dashboard',
            sql: `
CREATE TABLE strategic_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  website_url text NOT NULL,
  affiliate_url text NOT NULL,
  cta_text text NOT NULL DEFAULT 'Learn More',
  keywords text[] NOT NULL,
  pillar_categories text[] NOT NULL,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE partner_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text,
  goal_id uuid,
  partner_id uuid REFERENCES strategic_partners(id),
  goal_title text,
  user_tier text,
  clicked_at timestamp DEFAULT now()
);`
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    }

    console.log('✅ Partner system ready');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Partner system ready - StartingIt.ai added'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        tables_needed: 'strategic_partners, partner_clicks'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);