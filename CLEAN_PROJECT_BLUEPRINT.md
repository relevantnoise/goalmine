# 🎯 Clean SaaS Project Blueprint
**Universal Template for Any SaaS Application**

## The Exact Prompt to Give Claude Code

```
I want you to build a complete, production-ready SaaS application with the exact specifications below. 

CRITICAL INSTRUCTIONS:
1. Build this as a COMPLETE, WORKING application - not a prototype
2. Use the EXACT tech stack specified - no substitutions
3. Implement ALL authentication flows completely (including email verification)
4. Test EVERY feature as you build it - fix issues immediately
5. Create a fully working subscription system with proper limits
6. Set up professional email delivery with proper templates
7. Deploy to production and verify everything works end-to-end
8. Provide detailed documentation and deployment instructions

If ANY component doesn't work perfectly, debug it immediately. Do not move to the next feature until the current one is 100% functional.
```

## 📋 Complete Technical Specification Template

### **1. APPLICATION OVERVIEW**

**App Name**: [YOUR APP NAME HERE]
**Purpose**: [ONE CLEAR SENTENCE ABOUT WHAT YOUR APP DOES]
**Target Users**: [WHO WILL USE THIS APP]
**Business Model**: [FREEMIUM / SUBSCRIPTION / ONE-TIME PAYMENT]

### **2. EXACT TECH STACK (NO SUBSTITUTIONS ALLOWED)**

**Frontend Framework**: 
- Vite + React + TypeScript
- shadcn-ui components + Tailwind CSS
- React Router for navigation

**Authentication**: 
- Firebase Auth (via CDN, not npm)
- Support email/password + Google OAuth
- Email verification required

**Backend Database**: 
- Supabase PostgreSQL
- Row Level Security (RLS) policies
- Supabase Edge Functions (Deno runtime) for API endpoints

**Email Service**: 
- Resend for application emails (NOT Firebase, NOT Render)
- Firebase only for auth-related emails (verification, password reset)

**Payment Processing**: 
- Stripe with webhooks for subscription management
- Support for subscription status changes

**AI Integration** (if needed): 
- OpenAI GPT-4 (NOT 3.5) for content generation
- Proper error handling and fallback content

**Hosting**: 
- Frontend: Vercel with custom domain support
- Backend: Supabase hosted

### **3. COMPLETE FEATURE SPECIFICATIONS**

#### **User Authentication System**
```
REQUIREMENT: Complete authentication with ALL flows working

✅ MUST HAVE:
- Email/password registration with verification email
- Google OAuth sign-up (one-click)  
- Email verification required before app access
- "Forgot Password" functionality
- Profile creation automatically synced between Firebase → Supabase
- Session management and protected routes
- Proper error handling for all auth failures

✅ TESTING CRITERIA:
- New user can register with email and receive verification email
- Clicking verification link allows access to app
- Google sign-up works immediately without email verification
- Password reset emails arrive and work correctly  
- Users cannot access protected routes without authentication
- All auth errors show user-friendly messages
```

#### **Subscription & Business Logic**
```
REQUIREMENT: Complete subscription system with feature gates

✅ MUST HAVE:
- Free tier with specific limits (define exactly what limits)
- Premium tier with expanded limits  
- 30-day free trial tracking
- Stripe checkout integration
- Webhook handling for subscription changes
- Real-time subscription status checking
- UI that adapts based on subscription level

✅ BUSINESS RULES:
Free Tier: [DEFINE EXACTLY: X features, X limits, etc.]
Premium Tier: [DEFINE EXACTLY: X features, X limits, etc.]
Trial Expiration: [DEFINE EXACTLY WHAT HAPPENS]

✅ TESTING CRITERIA:  
- Free users hit limits and see upgrade prompts
- Premium users can access all features
- Subscription status updates immediately after payment
- Webhook properly updates database when subscriptions change
- Trial expiration properly restricts access
```

#### **Core Application Features**
```
[DEFINE EACH FEATURE WITH:]

FEATURE: [FEATURE NAME]
PURPOSE: [WHAT IT DOES]
USER FLOW: [STEP BY STEP USER EXPERIENCE]
TECHNICAL REQUIREMENTS: [SPECIFIC IMPLEMENTATION NEEDS]
BUSINESS RULES: [ANY RESTRICTIONS OR LOGIC]
TESTING CRITERIA: [HOW TO VERIFY IT WORKS]

REPEAT FOR EACH MAJOR FEATURE...
```

#### **Email System** (if needed)
```
REQUIREMENT: Professional email delivery system

✅ MUST HAVE:
- Resend integration for all application emails
- Professional HTML email templates
- Email scheduling (specify exact timing)
- Email delivery tracking and retry logic
- Transactional emails for user actions

✅ EMAIL TYPES:
[LIST EACH TYPE OF EMAIL YOUR APP SENDS]

✅ TESTING CRITERIA:
- All emails deliver reliably to inbox (not spam)
- Email templates render correctly across clients
- Scheduled emails send at specified time
- Transactional emails trigger properly
- Unsubscribe links work correctly
```

### **4. CRITICAL TECHNICAL REQUIREMENTS**

#### **Authentication Integration**
```
CRITICAL: Firebase Auth must sync with Supabase profiles

IMPLEMENTATION:
- Firebase handles authentication UI and flows
- Custom function creates Supabase profile on first login
- Profile includes: email, created_at, trial_expires_at, subscription_tier
- Session management uses Firebase tokens
- Protected routes check Firebase auth status
```

