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
    const { email, userId, tier } = await req.json();
    // Determine plan based on tier parameter
    const isStrategicAdvisory = tier === 'strategic_advisory';
    const planName = isStrategicAdvisory ? 'Strategic Advisor Plan' : 'Personal Plan';
    const priceId = isStrategicAdvisory 
      ? "price_1SCPJLCElVmMOup293vWqNTQ" // Strategic Advisor Plan $950/month
      : "price_1RwNO0CElVmMOup2B7WPCzlH"; // Personal Plan $4.99/month
    
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
          price: priceId,
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