# GoalMine.ai - Cursor Project Documentation

## 🚨 **STOP! READ THIS FIRST - CRITICAL HYBRID ARCHITECTURE**
**⚠️ EVERY CHAT SESSION GETS THIS WRONG! This causes hours of wasted debugging time.**

### **🔥 CRITICAL: HYBRID USER ID ARCHITECTURE (READ THIS FIRST!)**
**The system uses DIFFERENT user ID formats in DIFFERENT tables. DO NOT assume consistency!**

```typescript
// ✅ SUBSCRIBERS TABLE - ALWAYS uses EMAIL as user_id
subscribers: {
  user_id: "danlynn@gmail.com",    // ✅ EMAIL FORMAT ONLY
  subscribed: boolean,
  subscription_tier: string,
  // ...
}

// ✅ GOALS TABLE - HYBRID supports BOTH formats  
goals: {
  user_id: "danlynn@gmail.com" OR "ABC123xyz",  // ✅ EMAIL OR Firebase UID
  title: string,
  // ...
}

// ✅ PROFILES TABLE - uses Firebase UID
profiles: {
  id: "ABC123xyz",              // ✅ Firebase UID ONLY
  email: "danlynn@gmail.com",   // Email stored separately
  // ...
}
```

**⚠️ EDGE FUNCTION PATTERN - ALWAYS FOLLOW THIS:**
1. **Subscription checks**: Query by EMAIL (`danlynn@gmail.com`)
2. **Goal operations**: Try EMAIL first, fallback to Firebase UID
3. **New goals**: Use Firebase UID for user_id
4. **NEVER change subscriber.user_id from email to Firebase UID**

**🚨 DOCUMENTED PRODUCTION TABLES (November 2025 - VERIFIED FROM SUPABASE):**

### **✅ CONFIRMED PRODUCTION TABLES (November 2025 - VERIFIED FROM SUPABASE):**

```sql
-- ✅ ALL TABLES CONFIRMED IN PRODUCTION SUPABASE:
ai_insights              -- AI insights
daily_nudges            -- Daily motivation nudges  
email_deliveries        -- Email delivery tracking
goals                   -- Goal tracking system
motivation_history      -- AI content for goals
pillar_assessments      -- ✅ 6 Pillars assessment data (CONFIRMED EXISTS)
profiles               -- User profiles and authentication
subscribers            -- Stripe subscription data
user_frameworks        -- Framework instances
webhook_events         -- ✅ Stripe webhook event tracking (November 2025)
weekly_checkins        -- Weekly progress tracking
work_happiness         -- ✅ Business Happiness Formula data
```

#### **Existing Tables Details:**

-- Business Happiness Formula data  
work_happiness {
  id: uuid,
  framework_id: uuid,
  user_email: string,
  impact_current: number,        -- NOT "impactCurrent"
  impact_desired: number,        -- NOT "impactDesired"  
  enjoyment_current: number,     -- NOT "funCurrent"
  enjoyment_desired: number,     -- NOT "funDesired"
  income_current: number,        -- NOT "moneyCurrent"
  income_desired: number,        -- NOT "moneyDesired"
  remote_current: number,        -- NOT "remoteCurrent"
  remote_desired: number         -- NOT "remoteDesired"
}

-- Framework instances
user_frameworks {
  id: uuid,
  user_id: string,              -- Firebase UID
  user_email: string,
  is_active: boolean,
  created_at: timestamp,
  last_updated: timestamp,
  onboarding_completed: boolean,
  last_checkin_date: timestamp,
  total_checkins: number
}

