# GoalMine.ai Mobile App - Complete Standalone Requirements
**Independent Mobile Development Without Web App Interference**

## 🏗️ Project Isolation Strategy

### **Complete Separation Approach**
- **New GitHub Repository**: `goalmine-mobile` (completely separate from web repo)
- **New Supabase Project**: Fresh database instance for mobile app
- **Shared Services**: Firebase Auth (same project), Stripe (same account), OpenAI (same key)
- **Independent Deployment**: Separate app stores, separate analytics, separate everything

### **Why This Approach**
- ✅ Zero risk to existing web app
- ✅ Independent development cycles
- ✅ Clean testing environment
- ✅ Separate user analytics
- ✅ Future flexibility for mobile-specific features

---

## 📱 Complete Mobile App Requirements

### **App Identity**
- **Name**: GoalMine (Mobile)
- **Bundle ID**: `com.goalmine.mobile`
- **Platforms**: iOS and Android
- **Framework**: Expo React Native (managed workflow)

---

## 🎯 Complete User Flow Documentation

### **1. First-Time User Journey**
```
App Launch
    ↓
Welcome Screen (value proposition + sign up options)
    ↓
Authentication (Email/Password OR Google OAuth)
    ↓
[If Email] Email Verification Required
    ↓
Goal Creation Form (simple single form)
    ↓
AI Content Generation (immediate motivation)
    ↓
Dashboard (shows new goal + check-in available)
    ↓
Push Notification Setup Prompt
    ↓
Success State (ready for daily notifications)
```

### **2. Daily User Journey**
```
7:00 AM: Push Notification Received
    ↓
[User Taps Notification] → Opens to Goal Detail Screen
    ↓
[User Opens App Normally] → Dashboard Screen
    ↓
Check-In Button Available (if not done today)
    ↓
[Check-In Tap] → Streak Increment + Success Animation
    ↓
Updated Dashboard (streak count, next motivation preview)
```

### **3. Returning User Journey**
```
App Launch
    ↓
[Authenticated] → Dashboard
[Not Authenticated] → Login Screen
    ↓
Dashboard Shows:
- All active goals with current streaks
- Today's check-in status per goal
- Quick access to nudges (on-demand motivation)
- Subscription status/upgrade prompts
```

---

## 🗄️ Complete Backend Architecture

### **New Supabase Project Setup**

#### **Database Schema (Copy from Web)**
```sql
-- Profiles table (Firebase integration)
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,              -- Firebase UID
  email TEXT UNIQUE NOT NULL,       -- Firebase email
  display_name TEXT,
  goal_limit INTEGER DEFAULT 1,
  trial_expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
  push_token TEXT,                  -- Mobile-specific
  notification_enabled BOOLEAN DEFAULT true,
  notification_time TIME DEFAULT '07:00:00',
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Goals table (exact match to web)
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  tone TEXT NOT NULL CHECK (tone IN ('drill_sergeant', 'kind_encouraging', 'teammate', 'wise_mentor')),
  time_of_day TEXT DEFAULT '07:00',
  streak_count INTEGER DEFAULT 0,
  last_motivation_date DATE,
  last_checkin_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Motivation history (same as web)
CREATE TABLE motivation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('daily_motivation', 'nudge')),
  message TEXT NOT NULL,
  micro_plan TEXT[],
  challenge TEXT,
  tone TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscribers (same as web)
CREATE TABLE subscribers (
  user_id TEXT PRIMARY KEY REFERENCES profiles(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_name TEXT CHECK (plan_name IN ('Free Trial', 'Personal Plan')),
  status TEXT CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid')),
  current_period_end TIMESTAMP,
  subscribed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily nudges tracking (same as web)
CREATE TABLE daily_nudges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  goal_id UUID NOT NULL REFERENCES goals(id),
  nudge_date DATE DEFAULT CURRENT_DATE,
  nudge_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, goal_id, nudge_date)
);

-- Push notification log (mobile-specific)
CREATE TABLE push_notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  goal_id UUID NOT NULL REFERENCES goals(id),
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  status TEXT CHECK (status IN ('sent', 'failed', 'delivered'))
);
```

#### **Row Level Security (RLS) Policies**
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_log ENABLE ROW LEVEL SECURITY;

