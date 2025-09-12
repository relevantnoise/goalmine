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

## 🚦 Current Status (September 12, 2025)

- **Status**: ✅ DEPLOYED IN PRODUCTION - ALL CRITICAL SYSTEMS RESOLVED
- **Live URL**: https://goalmine.ai 🚀
- **Latest**: Duplicate email issue COMPLETELY RESOLVED - each user receives exactly 1 email per goal per day
- **Email Fix**: Atomic database updates prevent race conditions and duplicate processing
- **Architecture**: Comprehensive hybrid system with backward/forward compatibility and auto-detection logic
- **Critical Achievement**: No data loss, no ecosystem breaks, all functions coordinate together
- **Backward Compatibility**: All existing email-based goals continue working without disruption
- **Forward Compatibility**: New Firebase UID-based goals use proper architecture consistency
- **Auto-Detection**: Functions intelligently detect goal format and adapt behavior accordingly
- **Test Results**: dandlynn@yahoo.com Firebase UID goals + legacy email-based goals all working perfectly
- **Features**: 100% MVP + enterprise-grade business logic + hybrid architecture + bulletproof email system
- **Firebase Auth**: Unlimited user signups with no rate limits (migrated from Supabase auth 2 users/hour limit)
- **Database Operations**: Hybrid functions support both email and Firebase UID formats seamlessly
- **Profile Sync**: Firebase → Supabase profile creation working seamlessly
- **User Experience**: End-to-end authentication and goal management flow working for all user types

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
5. **Firebase Authentication** - **SCALABLE AUTH** with unlimited signups (migrated from Supabase auth rate limits)
6. **User ID Architecture** - Firebase UID (database) vs email (frontend) - edge functions convert email → Firebase UID
7. **Database Operations** - All edge functions use service role keys (RLS policies broken for Firebase auth)
8. **Daily Email System** - **FULLY AUTOMATED** via Vercel cron (7 AM EDT) → Supabase → **Resend** (onboarding@resend.dev)
9. **Business Logic Priority** - Trial expiration > Goal expiration > Normal operation
10. **Permission System** - Full-stack validation prevents API bypass attempts

---

## 🆕 Latest Fixes (September 2025)

### **Duplicate Email Issue Completely Resolved (September 12, 2025)**
- **Critical Bug**: Users receiving 2 daily emails per goal instead of 1
- **Root Cause**: Race condition in database update timing - goals processed multiple times  
- **Solution**: Atomic database update - mark goals as processed immediately after selection
- **Implementation**: Moved `last_motivation_date` update from middle of processing to right after query
- **Code Change**: Lines 86-99 in `send-daily-emails/index.ts` - bulletproof duplicate prevention
- **Removed**: Redundant duplicate check that never executed due to query logic flaw
- **Result**: Each user receives exactly 1 email per active goal per day, guaranteed
- **Preservation**: All hybrid architecture, skip logic, subscription logic maintained perfectly

### **Previous Fix: Hybrid Architecture Fully Implemented (September 11, 2025)**
- **Comprehensive Solution**: Hybrid functions support both email-based and Firebase UID-based goals
- **Backward Compatibility**: All existing email-based goals continue working without any disruption
- **Forward Compatibility**: New goals use Firebase UID for proper architecture consistency
- **Auto-Detection Logic**: Functions intelligently detect goal format and adapt behavior accordingly
- **Ecosystem Coordination**: All edge functions updated together to prevent cascade failures
- **Critical Lesson**: Architectural changes require comprehensive planning to avoid downstream impacts
- **No Data Loss**: dandlynn@yahoo.com's Firebase UID goal preserved during architectural transition
- **Test Results**: Both legacy email-based goals AND new Firebase UID goals working perfectly
- **Scalability**: Firebase auth provides unlimited user signups (no more 2 users/hour Supabase limit)

**Key Hybrid Functions Implemented:**
- `create-goal`: Converts email → Firebase UID, creates with proper user_id format
- `fetch-user-goals`: Dual queries (email + Firebase UID), combines and deduplicates results  
- `check-in`: Sequential lookup (email first, Firebase UID fallback) for goal access
- `send-daily-emails`: Auto-detects format `if (goal.user_id.includes('@'))` for subscription matching
- `update-goal/delete-goal`: Hybrid support with permission validation for both formats

### **Previous Fix: Email System Completely Resolved (September 11, 2025)**
- **Subscription Logic Fix**: Fixed field mismatch bug - `subscribed = true` vs `status = 'active'`
- **Database Cleanup**: Removed duplicate user profiles causing subscription matching failures
- **Resend Configuration**: Identified and documented verification requirements for production
- **Diagnostic Tools**: Added comprehensive debugging functions for future troubleshooting

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
- `supabase/functions/send-daily-emails/` - Smart skip logic + FIXED subscription logic
- `supabase/functions/check-in/` - Permission validation
- `supabase/functions/delete-goal/` - Permission validation  
- `supabase/functions/update-goal/` - Permission validation
- **NEW**: `supabase/functions/debug-email-issues/` - Email system diagnostics
- **NEW**: `supabase/functions/test-resend-simple/` - Direct Resend API testing
- **NEW**: `supabase/functions/cleanup-duplicate-profiles/` - Database cleanup
- **NEW**: `supabase/functions/cleanup-dandlynn-completely/` - Complete user removal

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