-- AI insights
ai_insights {
  id: uuid,
  framework_id: uuid,
  user_email: string,
  insight_type: string,
  title: string,
  description: string,          -- NOT "content"
  priority: string,
  is_read: boolean
}
```

### **❌ LEGACY TERMS TO NEVER USE:**
- ~~`framework_elements`~~ → Use `pillar_assessments`
- ~~`six_elements_*`~~ → Use `pillar_assessments` 
- ~~`element_allocations`~~ → Use `pillar_assessments`
- ~~`circle_*`~~ → Use `pillar_assessments` (5 Circle → 6 Pillars evolution)
- ~~`elements`~~ → Use `pillars` or `pillar_assessments`
- ~~`.current`~~ → Use `.current_hours_per_week`
- ~~`.desired`~~ → Use `.ideal_hours_per_week`
- ~~`.importance`~~ → Use `.importance_level`
- ~~`impactCurrent`~~ → Use `impact_current`
- ~~`funCurrent`~~ → Use `enjoyment_current`
- ~~`moneyCurrent`~~ → Use `income_current`
- ~~`remoteCurrent`~~ → Use `remote_current`

### **🔄 NAMING EVOLUTION HISTORY:**
1. **5 Circles Framework** (Legacy) → `circle_*` tables (DELETED)
2. **5 Elements Framework** (Legacy) → `six_elements_*` tables (DELETED)  
3. **6 Pillars Framework** (Current) → `pillar_assessments` table (ACTIVE)

**⚠️ Code may still reference "circles" or "elements" in comments/filenames but DATABASE uses "pillars"**

## 🚨 LATEST UPDATES (November 3, 2025 - Strategic Assessment Redesign)

### **CRITICAL SESSION PROGRESS**
**Status**: ✅ STRATEGIC BREAKTHROUGH - Assessment Check-in System Redesigned
**Current State**: Replaced complex weekly check-in system with elegant life reflection prompts

### **Recently Completed (NOVEMBER 3, 2025)**
✅ **Strategic Assessment Redesign**: Eliminated artificial weekly check-in system in favor of life-event-triggered updates  
✅ **Button Reframing**: Changed "Edit Assessment" → "Review My Assessment" (life reflection vs data entry mindset)  
✅ **Life Reflection Prompts**: Added gentle footer messages encouraging assessment updates when life changes  
✅ **Daily Email Enhancement**: Added subtle life reflection prompts to universal 6 AM emails  
✅ **UI Polish**: Updated assessment card button styling to match goal card attractiveness with color distinction  
✅ **Code Cleanup**: Removed weekly check-in modal, imports, state variables, and unused functionality  

### **Previous Milestones (October 29, 2025)**
✅ **AssessmentCard JSX Fix**: Resolved React fragment syntax errors - all return statements properly wrapped  
✅ **Framework Info Modal**: "Learn More About Our Framework and Formula" button now functional  
✅ **Dual-Tool Messaging**: Updated entire landing page to emphasize both 6 Pillars Framework + Business Happiness Formula  
✅ **Comprehensive Branding**: Landing page, assessment card, creator story all reflect sophisticated dual-tool approach  

### **Current Testing Status**
- ✅ Fresh user experience (Dan's data cleared for clean testing)
- ✅ Assessment card displays properly with updated messaging and new button styling
- ✅ Framework info modal working correctly
- ✅ Landing page messaging emphasizes both tools as complementary
- ✅ **COMPLETED**: Strategic assessment redesign with life reflection prompts
- ✅ **COMPLETED**: Removed complex weekly check-in system entirely
- ✅ **COMPLETED**: Daily email enhancement with gentle assessment reminders
- ⏳ **PENDING**: AI insights generation and goal creation testing

### **Key Files Modified November 3, 2025**
- `src/components/AssessmentCard.tsx` - Strategic assessment redesign: removed weekly check-ins, updated button styling, added life reflection prompts
- `supabase/functions/send-motivation-email/index.ts` - Added gentle life reflection prompt to daily emails
- Toast system fixes - Updated goal deletion flow to use MotivationAlert system consistently

### **Key Files Modified October 29, 2025**
- `src/components/AssessmentCard.tsx` - Fixed JSX structure, updated messaging
- `src/components/LandingPage.tsx` - Comprehensive dual-tool messaging updates
- `src/components/FrameworkInfoModal.tsx` - Comprehensive framework + formula explanation
- `src/hooks/useFramework.tsx` - Improved error handling for missing database tables

### **Testing Plan Remaining**
1. Framework editing functionality
2. ~~Weekly check-in system~~ ✅ **COMPLETED - Redesigned to life reflection prompts**
3. AI insights generation
4. Goal creation from framework analysis
5. Complete user state transitions

### **Business Logic Confirmation**
- Business Happiness Formula = specialized subset of Work pillar (but marketed as separate tool)
- Positioning: Two proven tools working together for maximum professional impact
- 30-year proven history with hundreds of professionals
- Dan Lynn created both tools to solve complex life management challenges

### **Business Happiness Formula™ Details**
**Formula**: Impact + Fun + Money + Flexibility = Work Happiness
- **Multiplicative Effect**: If any factor is low/zero, total happiness approaches zero
- **All factors important**: Each contributes to overall professional satisfaction
- **Priority Order**: Flexibility (least) → Money → Fun → Impact (most important)
- **Flexibility Redefined**: Location AND/OR schedule flexibility (more inclusive than just remote work)
- **Assessment Language**: "Your personal impact" + "Work satisfaction and fun" + "Location and/or schedule flexibility"

---

## Project Overview

GoalMine.ai is a **comprehensive goal creation platform** built with React, TypeScript, and Supabase. The application combines Dan Lynn's proprietary **6 Pillars of Life™ Framework** with intelligent goal tracking, featuring AI-powered insights, weekly pillar assessments, and research-backed guidance that helps high achievers create goals that reduce stress & increase happiness.

## ⚠️ CRITICAL CODEBASE WARNING (October 2025)

**OUTDATED CODE EXISTS**: Some components in this codebase contain OLD CODE that does not match production:
- `OnboardingForm.tsx` - Contains outdated 5-step process with time selection (SHOULD BE 4 steps)
- Email time selection logic - REMOVED months ago, all users get 6 AM emails
- **WARNING**: Do not modify or rely on code that references email time selection
- **VERIFY**: Always check if components match current simplified user flow before making changes

**PRODUCTION REALITY**: 4-step goal creation (Title → Details → Date → Tone) + Universal 6 AM emails

## ✅ DEVELOPMENT WORKFLOW (Updated October 3, 2025)

### **🔒 SAFETY IMPROVEMENTS (October 3, 2025)**
- Removed 62 debug/test/dangerous functions (48% reduction)
- Eliminated bulk deletion functions for data protection
- Implemented 1-day motivation content cleanup (95% storage reduction)
- **SIMPLIFIED SINGLE-BRANCH ARCHITECTURE**: Domain-based email protection

### **Repository Structure**
```
GitHub: relevantnoise/goalmine
└── main branch → Both environments with automatic protection
    ├── goalmine.ai [PRODUCTION - emails enabled]
    └── steady-aim-coach.vercel.app [STAGING - emails blocked]
