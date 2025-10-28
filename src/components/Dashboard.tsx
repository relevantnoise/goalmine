import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Zap, Plus, Crown, Calendar, Flame, Heart, Users, Briefcase, BookOpen, Activity, Settings, Clock, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGoals, getGoalStatus, getGoalPermissions } from "@/hooks/useGoals";
import { useSubscription } from "@/hooks/useSubscription";
import { useCircleCheckin } from "@/hooks/useCircleCheckin";
import { GoalCard } from "./GoalCard";
import { FrameworkCard } from "./FrameworkCard";
import { Header } from "./Header";
import { UpgradePrompt } from "./UpgradePrompt";
import { ProfessionalCoachPrompt } from "./ProfessionalCoachPrompt";
import { format } from "date-fns";

interface DashboardProps {
  onNudgeMe: () => Promise<any>;
  onStartOver: () => void;
  onLogoClick: () => void;
  hasFramework?: boolean;
  onEditFramework?: () => void;
  onViewFramework?: () => void;
  onCircleCheckin?: () => void;
}

export const Dashboard = ({ onNudgeMe, onStartOver, onLogoClick, hasFramework = false, onEditFramework, onViewFramework, onCircleCheckin }: DashboardProps) => {
  const { user } = useAuth();
  const { goals, loading, todaysMotivation, deleteGoal, resetStreak, updateGoal, checkIn } = useGoals();
  const { subscription } = useSubscription();
  const { checkinStatus, loading: checkinLoading } = useCircleCheckin();
  const [isNudging, setIsNudging] = useState(false);
  const [isCheckingLimits, setIsCheckingLimits] = useState(false);

  const handleNudgeMe = async () => {
    setIsNudging(true);
    try {
      // Just call the parent handler - Index.tsx will handle the MotivationAlert display
      const result = await onNudgeMe();
      // No need for toast here - Index.tsx handles the display
    } catch (error) {
      console.error('Nudge error:', error);
    } finally {
      setIsNudging(false);
    }
  };

  const handleCreateGoal = async () => {
    setIsCheckingLimits(true);
    try {
      // Let Index.tsx handle the limit checking and show MotivationAlert
      await onStartOver();
    } finally {
      setIsCheckingLimits(false);
    }
  };

  // Separate framework goals from regular goals
  const frameworkGoals = goals.filter(goal => 
    goal.title?.includes('6 Elements of Life™ Framework Complete')
  );
  const regularGoals = goals.filter(goal => 
    !goal.title?.includes('6 Elements of Life™ Framework Complete')
  );
  
  const totalStreak = Math.round(regularGoals.reduce((sum, goal) => sum + goal.streak_count, 0) / regularGoals.length) || 0;

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Dream Big...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onLogoClick={onLogoClick} />
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Custom Dashboard</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <span>•</span>
              <span>{regularGoals.length} {regularGoals.length === 1 ? 'Goal' : 'Goals'} Active</span>
              {subscription.subscribed && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Crown className="w-4 h-4 text-premium" />
                    <span className="text-premium font-medium">Personal Plan</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-success-light px-3 py-2 rounded-lg">
            <Flame className="w-5 h-5 text-success" />
            <span className="font-semibold text-success">{totalStreak} avg daily streak for your goals</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Goals Section - Left 3 columns */}
          <div className="lg:col-span-3">
            <div className="grid gap-6">
              {/* Framework Card */}
              {frameworkGoals.length > 0 && (
                <FrameworkCard 
                  framework={frameworkGoals[0]}
                  onViewFramework={onViewFramework || (() => {})}
                  onEditFramework={onEditFramework || (() => {})}
                  onCircleCheckin={onCircleCheckin}
                />
              )}

              {/* Regular Goals */}
              {regularGoals.length === 0 ? (
                <div className="bg-card border rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No Active Goals</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any active goals right now. Click the button below to create your first goal.
                  </p>
                  <Button onClick={handleCreateGoal} className="mt-2" disabled={isCheckingLimits}>
                    {isCheckingLimits ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create a Goal
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                regularGoals.map(goal => {
                  // Phase 4: Calculate status and permissions for each goal
                  const status = getGoalStatus(goal, user, subscription.subscribed);
                  const permissions = getGoalPermissions(goal, user, subscription.subscribed);
                  
                  return (
                    <GoalCard 
                      key={goal.id} 
                      goal={goal} 
                      motivation={todaysMotivation[goal.id] || null} 
                      onDelete={deleteGoal} 
                      onResetStreak={resetStreak} 
                      onUpdate={updateGoal} 
                      onCheckIn={checkIn} 
                      status={status}
                      permissions={permissions}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar - Right 1 column */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Create Goal Card */}
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">
                      {hasFramework ? "Add More Goals" : "Get Started"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {hasFramework ? (
                        subscription.subscribed ? (() => {
                          const tier = subscription.subscription_tier || 'Personal Plan';
                          const maxGoals = (() => {
                            if (tier === 'Pro Plan') return 5;
                            if (tier === 'Strategic Advisor Plan') return 5;
                            if (tier === 'Professional Coach') return 5; // Legacy tier
                            return 3; // Personal Plan
                          })();
                          const remaining = maxGoals - regularGoals.length;
                          return remaining > 0 ? `Create up to ${remaining} more goals` : `You're using all ${maxGoals} goals`;
                        })() : "First goal is free. Upgrade to create more."
                      ) : (
                        "Complete your 6 Elements of Life™ to start creating goals"
                      )}
                    </p>
                  </div>
                </div>
                <Button onClick={handleCreateGoal} className="w-full" variant="default" disabled={isCheckingLimits}>
                  {isCheckingLimits ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Checking limits...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {hasFramework ? "Create A Goal" : "Get Started"}
                      {!subscription.subscribed && <Crown className="w-4 h-4 ml-2" />}
                    </>
                  )}
                </Button>
              </div>


              {/* Circle Check-in Card */}
              {hasFramework && checkinStatus.needsCheckin && onCircleCheckin && (
                <div className="bg-card border rounded-lg p-6 border-l-4 border-l-blue-500">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Weekly Circle Check-in</h3>
                      <p className="text-sm text-muted-foreground">
                        {checkinStatus.weeksSinceLastCheckin === 0 
                          ? "How did you balance your 5 circles this week?" 
                          : `It's been ${checkinStatus.weeksSinceLastCheckin} week${checkinStatus.weeksSinceLastCheckin !== 1 ? 's' : ''} since your last check-in`
                        }
                      </p>
                      {checkinStatus.weeksSinceLastCheckin > 1 && (
                        <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                          Regular check-ins help maintain life balance
                        </div>
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={onCircleCheckin} 
                    className="w-full flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Complete Weekly Check-in
                  </Button>
                </div>
              )}

              {/* Circle Summary Card */}
              {regularGoals.some(goal => goal.circle_type) && (
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Your Circles</h3>
                      <p className="text-sm text-muted-foreground">Goals organized by life areas</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: 'Work', icon: Briefcase, color: 'text-green-600' },
                      { name: 'Sleep', icon: Moon, color: 'text-indigo-600' },
                      { name: 'Friends & Family', icon: Users, color: 'text-blue-600' },
                      { name: 'Health & Fitness', icon: Activity, color: 'text-red-600' },
                      { name: 'Personal Development', icon: BookOpen, color: 'text-orange-600' },
                      { name: 'Spiritual', icon: Heart, color: 'text-purple-600' }
                    ].map(circle => {
                      const circleGoals = regularGoals.filter(goal => goal.circle_type === circle.name);
                      const CircleIcon = circle.icon;
                      return circleGoals.length > 0 ? (
                        <div key={circle.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <CircleIcon className={`w-4 h-4 ${circle.color}`} />
                            <span>{circle.name}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {circleGoals.length}
                          </Badge>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Nudge Me Card */}
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Instant Motivation</h3>
                    <p className="text-sm text-muted-foreground">Get an immediate motivation boost</p>
                  </div>
                </div>
                <Button onClick={handleNudgeMe} disabled={isNudging} className="w-full" variant="default">
                  {isNudging ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Dream Big...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Nudge Me Now
                    </>
                  )}
                </Button>
              </div>

              {/* Upgrade Prompt for Free Users */}
              {!subscription.subscribed && <UpgradePrompt compact />}

              {/* Professional Coach Prompt for Personal Plan Users */}
              {subscription.subscribed && subscription.subscription_tier === "Personal Plan" && <ProfessionalCoachPrompt />}

              {/* Subscription Status */}
              <div className="bg-card border rounded-lg p-4">
                <h4 className="font-medium mb-3">Your Current Plan:</h4>
                <div className="text-sm space-y-2">
                  {subscription.subscribed ? (
                    (() => {
                      const tier = subscription.subscription_tier || 'Personal Plan';
                      const maxGoals = (() => {
                        if (tier === 'Professional Plan') return 10;
                        if (tier === 'Pro Plan') return 10; // Legacy name support
                        if (tier === 'Strategic Advisor Plan') return 10;
                        if (tier === 'Professional Coach') return 10; // Legacy tier
                        return 3; // Personal Plan
                      })();
                      const maxNudges = maxGoals === 10 ? 10 : 3;
                      
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-premium" />
                            <span className="font-medium">{tier} Member</span>
                          </div>
                          <div className="text-muted-foreground">• Up to {maxGoals} goals ({regularGoals.length}/{maxGoals} used)</div>
                          <div className="text-muted-foreground">• Up to {maxNudges} daily nudges</div>
                          <div className="text-muted-foreground">• Priority email delivery</div>
                          {(tier === 'Pro Plan' || tier === 'Strategic Advisor Plan') && (
                            <div className="text-muted-foreground">• Enhanced features & support</div>
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <>
                      <div className="text-muted-foreground">Free User</div>
                      <div className="text-muted-foreground">• 1 goal ({regularGoals.length}/1 used)</div>
                      <div className="text-muted-foreground">• 1 daily nudge</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};