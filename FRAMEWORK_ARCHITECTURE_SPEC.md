# 🎯 6 Elements of Life™ Framework - Technical Architecture Specification

**Date**: October 28, 2025  
**Status**: DESIGN PHASE  
**Objective**: Create a world-class life architecture platform with meticulous attention to detail

---

## 🎨 **USER EXPERIENCE VISION**

### **Dashboard Overview (Primary View)**
- **Visual Health Score**: Circular progress indicators for each element (0-100%)
- **Trend Analysis**: Spark lines showing 4-week progress trends
- **Quick Status**: Current vs Desired gap visualization
- **AI Insights Panel**: Dynamic recommendations based on latest assessment
- **Weekly Check-in CTA**: Prominent when due, subtle when complete

### **Element Detail Views**
- **Deep Dive Analytics**: Historical trends, patterns, correlations
- **Progress Tracking**: Visual timeline of improvements
- **Goal Integration**: AI-suggested goals based on element gaps
- **Contextual Insights**: Why this element matters for overall life balance

### **Weekly Check-in Experience**
- **Guided Reflection**: "How did you do this week?" for each element
- **Progress Input**: Simple 1-10 scale with contextual prompts
- **Insight Generation**: AI analysis of progress patterns
- **Goal Suggestions**: Smart recommendations based on performance gaps

---

## 🗄️ **DATABASE ARCHITECTURE**

### **Core Tables**

#### `user_frameworks`
```sql
CREATE TABLE user_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Firebase UID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  last_checkin_date DATE,
  total_checkins INTEGER DEFAULT 0
);
```

#### `elements`
```sql
CREATE TABLE elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'Work', 'Sleep', 'Friends & Family', etc.
  description TEXT,
  color_hex TEXT, -- For UI consistency
  icon_name TEXT, -- For UI icons
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true
);

-- Pre-populate with 6 core elements
INSERT INTO elements (name, description, color_hex, icon_name, display_order) VALUES
('Work', 'Career, jobs + Business Happiness Formula', '#3B82F6', 'briefcase', 1),
('Sleep', 'Rest, recovery, sleep optimization', '#8B5CF6', 'moon', 2),
('Friends & Family', 'Relationships, social connections, quality time', '#10B981', 'users', 3),
('Health & Fitness', 'Physical wellbeing, exercise, nutrition', '#EF4444', 'heart', 4),
('Personal Development', 'Learning, growth, skills, education', '#F59E0B', 'book', 5),
('Spiritual', 'Inner purpose, values, meaning, meditation, prayer', '#6366F1', 'sun', 6);
```

#### `element_assessments`
```sql
CREATE TABLE element_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_frameworks(id) ON DELETE CASCADE,
  element_id UUID NOT NULL REFERENCES elements(id),
  current_state INTEGER CHECK (current_state >= 1 AND current_state <= 10),
  desired_state INTEGER CHECK (desired_state >= 1 AND desired_state <= 10),
  priority_level INTEGER CHECK (priority_level >= 1 AND priority_level <= 5),
  weekly_hours_allocated INTEGER DEFAULT 0,
  personal_definition TEXT, -- User's custom definition of success in this element
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(framework_id, element_id)
);
```

