# 🚀 START HERE - GoalMine.ai Developer Onboarding

## For New Developers, New Chats, or Returning After Time Away

### 📖 Read These Documents First (IN THIS ORDER):

1. **`STATUS.md`** - **NEW** Complete status overview (READ THIS FIRST!)
   - Executive summary of current state
   - Latest expired goals/trials system implementation
   - Complete feature matrix and business logic
   - Production readiness assessment

2. **`CLAUDE.md`** - Complete project overview and technical architecture
   - Understand what the app does and how it works
   - Learn the technical stack and design patterns
   - Review common issues and troubleshooting

3. **`DEPLOYMENT_READY.md`** - Deployment workflows and environment setup
   - Understand the dev → production pipeline
   - Learn how to deploy changes safely
   - Review comprehensive testing checklists

4. **`CURRENT_STATUS.md`** - Detailed development history and context
   - Recent development achievements
   - Testing results and deployment preparation
   - Critical notes for developers

5. **`DEVELOPMENT_WORKFLOW.md`** - Development best practices (if exists)
   - Learn the coding workflow
   - Understand testing requirements
   - Review emergency procedures

---

## 🔑 Quick Context for AI Assistants

**Tell your AI assistant:**
"Please read STATUS.md first, then CLAUDE.md and DEPLOYMENT_READY.md before we start working on the GoalMine.ai app. The app is running live at https://goalmine.ai with daily emails working via Resend (using onboarding@resend.dev). Email system was fixed on September 8, 2025."

---

## 🏗️ Project Setup Summary

- **App Name**: GoalMine.ai (formerly steady-aim-coach in Lovable)
- **GitHub Repo**: relevantnoise/goalmine
- **Local Dev**: http://localhost:5173
- **Production**: https://goalmine.ai
- **Vercel Projects**: steady-aim-coach (dev) & GoalMine (production)

---

## 🚦 Current Status (September 10, 2025)

- **Status**: ✅ DEPLOYED IN PRODUCTION - EMAIL SYSTEM STABLE WITH DUPLICATE PREVENTION
- **Live URL**: https://goalmine.ai 🚀
- **Latest**: Email system stabilized - duplicate emails fixed, check-in UX improved
- **Email System**: Vercel cron → Supabase functions → Resend delivery (STABLE & TESTED)
- **Duplicate Prevention**: Active at goal level - users get exactly 1 email per goal per day
- **Check-In Links**: Working with helpful Firebase session error handling
- **Features**: 100% MVP + enterprise-grade business logic running live
- **Subscription Limits**: Fully enforced with permission system in production
- **Business Logic**: Trial expiration > Goal expiration > Normal operation
- **UI**: Status badges, permission-based buttons, upgrade prompts (LIVE)
- **Backend**: Full permission validation in all edge functions (DEPLOYED)

---

## 💻 Quick Start Commands

```bash
# Start local development
npm install
npm run dev

# Deploy to production
git add -A
git commit -m "Your change description"
git push origin main
# (Auto-deploys to Vercel)
```

---

## ⚠️ Critical Things to Know

1. **Never edit production directly** - Always work in local dev first
2. **Test thoroughly** - Use checklists in DEPLOYMENT_READY.md
3. **Firebase Auth** - Uses CDN version, not npm package
4. **Supabase Edge Functions** - Handle all database writes with permission validation
5. **Daily Email System** - **FULLY AUTOMATED** via Vercel cron (7 AM EDT) → Supabase → **Resend** (onboarding@resend.dev)
6. **Business Logic Priority** - Trial expiration > Goal expiration > Normal operation
7. **Expired Goals/Trials** - Sophisticated 5-phase system implemented September 2025
8. **Permission System** - Full-stack validation prevents API bypass attempts

---

## 🆕 Latest Fixes (September 2025)

### **Email System Stabilized (September 10, 2025)**
- **Duplicate Email Fix**: Resolved race condition causing 2 emails per goal instead of 1
- **Technical Solution**: Atomic `last_motivation_date` updates BEFORE email sending
- **UX Enhancement**: Added helpful messaging for Firebase session expiration from email links
- **Result**: Users get exactly 1 email per goal per day with better check-in link experience
- **Architecture**: Vercel cron → Supabase (with duplicate prevention) → Resend delivery

### **Expired Goals/Trials System - 5 Phases Complete (September 3, 2025)**
- **Phase 1**: Data layer helper functions in `useGoals.tsx`
- **Phase 2**: Email skip logic in `send-daily-emails` function
- **Phase 3**: Frontend status detection with parallel data fetching
- **Phase 4**: UI components with status badges and permission-based buttons
- **Phase 5**: Backend validation in `check-in`, `delete-goal`, `update-goal` functions

### **Key Files Modified**
- `src/hooks/useGoals.tsx` - Business logic and helper functions
- `src/components/GoalCard.tsx` - Status badges and permission-based UI
- `src/components/Dashboard.tsx` - Enhanced goal data passing
- `supabase/functions/send-daily-emails/` - Smart skip logic
- `supabase/functions/check-in/` - Permission validation
- `supabase/functions/delete-goal/` - Permission validation  
- `supabase/functions/update-goal/` - Permission validation

---

## 📞 If You Get Stuck

1. **Read STATUS.md first** - Has complete current state overview
2. Check CLAUDE.md for technical architecture and common issues
3. Review recent commits in git history
4. Check Vercel and Supabase logs for errors
5. Test in incognito mode to rule out cache issues
6. Check Supabase edge function logs for backend issues

---

## 🎯 For AI Assistants - What's New

**Latest Major Update**: Comprehensive expired goals/trials business logic system
- Goals past their target date: Edit/delete only (no check-ins, emails, sharing)
- Users past 30-day trial (not subscribed): Read-only until upgrade
- Full UI with status badges: "GOAL EXPIRED" (red), "TRIAL EXPIRED" (orange)  
- Backend permission validation in all key edge functions
- Smart email system skips expired scenarios (1 email per active goal)
- Clear upgrade prompts for trial-expired users

**Email Architecture**: Resend sends 1 individual email per active goal at 7 AM Eastern. Firebase handles auth emails only.

**The app now has enterprise-grade business logic handling all edge cases gracefully.**

---

**Remember**: This START_HERE.md file is your roadmap. Always start here when returning to the project or onboarding someone new. Read STATUS.md first for the complete picture!