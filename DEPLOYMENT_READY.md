# 🚀 GoalMine.ai - Deployment Guide & Development Workflow

## 📋 Environment Setup & Architecture

### Project Structure
- **Original Development**: Created in Lovable.dev as "steady-aim-coach"
- **Current Development**: Cursor (Claude Code) with local development
- **Repository**: GitHub - `relevantnoise/goalmine`
- **Live Domain**: goalmine.ai (via GoDaddy DNS → Vercel)

### Vercel Projects
1. **steady-aim-coach** (Development/Staging)
   - Auto-deploys from GitHub pushes
   - Used for preview deployments
   - URL: steady-aim-coach-main-*.vercel.app

2. **GoalMine** (Production)
   - Connected to same GitHub repository
   - Auto-deploys from main branch
   - Domain: goalmine.ai
   - Has production environment variables configured

### Tech Stack
- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Authentication**: Firebase (via CDN)
- **Backend**: Supabase (Database + Edge Functions)
- **Hosting**: Vercel
- **Payments**: Stripe
- **Email**: Resend using onboarding@resend.dev (Firebase handles auth emails)

---

## 🔄 Development Workflow & Best Practices

### 1. Development Process
```
Local Development (localhost:5173)
    ↓
Testing in Dev Environment
    ↓
Commit to Git
    ↓
Push to GitHub
    ↓
Auto-Deploy to Vercel (both projects)
    ↓
Production Testing on goalmine.ai
```

### 2. Development Best Practices

#### Always Work in Dev First
- Make ALL changes in local development environment
- Test thoroughly at localhost:5173
- Never edit production directly

#### Testing Protocol
1. **Before Committing**: Run full test suite locally
2. **Build Test**: `npm run build` must succeed without errors
3. **Manual Testing**: Complete the testing checklist below
4. **Commit with Clear Messages**: Describe what was fixed/added

#### Git Workflow
```bash
# 1. Check status
git status

# 2. Add all changes
git add -A

# 3. Commit with descriptive message
git commit -m "Fix: [specific issue] - [what was done]"

# 4. Push to GitHub (triggers auto-deploy)
git push origin main
```

---

## 🚢 Deployment Process (Dev → Production)

### Step-by-Step Deployment

#### 1. Pre-Deployment Checklist
- [ ] All features tested locally
- [ ] No console errors in browser
- [ ] Build completes successfully (`npm run build`)
- [ ] **CRITICAL: Database schema verified in BOTH dev and production** 
- [ ] **CRITICAL: All core tables exist (profiles, goals, subscribers, motivation_history, daily_nudges)**
- [ ] All edge functions deployed to Supabase
- [ ] Environment variables verified in Vercel
- [ ] **AI Assistant: Verify schema sync between environments**

#### 2. Deploy to Production
```bash
# 1. FIRST: Apply database schema (if needed)
# AI Assistant must handle this - NEVER ask user to run SQL manually

# 2. Ensure all changes are committed
git status

# 3. Stage all changes
git add -A

# 4. Commit with version note
git commit -m "Production release: [version] - [summary of changes]"

# 5. Push to GitHub (auto-deploys to both Vercel projects)
git push origin main

# 6. AI Assistant: Verify database tables exist in production
# 7. AI Assistant: Test core functionality immediately

# 8. Monitor deployment (2-3 minutes)
# Check: https://vercel.com/dashboard
```

#### 3. Verify Deployment
- Visit https://goalmine.ai
- Check Vercel dashboard for successful deployment
- Run production testing checklist

---

## ✅ Testing Checklists

### Local Development Testing (Before Pushing)

#### Core Features
- [ ] User can sign up with email/Google
- [ ] Email verification works
- [ ] Goal creation flow completes
- [ ] Dashboard loads without "No Active Goals" flash
- [ ] Check-ins work (once per day)
- [ ] Streaks calculate correctly
- [ ] Nudges generate properly
- [ ] ✅ **FIXED Sept 8**: Daily motivation emails sending via Resend (onboarding@resend.dev)

#### Subscription Limits & Business Logic
- [ ] Free users: 1 goal maximum
- [ ] Free users: 1 nudge per day
- [ ] Premium users: 3 goals maximum
- [ ] Premium users: 3 nudges per day
- [ ] Upgrade prompts appear correctly
- [ ] ✅ **DEPLOYED**: Expired goals show "GOAL EXPIRED" badge with edit/delete only
- [ ] ✅ **DEPLOYED**: Trial-expired users show "TRIAL EXPIRED" badge with upgrade prompts
- [ ] ✅ **DEPLOYED**: Permission system prevents invalid actions (check-in, share, view motivation on expired goals)
- [ ] ✅ **DEPLOYED**: Backend validates permissions in check-in/update/delete functions

#### UI/UX
- [ ] All buttons work
- [ ] Toast notifications appear
- [ ] Loading states display properly
- [ ] Mobile responsive design works
- [ ] No console errors

### Production Testing (After Deployment)

#### Critical Path Testing
1. **New User Flow**
   - [ ] Sign up with fresh email
   - [ ] Receive verification email
   - [ ] Complete goal creation
   - [ ] View goal detail page with motivation content
   - [ ] Land on dashboard with goal visible