```

### **Simplified Development Pattern**
```bash
# All development on main branch
git checkout main
npm run dev  # localhost:5173

# Deploy to both environments
git add -A && git commit -m "Feature: description"
git push origin main  # → Updates both goalmine.ai AND steady-aim-coach.vercel.app
```

### **Benefits**
- Domain-based email protection blocks non-production domains
- Single source of truth eliminates sync issues
- Automatic deployment keeps both environments in sync
- Staging environment cannot send emails

## Complete User Flow

### New User Registration & Onboarding (UPDATED - 6 Pillars Framework)
1. Landing page → registration (Google/email)
2. Email verification → 6 Pillars of Life™ Framework onboarding
3. 30-day free trial automatically activated

### Goal Creation Process (SIMPLIFIED - Current Implementation)
**IMPORTANT**: The goal creation process was simplified months ago and now uses a 4-step flow:
1. **Goal Title** - Clear, specific goal description
2. **Additional Details** - Context and motivation details (crucial for AI personalization)  
3. **Target Date** - When user wants to achieve the goal
4. **Motivation Tone** - Coaching style (drill sergeant, encouraging, teammate, mentor)

**REMOVED**: Time selection step (users previously selected morning/afternoon/evening)
**CURRENT**: All users receive emails at 6 AM Eastern regardless of preferences

### Dashboard Experience (6 Pillars Framework PRIMARY)
- **6 Pillars Framework Dashboard** - Visual framework overview with gap analysis
- **Smart Insights System** - AI-powered pattern recognition and recommendations
- **Weekly Pillar Check-ins** - Structured progress tracking and trend analysis
- **AI Goal Guidance** - Research-backed coaching from assessment to action
- **Clean Goals System** - Separate from framework (no filtering complexity)
- **Universal nudge system** - Real-time AI motivation
- **Goal detail pages** - Smart AI content with fallback systems

### Daily Motivation System (SIMPLIFIED - October 2025)
- **CURRENT EMAIL SYSTEM**: Universal 6 AM Eastern delivery for ALL users (no time selection)
- **Email Content**: AI-generated with goal-specific messages, micro-plans, mini-challenges
- **Tone**: Consistent with individual user preferences (drill sergeant, encouraging, teammate, mentor)
- **Goal Detail Pages**: Smart AI content (real-time/cached for on-demand viewing)
- **Key Change**: Users NO LONGER select email times - everyone gets the same consolidated email at 6 AM

### Subscription Tiers (Updated November 2025)
- **Free Users**: 1 goal, 1 daily nudge, 30-day trial
- **Personal Plan**: 3 goals, 3 daily nudges, $24.99/month
- **Professional Plan**: 10 goals, 10 daily nudges + 6 Pillars Framework™ + monthly group Q&A, $199.99/month
- **Strategic Advisor Plan**: 10 goals, 10 daily nudges + 6 Pillars Framework™ + 1-on-1 coaching, $950/month
- **Legacy Support**: Pro Plan, Professional Coach (mapped to Professional Plan limits)
- **Feature Gates**: UI dynamically adapts based on subscription status

## 🏛️ 6 PILLARS OF LIFE™ FRAMEWORK ARCHITECTURE (October 28, 2025)

### MAJOR ARCHITECTURAL BREAKTHROUGH (October 28, 2025)
**Status**: ✅ COMPLETE - Clean architecture implemented with 80/20 MVP approach  
**Transformation**: From simple goal tracking to comprehensive framework-driven goal creation platform  
**Timeline**: 5-day implementation delivering maximum impact with minimum complexity  

### Revolutionary Life Architecture System
Dan Lynn's **6 Pillars of Life™ Framework** (evolved from 30-year "5 Circles" legacy) now forms the core platform architecture:

**The 6 Pillars:**
- **Work**: Career, professional development, income
- **Sleep**: Rest, recovery, energy management (NEW 6th pillar)
- **Friends & Family**: Relationships, social connections  
- **Health & Fitness**: Physical wellbeing, energy, vitality
- **Personal Development**: Learning, growth, skills
- **Spiritual**: Inner purpose, values, meaning

### **CURRENT DATABASE ARCHITECTURE (November 2025)**
**✅ CONFIRMED PRODUCTION SCHEMA - USE THESE EXACT NAMES:**

```sql
-- 6 Pillars Framework Tables (CURRENT):
user_frameworks          -- Core framework instances
pillar_assessments       -- 6 Pillars data: pillar_name, current_hours_per_week, ideal_hours_per_week, importance_level
work_happiness          -- Business Formula: impact_current, enjoyment_current, income_current, remote_current (+ _desired versions)
weekly_checkins         -- Weekly progress tracking
ai_insights            -- AI insights: title, description, insight_type, priority

