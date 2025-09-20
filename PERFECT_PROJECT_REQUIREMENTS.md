# 🎯 Perfect Project Requirements Template
**For Building SaaS Apps with Claude Code Without Issues**

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

**App Name**: [Your App Name]
**Purpose**: [One clear sentence about what the app does]
**Target Users**: [Who will use this app]
**Business Model**: [Freemium, subscription, one-time payment, etc.]

**Example:**
- **App Name**: GoalMine.ai
- **Purpose**: AI-powered goal tracking with daily motivation emails
- **Target Users**: Individuals who want accountability for personal goals
- **Business Model**: Freemium with $4.99/month premium subscription

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

**AI Integration**: 
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
Free Tier: [Define exactly: X goals, X features, etc.]
Premium Tier: [Define exactly: X goals, X features, etc.]
Trial Expiration: [Define exactly what happens]

✅ TESTING CRITERIA:  
- Free users hit limits and see upgrade prompts
- Premium users can access all features
- Subscription status updates immediately after payment
- Webhook properly updates database when subscriptions change
- Trial expiration properly restricts access
```

#### **Core Application Features**
```
[Define each feature with:]

FEATURE: [Name]
PURPOSE: [What it does]
USER FLOW: [Step by step user experience]
TECHNICAL REQUIREMENTS: [Specific implementation needs]
BUSINESS RULES: [Any restrictions or logic]
TESTING CRITERIA: [How to verify it works]

EXAMPLE:
FEATURE: Goal Creation
PURPOSE: Allow users to create trackable goals with AI coaching
USER FLOW: 
1. User clicks "Create Goal"
2. Fills 4-step form (Title, Description, Target Date, Coaching Style)
3. AI generates immediate motivation content  
4. Goal appears on dashboard
5. Daily emails start next day
TECHNICAL REQUIREMENTS:
- Form validation on all fields
- AI content generation via OpenAI
- Database storage with proper relationships
- Email scheduling setup
BUSINESS RULES:
- Free users: 1 goal maximum
- Premium users: 3 goals maximum  
TESTING CRITERIA:
- Goal creation completes without errors
- AI content generates immediately
- Goal appears on dashboard
- Email system schedules daily emails
```

#### **Email System**
```
REQUIREMENT: Professional email delivery system

✅ MUST HAVE:
- Resend integration for all application emails
- Professional HTML email templates
- Daily email scheduling (specify exact time)
- Email delivery tracking and retry logic
- Separate emails per goal (not consolidated)
- Transactional emails for user actions

✅ EMAIL TYPES:
1. Daily Motivation: [Specify content, timing, personalization]
2. Nudges: [Specify triggers and content]  
3. Subscription: [Specify payment confirmations, etc.]

✅ TESTING CRITERIA:
- All emails deliver reliably to inbox (not spam)
- Email templates render correctly across clients
- Daily emails send at specified time
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
PROVIDE EXACT SCHEMA:

Table: profiles
- id (text, primary key, matches Firebase UID)
- email (text, unique)
- created_at (timestamp)
- trial_expires_at (timestamp, default: created_at + 30 days)
- subscription_tier (text, default: 'free')

Table: goals
- id (uuid, primary key)
- user_id (text, foreign key to profiles.id)
- title (text)
- description (text)
- target_date (date)
- tone (text) 
- streak_count (integer, default: 0)
- is_active (boolean, default: true)
- created_at (timestamp)

Table: subscribers  
- user_id (text, primary key, foreign key to profiles.id)
- stripe_customer_id (text)
- stripe_subscription_id (text)
- plan_name (text)
- status (text)
- current_period_end (timestamp)

[Continue for all tables...]
```

#### **Edge Functions Required**
```
LIST EVERY FUNCTION NEEDED:

1. create-user-profile
   - Purpose: Sync Firebase user to Supabase profile
   - Trigger: First login
   - Returns: Profile data

2. create-goal
   - Purpose: Create new goal with AI content generation
   - Validation: Check subscription limits
   - Returns: Goal data + motivation content

3. check-subscription  
   - Purpose: Real-time subscription status check
   - Integration: Stripe API
   - Returns: Subscription status and limits

