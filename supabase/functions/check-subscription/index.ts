import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use the service role key to perform writes (upsert) in Supabase
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started - checking subscription status");

    const { email, userId } = await req.json();
    if (!email || !userId) throw new Error("Email and userId are required");
    logStep("User data received", { userId, email });

    // TESTING MODE: Override for danlynn@gmail.com to be Professional Plan
    if (email === 'danlynn@gmail.com') {
      logStep("TESTING MODE: Using Professional Plan override for danlynn@gmail.com");
      return new Response(JSON.stringify({
        subscribed: true,
        subscription_tier: 'Professional Plan',
        subscription_end: '2025-12-31T23:59:59.000Z'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // First, check database for existing subscription
    const { data: existingSub, error: dbError } = await supabaseClient
      .from('subscribers')
      .select('subscribed, subscription_tier, subscription_end')
      .eq('email', email)
      .single();

    if (!dbError && existingSub) {
      logStep("Found existing subscription in database", existingSub);
      return new Response(JSON.stringify({
        subscribed: existingSub.subscribed || false,
        subscription_tier: existingSub.subscription_tier,
        subscription_end: existingSub.subscription_end
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("No database subscription found, checking Stripe");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    logStep("Stripe key check", { hasKey: !!stripeKey, keyLength: stripeKey?.length || 0 });
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY environment variable is not configured");
    logStep("Stripe key verified - proceeding with Stripe initialization");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      await supabaseClient.from("subscribers").upsert({
        email,
        user_id: userId,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier: string | null = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      // Determine subscription tier from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      // Updated price mapping for new tier structure
      if (amount <= 499) {
        subscriptionTier = "Personal Plan"; // $4.99 or less
      } else if (amount <= 2999) {
        subscriptionTier = "Personal Plan"; // Up to $29.99 (includes $24.99 Personal Plan)
      } else if (amount <= 25000) {
        subscriptionTier = "Professional Plan"; // $199.99/month and similar mid-tier plans
      } else if (amount >= 50000) {
        subscriptionTier = "Strategic Advisor Plan"; // $950/month and above
      } else {
        subscriptionTier = "Personal Plan"; // Default fallback
      }
      logStep("Determined subscription tier", { priceId, amount, subscriptionTier });
    } else {
      logStep("No active subscription found");
    }

    await supabaseClient.from("subscribers").upsert({
      email,
      user_id: userId,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier });
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});