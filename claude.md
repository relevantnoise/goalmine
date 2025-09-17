# GoalMine.ai - Cursor Project Documentation

## Project Overview

GoalMine.ai is a goal tracking and motivational platform built with React, TypeScript, and Supabase. The application helps users create goals, track daily progress through streaks, and receive AI-enhanced motivational messages via email and on-demand nudges.

## Complete User Flow

### New User Registration & Onboarding
1. **Landing Page**: User lands on GoalMine.ai homepage
2. **Registration Options**:
   - **Google Sign-up**: Taken directly to goal creation process
   - **Email Sign-up**: Receives verification email → clicks link → taken to goal creation process
3. **30-Day Free Trial**: Automatically activated upon registration

### Goal Creation Process (Onboarding)
1. **4-Step Form**: Title → Description → Target Date → Tone Selection
2. **LLM Content Generation**: Immediate AI-powered motivation content creation
3. **Success Toast**: "Goal Created! 🎯 Your daily motivation emails will start tomorrow"
5. **Redirect**: User taken to dashboard

### Dashboard Experience  
**Returning Users**: Taken directly to dashboard on login
**Dashboard Features**:
- View all active goals with progress display
- **Goal Interactions**: Share, Edit, Delete (with confirmation dialogs)
- **Check In**: Daily streak maintenance with 3 AM EST reset
- **Reset Streak**: Manual streak reset (with confirmation)
- **Nudge Generation**: On-demand motivational content (real-time AI)
- **Goal Detail Pages**: Click-through to detailed motivation content
- **Upgrade Options**: Subscription management and plan changes

### Daily Motivation System
- **Goal Detail Pages**: Display daily AI-generated content (pre-generated, not real-time)
- **Daily Emails**: Fresh LLM content sent at 7 AM Eastern (fixed time for all users)
- **Content Types**: Motivational messages, micro-plans (3 actionable steps), mini-challenges (2-minute tasks)
- **Tone Consistency**: All content matches user's selected coaching style

### Subscription Tiers
- **Free Users**: 1 goal, 1 daily nudge, 30-day trial
- **Premium Users**: 3 goals, 3 daily nudges, $4.99/month
- **Feature Gates**: UI dynamically adapts based on subscription status

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **UI**: shadcn-ui components + Tailwind CSS
- **Backend**: Supabase (Database + Edge Functions) + Firebase (Authentication)
- **Payments**: Stripe integration
- **Email**: Resend for email delivery (using verified custom domain noreply@notifications.goalmine.ai)
- **Chat**: Crisp integration  
- **AI**: OpenAI GPT-4 for motivation content generation

## Authentication Architecture (CRITICAL - Updated September 2025)

### Firebase Authentication System
- **Migration**: Originally used Supabase auth, migrated to Firebase due to rate limiting (2 users/hour limit)
- **Methods**: Email/password and Google OAuth via Firebase CDN
- **Scalability**: No rate limits, handles unlimited user signups
- **Session Management**: Firebase handles auth tokens and session state

### Database Profile Sync (Firebase → Supabase)
- **Profile Creation**: `create-user-profile` edge function syncs Firebase users to Supabase
- **Primary Key**: Uses Firebase UID as profile.id (NOT email)
- **Email Storage**: Stores email in separate field for lookups
- **Trial Setup**: 30-day trial automatically configured on profile creation

### HYBRID User ID Architecture (Resolved September 2025)
```typescript
// Profile Table Structure
profiles: {
  id: string,           // Firebase UID (e.g., "ABC123xyz")  
  email: string,        // User email (e.g., "user@example.com")
  trial_expires_at: timestamp
}

// Goals Table Structure (HYBRID - supports both formats)
goals: {
  id: string,
  user_id: string,      // Can be EITHER:
                        // - Firebase UID (e.g., "ABC123xyz") [NEW architecture]
                        // - Email (e.g., "user@example.com") [OLD architecture]
  title: string,
  // ...
}

// Subscribers Table Structure  
subscribers: {
  user_id: string,      // Always email format
  subscribed: boolean,
  // ...
}
```

