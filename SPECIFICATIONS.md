# GoalMine.ai - Complete Application Specifications

## Overview
GoalMine.ai is a simple goal tracking and daily motivation app. Users create goals, receive daily AI-generated motivational content via email, track streaks, and get on-demand motivation "nudges."

**Key Principle**: Keep it simple. This is a focused app with a clear user flow, not a complex productivity suite.

## Tech Stack

### Frontend
- **Framework**: React + TypeScript + Vite
- **UI Library**: shadcn/ui components + Tailwind CSS
- **State Management**: React hooks (useState, useEffect)
- **Routing**: React Router v6
- **HTTP Client**: Supabase client library
- **Icons**: Lucide React icons
- **Date Handling**: date-fns library

### Backend
- **Database**: Supabase (PostgreSQL)
- **API**: Supabase Edge Functions (Deno runtime)
- **Authentication**: Firebase Auth
- **AI**: OpenAI GPT-3.5-turbo
- **Email**: Render email service
- **Payments**: Stripe

### Deployment
- **Frontend**: Static hosting (Vercel/Netlify recommended)
- **Backend**: Supabase hosted
- **Domain**: Custom domain for email links

## Design System

### Brand Identity
- **App Name**: GoalMine.ai
- **Tagline**: "Dig Deep. Achieve More."
- **Concept**: Mining metaphor - extracting the gold of achievement from daily effort

### Logo & Icons
- **Primary Logo**: Text-based "GoalMine.ai" with mining pick icon
- **Favicon**: Simple "G" or mining pick symbol
- **App Icons**: Lucide React icon set throughout
  - Target: Goals
  - Zap: Nudges/motivation
  - Flame: Streaks
  - Crown: Premium features
  - Calendar: Daily progress
  - Plus: Create new

### Color Scheme
```css
/* Primary Colors */
--primary: #2563eb;        /* Blue - trust, progress */
--primary-light: #dbeafe;  /* Light blue backgrounds */
--success: #16a34a;        /* Green - achievement, streaks */
--success-light: #dcfce7;  /* Light green backgrounds */
--premium: #f59e0b;        /* Gold - premium features */

/* Neutral Colors */
--background: #ffffff;      /* Main background */
--card: #f8fafc;           /* Card backgrounds */
--muted: #64748b;          /* Secondary text */
--border: #e2e8f0;         /* Borders, dividers */

/* Semantic Colors */
--destructive: #dc2626;    /* Errors, delete actions */
--warning: #f59e0b;        /* Warnings, trial expiration */
```

### Typography
- **Font Family**: Inter (clean, modern, readable)
- **Headings**: Bold, clear hierarchy
- **Body Text**: Regular weight, good line spacing
- **Button Text**: Medium weight
- **Sizes**: Following Tailwind scale (text-sm, text-base, text-lg, etc.)

### UI Principles
- **Minimalist**: Clean, uncluttered interface
- **Motivational**: Positive language and visual feedback
- **Mobile-First**: Responsive design starting from mobile
- **Loading States**: Smooth transitions and loading indicators
- **Toast Notifications**: Clear feedback for user actions

## Database Schema (Supabase)

### profiles
```sql
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,           -- Firebase UID
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  trial_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);
```

### goals
```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,        -- User's email address
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  tone TEXT NOT NULL CHECK (tone IN ('drill_sergeant', 'kind_encouraging', 'teammate', 'wise_mentor')),
  time_of_day TEXT NOT NULL CHECK (time_of_day IN ('morning', 'afternoon', 'evening')),
  streak_count INTEGER DEFAULT 0,
  last_checkin_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### motivation_history
```sql
CREATE TABLE motivation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,        -- User's email address
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  message TEXT NOT NULL,
  micro_plan JSONB NOT NULL,    -- Array of 3 action steps
  challenge TEXT NOT NULL,
  tone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, date)         -- One motivation per goal per day
);
```

### subscribers
```sql
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,        -- User's email address
  email TEXT NOT NULL,
  subscribed BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  subscription_tier TEXT,       -- 'personal'
  subscription_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Complete User Flow

### 1. Landing Page
**Path**: `/`
- Hero section with value proposition
- "Get Started Free" call-to-action button
- Simple explanation of how it works (3 steps)
- Social proof/testimonials if available
- Footer with links

### 2. Authentication
**New User Registration**:
- **Email Signup**: Email/password form → email verification required → click link → redirect to goal creation
- **Google Signup**: Google OAuth → immediate redirect to goal creation

