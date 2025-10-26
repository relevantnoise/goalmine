# 5 Circle Framework Redesign - Technical Requirements

**Date**: October 26, 2025  
**Status**: Ready for Implementation  
**Priority**: High - Replaces current complex onboarding system

## **Overview**
Transform GoalMine.ai from simple goal tracking to comprehensive life management by adding time-based circle framework while preserving proven goal creation/tracking system.

---

## **PROBLEM SOLVED**
The current 5 Circle onboarding has critical UX issues:
- ❌ Infinite interview loop (users spent 1+ hours with no output)
- ❌ Redundant questions (hours asked multiple times)  
- ❌ Navigation bugs (jumps back to random steps)
- ❌ No clear end product or goal creation path
- ❌ AI consultant asks questions forever with no termination

## **NEW SOLUTION: 3-Part Simple Flow**

### **Part 1: Time Management Framework (5-7 minutes)**
Focus on concrete time allocation rather than philosophical questions.

#### **Step 1: Life Context**
- Work hours per week: Slider 0-100 (step: 5) [EXPANDED from 20-80 to include retirees and entrepreneurs]
- Sleep hours per night: Slider 6-10 (step: 0.5) 
- Commute hours per week: Slider 0-20 (step: 1)
- **Auto-calculate**: Available hours = 168 - (work + sleep*7 + commute)

#### **Steps 2-6: Circle Time Allocation**
For each circle (Spiritual, Friends & Family, Work, Personal Development, Health & Fitness):

**Standard Circles (Spiritual, Friends & Family, Personal Development, Health & Fitness):**
- Circle importance: Slider 1-10
- Current weekly time: Slider 0-50 (step: 0.5 for Spiritual, 1 for others)
- Ideal weekly time: Slider 0-50 (step: 0.5 for Spiritual, 1 for others)

