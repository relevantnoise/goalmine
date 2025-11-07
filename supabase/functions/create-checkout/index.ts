import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId, tier, priceId } = await req.json();
    
    console.log('🔍 DEBUG: Raw request body:', { email, userId, tier });
    
    // Determine plan based on tier parameter or explicit priceId
    const isStrategicAdvisory = tier === 'strategic_advisory';
    const isProPlan = tier === 'pro_plan';
    const isPersonalPlan = tier === 'personal_plan';
    
    const planName = (() => {
      if (isStrategicAdvisory) return 'Strategic Advisor Plan';
      if (isProPlan) return 'Professional Plan';
      if (isPersonalPlan) return 'Personal Plan';
      return 'Personal Plan'; // Default fallback
    })();
    
    const finalPriceId = priceId || (() => {
      if (isStrategicAdvisory) return "price_1SCPJLCElVmMOup293vWqNTQ"; // Strategic Advisor Plan $950/month
      if (isProPlan) return "price_1SHE5DCElVmMOup2zX8H4qnJ"; // Professional Plan $199.99/month
      if (isPersonalPlan) return "price_1SNEM2CElVmMOup25aJLD43T"; // Personal Plan $24.99/month
      return "price_1SNEM2CElVmMOup25aJLD43T"; // Default to Personal Plan
    })();
    
    console.log(`🔍 DEBUG: tier=${tier}, isStrategicAdvisory=${isStrategicAdvisory}, isProPlan=${isProPlan}, planName=${planName}, finalPriceId=${finalPriceId}`);
    console.log(`🛒 ${planName} checkout for:`, email);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe key not configured");
    }

    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2023-10-16",
      timeout: 5000, // 5 second timeout
    });

    // Create checkout session directly - no customer lookup to avoid delays
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/success`,
      cancel_url: `${req.headers.get("origin")}/`,
      subscription_data: {
        metadata: { 
          user_id: userId,
          tier: planName,
        },
      },
    });

    console.log("🛒 Session created:", session.url);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("🛒 Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});