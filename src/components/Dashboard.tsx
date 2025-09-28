import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Zap, Plus, Crown, Calendar, Flame } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGoals, getGoalStatus, getGoalPermissions } from "@/hooks/useGoals";
import { useSubscription } from "@/hooks/useSubscription";
import { GoalCard } from "./GoalCard";
import { Header } from "./Header";
import { UpgradePrompt } from "./UpgradePrompt";
import { ProfessionalCoachPrompt } from "./ProfessionalCoachPrompt";
import { format } from "date-fns";

interface DashboardProps {
  onNudgeMe: () => Promise<any>;
  onStartOver: () => void;
  onLogoClick: () => void;
}

export const Dashboard = ({ onNudgeMe, onStartOver, onLogoClick }: DashboardProps) => {
  const { user } = useAuth();
  const { goals, loading, todaysMotivation, deleteGoal, resetStreak, updateGoal, checkIn } = useGoals();
  const { subscription } = useSubscription();
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

  const totalStreak = Math.round(goals.reduce((sum, goal) => sum + goal.streak_count, 0) / goals.length) || 0;

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
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Personal Goal Dashboard</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <span>•</span>
              <span>{goals.length} {goals.length === 1 ? 'Goal' : 'Goals'} Active</span>
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
            <span className="font-semibold text-success">{totalStreak} day avg streak</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Goals Section - Left 3 columns */}
          <div className="lg:col-span-3">
            <div className="grid gap-6">
              {goals.length === 0 ? (
                <div className="bg-card border rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No Active Goals</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any active goals right now. Create your first goal to get started!
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
                        Create Your First Goal
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                goals.map(goal => {
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
                    <h3 className="font-semibold mb-1">Add More Goals</h3>
                    <p className="text-sm text-muted-foreground">
                      {subscription.subscribed ? `Create up to ${3 - goals.length} more goals` : "First goal is free. Upgrade to create more."}
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
                      Create A Goal
                      {!subscription.subscribed && <Crown className="w-4 h-4 ml-2" />}
                    </>
                  )}
                </Button>
              </div>

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
                <h4 className="font-medium mb-3">Your Plan:</h4>
                <div className="text-sm space-y-2">
                  {subscription.subscribed ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-premium" />
                        <span className="font-medium">Personal Plan Member</span>
                      </div>
                      <div className="text-muted-foreground">• Up to 3 goals ({goals.length}/3 used)</div>
                      <div className="text-muted-foreground">• Up to 3 daily nudges</div>
                      <div className="text-muted-foreground">• Priority email delivery</div>
                    </>
                  ) : (
                    <>
                      <div className="text-muted-foreground">Free User</div>
                      <div className="text-muted-foreground">• 1 goal ({goals.length}/1 used)</div>
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