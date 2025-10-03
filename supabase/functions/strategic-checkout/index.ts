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
    const { email, userId } = await req.json();
    console.log("🎯 STRATEGIC CHECKOUT ONLY - $950/month for:", email);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe key not configured");
    }

    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2023-10-16",
      timeout: 5000,
    });

    // HARDCODED Strategic Advisor Plan - $950/month ONLY
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price: "price_1SCPJLCElVmMOup293vWqNTQ", // STRATEGIC ADVISOR PLAN ONLY
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/success`,
      cancel_url: `${req.headers.get("origin")}/`,
      subscription_data: {
        metadata: { 
          user_id: userId,
          tier: "Strategic Advisor Plan",
        },
      },
    });

    console.log("🎯 Strategic Advisor Plan session created:", session.url);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("🎯 Strategic Checkout Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});