-- Note: Mobile app will use service role keys for edge functions
-- RLS policies are for direct client access (if needed)
```

---

## 🔧 Edge Functions (New Supabase Project)

### **Core Functions to Create**

#### **1. Authentication Functions**
```typescript
// create-user-profile/index.ts
export const createUserProfile = async (req: Request) => {
  const { userId, email, displayName, pushToken } = await req.json();
  
  // Create profile with Firebase UID
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: email,
      display_name: displayName,
      push_token: pushToken,
      goal_limit: 1,
      trial_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    
  return new Response(JSON.stringify({ success: !error, data }));
};
```

#### **2. Goal Management Functions**
```typescript
// create-goal/index.ts
export const createGoal = async (req: Request) => {
  const { userId, title, description, targetDate, tone } = await req.json();
  
  // Check goal limits
  const subscription = await checkUserSubscription(userId);
  const goalCount = await getCurrentGoalCount(userId);
  
  if (goalCount >= subscription.goalLimit) {
    return new Response(JSON.stringify({ 
      error: 'Goal limit reached', 
      requiresUpgrade: true 
    }), { status: 403 });
  }
  
  // Create goal (match web app structure)
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      title,
      description,
      target_date: targetDate,
      tone: tone || 'kind_encouraging',
      time_of_day: '07:00' // Default notification time
    });
    
  // Generate initial motivation content
  if (!error) {
    await generateInitialMotivation(data[0].id);
  }
  
  return new Response(JSON.stringify({ success: !error, data }));
};

