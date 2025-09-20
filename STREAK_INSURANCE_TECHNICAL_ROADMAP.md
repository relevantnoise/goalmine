# Streak Insurance System - Technical Implementation Roadmap

## 🎯 **Feature Overview**

The Streak Insurance System transforms GoalMine.ai from a harsh "all-or-nothing" streak tracker into an intelligent, forgiving habit-building platform that still rewards consistency while acknowledging that life happens.

### **Problem Statement**
- Users lose 30+ day streaks after missing a single day
- Creates anxiety and demotivation around goal pursuit
- Leads to user churn and abandonment
- Current system is psychologically harsh and unrealistic

### **Solution Vision**
- **Earned Protection**: Users earn "insurance days" through consistent behavior
- **Automatic Recovery**: System automatically protects streaks when possible
- **Planned Flexibility**: Users can schedule breaks for life events
- **Smart Notifications**: Clear, encouraging communication about protection status

---

## 🏗️ **System Architecture**

### **Core Concepts**
1. **Streak Insurance Days**: Earned currency that protects against missed check-ins
2. **Automatic Recovery**: System uses insurance when days are missed
3. **Planned Breaks**: Scheduled periods where streaks are preserved
4. **Recovery Audit Trail**: Complete history of when/how insurance was used

### **Business Rules**
- Earn 1 insurance day every 7 consecutive check-ins
- Maximum 3 insurance days can be stored per goal
- Insurance is automatically consumed when days are missed
- Insurance covers up to the number of days available
- Planned breaks can last up to 14 days maximum
- Insurance is goal-specific (each goal has its own bank)

---

## 📊 **Database Schema Design**

### **New Columns for `goals` table:**
```sql
-- Streak insurance tracking
streak_insurance_days INTEGER DEFAULT 0,           -- Current insurance days (0-3)
last_insurance_earned_at DATE,                     -- When last insurance was earned

-- Planned break functionality  
is_on_planned_break BOOLEAN DEFAULT false,         -- Currently on planned break
planned_break_until DATE,                          -- End date of planned break
```

### **New Table: `streak_recoveries`**
```sql
CREATE TABLE streak_recoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  recovery_date DATE NOT NULL,                      -- When recovery occurred
  streak_before INTEGER NOT NULL,                   -- Streak count before recovery
  recovery_type TEXT NOT NULL,                      -- 'insurance', 'manual', 'grace_period'
  days_recovered INTEGER NOT NULL DEFAULT 1,       -- How many days were recovered
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_streak_recoveries_goal_id ON streak_recoveries(goal_id);
CREATE INDEX idx_streak_recoveries_user_id ON streak_recoveries(user_id);
CREATE INDEX idx_streak_recoveries_date ON streak_recoveries(recovery_date);
```

### **Row Level Security (RLS)**
```sql
-- Users can view their own recovery records
CREATE POLICY "Users can view own streak recoveries" ON streak_recoveries
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

-- Service role can insert recovery records (for database functions)
CREATE POLICY "Service role can insert streak recoveries" ON streak_recoveries
  FOR INSERT WITH CHECK (true);
```

---

## ⚙️ **Enhanced Check-in Logic**

### **New Function: `handle_goal_checkin_with_recovery`**

```sql
CREATE OR REPLACE FUNCTION public.handle_goal_checkin_with_recovery(
  goal_id_param UUID,
  user_id_param TEXT
) RETURNS JSON
```

#### **Logic Flow:**
1. **Timezone Handling**: Convert to Eastern Time with 3 AM reset
2. **Goal Validation**: Verify goal exists and is active
3. **Break Check**: Handle planned break status
4. **Duplicate Prevention**: Ensure only one check-in per day
5. **Streak Calculation**: Apply insurance logic for missed days
6. **Insurance Awards**: Grant insurance every 7 consecutive days
7. **Recovery Logging**: Track insurance usage in audit table
8. **Response Building**: Return comprehensive status information

