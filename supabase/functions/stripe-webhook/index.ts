import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Enhanced logging with safety
const logWebhook = (step: string, data?: any, level: 'info' | 'warn' | 'error' = 'info') => {
  const timestamp = new Date().toISOString();
  const logData = data ? ` | ${JSON.stringify(data)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${timestamp} | ${level.toUpperCase()} | ${step}${logData}`);
};

serve(async (req) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    logWebhook("Invalid method attempted", { method: req.method }, 'warn');
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  let eventType = 'unknown';
  let eventId = 'unknown';

  try {
    logWebhook("Webhook received, starting processing");

    // Initialize Supabase client with service role for database access
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get Stripe configuration
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey) {
      logWebhook("Missing Stripe secret key", {}, 'error');
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    if (!webhookSecret) {
      logWebhook("Missing webhook secret", {}, 'error');
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Get request body and signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      logWebhook("Missing Stripe signature", {}, 'error');
      throw new Error("Missing stripe-signature header");
    }

    // CRITICAL: Verify webhook signature for security
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logWebhook("Signature verified successfully", { eventType: event.type, eventId: event.id });
    } catch (err) {
      logWebhook("Signature verification failed", { error: err.message }, 'error');
      return new Response("Invalid signature", { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    eventType = event.type;
    eventId = event.id;

    // SAFETY: Check for duplicate webhook processing
    const { data: existingWebhook } = await supabaseClient
      .from('webhook_events')
      .select('id')
      .eq('stripe_event_id', eventId)
      .single();

    if (existingWebhook) {
      logWebhook("Duplicate webhook detected, skipping", { eventId }, 'warn');
      return new Response("Duplicate webhook processed", { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Log the webhook event for tracking (non-blocking)
    try {
      await supabaseClient
        .from('webhook_events')
        .insert({
          stripe_event_id: eventId,
          event_type: eventType,
          processed_at: new Date().toISOString(),
          raw_event: event
        });
    } catch (logError) {
      logWebhook("Failed to log webhook event (non-critical)", { error: logError.message }, 'warn');
    }

    // PHASE 1: SAFE READ-ONLY PROCESSING
    // Process specific subscription events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await processSubscriptionEvent(event, supabaseClient);
        break;
      
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        await processPaymentEvent(event, supabaseClient);
        break;
      
      case 'customer.created':
      case 'customer.updated':
        await processCustomerEvent(event, supabaseClient);
        break;

      default:
        logWebhook("Unhandled event type (logging only)", { eventType });
        break;
    }

    logWebhook("Webhook processed successfully", { eventType, eventId });
    return new Response("Webhook processed", { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logWebhook("Webhook processing failed", { 
      eventType, 
      eventId, 
      error: errorMessage 
    }, 'error');

    // CRITICAL: Always return 200 to prevent Stripe retries on our application errors
    // This prevents webhook storms that could impact platform stability
    return new Response("Webhook logged with error", { 
      status: 200, 
      headers: corsHeaders 
    });
  }
});

// SAFE: Subscription event processing with comprehensive error handling
async function processSubscriptionEvent(event: Stripe.Event, supabaseClient: any) {
  try {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    
    logWebhook("Processing subscription event", { 
      eventType: event.type, 
      subscriptionId: subscription.id,
      customerId,
      status: subscription.status 
    });

    // Get customer email from Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    
    if (!customer.email) {
      logWebhook("No customer email found", { customerId }, 'warn');
      return;
    }

    // SAFETY: Preserve danlynn@gmail.com test override
    if (customer.email === 'danlynn@gmail.com') {
      logWebhook("Skipping webhook for test user (preserving override)", { email: customer.email });
      return;
    }

    // Determine subscription tier from price
    let subscriptionTier = 'Personal Plan'; // Default
    if (subscription.items.data.length > 0) {
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      if (amount <= 2999) {
        subscriptionTier = "Personal Plan"; // $24.99
      } else if (amount <= 25000) {
        subscriptionTier = "Professional Plan"; // $199.99
      } else if (amount >= 50000) {
        subscriptionTier = "Strategic Advisor Plan"; // $950
      }
    }

    const isActive = subscription.status === 'active';
    const subscriptionEnd = isActive 
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    logWebhook("Determined subscription details", {
      email: customer.email,
      tier: subscriptionTier,
      isActive,
      subscriptionEnd
    });

    // SAFE UPDATE: Use upsert with conflict resolution
    const { data, error } = await supabaseClient
      .from('subscribers')
      .upsert({
        user_id: customer.email, // Using email as user_id per hybrid architecture
        email: customer.email,
        stripe_customer_id: customerId,
        subscribed: isActive,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
        webhook_updated: true // Flag to track webhook updates
      }, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      logWebhook("Database update failed (non-critical)", { 
        email: customer.email, 
        error: error.message 
      }, 'error');
    } else {
      logWebhook("Subscription updated successfully", { 
        email: customer.email, 
        tier: subscriptionTier 
      });
    }

  } catch (error) {
    logWebhook("Subscription processing error", { 
      eventType: event.type, 
      error: error.message 
    }, 'error');
  }
}

// SAFE: Payment event processing
async function processPaymentEvent(event: Stripe.Event, supabaseClient: any) {
  try {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = invoice.customer as string;
    
    logWebhook("Processing payment event", { 
      eventType: event.type, 
      invoiceId: invoice.id,
      customerId,
      status: invoice.status,
      paid: invoice.paid 
    });

    // For payment failures, we might want to flag accounts
    // For now, just log for monitoring
    if (event.type === 'invoice.payment_failed') {
      logWebhook("Payment failure detected", { 
        customerId, 
        invoiceId: invoice.id,
        amountDue: invoice.amount_due 
      }, 'warn');
    }

  } catch (error) {
    logWebhook("Payment processing error", { 
      eventType: event.type, 
      error: error.message 
    }, 'error');
  }
}

// SAFE: Customer event processing
async function processCustomerEvent(event: Stripe.Event, supabaseClient: any) {
  try {
    const customer = event.data.object as Stripe.Customer;
    
    logWebhook("Processing customer event", { 
      eventType: event.type, 
      customerId: customer.id,
      email: customer.email 
    });

    // Log customer changes for monitoring
    // Future: Could update customer metadata

  } catch (error) {
    logWebhook("Customer processing error", { 
      eventType: event.type, 
      error: error.message 
    }, 'error');
  }
}