// fetch-user-goals/index.ts
export const fetchUserGoals = async (req: Request) => {
  const userId = req.headers.get('user-id');
  
  const { data, error } = await supabase
    .from('goals')
    .select(`
      *,
      motivation_history(*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
    
  return new Response(JSON.stringify({ goals: data || [] }));
};

// check-in/index.ts
export const checkIn = async (req: Request) => {
  const { goalId, userId } = await req.json();
  
  // Validate goal ownership
  const goal = await getGoalByUserAndId(userId, goalId);
  if (!goal) {
    return new Response(JSON.stringify({ error: 'Goal not found' }), { status: 404 });
  }
  
  // Check if already checked in today (3 AM Eastern reset logic)
  const lastCheckIn = new Date(goal.last_check_in);
  const resetTime = getTodayResetTime(); // 3 AM Eastern
  
  if (lastCheckIn > resetTime) {
    return new Response(JSON.stringify({ error: 'Already checked in today' }), { status: 400 });
  }
  
  // Update streak and check-in time
  const newStreakCount = goal.streak_count + 1;
  
  const { error } = await supabase
    .from('goals')
    .update({
      streak_count: newStreakCount,
      last_check_in: new Date().toISOString()
    })
    .eq('id', goalId);
    
  return new Response(JSON.stringify({ 
    success: !error, 
    newStreakCount 
  }));
};
```

#### **3. Nudge (On-Demand Motivation) Functions**
```typescript
// generate-nudge/index.ts
export const generateNudge = async (req: Request) => {
  const { goalId, userId } = await req.json();
  
  // Check nudge limits
  const subscription = await checkUserSubscription(userId);
  const nudgeCount = await getTodayNudgeCount(userId);
  
  if (nudgeCount >= subscription.nudgeLimit) {
    return new Response(JSON.stringify({ 
      error: 'Daily nudge limit reached', 
      requiresUpgrade: subscription.name === 'Free Trial'
    }), { status: 403 });
  }
  
  const goal = await getGoalById(goalId);
  const prompt = buildNudgePrompt(goal);
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });
    
    const content = parseAIResponse(completion.choices[0].message.content);
    
    // Log nudge usage
    await supabase
      .from('daily_nudges')
      .insert({
        user_id: userId,
        goal_id: goalId,
        nudge_date: new Date().toISOString().split('T')[0]
      });
    
    return new Response(JSON.stringify({ success: true, content }));
    
  } catch (error) {
    const fallbackContent = getFallbackNudge(goal.tone);
    return new Response(JSON.stringify({ success: true, content: fallbackContent }));
  }
};
```

#### **4. AI Content Generation**
```typescript
// generate-daily-motivation/index.ts
export const generateDailyMotivation = async (req: Request) => {
  const { goalId } = await req.json();
  
  const goal = await getGoalById(goalId);
  const prompt = buildMotivationPrompt(goal);
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });
    
    const content = parseAIResponse(completion.choices[0].message.content);
    
    // Save to motivation_history
    await supabase
      .from('motivation_history')
      .insert({
        goal_id: goalId,
        content_type: 'daily_motivation',
        message: content.message,
        micro_plan: content.microPlan,
        challenge: content.challenge,
        tone: goal.coaching_tone
      });
      
    return new Response(JSON.stringify({ success: true, content }));
    
  } catch (error) {
    // Fallback content
    const fallbackContent = getFallbackMotivation(goal.coaching_tone);
    return new Response(JSON.stringify({ success: true, content: fallbackContent }));
  }
};
```

#### **4. Push Notification Functions**
```typescript
// send-push-notifications/index.ts
import { Expo } from 'expo-server-sdk';

export const sendPushNotifications = async (req: Request) => {
  const expo = new Expo();
  const notifications = [];
  
  // Get all active goals for users with notifications enabled
  const { data: goals } = await supabase
    .from('goals')
    .select(`
      *,
      profiles!inner(push_token, notification_enabled, notification_time, timezone)
    `)
    .eq('is_active', true)
    .eq('profiles.notification_enabled', true);
    
  for (const goal of goals) {
    // Check if it's notification time for this user
    const userTime = getCurrentTimeInTimezone(goal.profiles.timezone);
    const notificationTime = goal.profiles.notification_time;
    
    if (shouldSendNotification(userTime, notificationTime)) {
      // Generate fresh motivation content
      const motivation = await generateDailyMotivation({ goalId: goal.id });
      
      // Create push notification
      if (Expo.isExpoPushToken(goal.profiles.push_token)) {
        notifications.push({
          to: goal.profiles.push_token,
          title: `🎯 ${goal.title}`,
          body: truncateMessage(motivation.content.message, 100),
          data: { 
            goalId: goal.id,
            type: 'daily_motivation',
            checkInAvailable: !hasCheckedInToday(goal)
          },
          categoryId: 'daily_motivation',
          priority: 'normal'
        });
      }
    }
  }
  
  // Send notifications in batches
  const chunks = expo.chunkPushNotifications(notifications);
  const receipts = [];
  
  for (const chunk of chunks) {
    const receipt = await expo.sendPushNotificationsAsync(chunk);
    receipts.push(...receipt);
  }
  
  // Log notification sends
  await logNotificationSends(notifications, receipts);
  
  return new Response(JSON.stringify({ 
    success: true, 
    sent: notifications.length 
  }));
};

// Helper function to check notification timing
function shouldSendNotification(userTime: Date, notificationTime: string): boolean {
  const [hours, minutes] = notificationTime.split(':').map(Number);
  const currentHour = userTime.getHours();
  const currentMinute = userTime.getMinutes();
  
  // Send within 5-minute window of scheduled time
  return currentHour === hours && Math.abs(currentMinute - minutes) <= 5;
}
```

#### **5. Subscription Functions** (Copy from Web)
```typescript
// check-subscription/index.ts
// update-subscription/index.ts  
// create-checkout/index.ts
// (Same logic as web app, just copy over)
```

---

## 📱 Complete Mobile App Structure

### **React Native Project Setup**
```bash
npx create-expo-app goalmine-mobile --template
cd goalmine-mobile
npm install @supabase/supabase-js firebase expo-notifications expo-router
```

### **App Configuration**
```json
// app.json
{
  "expo": {
    "name": "GoalMine",
    "slug": "goalmine-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "platforms": ["ios", "android"],
    "scheme": "goalmine",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "bundleIdentifier": "com.goalmine.mobile",
      "supportsTablet": false
    },
    "android": {
      "package": "com.goalmine.mobile",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      }
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ]
  }
}
```

### **File Structure**
```
goalmine-mobile/
├── src/
│   ├── screens/
│   │   ├── WelcomeScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── GoalCreationScreen.tsx
│   │   ├── GoalDetailScreen.tsx
│   │   ├── GoalEditScreen.tsx
│   │   └── SubscriptionScreen.tsx
│   ├── components/
│   │   ├── GoalCard.tsx
│   │   ├── CheckInButton.tsx
│   │   ├── NudgeModal.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── SubscriptionGate.tsx
│   ├── hooks/
│   │   ├── useAuth.tsx
│   │   ├── useGoals.tsx
│   │   ├── useSubscription.tsx
│   │   └── useNotifications.tsx
│   ├── services/
│   │   ├── supabase.ts
│   │   ├── firebase.ts
│   │   ├── notifications.ts
│   │   └── ai.ts
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   └── AuthNavigator.tsx
│   ├── utils/
│   │   ├── time.ts
│   │   ├── validation.ts
│   │   └── formatting.ts
│   └── types/
│       └── index.ts
├── assets/
├── App.tsx
└── package.json
```

---

## 🔔 Detailed Notification Strategy

### **Notification Types**

#### **1. Daily Motivation Notifications**
```typescript
interface DailyMotivationNotification {
  title: string;           // "🎯 [Goal Title]"
  body: string;            // AI motivation snippet (100 chars)
  data: {
    goalId: string;
    type: 'daily_motivation';
    checkInAvailable: boolean;
    motivationId: string;
  };
  categoryId: 'daily_motivation';
  sound: 'default';
  badge: number;           // Unread motivation count
}
```

#### **2. Check-In Reminder Notifications** (Optional)
```typescript
interface CheckInReminderNotification {
  title: string;           // "Don't break your streak!"
  body: string;            // "Check in on [Goal Name]"
  data: {
    goalId: string;
    type: 'check_in_reminder';
    streakCount: number;
  };
  categoryId: 'check_in_reminder';
  sound: 'default';
}
```

### **Notification Scheduling Logic**
```typescript
// services/notifications.ts
export class NotificationService {
  
  async scheduleNotification(userId: string, goalId: string, time: string) {
    const user = await getUserProfile(userId);
    const goal = await getGoal(goalId);
    
    // Calculate next notification time in user's timezone
    const nextNotificationTime = calculateNextNotificationTime(time, user.timezone);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎯 ${goal.title}`,
        body: "Your daily motivation is ready!",
        data: { goalId, type: 'daily_motivation' }
      },
      trigger: {
        date: nextNotificationTime,
        repeats: true
      }
    });
  }
  
  async handleNotificationReceived(notification: Notification) {
    const { goalId, type } = notification.request.content.data;
    
    if (type === 'daily_motivation') {
      // Mark notification as received
      await this.logNotificationInteraction(goalId, 'received');
      
      // Pre-load goal data for faster app opening
      await this.preloadGoalData(goalId);
    }
  }
  
  async handleNotificationResponse(response: NotificationResponse) {
    const { goalId, type } = response.notification.request.content.data;
    
    if (type === 'daily_motivation') {
      // Navigate to goal detail screen
      navigation.navigate('GoalDetail', { goalId });
      
      // Mark as opened
      await this.logNotificationInteraction(goalId, 'opened');
    }
  }
}
```

### **Background Notification Generation**
```typescript
// Instead of scheduled local notifications, use push notifications
// This allows fresh AI content generation server-side