### Hybrid Edge Function Architecture (RESOLVED)
- **Frontend**: Sends email as user_id in requests (unchanged)
- **Edge Functions**: Use HYBRID APPROACH - support both architectures
- **Goal Retrieval**: Query by BOTH email AND Firebase UID, combine results
- **Goal Operations**: Try email first, fallback to Firebase UID approach
- **New Goal Creation**: Uses Firebase UID for consistency
- **Email System**: Auto-detects goal format and handles subscription lookup accordingly

### Hybrid Functions (September 2025)
- **✅ fetch-user-goals**: Dual lookup (email + Firebase UID), combines all goals
- **✅ check-in**: Tries email approach first, then Firebase UID if not found
- **✅ create-goal**: Profile lookup → Firebase UID for new goals
- **✅ send-daily-emails**: Detects goal format, handles subscription accordingly

### Legacy RLS Issues (Bypassed)
- **Original Design**: RLS policies expect Supabase auth.uid()
- **Current Reality**: Firebase auth means auth.uid() returns NULL
- **Solution**: All edge functions use service role keys to bypass RLS
- **Frontend**: Cannot query database directly due to broken RLS

### Auth Flow Summary
1. **User Signs In**: Firebase handles authentication (email/Google)
2. **Profile Sync**: `create-user-profile` creates Supabase profile with Firebase UID
3. **Database Operations**: Edge functions look up profile by email, use Firebase UID
4. **Session**: Firebase maintains session state, Supabase stores profile data

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
- **Create Goals**: Title, description, target date, tone
- **Edit/Delete**: Full CRUD operations
- **Goal Cards**: Display progress, streaks, and motivation content

### 2. Daily Streak System  
- **Check-ins**: Daily progress tracking with 3 AM EST reset
- **Streak Counter**: Tracks consecutive days of progress
- **Reset Functionality**: Users can manually reset streaks

### 3. AI-Powered Motivation
- **Daily Messages**: Personalized based on goal and tone preference
- **Micro-Plans**: 3 actionable steps for the day
- **Mini-Challenges**: Quick 2-minute tasks
- **Nudges**: On-demand motivation boosts
- **Email Delivery**: Daily motivational emails at 7 AM Eastern (fixed time)

### 4. Subscription System & Business Logic
- **Free Tier**: 1 goal, 1 daily nudge, 30-day trial
- **Premium**: 3 goals, 3 daily nudges, priority email delivery
- **Stripe Integration**: Payment processing and subscription management
- **Expired Goals**: Goals past target date - edit/delete only, no check-ins
- **Expired Trials**: 30+ days free users - read-only until upgrade

### 5. User Experience
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Live streak updates and goal changes
- **Social Sharing**: Share goals on social platforms
- **Progressive Enhancement**: Fallback content when AI fails

## Expired Goals & Trials System

### Business Logic (5-Phase Implementation - COMPLETED September 3, 2025)
**Status**: ✅ FULLY IMPLEMENTED AND DEPLOYED TO PRODUCTION
**Priority**: Trial expiration > Goal expiration > Normal operation

#### Goal Expiration (past target_date)
- **UI**: "GOAL EXPIRED" red badge, gray info box with explanation
- **Permissions**: Edit ✅ Delete ✅ | Check-in ❌ Share ❌ Emails ❌ View Motivation ❌
- **Purpose**: Users can extend date or clean up old goals
- **Email System**: Skips sending to expired goals

#### Trial Expiration (30+ days, not subscribed)  
- **UI**: "TRIAL EXPIRED" orange badge, upgrade prompt with button
- **Permissions**: All actions disabled ❌ until upgrade
- **Purpose**: Clear upgrade path without losing goal data
- **Email System**: Skips sending to trial-expired users