#### **Insurance Logic:**
```javascript
// Pseudocode for streak calculation
if (days_missed === 0) {
    // Consecutive day - increment streak
    new_streak_count = current_streak + 1;
} else if (days_missed > 0 && insurance_days >= days_missed) {
    // Insurance covers missed days
    new_streak_count = current_streak + 1;
    insurance_used = true;
    insurance_days_remaining = insurance_days - days_missed;
    log_recovery_event();
} else {
    // No insurance or insufficient coverage - reset streak
    new_streak_count = 1;
}
```

#### **Insurance Earning Logic:**
```javascript
// Award insurance every 7 days (max 3)
if (new_streak_count % 7 === 0 && insurance_days < 3) {
    insurance_days = Math.min(insurance_days + 1, 3);
    insurance_earned = true;
}
```

---

## 🎨 **Frontend Implementation**

### **Updated TypeScript Interfaces**

```typescript
export interface Goal {
  // ... existing fields
  streak_insurance_days: number;
  last_insurance_earned_at: string | null;
  is_on_planned_break: boolean;
  planned_break_until: string | null;
}

export interface StreakRecovery {
  id: string;
  goal_id: string;
  user_id: string;
  recovery_date: string;
  streak_before: number;
  recovery_type: 'insurance' | 'grace_period' | 'manual';
  days_recovered: number;
  created_at: string;
}

export interface CheckinResult {
  success: boolean;
  streak_count: number;
  insurance_used: boolean;
  insurance_earned: boolean;
  insurance_days_remaining: number;
  days_recovered: number;
  is_milestone: boolean;
  milestone_label?: string;
}
```

### **Enhanced Check-in Hook**

```typescript
// Updated useGoals.tsx
const checkIn = async (goalId: string) => {
  const { data, error } = await supabase.rpc('handle_goal_checkin_with_recovery', {
    goal_id_param: goalId,
    user_id_param: user.id
  });
  
  if (result.insurance_used) {
    toast({
      title: "🛡️ Streak Protected!",
      description: `Used ${result.days_recovered} insurance day(s). Your ${result.streak_count}-day streak is safe!`,
    });
  } else if (result.insurance_earned) {
    toast({
      title: "🛡️ Streak Insurance Earned!",
      description: `Great! You earned 1 insurance day for your ${result.streak_count}-day streak!`,
    });
  }
};
```

---

## 🖼️ **UI Components Design**

### **1. StreakInsurance Component**
```typescript
interface StreakInsuranceProps {
  goal: Goal;
}

const StreakInsurance = ({ goal }: StreakInsuranceProps) => {
  const insuranceCount = goal.streak_insurance_days || 0;
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Shield className="w-4 h-4" />
      <span>{insuranceCount}/3 Insurance</span>
      
      {/* Visual indicators */}
      <div className="flex gap-1">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < insuranceCount ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
      
      {/* Helpful tooltip */}
      <Tooltip>
        <TooltipContent>
          Protects your streak if you miss a day.
          Earn 1 insurance every 7 consecutive check-ins.
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
```

### **2. PlannedBreakDialog Component**
```typescript
const PlannedBreakDialog = ({ goal, onSuccess }: PlannedBreakDialogProps) => {
  const [breakDays, setBreakDays] = useState(1);
  const [startDate, setStartDate] = useState(new Date());
  
  const handleScheduleBreak = async () => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + breakDays - 1);
    
    await supabase
      .from('goals')
      .update({
        is_on_planned_break: true,
        planned_break_until: endDate.toISOString().split('T')[0]
      })
      .eq('id', goal.id);
      
    toast({
      title: "✈️ Break Scheduled!",
      description: `Your streak is paused for ${breakDays} days.`,
    });
  };
  
  return (
    <Dialog>
      {/* Date picker and duration selector */}
      {/* Cancel/schedule buttons */}
    </Dialog>
  );
};
```

### **3. Enhanced Notifications**