-- Goals System:
goals                   -- Goal tracking (separate from framework)
motivation_history      -- AI content for goals

-- Supporting Tables:
profiles               -- User authentication (Firebase UID + email)
subscribers            -- Stripe subscription data
daily_nudges          -- Daily motivation nudges
email_deliveries      -- Email delivery tracking
```

**🚨 CRITICAL: Always use snake_case field names (current_hours_per_week NOT currentHours)**

**✅ October 29 Database Cleanup:**
- Removed inconsistent table names (six_elements_*, element_allocations)
- Added user_email columns for easy developer investigation
- Clean schema with proper validation and performance indexes
- Zero backward compatibility complexity for zero-user codebase

### 80/20 MVP Implementation (6-Day Sprint)
**Day 1**: Database architecture and tables  
**Day 2**: FrameworkOverview component replacing goal card  
**Day 3**: WeeklyCheckin system for engagement  
**Day 3.5**: AI Goal Guidance bridging assessment to action  
**Day 4**: Smart Insights with connection intelligence  
**Day 5**: Framework filtering removal and UI polish  
**Day 6**: Intelligent assessment system + Complete API data layer  

### Key Components Built (October 28, 2025)

#### FrameworkOverview.tsx
- Visual dashboard showing all 6 pillars with progress bars
- Gap analysis with current vs desired visualization  
- Smart Architecture Insights highlighting biggest opportunities
- Weekly check-in triggers and AI guidance access
- Progress trends modal for historical analysis

#### WeeklyCheckin.tsx  
- Modal interface with 1-10 sliders for each pillar
- Real-time overall satisfaction calculation
- Optional notes for weekly insights
- Integration with save-weekly-checkin edge function
- Encouraging feedback: "Your framework progress is strengthening!"

#### AIGoalGuidance.tsx
- **The Bridge Component** - Assessment to action transformation
- Research-backed reality checks for unrealistic targets
- Context-aware AI prompts analyzing all pillar gaps
- Intelligent red flag detection (Sleep <6, unrealistic expectations)
- 3 specific goal suggestions with priority reasoning
- Fallback systems ensuring guidance always available

#### FrameworkInsights.tsx (Smart Analysis Engine)
- **Priority Intelligence**: Identifies weakest pillars for maximum impact
- **Connection Analysis**: Sleep affects everything, Work-Life balance alerts
- **Foundation Intelligence**: Health as base supporting all pillars
- **Strength Recognition**: Leveraging high-performing pillars
- **Color-coded urgency**: Critical/High/Medium/Low priority insights

#### GapTrends.tsx
- Weekly progress tracking with trend indicators
- Visual gap analysis sorted by improvement potential
- Trend icons (↗️/↘️/➡️) showing pillar movement
- Smart tips: "Strengthen weakest pillars first for maximum impact"

### Latest Enhancements (October 29, 2025)

#### Intelligent Assessment System ✅ COMPLETE
**AssessmentCard.tsx** - Revolutionary multi-state assessment interface:
- **Smart State Detection**: Automatically determines user journey stage
  - `initial` → No framework → "Take Assessment" 
  - `completed` → Framework only → Assessment summary
  - `insights` → Framework + AI insights → Ready for goals
  - `ongoing` → Framework + goals/check-ins → Active management
- **Real-time Data Integration**: useFramework hook with live database connection
- **Enhanced UI**: Displays actual insights, active goals, and check-in counts

#### Complete API Data Layer ✅ COMPLETE
**Edge Functions Deployed**:
- **update-framework-data**: Edit pillar ratings, definitions, work happiness with hybrid architecture support
- **generate-ai-insights**: Intelligent gap analysis, goal suggestions, celebrations stored in database
- **save-weekly-checkin**: Progress tracking with database persistence (pre-existing, verified compatible)

**Frontend API Layer**:
- **frameworkApi.ts**: TypeScript module with full type safety and error handling
- **useFramework.tsx**: Enhanced hook with intelligent state detection and real-time data
- **AI Insights Engine**: Gap analysis, goal suggestions, strength recognition with expiration dates

### Smart AI Integration (October 28-29, 2025)
**Enhanced AI Prompts**: Context-aware analysis of entire pillar framework  
**Research-Backed Guidance**: "Studies show adults need 7-9 hours nightly..."  
**Reality Checks**: Challenges unrealistic/unhealthy targets with evidence  
**Connection Intelligence**: Explains how pillars affect each other  
**Fallback Systems**: Graceful degradation ensuring guidance always works  

### User Experience Transformation
**Before**: Goal tracking app with confusing framework filtering  
**After**: Life architecture consulting platform with intelligent guidance  

**New User Journey:**
1. Framework assessment reveals pillar gaps
2. AI provides research-backed analysis and recommendations  
3. Users understand WHY certain goals should be priorities
4. Weekly check-ins create engagement and track progress
5. Smart insights show ongoing platform intelligence
6. Clean goal creation separate from framework complexity

### Business Impact (October 28, 2025)
- **Platform Positioning**: Life architecture consultant vs. goal tracker
- **Premium Justification**: Sophisticated AI analysis and framework expertise  
- **Engagement Stickiness**: Weekly check-ins create habitual usage
- **Differentiation**: No competitor offers this depth of life design intelligence
- **Scalability**: Clean architecture supports advanced features

## 🔥 LEGACY: 5 CIRCLE FRAMEWORK™ (SUPERSEDED BY 6 PILLARS)

**Note**: This framework has been superseded by the 6 Pillars Framework. Maintained for reference only.

### The Five Circles (Legacy)
- **Spiritual**: Inner purpose, values, meaning
- **Friends & Family**: Relationships, social connections
- **Work**: Career, professional development, income
- **Personal Development**: Learning, growth, skills
- **Health & Fitness**: Physical wellbeing, energy, vitality

## Tech Stack
- Frontend: Vite + React + TypeScript
- UI: shadcn-ui + Tailwind CSS
- Backend: Supabase + Firebase Auth
- Payments: Stripe
- Email: Resend (noreply@notifications.goalmine.ai)
- Chat: Crisp
- AI: OpenAI GPT-4

## Authentication Architecture (CRITICAL - Updated September 2025)

### Firebase Authentication System
- Migrated from Supabase auth (rate limiting issues)
- Email/password and Google OAuth
- No rate limits, unlimited signups
- Firebase manages auth tokens and sessions

### Database Profile Sync (Firebase → Supabase)
- `create-user-profile` syncs Firebase users to Supabase
- Uses Firebase UID as profile.id
- Email stored separately for lookups
- 30-day trial auto-configured

### 🔥🔥🔥 HYBRID USER ID ARCHITECTURE - MEMORIZE THIS! 🔥🔥🔥
**⚠️ THIS IS THE #1 SOURCE OF CHAT SESSION CONFUSION - STUDY CAREFULLY**

```typescript
// 🚨 SUBSCRIBERS TABLE - ALWAYS EMAIL FORMAT (NEVER CHANGE THIS!)
subscribers: {
  user_id: "danlynn@gmail.com",    // ✅ EMAIL - subscription lookups use this
  subscribed: boolean,
  subscription_tier: string,       // "Professional Plan", "Personal Plan", etc.
  // ...
}