#### Implementation Architecture
- **Phase 1**: Data layer helper functions in `useGoals.tsx`
- **Phase 2**: Email skip logic in `send-daily-emails` function  
- **Phase 3**: Frontend status detection with parallel data fetching
- **Phase 4**: UI components with status badges and permission-based buttons
- **Phase 5**: Backend validation in `check-in`, `delete-goal`, `update-goal` functions

## Database Schema

### Core Tables
- **goals**: User goals with streak tracking and settings
- **motivation_history**: AI-generated daily content archive  
- **subscribers**: Stripe subscription status tracking
- **profiles**: User profile data with trial information

### Key Relationships
- Goals linked to users via `user_id`
- Motivation history linked to goals via `goal_id`
- Subscribers linked to users via `user_id`

## Authentication Flow

1. **Firebase Auth**: Email/password and Google OAuth authentication via CDN
2. **Profile Sync**: Firebase users synced to Supabase profiles table
3. **Session Management**: Firebase handles auth tokens, Supabase stores profile data
4. **Protected Routes**: Auth guards on main app pages
5. **User Context**: Global auth state via `useAuth` hook

## Subscription Flow  

1. **Free Trial**: 30 days with 1 goal limit
2. **Upgrade**: Stripe checkout for $4.99/month Personal Plan
3. **Verification**: Edge function checks Stripe subscription status
4. **Feature Gates**: UI adapts based on subscription tier

## AI Integration

### Motivation Generation
- **Edge Functions**: `generate-daily-motivation` and `generate-milestone-content`
- **Tone Adaptation**: 4 personality types (drill sergeant, encouraging, teammate, mentor)
- **Contextual**: Based on goal, streak count, and target date
- **Fallback**: Graceful degradation when AI unavailable

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

### Daily Emails
- **Frequency**: 1 separate email per goal (not consolidated per user)
- **Scheduled**: 7 AM Eastern delivery time (intentionally fixed for simplicity)
- **Automation**: Vercel cron job triggers at 11:00 UTC (7:00 AM EDT) daily
- **Content**: AI-generated motivation + progress tracking per goal
- **Templates**: Professional HTML email templates with "CHECK IN NOW" links
- **Delivery**: Resend email service using custom domain noreply@notifications.goalmine.ai
- **Status**: ✅ FULLY AUTOMATED AND STABLE (Fixed Sept 15, 2025 - custom domain verified, all users receive emails)

### Email Link Flow
- **Check-In Links**: Include `?checkin=true&user=email&goal=goalId&t=timestamp` parameters for user-specific access
- **User Validation**: Links validate the correct user is logged in, prevent cross-contamination
- **Authentication Handling**: If user session expired, shows helpful login message with context
- **User Experience**: Seamless flow from email → login (if needed) → correct user's dashboard
- **Security**: ✅ BULLETPROOF - User-specific links prevent cross-user access (Sept 15, 2025 fix)

### Transactional Emails (via Resend)
- **Nudges**: On-demand motivation delivery (1 email per nudge)
- **Daily Motivation**: Individual goal-specific motivation (1 email per goal)
- **From Address**: GoalMine.ai <noreply@notifications.goalmine.ai>
- **System**: Resend handles all application emails using verified custom domain

### Authentication Emails (via Firebase)
- **Email Verification**: Account verification links
- **Password Reset**: Password recovery emails
- **System**: Firebase handles all authentication-related emails

## Development Workflow

### Local Development
```bash
npm install
npm run dev           # Start Vite dev server
```