**Returning User**:
- Login → redirect to dashboard

**Key Requirements**:
- Firebase Auth handles all authentication
- Email verification required for email signups
- Custom domain for verification links
- Profile creation via Supabase edge function

### 3. Goal Creation Process (5-Step Wizard)
**Path**: `/onboarding`

**Step 1 - Goal Title**:
- "What do you want to achieve?"
- Text input for goal title
- Required field

**Step 2 - Description** (Optional):
- "Tell us more about your goal"
- Textarea for additional details
- Optional field

**Step 3 - Target Date** (Optional):
- "When do you want to achieve this?"
- Date picker
- Optional field

**Step 4 - Motivation Tone**:
- "How would you like to be motivated?"
- 4 cards with tone options:
  - **Drill Sergeant**: "Push me hard with direct, commanding motivation"
  - **Kind & Encouraging**: "Support me with warm, gentle encouragement"  
  - **Teammate**: "Motivate me like a supportive workout partner"
  - **Wise Mentor**: "Guide me with thoughtful, insightful advice"
- Required selection

**Final Step**:
- Review goal summary
- "Create My Goal" button
- Loading state during creation

### 4. Goal Creation Backend Process
1. Call `create-complete-goal` edge function with form data
2. Create goal record in database
3. Generate first AI motivation content using goal details and tone
4. Save motivation content to `motivation_history` table for today
5. Send first motivational email immediately
6. Return success response with goal data

### 5. Post-Creation Flow
- Success toast: "🎉 Goal created successfully! Check your email for your first motivational message."
- Automatic redirect to dashboard
- Goal appears immediately (optimistic update)

### 6. Dashboard
**Path**: `/dashboard`

**Layout**:
- Header with logo, user menu, logout
- Welcome section with user name and current date
- Goals grid (responsive cards)
- Action buttons section
- Sidebar with upgrade prompts (free users)

**Goal Cards Display**:
- Goal title and description
- Current streak count with flame icon
- "Check In" button (disabled if already used today)
- "View Details" link
- Options menu (edit, delete, reset streak)

**Action Buttons**:
- **Create Goal**: Add new goal (shows upgrade prompt if at limit)
- **Nudge Me**: Generate instant motivation (respects daily limits)

**Limits Enforcement**:
- Free users: 1 goal max, 1 nudge per day
- Paid users: 3 goals max, 3 nudges per day
- Clear messaging about limits
- Upgrade prompts when limits reached

### 7. Goal Detail Page
**Path**: `/goal/:goalId`

**Content**:
- Goal information (title, description, target date, tone)
- Current streak with visual indicator
- Today's AI-generated motivation content:
  - Main motivational message
  - 3-item micro-plan (actionable steps)
  - Quick 2-minute challenge
- Check-in functionality
- Edit/delete options

**Content Loading**:
- Load from `motivation_history` table for today
- If no content exists, generate fresh content
- Cache content for consistent display

### 8. Subscription System
**Free Tier (30-day trial)**:
- 1 goal maximum
- 1 daily nudge
- All core features
- Trial countdown in UI

**Personal Plan ($4.99/month)**:
- 3 goals maximum
- 3 daily nudges
- Priority email delivery
- All core features

**Upgrade Flow**:
- Upgrade button → Stripe checkout
- Success → webhook updates subscription status
- Immediate feature unlock

## AI Integration

### Motivation Content Structure
```typescript
interface MotivationContent {
  message: string;      // 2-3 encouraging sentences
  microPlan: string[];  // Array of 3 actionable steps
  challenge: string;    // Quick 2-minute task
  tone: string;         // Matches user's selected tone
}
```

### Primary AI Prompt Template
```
You are a {tone} helping someone with their goal: "{title}"

{Include description and target date if provided}
{Include current streak information for ongoing motivation}

Generate motivational content in this exact JSON format:
{
  "message": "A motivational message (2-3 sentences) in the {tone} style",
  "microPlan": ["Action step 1", "Action step 2", "Action step 3"],
  "challenge": "A quick 2-minute challenge they can do today"
}

Tone Guidelines:
- drill_sergeant: Be direct, commanding, and motivational like a military drill sergeant. Use strong, action-oriented language.
- kind_encouraging: Be warm, supportive, and encouraging like a caring friend. Use gentle but motivating language.
- teammate: Be collaborative and supportive like a workout partner. Use "we" language and team-oriented motivation.
- wise_mentor: Be thoughtful and wise like an experienced mentor. Provide insightful guidance and perspective.

Keep it concise, actionable, and motivating. Focus on progress and possibility.
```