// Cron job calls this function every hour
export const checkAndSendNotifications = async () => {
  const currentTime = new Date();
  
  // Query users whose notification time is now (+/- 5 minutes)
  const usersToNotify = await getUsersForNotificationTime(currentTime);
  
  for (const user of usersToNotify) {
    const activeGoals = await getActiveGoals(user.id);
    
    for (const goal of activeGoals) {
      // Generate fresh AI content
      const motivation = await generateDailyMotivation(goal.id);
      
      // Send push notification
      await sendPushNotification(user.pushToken, {
        title: `🎯 ${goal.title}`,
        body: truncateMessage(motivation.message, 100),
        data: { goalId: goal.id, motivationId: motivation.id }
      });
      
      // Log the send
      await logNotificationSend(user.id, goal.id, 'daily_motivation');
    }
  }
};
```

---

## 💼 Complete Business Logic

### **Subscription Tiers (Same as Web)**
```typescript
interface SubscriptionTier {
  name: string;
  goalLimit: number;
  nudgeLimit: number;
  price: number;
  features: string[];
}

const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free Trial',
    goalLimit: 1,
    nudgeLimit: 1,
    price: 0,
    features: ['1 Goal', '1 Daily Nudge', '30-Day Trial']
  },
  premium: {
    name: 'Personal Plan',
    goalLimit: 3,
    nudgeLimit: 3,
    price: 4.99,
    features: ['3 Goals', '3 Daily Nudges', 'Priority Support']
  }
};
```

### **Goal State Management**
```typescript
interface GoalState {
  isExpired: boolean;      // Past target_date
  isTrialExpired: boolean; // User's trial expired
  canCheckIn: boolean;     // Not checked in today + not expired
  canEdit: boolean;        // Always true (even for expired goals)
  canDelete: boolean;      // Always true
  canShare: boolean;       // Only if not expired
  canViewMotivation: boolean; // Only if not expired
  canGenerateNudge: boolean;  // Only if not expired + under daily limit
}

