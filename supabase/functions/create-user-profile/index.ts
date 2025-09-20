import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firebaseUid, email, displayName, photoURL } = await req.json();
    
    console.log("🔥 Creating profile for Firebase user:", { email, firebaseUid });

    if (!firebaseUid || !email) {
      throw new Error("Firebase UID and email are required");
    }

    // Check environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("Environment check:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlPrefix: supabaseUrl?.substring(0, 20)
    });

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if profile already exists by Firebase UID
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', firebaseUid)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error checking existing profile:", fetchError);
      throw fetchError;
    }

    if (existingProfile) {
      // Update existing profile with Firebase UID
      console.log("📝 Updating existing profile");
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          email: email,  // ✅ Ensure email is up to date
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw updateError;
      }

      return new Response(JSON.stringify({ profile: updatedProfile }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Create new profile with Firebase UID as primary key
      console.log("🆕 Creating new profile with Firebase UID as ID");
      const newProfile = {
        id: firebaseUid,           // ✅ Use Firebase UID as primary key
        email: email,
        // Try both old and new column names for trial expiration
        trial_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (createError) {
        console.error("Error creating profile:", createError);
        throw createError;
      }

      return new Response(JSON.stringify({ profile: createdProfile }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    console.error("❌ Profile creation error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});