2. **Returning User Flow**
   - [ ] Log in successfully
   - [ ] Dashboard loads with existing goals
   - [ ] Can check in once per day
   - [ ] Can get nudges (respecting limits)
   - [ ] Can edit/delete goals

3. **Subscription Flow**
   - [ ] Free user sees upgrade prompts
   - [ ] Stripe checkout loads
   - [ ] Subscription limits enforced

4. **Email System**
   - [ ] Daily motivation emails sending (1 per goal via Resend)
   - [ ] Nudge emails arrive (individual delivery via Resend)
   - [ ] Email verification works (via Firebase)
   - [ ] Password reset emails work (via Firebase)
   - [ ] Email templates render correctly with goal-specific content

---

## 🔧 Environment Variables

### Required in Vercel (Production)
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### Required in Supabase Edge Functions
```
OPENAI_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
```

---

## 🚨 Troubleshooting Common Issues

### Issue: Changes not appearing on goalmine.ai
**Solution**: 
1. Check Vercel dashboard for deployment status
2. Clear browser cache
3. Verify GitHub push was successful

### Issue: "No Active Goals" flash on dashboard
**Solution**: 
- Ensure `authLoading` and `goalsLoading` are coordinated
- Check Dashboard.tsx loading logic

### Issue: Firebase authentication errors
**Solution**:
- Verify Firebase project settings
- Check authorized domains include goalmine.ai
- Ensure environment variables are set

### Issue: Subscription limits not working
**Solution**:
- Check Supabase `check-subscription` edge function
- Verify Stripe webhook is configured
- Test with real Stripe test keys

### 🚨 CRITICAL ISSUE: Database tables missing in production
**Symptoms**: 
- "relation does not exist" errors
- App not working at all
- Goals can't be created
- Subscription checks fail

**ROOT CAUSE**: Database migrations not applied to production

**SOLUTION (AI Assistant Only)**:
1. AI must immediately create and execute database setup function
2. AI must verify all core tables exist
3. AI must test app functionality
4. NEVER ask user to run SQL manually

**Prevention**: Always verify database schema before declaring deployment complete

---

## 🔄 Dev/Production Sync Process

### **Current Setup (Always In Sync):**
✅ **Code**: Single GitHub repo → Auto-deploys to both environments  
✅ **Edge Functions**: Same Supabase project for both  
✅ **Environment Variables**: Properly configured in Vercel  

### **Best Practice Workflow:**
1. **Make changes locally** (localhost:5173)
2. **Test thoroughly** with dev database
3. **AI Assistant verifies** schema exists in production
4. **Commit and push** → Auto-deploys everywhere
5. **Verify both environments** work identically

### **Schema Sync Process:**
- **Dev Environment**: Uses local Supabase or shared dev instance
- **Production**: Uses production Supabase (dhlcycjnzwfnadmsptof)
- **AI Responsibility**: Ensure schemas match before deployment
- **Never Again**: User shouldn't need to run SQL manually

---

## 📊 Monitoring & Maintenance

### Daily Checks
- Verify daily email cron job ran (7 AM EST)
- Check Resend dashboard for email delivery status
- Monitor that emails send from onboarding@resend.dev
- Check error logs in Vercel dashboard
- Monitor Supabase edge function logs
- **New: Verify dev/prod database schema consistency**

### Weekly Maintenance
- Review user feedback
- Check Stripe for failed payments
- Audit database for orphaned records
- Review email delivery rates
- **New: Run schema comparison between environments**

---

## 🔐 Security Notes

### Never Commit
- API keys or secrets
- .env files
- User data or passwords
- Debug/test user credentials

### Always Use
- Environment variables for sensitive data
- HTTPS for all communications
- Proper authentication checks
- Supabase RLS policies

---

## 📞 Quick Reference

### Key Commands
```bash
# Local development
npm run dev

# Build for production
npm run build

# Deploy to production
git add -A && git commit -m "message" && git push origin main

# Check deployment status
# Visit: https://vercel.com/dashboard
```

### Important URLs
- **Production**: https://goalmine.ai
- **GitHub**: https://github.com/relevantnoise/goalmine
- **Vercel Dashboard**: https://vercel.com
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Stripe Dashboard**: https://dashboard.stripe.com

---

## 📝 Version History

### Latest Release (September 2025) 
- **NEW**: Comprehensive expired goals/trials system with 5-phase implementation
- **NEW**: Status badges ("GOAL EXPIRED", "TRIAL EXPIRED") and permission-based UI
- **NEW**: Backend permission validation in all key edge functions
- **NEW**: Smart email skip logic for expired scenarios  
- **ENHANCED**: Enterprise-grade business logic with full-stack validation
- Fixed Firebase authentication flow
- Corrected subscription limits  
- Resolved loading state issues
- Fixed email delivery system
- Enhanced UI consistency

### Previous Issues Resolved
- Email verification redirect issue
- "No Active Goals" flash on dashboard
- Subscription limit enforcement
- Daily check-in timezone calculations
- Motivation content generation

---

## ✨ Ready for Production!

This guide ensures smooth development and deployment workflows. Always follow the testing checklists and deployment process to maintain a stable production environment at goalmine.ai.