### Database Management
```bash
supabase start        # Start local Supabase
supabase db reset     # Reset local database
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Deployment
- **Frontend**: Deployed via Lovable.dev
- **Backend**: Supabase hosted instance
- **Edge Functions**: Auto-deployed with Supabase

## Environment Variables

### Required Variables
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Public API key
- `STRIPE_SECRET_KEY`: Stripe API key
- `OPENAI_API_KEY`: OpenAI API key for motivation generation

## Key Design Patterns

### 1. Custom Hooks
- Encapsulate complex logic (auth, goals, subscriptions)
- Provide reusable stateful functionality
- Handle error states and loading indicators

### 2. Optimistic Updates
- Immediate UI feedback for check-ins and goal updates
- Background sync with database
- Rollback on failures

### 3. Progressive Enhancement
- Core functionality works without AI
- Graceful fallbacks for failed API calls
- Offline-capable basic features

### 4. Subscription-Aware UI
- Feature gates based on user tier
- Upgrade prompts for free users
- Usage limit enforcement

## Common Development Tasks

### Adding New Goal Features
1. Update database schema in migrations
2. Modify `Goal` interface in `useGoals.tsx`
3. Update form components (`OnboardingForm`, `EditGoalDialog`)
4. Add UI to `GoalCard` component

### AI Content Customization
1. Modify prompts in `generate-daily-motivation` edge function
2. Update `MotivationContent` interface if needed
3. Adjust fallback content in `useGoals.tsx`
4. Test tone variations

### Subscription Changes
1. Update Stripe price IDs in `create-checkout` function
2. Modify feature limits in components
3. Update `useSubscription` hook logic
4. Adjust UI messaging

## Troubleshooting

### Common Issues
- **Auth Loops**: Check Firebase session handling in `useAuth.tsx`
- **Streak Logic**: Verify timezone calculations (3 AM EST reset)
- **Email Delivery**: Confirm Resend integration and templates (not Render)
- **Subscription Sync**: Check Stripe webhook configuration
- **Loading State Flash**: Dashboard briefly shows "No Active Goals" - check `authLoading` coordination
- **Motivation Content Missing**: RLS policies block frontend DB writes - use edge functions instead
- **MicroPlan Type Errors**: Handle both string and array formats in components (GoalCard, GoalDetail)

### Firebase Authentication Issues ✅ **RESOLVED WITH HYBRID ARCHITECTURE SEPTEMBER 2025**
- **✅ FIXED: Create Goal Button Not Working**: Hybrid architecture supports both email and Firebase UID goals
- **✅ FIXED: Check-In Button Not Working**: Hybrid check-in tries both approaches, works for all goal types
- **✅ FIXED: Goals Not Loading**: Dual lookup combines goals from both architectures seamlessly
- **✅ FIXED: Email System Compatibility**: Auto-detects goal format for subscription matching
- **✅ ROOT CAUSE**: Incremental fixes created mixed architecture (some goals email-based, some Firebase UID-based)
- **✅ SOLUTION**: Hybrid system maintains backward compatibility while supporting proper Firebase architecture

### Hybrid Architecture Benefits (CRITICAL UNDERSTANDING)
- **Backward Compatibility**: All existing email-based goals continue working
- **Forward Compatibility**: New goals use proper Firebase UID architecture  
- **No Data Loss**: Existing user data preserved during architectural transition
- **Ecosystem Safety**: No functions broken, email system maintained
- **Migration Path**: Gradual transition without breaking changes

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

### Email System Issues ✅ **COMPLETELY RESOLVED SEPTEMBER 16, 2025**
- **✅ FIXED: Daily Email Automation Failure**: Fixed daily-cron function authentication issues causing "non-2xx status code" errors (Sept 16, 2025)
- **✅ FIXED: Service Role Authentication**: Added proper service role keys to internal function calls in daily-cron (Sept 16, 2025)
- **✅ FIXED: Email Timing Logic Bug**: Removed hourly restriction in send-daily-emails, now sends whenever cron runs (Sept 16, 2025)
- **✅ FIXED: Dual Environment Duplicate Emails**: Environment detection prevents dev environment from sending emails (Sept 14, 2025)
- **✅ FIXED: Free Trial Users Not Receiving Emails**: Subscription logic now includes free trial users during valid trial period (Sept 14, 2025)
- **✅ FIXED: Hybrid Profile Lookup Bug**: Implemented dual lookup strategy for email and Firebase UID goals (Sept 12, 2025)
- **✅ FIXED: Duplicate Email Bug**: Implemented atomic database updates preventing race conditions (Sept 12, 2025)
- **✅ FIXED: Subscription Field Bug**: Updated `send-daily-emails` to use `subscribed = true` instead of `status = 'active'` (Sept 11, 2025)
- **✅ FIXED: Duplicate User Profiles**: Cleaned up multiple profiles per email causing subscription mismatches (Sept 11, 2025)
- **✅ FIXED: Resend Verification**: Resend requires individual email verification or domain verification for production
- **✅ BULLETPROOF: Email Delivery**: All users receive emails regardless of goal creation method and subscription status
- **✅ WORKING: Check-In Links**: Firebase session errors handled gracefully with user messaging
- **Email Content**: All templates in `/supabase/functions/send-motivation-email/index.ts`

### Hybrid Profile Lookup Implementation (September 12, 2025)
- **Root Cause**: Profile lookup in `send-daily-emails` only handled email-based goals, failed for Firebase UID-based goals
- **Solution**: Implemented hybrid profile lookup with auto-detection and dual query strategy
- **Code Changes**: Lines 110-160 in `send-daily-emails/index.ts` - comprehensive hybrid support
- **Email-based goals**: `WHERE profiles.email = goal.user_id` (e.g., danlynn@gmail.com)
- **Firebase UID goals**: `WHERE profiles.id = goal.user_id` (e.g., dandlynn@yahoo.com's Firebase UID)
- **Auto-detection**: `goal.user_id.includes('@')` determines which lookup method to use
- **Result**: All users receive daily emails regardless of account creation architecture

### Duplicate Email Fix Implementation (September 12, 2025)
- **Root Cause**: Race condition in database update timing allowed goals to be processed multiple times
- **Solution**: Moved `last_motivation_date` update to happen atomically after initial query selection
- **Code Change**: Lines 86-99 in `send-daily-emails/index.ts` - mark goals as processed immediately
- **Result**: Each user receives exactly 1 email per active goal per day, regardless of cron timing issues

### Dual Environment Fix Implementation (September 14, 2025)
- **Root Cause**: Both development (`steady-aim-coach-*.vercel.app`) and production (`goalmine.ai`) environments running same cron job
- **Issue**: Users receiving 2 emails per goal - one from dev, one from production
- **Solution**: Environment detection in `/api/trigger-daily-emails.js` - dev environment skips email sending
- **Implementation**: `req.headers.host` detection blocks URLs containing `steady-aim-coach` or `vercel.app`
- **Result**: Only production environment sends emails, eliminates all duplicate emails

### Free Trial Email Fix Implementation (September 14, 2025)
- **Root Cause**: Subscription lookup filtered with `.eq('subscribed', true)` excluding all free trial users
- **Issue**: Free trial users received zero emails during valid 30-day trial period
- **Solution**: Removed subscription filter, rely on trial expiration logic for proper filtering
- **Implementation**: Lines 164-186 in `send-daily-emails/index.ts` - check all subscription records, not just active
- **Result**: Free trial users receive emails during trial, expired trials properly blocked

### Email Check-In Cross-Contamination Fix (FINAL - September 15, 2025)
- **Initial Issue**: Check-in links in emails were generic (`?checkin=true`) without user identification
- **Initial Fix**: Added user email and goal ID to all check-in links (`?checkin=true&user=email&goal=goalId&t=timestamp`)
- **Final Security Issue**: User validation used Supabase profile email vs Firebase email, causing mismatches
- **Root Cause**: Hybrid architecture where `user.email` (profile) ≠ `firebaseUser.email` in some cases
- **Final Solution**: Updated Index.tsx lines 162-163 to use `firebaseUser?.email || user?.email` for validation
- **Session Security**: Users on same device must log out/in to access different user's email links (intended behavior)
- **Result**: BULLETPROOF user validation - email links only work for intended recipient using Firebase email as authority

### Custom Domain Email Delivery Fix (September 15, 2025)
- **Root Cause**: Resend sandbox mode only allows emails to verified account owner (danlynn@gmail.com)
- **Issue**: Free trial users like dandlynn@yahoo.com couldn't receive emails due to Resend restrictions
- **Solution**: Verified custom domain notifications.goalmine.ai with proper DNS records in Vercel
- **DNS Records**: MX, TXT/SPF, and DKIM records configured for notifications.goalmine.ai subdomain
- **Implementation**: Updated send-motivation-email function to use noreply@notifications.goalmine.ai
- **Result**: ALL users (paid and free trial) now receive emails regardless of email domain

### Email System Debug Tools (Added September 11, 2025)
- **debug-email-issues**: Complete database diagnostic for email troubleshooting
- **test-resend-simple**: Direct Resend API testing and verification status checking  
- **cleanup-duplicate-profiles**: Database cleanup for duplicate user issues
- **cleanup-dandlynn-completely**: Complete user removal for fresh testing
- **debug-duplicate-emails**: Comprehensive duplicate email analysis tool

### Debug Tools
- Browser dev tools for client-side debugging
- Supabase logs for database operations
- Edge function logs for AI and payment issues
- Stripe dashboard for payment troubleshooting

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
6. **Real-time only for nudges** - all other content should be pre-generated
7. **Fallback gracefully** when AI services are unavailable

### Performance Monitoring
- **Query Optimization**: Efficient Supabase queries with proper indexing
- **State Management**: Minimal re-renders with optimized React hooks  
- **API Limits**: Rate limiting for AI generation and email sending
- **Cache Strategy**: In-memory caching for frequently accessed data

## Recent Technical Developments

### Data Structure Handling
- **MicroPlan Format**: Components handle both string and array formats for `motivation.microPlan`
- **Implementation**: Use conditional logic to convert strings to arrays before mapping

### Loading State Management  
- **Auth Loading**: Dashboard uses `authLoading` from `useAuth` to prevent "No Active Goals" flash
- **Coordination**: Loading logic is `shouldShowLoading = authLoading || loading`
- **Pattern**: Always coordinate auth state with data loading states

### Database Permissions
- **RLS Policy Issue**: Frontend cannot directly write to `motivation_history` table
- **Solution**: Edge functions handle database writes with service role privileges
- **Edge Function**: `generate-daily-motivation` now saves motivation to database automatically
- **Pattern**: Use edge functions for any database writes that might be blocked by RLS

### Email Verification Flow (Aug 2024)
- **Issue**: Email verification links redirected to sign-in page instead of goal creation
- **Solution**: Changed Firebase verification redirect from `/auth?verified=true` to `/?email-verified=true`
- **Implementation**: Index.tsx detects `email-verified=true` parameter and forces goal creation
- **Pattern**: Use URL parameters to maintain context across Firebase redirects

### Expired Goals & Trials System (Sep 2024)
- **Implementation**: 5-phase rollout ensuring no breaking changes
- **Frontend**: Status badges, permission-based UI, upgrade prompts
- **Backend**: Full permission validation in key edge functions
- **Email System**: Smart skip logic prevents individual goal emails to expired scenarios
- **Architecture**: Consistent business logic across frontend/backend with helper functions

## Content Generation Strategy

### Real-time vs Pre-generated Content
- **Goal Creation**: Immediate LLM generation for goal detail page (emails start next day)
- **Daily Emails**: Fresh content generated by `daily-cron` edge function 
- **Goal Detail Pages**: Display pre-generated content from `motivation_history` table
- **Nudges Only**: Real-time LLM generation for instant motivational boosts
- **Fallback Strategy**: Graceful degradation when AI services are unavailable

### Content Generation Rules
1. **Never generate content on-demand** for goal detail pages (performance)
2. **Always generate during goal creation** for immediate user satisfaction  
3. **Use daily cron jobs** for regular content updates
4. **Cache generated content** in memory for session performance
5. **Handle missing content gracefully** with user-friendly messages

This documentation provides a comprehensive overview for developers working on GoalMine.ai, covering architecture, features, user flow, performance optimizations, and critical UX patterns that must be maintained.