export function getGoalState(goal: Goal, userSubscription: Subscription): GoalState {
  const isExpired = new Date(goal.target_date) < new Date();
  const isTrialExpired = userSubscription.status === 'trial_expired';
  
  return {
    isExpired,
    isTrialExpired,
    canCheckIn: !isExpired && !isTrialExpired && !hasCheckedInToday(goal),
    canEdit: !isTrialExpired, // Can edit expired goals to extend date
    canDelete: !isTrialExpired,
    canShare: !isExpired && !isTrialExpired,
    canViewMotivation: !isExpired && !isTrialExpired,
    canGenerateNudge: !isExpired && !isTrialExpired // Additional nudge limit check in handler
  };
}
```

### **Feature Gates**
```typescript
export function checkFeatureAccess(
  action: string, 
  userSubscription: Subscription, 
  currentUsage: any
): { allowed: boolean; reason?: string; requiresUpgrade?: boolean } {
  
  if (userSubscription.status === 'trial_expired') {
    return {
      allowed: false,
      reason: 'Trial expired. Please upgrade to continue.',
      requiresUpgrade: true
    };
  }
  
  switch (action) {
    case 'create_goal':
      if (currentUsage.goalCount >= userSubscription.goalLimit) {
        return {
          allowed: false,
          reason: `You've reached your limit of ${userSubscription.goalLimit} goals.`,
          requiresUpgrade: userSubscription.name === 'Free Trial'
        };
      }
      break;
      
    case 'request_nudge':
      if (currentUsage.nudgeCount >= userSubscription.nudgeLimit) {
        return {
          allowed: false,
          reason: `You've used all ${userSubscription.nudgeLimit} nudges for today.`,
          requiresUpgrade: userSubscription.name === 'Free Trial'
        };
      }
      break;
  }
  
  return { allowed: true };
}
```

---

## 📤 Social Sharing Feature

### **Simple Goal Sharing**
```typescript
// services/sharing.ts
import { Share } from 'react-native';

export const shareGoal = async (goal: Goal) => {
  const message = `🎯 I'm working on: ${goal.title}\n\nTrack your goals with GoalMine! 💪`;
  
  try {
    await Share.share({
      message: message,
      title: 'My Goal from GoalMine'
    });
  } catch (error) {
    console.error('Error sharing goal:', error);
  }
};
```

### **Share Button Implementation**
```typescript
// Simple share action in GoalCard
const handleShare = () => {
  if (goalState.canShare) {
    shareGoal(goal);
  }
};
```

**Features:**
- Share goal title to any social platform (Twitter, Facebook, Instagram, etc.)
- Uses native iOS/Android share sheet
- Simple text format: "🎯 I'm working on: [Goal Title]"
- Only available for active (non-expired) goals
- No complex tracking or analytics needed

---

## 🎨 UI Component Examples

### **Goal Card Component**
```typescript
interface GoalCardProps {
  goal: Goal;
  goalState: GoalState;
  onCheckIn: (goalId: string) => void;
  onEdit: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onShare: (goalId: string) => void;
  onNudge: (goalId: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ 
  goal, 
  goalState, 
  onCheckIn, 
  onEdit, 
  onDelete,
  onShare,
  onNudge
}) => {
  return (
    <View style={styles.card}>
      {/* Status Badge */}
      {goalState.isExpired && (
        <Badge color="red" text="GOAL EXPIRED" />
      )}
      {goalState.isTrialExpired && (
        <Badge color="orange" text="TRIAL EXPIRED" />
      )}
      
      {/* Goal Info */}
      <Text style={styles.title}>{goal.title}</Text>
      <Text style={styles.streak}>🔥 {goal.streak_count} day streak</Text>
      
      {/* Action Buttons */}
      <View style={styles.actions}>
        <CheckInButton 
          enabled={goalState.canCheckIn}
          onPress={() => onCheckIn(goal.id)}
        />
        <IconButton 
          icon="edit" 
          enabled={goalState.canEdit}
          onPress={() => onEdit(goal.id)} 
        />
        <IconButton 
          icon="delete" 
          enabled={goalState.canDelete}
          onPress={() => onDelete(goal.id)} 
        />
        <IconButton 
          icon="share" 
          enabled={goalState.canShare}
          onPress={() => onShare(goal.id)} 
        />
        <IconButton 
          icon="zap" 
          enabled={goalState.canGenerateNudge}
          onPress={() => onNudge(goal.id)} 
        />
      </View>
    </View>
  );
};
```

### **Check-In Button Component**
```typescript
interface CheckInButtonProps {
  enabled: boolean;
  loading?: boolean;
  onPress: () => void;
}