### Nudge Prompt Template
```
Generate a quick motivational boost for someone who needs instant encouragement. 

Return the same JSON format but make it more general and immediately energizing. This is for someone who just asked for a motivation boost during their day.
```

### Fallback Content
Always provide fallback content when AI fails:
```javascript
const fallbackContent = {
  message: "Every step forward is progress worth celebrating. You're building something amazing, one day at a time.",
  microPlan: [
    "Take a moment to acknowledge your progress so far",
    "Choose one small action you can do right now",
    "Remind yourself why this goal matters to you"
  ],
  challenge: "Take 2 minutes to write down one thing you've learned about yourself through pursuing this goal."
};
```

## Required Edge Functions (Supabase)

### 1. create-complete-goal
**Purpose**: Atomic goal creation with motivation generation
**Input**: Goal form data
**Process**:
1. Create goal record
2. Generate AI motivation content
3. Save to motivation_history
4. Send first email
5. Return goal + motivation data

### 2. get-user-goals
**Purpose**: Fetch user's active goals (bypasses RLS)
**Input**: User email
**Output**: Array of goal objects

### 3. generate-daily-motivation  
**Purpose**: Create fresh motivation for goal detail pages
**Input**: Goal ID, user email
**Process**:
1. Fetch goal details
2. Generate AI content
3. Upsert to motivation_history (overwrite today's content)
4. Return motivation content

### 4. send-motivation-email
**Purpose**: Send motivational emails
**Input**: User email, goal data, motivation content
**Process**: Format and send via Render email service

### 5. check-in
**Purpose**: Update goal streak
**Input**: Goal ID, user email
**Process**: 
1. Validate user owns goal
2. Check if already checked in today
3. Increment streak_count
4. Update last_checkin_date

### 6. generate-general-nudge
**Purpose**: Create instant motivation for nudge feature
**Input**: User email
**Output**: General motivational content

### 7. create-user-profile
**Purpose**: Sync Firebase users to Supabase
**Input**: Firebase user data
**Process**: Create profile record with email and trial expiration

## Email System

### Daily Motivation Emails
**Trigger**: Daily cron job or user-initiated
**Content**: 
- Personalized greeting
- Goal title and progress
- AI-generated motivation content
- Call-to-action to check in
- Unsubscribe link

**Template Structure**:
```html
<h1>Your Daily Motivation for [Goal Title]</h1>
<p>Current streak: [X] days 🔥</p>
<div class="motivation-message">[AI message]</div>
<h3>Today's Action Plan:</h3>
<ul>[micro-plan items]</ul>
<h3>Quick Challenge:</h3>
<p>[2-minute challenge]</p>
<a href="[check-in-link]">Check In Now</a>
```

### Transactional Emails
- Goal creation confirmation
- Streak milestone celebrations
- Trial expiration warnings
- Subscription confirmations

## Key Business Rules

### Streak Logic
- Streaks increment once per 24-hour period
- Check-in button disabled after daily use
- Visual feedback for check-in status
- Manual reset option with confirmation dialog
- Streak celebrations at milestones (7, 30, 100 days)

### Content Generation Rules
- New motivation generated daily (overwrites previous)
- Content saved to database for consistent display
- Fallback content if AI generation fails
- Content personalized using goal context and tone

### Usage Limits
- Enforced in both UI and backend
- Free users: 1 goal, 1 nudge/day, 30-day trial
- Paid users: 3 goals, 3 nudges/day, unlimited access
- Graceful upgrade prompts when limits reached

### Data Privacy
- Users can delete goals and all associated data
- Email unsubscribe honored immediately
- No sensitive data logged or stored unnecessarily

## Required Environment Variables & API Keys

### Supabase
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
**Where to get**: Create project at supabase.com

### Firebase
```env
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_APP_ID=your_firebase_app_id
```
**Where to get**: Create project at console.firebase.google.com
**Setup required**: 
- Enable Email/Password authentication
- Enable Google OAuth provider
- Configure authorized domains for email verification

### OpenAI
```env
OPENAI_API_KEY=sk-your_openai_api_key
```
**Where to get**: platform.openai.com
**Usage**: GPT-3.5-turbo model for motivation generation

### Stripe
```env
STRIPE_PUBLIC_KEY=pk_your_stripe_public_key
STRIPE_SECRET_KEY=sk_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```
**Where to get**: dashboard.stripe.com
**Setup required**:
- Create product for "Personal Plan" at $4.99/month
- Set up webhook endpoints
- Configure customer portal

### Render (Email Service)
```env
RENDER_API_KEY=your_render_api_key
RENDER_EMAIL_SERVICE=your_service_id
```
**Where to get**: render.com
**Alternative**: Can substitute with SendGrid, Mailgun, or similar

## Pages & Components Structure

### Core Pages
```
src/pages/
├── Index.tsx          # Landing page + auth routing
├── Auth.tsx           # Login/signup forms
├── Onboarding.tsx     # 5-step goal creation wizard
├── Dashboard.tsx      # Goals overview + actions
├── GoalDetail.tsx     # Individual goal page
├── Upgrade.tsx        # Subscription plans
└── Success.tsx        # Post-checkout success
```

### Core Components
```
src/components/
├── ui/               # shadcn/ui components
├── Header.tsx        # Navigation header
├── GoalCard.tsx      # Individual goal display
├── OnboardingForm.tsx # Goal creation wizard
├── UpgradePrompt.tsx # Subscription CTAs
├── PricingCard.tsx   # Subscription plan display
└── MotivationDisplay.tsx # AI content display
```

### Custom Hooks
```
src/hooks/
├── useAuth.tsx       # Firebase authentication
├── useGoals.tsx      # Goal management
├── useSubscription.tsx # Stripe subscription status
├── useMotivation.tsx # AI content generation
└── useToast.tsx      # Notification system
```

## Error Handling & Edge Cases

### Network Errors
- Retry mechanisms for failed API calls
- Offline state detection and messaging
- Graceful degradation when services unavailable

### AI Generation Failures
- Always provide fallback motivation content
- Log failures for monitoring
- Don't fail entire operations due to AI issues

### Authentication Edge Cases
- Handle expired sessions gracefully
- Clear invalid tokens
- Redirect to login when necessary

### Data Validation
- Client-side form validation
- Server-side data sanitization
- SQL injection prevention (Supabase handles this)

### Subscription Edge Cases
- Handle failed payments gracefully
- Grace periods for expired subscriptions
- Clear communication about feature limitations

## Performance Requirements

### Frontend Performance
- Fast initial page load (< 3s)
- Smooth transitions and interactions
- Efficient React re-rendering
- Lazy loading for non-critical components

### Backend Performance  
- Edge function response times < 2s
- Database query optimization
- Efficient AI API usage
- Email delivery reliability

### Scalability Considerations
- Stateless edge functions
- Efficient database indexing
- CDN for static assets
- Monitoring and alerting

## Testing Strategy

### Frontend Testing
- Component unit tests for critical functionality
- Integration tests for user flows
- E2E tests for complete user journeys

### Backend Testing
- Edge function unit tests
- Database integration tests
- API endpoint testing
- Email delivery testing

### User Acceptance Testing
- Complete user flow testing
- Mobile responsiveness
- Cross-browser compatibility
- Accessibility compliance

## Deployment Checklist

### Pre-Launch
- [ ] All API keys configured
- [ ] Database schema deployed
- [ ] Edge functions deployed and tested
- [ ] Email templates configured
- [ ] Stripe products and webhooks set up
- [ ] Domain and SSL configured
- [ ] Error monitoring configured

### Go-Live
- [ ] Frontend deployed to production
- [ ] Database migrations applied
- [ ] DNS configured properly
- [ ] Email deliverability tested
- [ ] Payment flows tested
- [ ] User registration tested end-to-end

### Post-Launch
- [ ] Monitor error rates and performance
- [ ] Track user conversion funnel
- [ ] Monitor email delivery rates
- [ ] Track subscription metrics
- [ ] Gather user feedback

---

## Development Notes

### Keep It Simple
This is a focused app with a clear purpose. Avoid feature creep and maintain simplicity in:
- User interface design
- Data models
- API structure
- User flows

### Focus Areas
1. **Smooth onboarding** - Get users to their first goal quickly
2. **Reliable daily emails** - Core value proposition
3. **Streak motivation** - Primary engagement driver
4. **Clean mobile experience** - Many users will access on mobile

### Success Metrics
- User activation rate (goal creation completion)
- Daily active users
- Email engagement rates
- Streak retention (7-day, 30-day)
- Free-to-paid conversion rate

This specification provides everything needed to build GoalMine.ai from scratch with a clean, focused architecture.