# 🎯 STRIPE WEBHOOK CONFIGURATION GUIDE

## **Phase 1: Environment Setup**

### **1. Add Webhook Secret to Supabase**
```bash
# Get webhook signing secret from Stripe Dashboard (step 3 below)
# Then add to Supabase Edge Functions environment variables

STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

### **2. Deploy Webhook Function**
```bash
# Run the safe deployment script
./deploy-webhook-safely.sh
```

## **Phase 2: Stripe Dashboard Configuration**

### **3. Create Webhook Endpoint**
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/stripe-webhook`
4. **Description**: "GoalMine Subscription Management"

### **4. Select Events to Send**
```
✅ customer.subscription.created
✅ customer.subscription.updated  
✅ customer.subscription.deleted
✅ invoice.payment_succeeded
✅ invoice.payment_failed
✅ customer.created
✅ customer.updated
```

### **5. Copy Webhook Signing Secret**
1. After creating webhook, click on it
2. Go to "Signing secret" section
3. Click "Reveal" and copy the secret (starts with `whsec_`)
4. Add this to Supabase environment variables as `STRIPE_WEBHOOK_SECRET`

## **Phase 3: Testing & Monitoring**

### **6. Test Webhook**
```bash
# Monitor webhook function logs
supabase functions logs stripe-webhook --project-ref dhlcycjnzwfnadmsptof

# Or test with Stripe CLI
stripe listen --forward-to https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/stripe-webhook
```

### **7. Validate Database Updates**
```sql
-- Check webhook events are being logged
SELECT * FROM webhook_events ORDER BY processed_at DESC LIMIT 10;

-- Check subscription updates  
SELECT email, subscription_tier, webhook_updated, updated_at 
FROM subscribers 
WHERE webhook_updated = true 
ORDER BY updated_at DESC;
```

### **8. Test Subscription Flow**
1. **Create test subscription** (use Stripe test mode if available)
2. **Monitor logs** for webhook processing
3. **Verify database** subscription updates
4. **Test cancellation** flow

## **Phase 4: Production Monitoring**

### **9. Key Metrics to Monitor**
- ✅ **Webhook success rate** (should be ~100%)
- ✅ **Event processing time** (should be <2 seconds)  
- ✅ **Duplicate events** (should be 0)
- ✅ **Failed signature verifications** (investigate if >0)

### **10. Troubleshooting**
```bash
# Check function health
curl -X OPTIONS https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/stripe-webhook

# Monitor webhook logs
supabase functions logs stripe-webhook --project-ref dhlcycjnzwfnadmsptof

# Check Stripe webhook status
# Dashboard > Webhooks > Your endpoint > Recent deliveries
```

## **🛡️ SAFETY FEATURES**

### **Built-in Protection**
- ✅ **Signature verification** prevents unauthorized requests
- ✅ **Event deduplication** prevents double processing  
- ✅ **danlynn@gmail.com override** preserved for testing
- ✅ **Always returns 200** prevents webhook retry storms
- ✅ **Comprehensive logging** for debugging
- ✅ **Non-blocking errors** maintain platform stability

### **Zero Platform Risk**
- ✅ **Read-only database queries** where possible
- ✅ **Upsert operations** prevent data conflicts
- ✅ **Error isolation** - webhook failures don't affect main app
- ✅ **Graceful degradation** - platform works without webhooks

## **🚨 IMPORTANT NOTES**

1. **Test User Protection**: `danlynn@gmail.com` subscription updates are skipped to preserve test access
2. **Signature Security**: NEVER expose webhook signing secret in client code
3. **Event Ordering**: Stripe may send events out of order - design handles this
4. **Retry Logic**: Stripe retries failed webhooks - we return 200 even on errors to prevent storms

## **📊 SUCCESS INDICATORS**

✅ **Webhook function deployed** without errors  
✅ **Database table created** successfully  
✅ **Stripe endpoint configured** with correct URL  
✅ **Events selected** for subscription lifecycle  
✅ **Signing secret added** to environment variables  
✅ **Test subscription** updates database correctly  
✅ **Logs show successful** event processing  
✅ **No duplicate events** in webhook_events table  

## **🎯 COMPLETION CHECKLIST**

- [ ] Webhook function deployed
- [ ] Database schema updated  
- [ ] Stripe webhook endpoint created
- [ ] Webhook secret configured
- [ ] Test subscription processed
- [ ] Monitoring setup complete
- [ ] Documentation reviewed

**When all items checked**: Webhook system is production-ready! 🎉