export const CheckInButton: React.FC<CheckInButtonProps> = ({ 
  enabled, 
  loading, 
  onPress 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.checkInButton,
        enabled ? styles.enabled : styles.disabled
      ]}
      disabled={!enabled || loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={styles.buttonText}>
          {enabled ? "Check In" : "Done Today"}
        </Text>
      )}
    </TouchableOpacity>
  );
};
```

---

## 🚀 Deployment Strategy

### **Development Environment**
```bash
# Local development
npm start
# Runs on Expo Go app for testing

# Web preview (for testing)
npm run web
```

### **Production Deployment**
```bash
# Build for app stores
eas build --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### **Environment Variables**
```bash
# .env.local
EXPO_PUBLIC_SUPABASE_URL=https://[new-project].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
EXPO_PUBLIC_FIREBASE_CONFIG=[firebase-config-json]
```

---

## ✅ Testing Checklist

### **Core Functionality**
- [ ] User signup/login (email + Google)
- [ ] Email verification flow
- [ ] Goal creation (4-step process)
- [ ] Daily check-ins work
- [ ] Streak counting accurate
- [ ] Push notifications send at correct time
- [ ] AI content generation works
- [ ] Subscription limits enforced
- [ ] Expired goal/trial states work

### **Mobile-Specific**
- [ ] App works in background
- [ ] Notifications appear in notification center
- [ ] Tapping notification opens correct screen
- [ ] App handles notification permissions
- [ ] Works on both iOS and Android
- [ ] Offline goal viewing works
- [ ] App store submission ready

---

## 🎯 Success Metrics

### **Launch Criteria**
- App approved on both app stores
- Push notifications working reliably
- Same user experience as web app
- All subscription features working
- Zero critical bugs in core flow

### **Business Metrics to Track**
- Daily active users
- Push notification open rates
- Check-in completion rates
- Free to paid conversion rates
- User retention (7, 14, 30 days)

---

## 📋 Implementation Phases

### **Phase 1: Project Setup (1-2 hours)**
- Create new Expo React Native project
- Set up new Supabase project with database schema
- Configure Firebase authentication
- Set up basic navigation structure

### **Phase 2: Authentication Flow (2-3 hours)**
- Implement signup/login screens
- Connect Firebase authentication
- Create user profile sync to Supabase
- Handle email verification flow

### **Phase 3: Goal Management (3-4 hours)**
- Build goal creation flow (4 steps)
- Implement dashboard with goal cards
- Add goal editing and deletion
- Connect to AI content generation

### **Phase 4: Check-in System (2-3 hours)**
- Implement daily check-in functionality
- Add streak counting logic
- Create check-in success animations
- Handle timezone calculations

### **Phase 5: Push Notifications (3-4 hours)**
- Set up Expo notifications
- Implement push notification scheduling
- Create notification handling logic
- Test notification delivery

### **Phase 6: Subscription System (2-3 hours)**
- Implement subscription screens
- Add feature gates and limits
- Connect Stripe in-app purchases
- Handle upgrade flows

### **Phase 7: Polish & Testing (2-3 hours)**
- Add loading states and error handling
- Implement offline capabilities
- Test on both iOS and Android
- Prepare for app store submission

### **Total Estimated Time: 15-22 hours**

---

## 🎯 Key Success Factors

### **Simplicity First**
- Use Expo managed workflow (avoid custom native code)
- Reuse existing backend infrastructure
- Keep UI simple and focused
- Minimal new features beyond mobile optimization

### **Reliability Focus**
- Push notifications must work consistently
- Offline goal viewing essential
- Fast app startup times
- Smooth check-in interactions

### **User Experience Priority**
- Intuitive navigation
- Clear visual feedback
- Seamless notification experience
- Easy upgrade path

This complete requirements document provides everything needed to build GoalMine.ai as a standalone mobile app without any interference with the existing web application. The mobile app will have the same functionality but optimized for mobile usage with push notifications replacing email notifications.

---

**Ready for Development**: This document contains complete specifications, code examples, database schema, user flows, and implementation guidance. A developer can use this to build the entire mobile app from scratch while maintaining complete separation from the existing web application.