**Work Circle (Enhanced with Business Happiness Formula):**
- Same as above PLUS Business Happiness Formula (Dan's 10-year proven framework):
  - **Impact**: Current (1-10) → Desired (1-10)
  - **Fun**: Current (1-10) → Desired (1-10) 
  - **Money**: Current (1-10) → Desired (1-10)
  - **Work from Anywhere**: Current (1-10) → Desired (1-10)

*Note: Business Happiness Formula helps users self-discover when it's time to "RUN" (change jobs) based on gaps between current and desired states.*

### **Part 2: Goal Creation**
- Use existing proven goal creation system with minor updates
- **REMOVED**: Step 5 (Time of day preference) - emails now consolidated and sent at fixed 6 AM Eastern
- **NEW**: Add "Circle Assignment" dropdown as new Step 5 (required field)
- **NEW**: Show circle context during creation to guide goal selection
- **SIMPLIFIED**: 5-step process becomes: Title → Description → Target Date → Tone → Circle Assignment
- Allow 1-5 goals during trial (any circle distribution user prefers)

### **Part 3: Framework Complete**
- Save circle framework to database
- Show simple completion confirmation
- Proceed to enhanced dashboard

---

## **DATABASE CHANGES**

### **New Tables:**
```sql
-- User's circle framework instance
user_circle_frameworks (
  id UUID PRIMARY KEY,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  work_hours_per_week INTEGER,
  sleep_hours_per_night DECIMAL(3,1),
  commute_hours_per_week INTEGER,
  available_hours_per_week INTEGER
);

-- Individual circle allocations
circle_time_allocations (
  id UUID PRIMARY KEY,
  framework_id UUID REFERENCES user_circle_frameworks(id),
  circle_name TEXT NOT NULL, -- 'Spiritual', 'Friends & Family', 'Work', 'Personal Development', 'Health & Fitness'
  importance_level INTEGER CHECK (importance_level >= 1 AND importance_level <= 10),
  current_hours_per_week DECIMAL(4,1),
  ideal_hours_per_week DECIMAL(4,1),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Work circle happiness metrics (Business Happiness Formula)
work_happiness_metrics (
  id UUID PRIMARY KEY,
  framework_id UUID REFERENCES user_circle_frameworks(id),
  impact_current INTEGER CHECK (impact_current >= 1 AND impact_current <= 10),
  impact_desired INTEGER CHECK (impact_desired >= 1 AND impact_desired <= 10),
  fun_current INTEGER CHECK (fun_current >= 1 AND fun_current <= 10),
  fun_desired INTEGER CHECK (fun_desired >= 1 AND fun_desired <= 10),
  money_current INTEGER CHECK (money_current >= 1 AND money_current <= 10),
  money_desired INTEGER CHECK (money_desired >= 1 AND money_desired <= 10),
  remote_current INTEGER CHECK (remote_current >= 1 AND remote_current <= 10),
  remote_desired INTEGER CHECK (remote_desired >= 1 AND remote_desired <= 10),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Weekly circle check-ins (for ongoing time management)
circle_checkins (
  id UUID PRIMARY KEY,
  framework_id UUID REFERENCES user_circle_frameworks(id),
  week_date DATE NOT NULL,
  circle_name TEXT NOT NULL,
  actual_hours_spent DECIMAL(4,1),
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 10),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Modified Tables:**
```sql
-- Add to existing goals table
ALTER TABLE goals ADD COLUMN circle_type TEXT;
ALTER TABLE goals ADD COLUMN weekly_commitment_hours INTEGER;

-- Add constraint for valid circle types
ALTER TABLE goals ADD CONSTRAINT valid_circle_type 
  CHECK (circle_type IN ('Spiritual', 'Friends & Family', 'Work', 'Personal Development', 'Health & Fitness'));
```

---

## **DASHBOARD ENHANCEMENTS**

### **Goal Cards (Minimal Changes):**
- Add circle badge/label to each goal card
- Use circle-specific colors for visual organization:
  - Spiritual: Purple
  - Friends & Family: Blue  
  - Work: Green
  - Personal Development: Orange
  - Health & Fitness: Red
- Everything else stays exactly the same (preserve all existing functionality)

### **New Circle Management Section:**
- **Circle Overview**: Visual display of current vs ideal time allocation per circle
- **Weekly Check-in**: Simple interface to update actual time spent per circle
- **Circle Target Adjustment**: Edit ideal time allocations (they should be editable as users learn what's realistic)
- **Work Happiness Dashboard**: Track progress on 4 business happiness metrics over time

---

## **SUBSCRIPTION TIERS**

### **Free Trial (30 days):**
- Full circle framework access
- Up to 5 goals (any circle distribution)
- All features unlocked (let them experience full value)

### **Personal Plan ($24.99/month - PROPOSED PRICING):**
- Circle framework included
- 2 goals maximum
- Basic circle analytics
- **Rationale**: Increased value justifies 5x price increase from $4.99

### **Pro Plan ($199.99/month):**
- Everything + group coaching calls with Dan Lynn
- 5 goals maximum  
- Advanced circle analytics and insights
- 5 Circle Framework + strategic advisory access

### **Feature Gating Strategy:**
Build everything first, then add subscription gates based on real usage data and user feedback.

---

## **TECHNICAL IMPLEMENTATION PHASES**

### **Phase 1: Core Framework (Week 1-2)**
1. Create new simplified onboarding components
2. Implement database schema changes
3. Build circle data storage/retrieval systems
4. Remove infinite AI consultant system

### **Phase 2: Dashboard Integration (Week 3)**
1. Add circle labels to existing goal cards
2. Build circle management interface
3. Create weekly check-in system
4. Integrate work happiness tracking

### **Phase 3: Subscription Gates (Week 4)**
1. Implement goal limit enforcement
2. Add feature access controls  
3. Create upgrade prompts and flows

---

## **PRESERVED SYSTEMS (MINIMAL CHANGES)**
- ✅ Existing goal creation flow (remove time preference, add circle assignment)
- ✅ Daily goal check-ins and streak tracking
- ✅ **CURRENT EMAIL SYSTEM**: Consolidated 1 email per user at 6 AM Eastern (October 2025)
- ✅ Universal nudge system (dashboard-level, not goal-specific)
- ✅ All current dashboard functionality
- ✅ Firebase auth + Supabase architecture
- ✅ Subscription management (Stripe integration)
- ✅ User profile and trial logic

---

## **BUSINESS HAPPINESS FORMULA CONTEXT**
Dan Lynn developed this formula 10 years ago and has used it to help many people:
- **Original (10 years ago)**: Impact + Fun + Money (if any dimension consistently low = time to leave/RUN)
- **COVID Update**: Added "Work from Anywhere" as 4th dimension
- **Philosophy**: Let users self-discover the need for change rather than telling them to "RUN"
- **Integration**: Large gaps between current and desired states naturally guide goal creation

---

## **KEY DESIGN PRINCIPLES**
1. **Simplicity Over Sophistication**: 10 minutes vs 1+ hour onboarding
2. **Concrete Over Abstract**: Time allocation vs philosophical questions  
3. **Self-Discovery Over Prescription**: Users see their own gaps and create relevant goals
4. **Preserve What Works**: Keep proven goal tracking system intact
5. **Progressive Enhancement**: Add circle context without overwhelming existing users

---

## **SUCCESS METRICS**
- Onboarding completion rate > 80% (vs current ~20%)
- Time to complete onboarding < 10 minutes (vs current 60+ minutes)
- Goal creation rate increases (circle context helps focus)
- User engagement with circle check-ins
- Conversion from trial to paid subscriptions

---

**Next Steps**: Begin Phase 1 implementation with simplified onboarding flow replacement.