```typescript
// Smart notification system based on check-in results
const NotificationSystem = {
  insuranceUsed: (days: number, remaining: number) => ({
    title: "🛡️ Streak Protected!",
    description: `Used ${days} insurance day${days > 1 ? 's' : ''}. ${remaining} insurance days remaining.`,
    variant: "default"
  }),
  
  insuranceEarned: (streakDays: number) => ({
    title: "🛡️ Streak Insurance Earned!",
    description: `Awesome! You earned 1 insurance day for your ${streakDays}-day streak!`,
    variant: "default"
  }),
  
  streakReset: () => ({
    title: "💔 Streak Reset",
    description: "Your streak reset to 1. You didn't have enough insurance days.",
    variant: "destructive"
  }),
  
  regularCheckin: (streakDays: number) => ({
    title: "✅ Checked In!",
    description: `Great job! Your streak is now ${streakDays} days.`,
    variant: "default"
  })
};
```

---

## 📱 **User Experience Flow**

### **New User Journey:**
1. **Goal Creation**: User creates first goal (0 insurance days)
2. **Early Check-ins**: User checks in daily, building initial streak
3. **First Insurance**: After 7 consecutive days, user earns first insurance day
4. **Protection Event**: User misses a day, insurance automatically protects streak
5. **Understanding**: User learns about the system through clear notifications
6. **Confidence**: User feels secure continuing long-term habit building

### **Planned Break Flow:**
1. **Break Planning**: User plans vacation/illness in advance
2. **Break Scheduling**: User sets break duration and dates through UI
3. **Break Period**: Check-ins are blocked, streak is preserved
4. **Break End**: User resumes normal check-ins after break period
5. **Seamless Continuation**: Streak continues from pre-break count

### **Recovery Analytics Flow:**
1. **Recovery Event**: Insurance is used to protect streak
2. **Audit Logging**: Event is recorded in streak_recoveries table
3. **Analytics View**: User can see history of protection events
4. **Pattern Recognition**: User learns their check-in patterns
5. **Behavior Adjustment**: User can improve consistency over time

---

## 📊 **Analytics & Metrics**

### **Key Metrics to Track:**
- **Insurance Earning Rate**: % of 7-day streaks that earn insurance
- **Insurance Usage Rate**: % of insurance days that get used
- **Streak Protection Events**: Number of times insurance saves streaks
- **User Retention Impact**: Before/after insurance implementation
- **Average Streak Length**: Impact on overall streak duration
- **Planned Break Usage**: Adoption of planned break feature

### **Analytics Queries:**
```sql
-- Insurance usage statistics
SELECT 
  COUNT(*) as total_recoveries,
  AVG(days_recovered) as avg_days_recovered,
  COUNT(DISTINCT goal_id) as goals_with_recoveries
FROM streak_recoveries 
WHERE recovery_type = 'insurance';

-- Insurance earning patterns
SELECT 
  COUNT(*) as users_with_insurance,
  AVG(streak_insurance_days) as avg_insurance_days
FROM goals 
WHERE streak_insurance_days > 0;

-- Break usage patterns  
SELECT 
  COUNT(*) as goals_on_break,
  AVG(planned_break_until - CURRENT_DATE) as avg_break_length
FROM goals 
WHERE is_on_planned_break = true;
```

---

## 🧪 **Testing Strategy**

### **Unit Tests:**
```typescript
describe('Streak Insurance Logic', () => {
  test('should earn insurance after 7 consecutive days', () => {
    // Test insurance earning logic
  });
  
  test('should use insurance when days are missed', () => {
    // Test automatic insurance consumption
  });
  
  test('should reset streak when insufficient insurance', () => {
    // Test streak reset with inadequate coverage
  });
  
  test('should handle planned breaks correctly', () => {
    // Test planned break preservation
  });
});
```

### **Integration Tests:**
```typescript
describe('Check-in System Integration', () => {
  test('complete insurance workflow', async () => {
    // Create goal, check in 7 times, verify insurance earned
    // Miss days, verify insurance used, verify streak preserved
  });
  
  test('planned break workflow', async () => {
    // Schedule break, verify check-ins blocked, verify streak preserved
  });
});
```