// 🚨 GOALS TABLE - HYBRID FORMAT (supports both)
goals: {
  user_id: "danlynn@gmail.com" OR "ABC123xyz",  // Can be EMAIL or Firebase UID
  title: string,
  pillar_type: string,             // "Work", "Sleep", "Health & Fitness", etc.
  // ...
}

// 🚨 PROFILES TABLE - FIREBASE UID FORMAT
profiles: {
  id: "ABC123xyz",                 // ✅ Firebase UID - auth lookups use this
  email: "danlynn@gmail.com",      // Email stored separately for reference
  trial_expires_at: timestamp
}
```

**🚨 CRITICAL EDGE FUNCTION PATTERNS (ALWAYS FOLLOW THESE):**

1. **SUBSCRIPTION VALIDATION**: 
   ```typescript
   // ✅ CORRECT - Query subscribers by EMAIL
   .eq('user_id', 'danlynn@gmail.com')
   
   // ❌ WRONG - Don't query by Firebase UID  
   .eq('user_id', 'ABC123xyz')
   ```

2. **GOAL OPERATIONS (HYBRID APPROACH)**:
   ```typescript
   // ✅ CORRECT - Try both approaches
   const emailGoals = await query.eq('user_id', email);
   const uidGoals = await query.eq('user_id', firebaseUID);
   return [...emailGoals, ...uidGoals];
   ```

3. **NEW GOAL CREATION**:
   ```typescript
   // ✅ CORRECT - Use Firebase UID for new goals
   user_id: actualUserId  // Firebase UID from profile lookup
   ```

### Hybrid Edge Function Architecture (RESOLVED September 2025)
**🔥 CRITICAL UNDERSTANDING: Frontend sends email, edge functions handle hybrid lookups**
- Frontend sends email as user_id (unchanged)
- Edge functions support both architectures automatically
- Goal retrieval: Query email AND Firebase UID, combine results
- Goal operations: Email first, Firebase UID fallback
- New goals use Firebase UID
- Email system auto-detects goal format

### 🚨 FINAL WARNING: COMMON MISTAKES TO AVOID 🚨
**These mistakes waste hours every chat session:**

❌ **NEVER DO THIS**: Change subscriber.user_id from email to Firebase UID
❌ **NEVER DO THIS**: Assume all tables use the same user_id format
❌ **NEVER DO THIS**: Query subscribers table with Firebase UID
❌ **NEVER DO THIS**: Ignore the hybrid architecture and try to "fix" it

✅ **ALWAYS DO THIS**: Read this section first before any user_id related work
✅ **ALWAYS DO THIS**: Follow the documented patterns exactly
✅ **ALWAYS DO THIS**: Test subscription lookups with EMAIL format
✅ **ALWAYS DO THIS**: Remember goals table supports BOTH formats

### Hybrid Functions (September 2025)
- fetch-user-goals: Dual lookup, combines all goals
- check-in: Email first, Firebase UID fallback
- create-goal: Uses Firebase UID for new goals
- update-goal: Supports both formats
- send-daily-emails: Auto-detects goal format

### Legacy RLS Issues (Bypassed)
- RLS policies expect Supabase auth.uid()
- Firebase auth causes auth.uid() to return NULL
- Edge functions use service role keys to bypass RLS
- Frontend cannot query database directly

### Auth Flow Summary
1. Firebase handles authentication
2. `create-user-profile` syncs to Supabase
3. Edge functions use email lookup + Firebase UID
4. Firebase manages sessions, Supabase stores data

## Project Structure

```
src/
├── components/
│   ├── ui/                     # shadcn-ui components
│   ├── Dashboard.tsx           # Main dashboard with goals grid
│   ├── GoalCard.tsx           # Individual goal display with streaks/check-ins
│   ├── EditGoalDialog.tsx     # Goal editing modal
│   ├── OnboardingForm.tsx     # Goal creation form
│   ├── PricingPage.tsx        # Subscription plans
│   └── ...
├── hooks/
│   ├── useAuth.tsx            # Firebase authentication with Supabase profile sync
│   ├── useGoals.tsx           # Goal management & AI motivation
│   ├── useSubscription.tsx    # Stripe subscription management
│   └── ...
├── pages/
│   ├── Index.tsx              # Landing page + main app logic
│   ├── Auth.tsx               # Login/signup forms
│   ├── GoalDetail.tsx         # Individual goal detail page
│   └── ...
├── integrations/
│   └── supabase/
│       ├── client.ts          # Supabase client configuration
│       └── types.ts           # Database type definitions
supabase/
├── functions/                 # Edge functions for AI & payments
├── migrations/               # Database schema migrations
└── config.toml              # Supabase configuration
```

## Key Features

### 1. Goal Management
- Create/edit/delete goals with CRUD operations
- Goal cards display progress, streaks, motivation

### 2. Daily Streak System
- Check-ins with 3 AM EST reset
- Consecutive day tracking
- Manual reset functionality

### 3. AI-Powered Motivation
- Personalized daily messages by tone
- Micro-plans (3 steps), mini-challenges (2 min)
- On-demand nudges, daily emails

### 4. Subscription & Business Logic
- Free: 1 goal, 1 nudge, 30-day trial
- Premium: 3 goals, 3 nudges
- Stripe integration
- Expired goals/trials have limited permissions

### 5. User Experience
- Responsive design, real-time updates
- Social sharing, progressive enhancement

## Expired Goals & Trials System

### Business Logic (COMPLETED September 3, 2025)
**Status**: ✅ FULLY IMPLEMENTED
**Priority**: Trial expiration > Goal expiration > Normal operation

#### Goal Expiration (past target_date)
- UI: "GOAL EXPIRED" red badge
- Permissions: Edit/Delete ✅ | Check-in/Share/Emails ❌
- Email system skips expired goals

#### Trial Expiration (30+ days, not subscribed)
- UI: "TRIAL EXPIRED" orange badge, upgrade prompt
- Permissions: All actions disabled until upgrade
- Email system skips trial-expired users

#### Implementation: 5-phase rollout with data layer helpers, email logic, frontend detection, UI components, backend validation

## Database Schema

### Core Tables
- goals: User goals with streak tracking
- motivation_history: AI content archive
- subscribers: Stripe subscription status
- profiles: User profile with trial data

### Relationships
- Goals → users via user_id
- Motivation → goals via goal_id
- Subscribers → users via user_id

## Authentication Flow
1. Firebase Auth: Email/password and Google OAuth
2. Profile sync to Supabase
3. Firebase manages sessions, Supabase stores data
4. Auth guards on protected routes
5. Global auth state via `useAuth`

## Subscription Flow
1. 30-day free trial (1 goal limit)
2. Stripe checkout for upgrades
3. Edge function verifies subscription status
4. UI adapts based on tier

## AI Integration

### Motivation Generation
- Edge functions: `generate-daily-motivation`, `generate-milestone-content`
- 4 tone types: drill sergeant, encouraging, teammate, mentor
- Contextual based on goal, streak, target date
- Graceful fallback when AI unavailable

### Content Structure
```typescript
interface MotivationContent {
  message: string;         // Main motivational message
  microPlan: string[];     // 3 actionable steps
  challenge: string;       // Quick 2-minute task
  tone: string;           // Tone used for generation
}
```

## Email System

### Daily Emails (SIMPLIFIED SYSTEM - Current November 2025)
- **UNIVERSAL DELIVERY**: 6 AM Eastern for ALL users (no user time selection)
- **EMAIL CONTENT**: ✅ **CURRENT SYSTEM**: Single "Your daily motivation boost" email per user with active goals
- **EMAIL ARCHITECTURE**: 
  - **One email per user** (not per goal) if they have at least 1 active goal
  - **Universal fresh motivation** generated daily via AI (same for all users, changes daily)
  - **No longer tone-specific or goal-specific** (eliminated old individual goal emails)
  - **Clean, simple template**: Screenshot reference `/var/folders/wg/_k4qktzj0jxbjlys727l6w780000gn/T/TemporaryItems/NSIRD_screencaptureui_D7yOzi/Screenshot 2025-11-03 at 7.31.46 AM.png`
- **FORMAT**: HTML templates with "Open Dashboard & Check In" button
- **SERVICE**: Resend with custom domain (noreply@notifications.goalmine.ai)
- **DELIVERY METHOD**: `send-daily-wake-up-call` function via daily cron
- **KEY CHANGE**: Transformed from goal-specific emails to consolidated daily boost system
- **Status**: ✅ FULLY AUTOMATED and WORKING PERFECTLY (November 2025)

### Email Link Flow
- Check-in links with user/goal/timestamp parameters
- User validation prevents cross-contamination
- Handles expired sessions gracefully
- Seamless email → dashboard flow
- Bulletproof security (Sept 15, 2025)

### Email Types
- Transactional (Resend): Nudges, daily motivation
- Authentication (Firebase): Verification, password reset
- From: GoalMine.ai <noreply@notifications.goalmine.ai>

## Development Workflow
### Local: `npm install && npm run dev`
### Database: `supabase start/reset`
### Deployment: Lovable.dev (frontend), Supabase (backend)

## Environment Variables
- SUPABASE_URL, SUPABASE_ANON_KEY
- STRIPE_SECRET_KEY
- OPENAI_API_KEY

## Key Design Patterns

### 1. Custom Hooks
- Encapsulate auth, goals, subscriptions logic
- Reusable stateful functionality
- Error/loading state handling

### 2. Optimistic Updates
- Immediate UI feedback
- Background database sync
- Rollback on failures

### 3. Progressive Enhancement
- Works without AI
- Graceful API fallbacks
- Offline-capable features

### 4. Subscription-Aware UI
- Feature gates by tier
- Upgrade prompts
- Usage limit enforcement

## Common Development Tasks

### Adding Goal Features
1. Update database schema
2. Modify Goal interface
3. Update form components
4. Add UI to GoalCard

### AI Customization
1. Modify prompts in edge function
2. Update MotivationContent interface
3. Adjust fallbacks
4. Test tone variations

### Universal Nudge System (October 11, 2025)
- Replaced goal-specific with universal motivation
- Eliminated goal selection issues
- Dashboard-level nudges for all users
- 35-50 word AI bursts with universal appeal
- Consistent experience regardless of setup

### Subscription Changes
1. Update Stripe price IDs
2. Modify feature limits
3. Update hook logic
4. Adjust UI messaging

## Troubleshooting

### Common Issues
- **OUTDATED CODE USAGE**: If goal creation fails, verify you're not using old OnboardingForm.tsx with 5-step process
- **Time Selection Bugs**: Email time selection was REMOVED - do not implement time selection features
- Auth Loops: Check Firebase session in useAuth.tsx
- Streak Logic: Verify 3 AM EST reset timezone calculations
- Email Delivery: Confirm Resend integration
- Subscription Sync: Check Stripe webhooks
- Loading Flash: Coordinate authLoading with data loading
- Content Missing: RLS blocks frontend writes, use edge functions
- MicroPlan Errors: Handle string/array formats

### Firebase Authentication Issues ✅ RESOLVED (Sept 2025)
- Fixed: Create Goal, Check-In, Goals Loading
- Root Cause: Mixed architecture (email vs Firebase UID)
- Solution: Hybrid system with backward compatibility

### Hybrid Architecture Benefits
- Backward/forward compatibility
- No data loss during transition
- Ecosystem safety maintained
- Gradual migration without breaking changes

### Hybrid Function Patterns
```typescript
// Pattern 1: Goal Retrieval (fetch-user-goals)
// Query BOTH architectures, combine results
const emailGoals = await query.eq('user_id', email);
const firebaseGoals = await query.eq('user_id', firebaseUID);
return [...emailGoals, ...firebaseGoals];