[Continue for all functions...]
```

### **5. SPECIFIC INTEGRATION REQUIREMENTS**

#### **OpenAI Integration**
```
REQUIREMENT: GPT-4 content generation with fallbacks

IMPLEMENTATION:
- Use GPT-4 model specifically (not 3.5)
- Provide exact prompts for each content type
- Implement retry logic for API failures
- Provide fallback content when AI unavailable
- Cache generated content in database

CONTENT TYPES:
1. Daily Motivation: [Provide exact prompt template]
2. Micro-plans: [Provide exact prompt template]  
3. Challenges: [Provide exact prompt template]
```

#### **Stripe Integration**
```  
REQUIREMENT: Complete subscription management

IMPLEMENTATION:
- Stripe Checkout for payment processing
- Webhooks for subscription events
- Customer portal for subscription management
- Price IDs for each subscription tier
- Trial period handling
- Failed payment handling

WEBHOOK EVENTS TO HANDLE:
- customer.subscription.created
- customer.subscription.updated  
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

### **6. USER EXPERIENCE REQUIREMENTS**

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

### **7. BUSINESS LOGIC EDGE CASES**

#### **Expired States**
```
DEFINE EXACTLY what happens when:

GOAL EXPIRATION (past target date):
- UI Display: [Exact badges, colors, messages]
- Allowed Actions: [Edit, Delete only]  
- Restricted Actions: [No check-ins, sharing, motivation viewing]
- Email Behavior: [Skip sending emails]

TRIAL EXPIRATION (30+ days, not subscribed):
- UI Display: [Exact badges, colors, upgrade prompts]
- Allowed Actions: [None until upgrade]
- Restricted Actions: [All actions disabled]  
- Email Behavior: [Skip all emails]
- Data Preservation: [All goals preserved to incentivize upgrade]
```

#### **Subscription Changes**
```
DEFINE EXACTLY what happens when:

FREE → PREMIUM:
- Immediate limit increases
- Access to premium features  
- Retroactive feature activation

PREMIUM → FREE (downgrade):
- Gradual limit enforcement
- Feature restrictions  
- Data preservation

PAYMENT FAILURE:
- Grace period behavior
- Feature restrictions
- Recovery process
```

### **8. DEPLOYMENT REQUIREMENTS**

#### **Environment Setup**
```
PRODUCTION ENVIRONMENT:
- Custom domain with SSL
- Environment variables properly configured
- CDN setup for static assets
- Database backups configured
- Error monitoring setup

TESTING ENVIRONMENT:  
- Staging environment for testing
- Separate database for development
- Test payment processing with Stripe test mode
- Email testing with development accounts
```

#### **Launch Checklist**
```  
BEFORE LAUNCH:
✅ All authentication flows tested with real emails
✅ Subscription system tested with real credit cards (test mode)
✅ Email delivery tested to multiple email providers  
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

**PROMPT:**
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

Start by confirming you understand these requirements, then begin implementation following the specification document exactly.
```

**ATTACH THIS DOCUMENT:** `COMPLETE_PROJECT_REQUIREMENTS.md` (with all your specific requirements filled in)

---

## 🚀 Why This Would Have Worked

With this approach, you would have:

1. **Clear Expectations**: Claude knows to build a COMPLETE app, not a prototype
2. **Specific Tech Stack**: No confusion about which services to use  
3. **Detailed Requirements**: Every feature specified with testing criteria
4. **Error Prevention**: Requirements for debugging each component immediately
5. **Business Logic**: All edge cases defined upfront
6. **Integration Details**: Exact implementation requirements for each service
7. **Quality Standards**: Professional UX and error handling requirements

**The key difference**: This tells Claude to treat it like a client project where everything must work perfectly, not a coding exercise where "mostly working" is acceptable.

This template would have prevented every single issue we encountered because it:
- Specifies Firebase Auth implementation details
- Defines exact subscription limit behavior  
- Requires email system testing
- Mandates proper error handling
- Includes mobile responsiveness requirements
- Defines all business logic edge cases

**For your next project, just fill in this template with your specific requirements and give it to Claude Code. You'll get a production-ready app in days, not weeks!**