### **User Testing Scenarios:**
1. **New User**: First-time experience with insurance system
2. **Insurance Earner**: User reaches 7-day milestone  
3. **Protection Event**: User misses days and gets protection
4. **Break Planner**: User schedules and manages planned breaks
5. **Power User**: Long-term user with multiple insurance events

---

## 🚀 **Deployment Strategy**

### **Phase 1: Database Migration**
1. Apply schema changes to staging environment
2. Test migration rollback procedures
3. Deploy enhanced check-in function
4. Verify existing functionality unchanged
5. Apply to production during low-traffic window

### **Phase 2: Gradual Feature Rollout**
1. Deploy UI changes with feature flags
2. Enable for 10% of users initially
3. Monitor metrics and user feedback  
4. Gradually increase to 50%, then 100%
5. Remove feature flags after stable deployment

### **Phase 3: User Education**
1. In-app onboarding for insurance system
2. Email campaign explaining new features
3. Help documentation and FAQ updates
4. Social media content about improved experience
5. User feedback collection and iteration

---

## 💡 **Future Enhancements**

### **Advanced Insurance Features:**
- **Insurance Gifting**: Users can gift insurance days to friends
- **Premium Insurance**: Paid users get bonus insurance earning
- **Streak Restoration**: One-time purchase to restore lost streaks
- **Insurance Analytics**: Personal dashboard showing usage patterns

### **Social Features:**
- **Insurance Sharing**: Share protection events on social media
- **Community Support**: Users can donate insurance to community pool
- **Achievement Badges**: Rewards for smart insurance usage
- **Leaderboards**: Track longest protected streaks

### **AI Enhancements:**
- **Predictive Protection**: AI predicts when users might miss days
- **Smart Reminders**: Proactive notifications based on risk patterns
- **Personalized Insurance**: Different earning rates based on user behavior
- **Habit Coaching**: AI advice on building sustainable streaks

---

## 🎯 **Success Criteria**

### **Quantitative Goals:**
- **Retention Improvement**: +25% in 30-day retention rate
- **Streak Length**: +40% average streak duration  
- **User Satisfaction**: 4.5+ stars in app store reviews
- **Insurance Usage**: 60%+ of eligible users earn insurance
- **Protection Events**: 30%+ of insurance used for protection

### **Qualitative Goals:**
- **Reduced Anxiety**: Users report less stress about maintaining streaks
- **Increased Confidence**: Users attempt longer-term goals
- **Better Experience**: Positive feedback on forgiving system
- **Habit Formation**: Users develop sustainable daily routines
- **Word of Mouth**: Organic user growth from recommendations

---

## 📋 **Implementation Checklist**

### **Backend Development:**
- [ ] Create database migration scripts
- [ ] Implement enhanced check-in function
- [ ] Add RLS policies and security
- [ ] Create audit logging system
- [ ] Write comprehensive tests
- [ ] Performance optimization

### **Frontend Development:**
- [ ] Update TypeScript interfaces
- [ ] Create StreakInsurance component
- [ ] Build PlannedBreakDialog component  
- [ ] Implement enhanced notifications
- [ ] Update check-in UI flow
- [ ] Add analytics tracking

### **Testing & QA:**
- [ ] Unit test coverage >90%
- [ ] Integration test scenarios
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Security testing
- [ ] Cross-browser compatibility

### **Deployment & Launch:**
- [ ] Staging environment testing
- [ ] Production deployment plan
- [ ] Rollback procedures
- [ ] Monitoring and alerting
- [ ] User communication plan
- [ ] Success metrics tracking

---

**Status**: 🎯 **Ready for Implementation**  
**Estimated Timeline**: 3-4 weeks development + 2 weeks testing  
**Priority**: High-impact feature for V2.0 release  
**Risk Level**: Medium (significant UX change, requires careful testing)

This comprehensive roadmap ensures the Streak Insurance System can be implemented efficiently and effectively when the timing is right for your product's growth trajectory.