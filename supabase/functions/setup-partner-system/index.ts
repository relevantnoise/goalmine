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
    console.log('🚀 Setting up strategic partner system...');

    // Execute SQL directly to create tables
    const createTablesSQL = `
      -- Create strategic_partners table
      CREATE TABLE IF NOT EXISTS strategic_partners (
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

      -- Create partner_clicks table
      CREATE TABLE IF NOT EXISTS partner_clicks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email text,
        goal_id uuid,
        partner_id uuid,
        goal_title text,
        user_tier text,
        clicked_at timestamp DEFAULT now()
      );

      -- Add foreign key constraint if not exists
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'partner_clicks_partner_id_fkey') THEN
          ALTER TABLE partner_clicks ADD CONSTRAINT partner_clicks_partner_id_fkey 
          FOREIGN KEY (partner_id) REFERENCES strategic_partners(id);
        END IF;
      END $$;
    `;

    // Skip table creation for now - we'll use SQL migrations
    console.log('Tables should be created via Supabase migrations...');

    // Now insert StartingIt.ai partner
    const { data: existingPartner } = await supabase
      .from('strategic_partners')
      .select('id')
      .eq('name', 'StartingIt.ai')
      .single();

    if (!existingPartner) {
      const { error: insertError } = await supabase
        .from('strategic_partners')
        .insert({
          name: 'StartingIt.ai',
          description: 'Complete business launch platform with legal setup, financial planning, and strategic guidance',
          website_url: 'https://startingit.ai',
          affiliate_url: 'https://startingit.ai?ref=goalmine&user={{USER_EMAIL}}',
          // Note: No cta_text field - frontend always shows "Learn More" button
          keywords: ['business', 'startup', 'entrepreneur', 'consulting', 'freelance', 'launch', 'company', 'llc', 'corporation', 'firm', 'agency', 'venture'],
          pillar_categories: ['Work'],
          notes: 'First strategic partner - business/entrepreneurship focus',
          is_active: true
        });

      if (insertError) {
        console.error('Error inserting StartingIt.ai:', insertError);
        throw insertError;
      }
    }

    console.log('✅ Partner system setup complete');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Strategic partner system ready',
        partner: 'StartingIt.ai added'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('❌ Setup error:', error);
    
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