#### **Database Schema**
```
PROVIDE EXACT SCHEMA FOR YOUR APP:

Table: profiles
- id (text, primary key, matches Firebase UID)
- email (text, unique)
- created_at (timestamp)
- trial_expires_at (timestamp, default: created_at + 30 days)
- subscription_tier (text, default: 'free')

[ADD YOUR APP-SPECIFIC TABLES HERE]
```

#### **Edge Functions Required**
```
LIST EVERY FUNCTION NEEDED FOR YOUR APP:

1. create-user-profile
   - Purpose: Sync Firebase user to Supabase profile
   - Trigger: First login
   - Returns: Profile data

2. [YOUR SPECIFIC FUNCTIONS HERE]

[CONTINUE FOR ALL FUNCTIONS...]
```

### **5. USER EXPERIENCE REQUIREMENTS**

#### **Loading States**
```
REQUIREMENT: No UI flashes or jarring experiences

IMPLEMENTATION:
- Coordinated loading states (auth + data)
- Minimum loading times to prevent flashes
- Skeleton screens for content loading
- Optimistic updates with rollback on errors
- Professional loading animations
```

#### **Error Handling**  
```
REQUIREMENT: User-friendly error messages throughout

IMPLEMENTATION:
- Try/catch blocks around all API calls
- Toast notifications for all user actions
- Clear error messages (no technical jargon)
- Graceful fallbacks when services unavailable
- Confirmation dialogs for destructive actions
```

#### **Mobile Responsiveness**
```
REQUIREMENT: Perfect mobile experience

IMPLEMENTATION:
- Mobile-first design approach
- Touch-friendly button sizes
- Responsive grid layouts
- Mobile navigation patterns
- Test on actual devices
```

### **6. BUSINESS LOGIC EDGE CASES**

#### **Trial & Subscription Logic**
```
DEFINE EXACTLY what happens when:

TRIAL EXPIRATION (30+ days, not subscribed):
- UI Display: [EXACT BADGES, COLORS, UPGRADE PROMPTS]
- Allowed Actions: [WHAT CAN THEY STILL DO]
- Restricted Actions: [WHAT IS DISABLED]  
- Data Preservation: [WHAT DATA IS KEPT]

SUBSCRIPTION CHANGES:
FREE → PREMIUM: [WHAT CHANGES IMMEDIATELY]
PREMIUM → FREE: [HOW LIMITS ARE ENFORCED]
PAYMENT FAILURE: [GRACE PERIOD BEHAVIOR]
```

### **7. DEPLOYMENT REQUIREMENTS**

#### **Environment Setup**
```
PRODUCTION ENVIRONMENT:
- Custom domain with SSL
- Environment variables properly configured
- CDN setup for static assets
- Database backups configured
- Error monitoring setup
```

#### **Launch Checklist**
```  
BEFORE LAUNCH:
✅ All authentication flows tested with real emails
✅ Subscription system tested with real credit cards (test mode)
✅ Email delivery tested to multiple email providers (if applicable)
✅ Mobile responsiveness tested on real devices
✅ Performance tested under load
✅ Error handling tested with network failures
✅ Database backups configured
✅ Monitoring and alerts setup
✅ Legal pages created (Privacy Policy, Terms of Service)
✅ Custom domain configured with SSL
```

## 🎯 The Perfect Initial Prompt

**Copy this exact prompt for your next project:**

---

```
I want you to build a complete, production-ready SaaS application following the attached requirements document exactly.

CRITICAL SUCCESS CRITERIA:
1. Build this as a COMPLETE, WORKING application - not a prototype
2. Use the EXACT tech stack specified - no substitutions  
3. Test EVERY feature as you build it - fix issues immediately
4. If authentication doesn't work perfectly, stop and fix it before moving on
5. If subscription limits don't work perfectly, stop and fix them before moving on  
6. If any component breaks, debug it immediately - do not continue
7. Deploy to production and test everything end-to-end
8. Provide complete documentation

DEBUGGING REQUIREMENTS:
- If emails don't deliver, debug the email service integration
- If toast messages don't appear, fix the notification system  
- If authentication loops, fix the session management
- If subscriptions don't update, debug the webhook system
- If builds fail, fix all TypeScript errors
- If pages don't load, fix all routing issues

Do not tell me "this should work" - make it actually work. Test everything.

DELIVERABLES:
✅ Complete working application deployed to production
✅ All features tested and verified working  
✅ Complete documentation for deployment and maintenance
✅ Database schema and seed data
✅ Testing checklist with all items verified

This is a completely new project. Do not reference any previous work or projects. Start fresh.

Start by confirming you understand these requirements, then begin implementation following the specification document exactly.
```

**ATTACH THIS DOCUMENT:** Your completed requirements document

---

## 🚀 How To Use This

1. **Copy this clean template** (no GoalMine references anywhere)
2. **Save it outside your GoalMine folder** (like `/Users/yourname/Desktop/SaaS-Blueprint.md`)
3. **For each new project**: 
   - Start a fresh Claude Code chat
   - Work in a completely new folder
   - Fill out the template with your new app's details
   - Use the prompt with zero references to previous work

**This ensures zero contamination between projects!**