#### `work_happiness_metrics`
```sql
CREATE TABLE work_happiness_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_frameworks(id) ON DELETE CASCADE,
  impact_current INTEGER CHECK (impact_current >= 1 AND impact_current <= 10),
  impact_desired INTEGER CHECK (impact_desired >= 1 AND impact_desired <= 10),
  fun_current INTEGER CHECK (fun_current >= 1 AND fun_current <= 10),
  fun_desired INTEGER CHECK (fun_desired >= 1 AND fun_desired <= 10),
  money_current INTEGER CHECK (money_current >= 1 AND money_current <= 10),
  money_desired INTEGER CHECK (money_desired >= 1 AND money_desired <= 10),
  remote_current INTEGER CHECK (remote_current >= 1 AND remote_current <= 10),
  remote_desired INTEGER CHECK (remote_desired >= 1 AND remote_desired <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `weekly_checkins`
```sql
CREATE TABLE weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_frameworks(id) ON DELETE CASCADE,
  week_ending DATE NOT NULL, -- Sunday of the week
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 10),
  UNIQUE(framework_id, week_ending)
);
```

#### `weekly_element_scores`
```sql
CREATE TABLE weekly_element_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id UUID NOT NULL REFERENCES weekly_checkins(id) ON DELETE CASCADE,
  element_id UUID NOT NULL REFERENCES elements(id),
  score INTEGER CHECK (score >= 1 AND score <= 10) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(checkin_id, element_id)
);
```

#### `framework_insights`
```sql
CREATE TABLE framework_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES user_frameworks(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'gap_analysis', 'trend_alert', 'goal_suggestion', 'balance_warning'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high
  is_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE, -- Some insights expire
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- Additional insight data
);
```

---

## 🎨 **COMPONENT ARCHITECTURE**

### **Framework Components**

#### `FrameworkDashboard.tsx` (Main View)
- **Health Overview**: 6-element progress wheel
- **Trend Insights**: 4-week performance trends
- **AI Recommendations**: Dynamic insight cards
- **Quick Actions**: Check-in, Edit, Goal Creation

#### `ElementCard.tsx` (Individual Element)
- **Progress Indicator**: Current vs Desired with gap visualization
- **Weekly Trend**: Mini spark line chart
- **Quick Check-in**: Inline progress update
- **Deep Dive Link**: Navigate to full element analysis

#### `WeeklyCheckin.tsx` (Guided Assessment)
- **Progress Slider**: 1-10 scale per element with contextual hints
- **Reflection Prompts**: "What went well? What was challenging?"
- **Goal Integration**: Suggest goals based on low-performing elements
- **Summary View**: Show progress before submission

#### `ElementDetailView.tsx` (Deep Analytics)
- **Historical Trends**: 12-week chart with annotations
- **Gap Analysis**: Current vs Desired breakdown
- **Goal Connections**: Related goals and their impact
- **Edit Assessment**: Update current/desired states

#### `FrameworkOnboarding.tsx` (Initial Setup)
- **Enhanced Interview**: More sophisticated than current
- **Element Education**: Explain each element with examples
- **Priority Setting**: Help users identify top 2-3 focus areas
- **Goal Workshop**: AI-powered initial goal suggestions

### **AI Integration Components**

#### `InsightEngine.tsx` (Background Service)
- **Gap Analysis**: Identify largest current vs desired gaps
- **Trend Detection**: Notice improving/declining elements
- **Balance Alerts**: Warn when one element dominates
- **Goal Suggestions**: Recommend SMART goals for gaps

#### `GoalSuggestionWorkshop.tsx` (AI-Powered Goal Creation)
- **Context Analysis**: Use framework data for intelligent suggestions
- **SMART Validation**: Ensure goals meet SMART criteria
- **Element Integration**: Connect goals to framework elements
- **Priority Guidance**: Help users choose highest-impact goals

---

## 🔄 **USER WORKFLOWS**

### **New User Journey**
1. **Framework Onboarding** (15-20 min)
   - Element education and personal definitions
   - Current vs Desired assessment
   - Work Happiness Formula (if applicable)
   - Priority identification

2. **Initial Dashboard** 
   - Framework overview with gaps highlighted
   - AI-generated insights about biggest opportunities
   - Suggested first goals (2-3 maximum)

3. **First Week Experience**
   - Gentle reminders about weekly check-ins
   - Goal progress tracking
   - Framework-goal connections shown

### **Ongoing User Experience**
1. **Weekly Check-ins** (5 min)
   - How did each element perform this week?
   - Overall satisfaction and notes
   - AI insights based on patterns

2. **Monthly Framework Review** (10 min)
   - Update current/desired states if life changed
   - Review trends and celebrate progress
   - Adjust goals based on framework evolution

3. **Quarterly Deep Dive** (20 min)
   - Comprehensive framework reassessment
   - Major life changes integration
   - Strategic goal planning for next quarter

---

## 🧠 **AI INTELLIGENCE FEATURES**

### **Insight Generation**
- **Gap Analysis**: "Your Work element has the largest gap (3→9). Consider focusing here."
- **Trend Alerts**: "Your Sleep scores have declined 3 weeks straight. Time to prioritize rest?"
- **Balance Warnings**: "80% of your time is allocated to Work. Consider rebalancing."
- **Success Patterns**: "Your Health improvements correlate with better Sleep. Keep this connection!"

### **Goal Suggestions**
- **Smart Recommendations**: Use framework gaps to suggest relevant goals
- **SMART Validation**: Ensure goals are specific, measurable, achievable
- **Element Integration**: Connect each goal to relevant framework elements
- **Priority Guidance**: Help users choose highest-impact goals first

### **Progress Insights**
- **Weekly Summaries**: "This week you improved in 4/6 elements. Great progress!"
- **Correlation Detection**: "Your Friends & Family scores improve when Work stress is lower."
- **Celebration Moments**: "You've closed the gap in Personal Development by 40%!"

---

## 📊 **METRICS & ANALYTICS**

### **Framework Health Score**
- **Overall Score**: Weighted average of all elements (accounting for user priorities)
- **Balance Score**: How evenly distributed is attention across elements
- **Progress Score**: Trend analysis showing improvement over time
- **Gap Score**: How close current states are to desired states

### **Element Metrics**
- **Current State**: 1-10 user assessment
- **Desired State**: 1-10 user goal
- **Gap Size**: Desired - Current
- **Weekly Trend**: 4-week moving average
- **Priority Weight**: User-defined importance (1-5)

### **Engagement Metrics**
- **Check-in Streak**: Consecutive weekly check-ins
- **Framework Updates**: How often users update assessments
- **Goal Connection**: How many goals are tied to framework elements
- **Insight Engagement**: Which AI insights drive action

---

## 🚀 **IMPLEMENTATION PHASES**

### **Phase 1: Foundation** (Week 1)
- ✅ Create database tables with proper schemas
- ✅ Build core framework data collection
- ✅ Implement basic dashboard visualization
- ✅ Create framework onboarding flow

### **Phase 2: Intelligence** (Week 2)
- ✅ Build AI insight generation system
- ✅ Implement weekly check-in workflow
- ✅ Create goal suggestion engine
- ✅ Add progress tracking and trends

### **Phase 3: Polish** (Week 3)
- ✅ Enhance UI/UX with attention to detail
- ✅ Add advanced analytics and visualizations
- ✅ Implement comprehensive testing
- ✅ Optimize performance and user experience

### **Phase 4: Integration** (Week 4)
- ✅ Remove old framework-as-goal code
- ✅ Integrate with existing goal system
- ✅ Migration and cleanup
- ✅ End-to-end testing with real scenarios

---

## ✅ **SUCCESS CRITERIA**

### **User Experience**
- [ ] Users can complete framework onboarding in 15-20 minutes
- [ ] Dashboard provides immediate value and insights
- [ ] Weekly check-ins feel valuable and take <5 minutes
- [ ] AI suggestions are relevant and actionable
- [ ] Framework updates are intuitive when life changes

### **Technical Excellence**
- [ ] Clean data architecture with no framework/goal confusion
- [ ] Fast, responsive UI with smooth interactions
- [ ] Reliable AI insights with proper error handling
- [ ] Comprehensive test coverage
- [ ] Scalable code architecture for future features

### **Business Impact**
- [ ] Framework becomes the "sticky" core of the platform
- [ ] Users see clear value in comprehensive life management
- [ ] Platform differentiates from simple goal tracking apps
- [ ] Foundation for premium positioning and pricing

---

**This specification will guide our implementation with the precision and attention to detail needed to create something truly exceptional. Ready to build it? 🚀**