// Pattern 2: Goal Operations (check-in)  
// Try email first, fallback to Firebase UID
let goal = await findByEmail(goalId, email);
if (!goal && firebaseUID) {
  goal = await findByFirebaseUID(goalId, firebaseUID);
}

// Pattern 3: Email System (send-daily-emails)
// Auto-detect goal format
if (goal.user_id.includes('@')) {
  // Email-based goal
} else {
  // Firebase UID-based goal, lookup email via profile
}
```

### Email System Issues ✅ **RESOLVED (OCTOBER 2025)**

**Status**: ✅ DUPLICATE EMAILS ELIMINATED
- **Root Cause**: Multiple Supabase cron jobs
- **Solution**: Single Vercel cron with direct OpenAI integration
- **Result**: Reliable daily delivery with AI content

**Key Historical Fixes:**
- Fixed multiple cron jobs causing duplicate emails
- Implemented atomic `last_motivation_date` update
- Added environment detection for dev/production
- Established bulletproof check-in link security
- Configured custom domain (notifications.goalmine.ai)

## Performance & UX Optimizations

### Performance Architecture
- **Build System**: Vite + React SWC for fast builds and hot reload
- **React Optimizations**: useMemo for expensive calculations, optimized dependency arrays
- **Loading Management**: 800ms minimum loading time prevents jarring UI flashes
- **State Coordination**: `authLoading + goalsLoading` prevents "No Goals" flash on dashboard
- **Network Efficiency**: Edge functions for server-side processing, pre-generated content
- **Bundle Optimization**: Tree-shaking with Vite, path aliases (@/), selective imports
- **Memory Management**: Proper cleanup in useEffect hooks, efficient state updates

### User Experience Patterns
- **Loading States**: Comprehensive loading spinners with "Dream Big" branding
- **Error Handling**: 113+ try/catch blocks with user-friendly toast notifications  
- **Visual Feedback**: Toast notifications for all user actions with proper messaging
- **Confirmation Dialogs**: All destructive actions (delete goal, reset streak) require confirmation
- **Optimistic Updates**: Immediate UI feedback with background database sync
- **Progressive Enhancement**: Core functionality works even when AI generation fails
- **Responsive Design**: Mobile-first approach with Tailwind CSS, touch-friendly interfaces

### Critical UX Rules
1. **Never show empty states** without proper loading coordination
2. **Always provide feedback** for user actions (toasts, spinners, confirmations)  
3. **Coordinate loading states** - combine auth + data loading to prevent flashes
4. **Use edge functions** for database writes to avoid RLS permission issues
5. **Handle both data formats** - microPlan can be string or array, convert appropriately
6. **Real-time for nudges and goal detail updates** - daily emails use pre-generated content
7. **Fallback gracefully** when AI services are unavailable

### Performance Monitoring
- **Query Optimization**: Efficient Supabase queries with proper indexing
- **State Management**: Minimal re-renders with optimized React hooks  
- **API Limits**: Rate limiting for AI generation and email sending
- **Cache Strategy**: In-memory caching for frequently accessed data

## Recent Technical Developments

### Email System Resolution (October 2025) ✅ COMPLETE
- **Final Fix**: Direct OpenAI integration in email function
- **Root Issue**: Function-to-function calls between edge functions failing
- **Solution**: Inlined ChatGPT prompt system for reliable AI content
- **Result**: Production-ready email system with goal-specific AI coaching

### Critical Architecture Fixes ✅ COMPLETE
- **Goal Editing**: Fixed `.maybeSingle()` PostgreSQL errors with proper array handling
- **API Routing**: Fixed Vercel routing blocking `/api/*` paths
- **UTC Consistency**: Simplified timezone logic for reliable daily delivery

### Key Technical Patterns
- **Data Handling**: Components handle both string/array formats for `motivation.microPlan`
- **Loading Coordination**: Always combine `authLoading + dataLoading` to prevent UI flashes
- **Database Permissions**: Use edge functions for writes (RLS bypassed with service role)
- **Email Verification**: Use URL parameters to maintain context across Firebase redirects

## Content Generation Strategy

### Intelligent Multi-Layered Content System
- **Goal Creation**: Immediate LLM generation for goal detail page (emails start next day)
- **Daily Emails**: Fresh content generated by `daily-cron` edge function 
- **Goal Detail Pages**: Smart content system - real-time when goals change, cached when stable
- **Universal Nudges**: Real-time LLM generation for instant motivational boosts (works for all users)
- **Fallback Strategy**: Graceful degradation when AI services are unavailable

### Goal Detail Page Content Strategy (Updated October 11, 2025)
**Multi-Layered Smart Content System:**
1. **State Cache**: Check `todaysMotivation` for immediate display
2. **Database Cache**: Query `motivation_history` table for today's content
3. **Smart Regeneration**: Generate fresh content when:
   - No content exists for today
   - Goal data changed (title, description, tone)
   - Streak count changed (after check-ins)
4. **Performance**: Cached content for unchanged goals, real-time for updates

### Content Generation Rules
1. **Smart on-demand generation** for goal detail pages when changes detected
2. **Always generate during goal creation** for immediate user satisfaction  
3. **Use daily cron jobs** for regular email content with ADVANCED AI system
4. **Cache generated content** in memory and database for performance
5. **Handle missing content gracefully** with user-friendly messages
6. **Universal nudges** eliminate goal-selection complexity

### Pro Plan & Feature Updates (October 2025) ✅ COMPLETE
- **New Tier**: Pro Plan at $199.99/month with 5 goals + group Q&A sessions
- **Universal Nudges**: Redesigned system for dashboard-level operation (eliminated goal selection issues)
- **AI Enhancement**: Restored advanced generation system for expert coaching quality

This documentation provides a comprehensive overview for developers working on GoalMine.ai, covering architecture, features, user flow, performance optimizations, and critical UX patterns that must be maintained.