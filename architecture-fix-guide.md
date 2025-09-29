# Email System Permanent Fix Implementation Guide

## Phase 1: Immediate Recovery (Do This First)

### Step 1: Reset Database State
```sql
-- Reset all goals to allow email retry
UPDATE goals 
SET last_motivation_date = NULL 
WHERE is_active = true;
```

### Step 2: Test Email Flow
```bash
curl -X POST \
  "https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/send-daily-emails" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"forceDelivery": true}'
```

## Phase 2: Deploy Robust Email Function

### Step 1: Deploy New Function
```bash
SUPABASE_ACCESS_TOKEN=sbp_92814ac901f3b9a33f69e4019854d307e675d968 \
npx supabase functions deploy send-daily-emails-robust
```

### Step 2: Update Daily Cron to Use Robust Function
Edit `supabase/functions/daily-cron/index.ts` line 31:
```typescript
// OLD:
const dailyEmailsResponse = await supabase.functions.invoke('send-daily-emails', {

// NEW:
const dailyEmailsResponse = await supabase.functions.invoke('send-daily-emails-robust', {
```

### Step 3: Deploy Updated Daily Cron
```bash
SUPABASE_ACCESS_TOKEN=sbp_92814ac901f3b9a33f69e4019854d307e675d968 \
npx supabase functions deploy daily-cron
```

## Phase 3: Implement Branch-Based Architecture

### Step 1: Create Development Branch
```bash
git checkout -b dev
```

### Step 2: Remove Cron Jobs from Dev Branch
Edit `vercel.json` on dev branch:
```json
{
  "_comment": "DEVELOPMENT BRANCH: NO CRON JOBS",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 3: Commit and Push Dev Branch
```bash
git add vercel.json
git commit -m "Dev branch: Remove cron jobs for true environment separation"
git push origin dev
```

### Step 4: Configure Vercel Projects
1. Go to Vercel Dashboard
2. Find "steady-aim-coach" project (development)
3. Settings → Git
4. Change "Production Branch" from "main" to "dev"
5. Save changes

### Step 5: Verify Separation
- steady-aim-coach project deploys from dev branch (no crons)
- GoalMine project continues deploying from main branch (with crons)

## Phase 4: Add Email Delivery Tracking (Optional Enhancement)

### Step 1: Create Email Log Table
```sql
CREATE TABLE email_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id),
  user_email text NOT NULL,
  resend_id text,
  status text NOT NULL, -- 'sent', 'failed', 'skipped'
  attempted_at timestamp DEFAULT now(),
  error_message text
);
```

### Step 2: Create Monitoring Function
```typescript
// Function: check-email-health
// Runs after daily emails to verify delivery rates
// Alerts if processed goals > delivered emails
```

## Testing Checklist

### After Phase 1:
- [ ] Database reset successful
- [ ] Test email delivery confirms emails reach users
- [ ] Verify users receive emails for all active goals

### After Phase 2:
- [ ] Robust function deployed
- [ ] Daily cron updated to use robust function
- [ ] Delivery log shows detailed success/failure tracking
- [ ] Failed emails don't mark goals as processed

### After Phase 3:
- [ ] Dev environment cannot send emails (test with curl)
- [ ] Production environment still sends emails
- [ ] No more dual environment email issues

### After Phase 4:
- [ ] Email delivery tracking works
- [ ] Monitoring detects and alerts on failures
- [ ] Health dashboard shows email success rates

## Emergency Recovery Procedures

### If Emails Stop Again:
1. Check `email_delivery_log` table for actual delivery status
2. Reset `last_motivation_date = NULL` for affected goals
3. Run manual email test with `forceDelivery: true`
4. Check Resend dashboard for delivery issues

### If Duplicate Emails Return:
1. Verify branch-based deployment is working
2. Check that dev environment has no cron jobs
3. Ensure only goalmine.ai domain sends emails

## Success Metrics

### Email System Health:
- 95%+ email delivery success rate
- Zero duplicate emails
- Users receive exactly 1 email per active goal
- Recovery from failures within 24 hours

### Architectural Health:
- Dev environment isolated from production
- No manual intervention needed for normal operation
- Clear monitoring and alerting for issues