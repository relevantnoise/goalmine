import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Zap, Settings, Flame, LogOut, Calendar, Plus, Crown, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useGoals, Goal, MotivationContent } from "@/hooks/useGoals";
import { GoalCard } from "@/components/GoalCard";
import { format } from "date-fns";
import { Header } from "@/components/Header";
import { UpgradePrompt } from "@/components/UpgradePrompt";
interface DashboardProps {
  onNudgeMe: () => Promise<MotivationContent | null>;
  onStartOver: () => void;
  onLogoClick?: () => void;
}
export const Dashboard = ({
  onNudgeMe,
  onStartOver,
  onLogoClick
}: DashboardProps) => {
  const [isNudging, setIsNudging] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    signOut,
    user,
    isLoading: authLoading
  } = useAuth();
  const {
    subscription,
    checkSubscription
  } = useSubscription();

  // Debug: Log subscription status
  console.log('🎯 Dashboard subscription state:', subscription);
  const { trialStatus } = useTrialStatus();
  const {
    goals,
    loading,
    todaysMotivation,
    deleteGoal,
    resetStreak,
    updateGoal,
    checkIn,
    debugGoals,
    cleanDatabase,
    updateSubscription,
    generateGoalMotivation
  } = useGoals();
  const handleNudgeMe = async () => {
    try {
      setIsNudging(true);
      setEmailSent(false);
      const result = await onNudgeMe();
      if (result) {
        setEmailSent(true);
        // Show motivation content directly in toast (like in Index.tsx)
        toast({
          title: "🚀 Motivation Boost!",
          description: <div className="space-y-2">
              <p className="font-medium">{result.message}</p>
              {result.microPlan && result.microPlan.length > 0 && <div>
                  <p className="text-sm font-medium">Quick actions:</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    {result.microPlan.map((step: string, index: number) => <li key={index}>{step}</li>)}
                  </ul>
                </div>}
              {result.challenge && <div>
                  <p className="text-sm font-medium">Today's challenge:</p>
                  <p className="text-sm italic">{result.challenge}</p>
                </div>}
            </div>,
          duration: 20000 // Show longer since there's more content
        });
      }
    } catch (error) {
      toast({
        title: "Oops!",
        description: "Couldn't generate new motivation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsNudging(false);
    }
  };
  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };
  const handleResetStreak = async (goalId: string) => {
    try {
      console.log('🎯 Dashboard: Reset streak called for goal:', goalId);
      await resetStreak(goalId);
      console.log('🎯 Dashboard: Reset streak completed successfully');
      toast({
        title: "Streak reset",
        description: "Your streak has been reset to 0. Time for a fresh start!"
      });
    } catch (error) {
      console.error('🎯 Dashboard: Reset streak failed:', error);
      toast({
        title: "Error",
        description: `Couldn't reset streak: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };
  const handleUpdateGoal = async (goalId: string, updates: any) => {
    try {
      await updateGoal(goalId, updates);
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };
  const handleCreateAnotherGoal = () => {
    const maxGoals = subscription.subscribed ? 3 : 1;
    if (goals.length >= maxGoals) {
      if (!subscription.subscribed) {
        // Free user at limit - show upgrade message
        toast({
          title: "Upgrade to Premium",
          description: "Free users can only have 1 goal. Upgrade to create up to 3 goals!",
          variant: "default",
          duration: 20000
        });
        navigate('/upgrade');
      } else {
        // Paid user at limit
        toast({
          title: "🎯 Maximum Goals Reached",
          description: "You've reached your Personal Plan limit of 3 goals. To create a new goal, delete one of your existing goals first.",
          variant: "destructive",
          duration: 8000
        });
      }
      return;
    }

    // User has available slots - create new goal
    onStartOver();
  };

  // Calculate total streak (average of all goals) - updated
  const totalStreak = Math.round(goals.reduce((sum, goal) => sum + goal.streak_count, 0) / goals.length) || 0;

  // Debug: log the current state
  console.log('🎯 Dashboard render - goals state:', {
    goalsCount: goals.length,
    loading,
    authLoading,
    user: !!user,
    todaysMotivationCount: Object.keys(todaysMotivation).length
  });

  // Coordinate auth and goals loading to prevent jumpy UI
  const shouldShowLoading = authLoading || loading || !user;

  // Show stable loading state while auth or goals are being processed
  if (shouldShowLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Dream Big...</p>
      </div>
    </div>;
  }

  // Removed the "Dream Big" fallback page - users should always see the dashboard layout
  return <div className="min-h-screen bg-background">
      <Header onLogoClick={onLogoClick} />
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Personal Goal Dashboard</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <span>•</span>
              <span>
                {goals.length} {goals.length === 1 ? 'Goal' : 'Goals'} Active
              </span>
              <>
                <span>•</span>
                {subscription.subscribed ? (
                  <div className="flex items-center gap-1">
                    <Crown className="w-4 h-4 text-premium" />
                    <span className="text-premium font-medium">
                      Personal Plan (3 goals, 3 nudges/day)
                    </span>
                  </div>
                ) : trialStatus.daysRemaining > 0 ? (
                  <div className="flex items-center gap-1">
                    {trialStatus.daysRemaining <= 7 ? (
                      <span className="text-orange-600 font-medium">
                        ⏰ Trial: {trialStatus.daysRemaining} day{trialStatus.daysRemaining !== 1 ? 's' : ''} left
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        🔥 Trial: {trialStatus.daysRemaining} days remaining
                      </span>
                    )}
                  </div>
                ) : null}
              </>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-success-light px-3 py-2 rounded-lg">
            <Flame className="w-5 h-5 text-success" />
            <span className="font-semibold text-success">{totalStreak} day avg streak</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Goals Section */}
          <div className="lg:col-span-3">
            {/* Goals Grid */}
            <div className="grid gap-6 mb-8">
              {goals.length === 0 ? (
                <div className="bg-card border rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No Active Goals</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any active goals right now. Free users can have 1 goal, Premium users can have up to 3.
                  </p>
                  <Button onClick={handleCreateAnotherGoal} className="mt-2">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Goal
                  </Button>
                </div>
              ) : (
                goals.map(goal => <GoalCard key={goal.id} goal={goal} motivation={todaysMotivation[goal.id] || null} onDelete={handleDeleteGoal} onResetStreak={handleResetStreak} onUpdate={handleUpdateGoal} onCheckIn={checkIn} /* onGenerateMotivation={generateGoalMotivation} TEST: Commented out for production */ />)
              )}
            </div>

            {/* Action Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              {/* Create Goal Card */}
              <div className="bg-card border rounded-lg p-6 flex flex-col h-full">
                <div className="flex items-start gap-3 mb-4 flex-1">
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
                <Button onClick={handleCreateAnotherGoal} className="w-full mt-auto" variant={!subscription.subscribed ? "default" : "outline"}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create A Goal
                  {!subscription.subscribed && <Crown className="w-4 h-4 ml-2" />}
                </Button>
              </div>

              {/* Nudge Me Card */}
              <div className="bg-card border rounded-lg p-6 flex flex-col h-full">
                <div className="flex items-start gap-3 mb-4 flex-1">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Instant Motivation</h3>
                    <p className="text-sm text-muted-foreground">Get an immediate motivation boost</p>
                  </div>
                </div>
                <Button onClick={handleNudgeMe} disabled={isNudging} className="w-full mt-auto" variant="default">
                  {isNudging ? <>
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Dream Big...
                    </> : <>
                      <Zap className="w-4 h-4 mr-2" />
                      Nudge Me Now
                    </>}
                </Button>
              </div>

              {/* TEST: Commented out for production
              {/* Debug Card - Development only */}
              {/* <div className="bg-card border rounded-lg p-6 flex flex-col h-full">
                <div className="flex items-start gap-3 mb-4 flex-1">
                  <div className="w-10 h-10 bg-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Settings className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Debug Database</h3>
                    <p className="text-sm text-muted-foreground">Investigate goal fetching issues</p>
                  </div>
                </div>
                <Button onClick={debugGoals} className="w-full mt-auto" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Debug Goals
                </Button>
              </div> */}

              {/* TEST: Commented out for production
              {/* Update Subscription Card - Development only */}
              {/* <div className="bg-card border rounded-lg p-6 flex flex-col h-full">
                <div className="flex items-start gap-3 mb-4 flex-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Crown className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Update Subscription</h3>
                    <p className="text-sm text-muted-foreground">Make user a paid subscriber</p>
                  </div>
                </div>
                <Button onClick={async () => {
                  await updateSubscription('Personal Plan', 'active');
                  // Force refresh subscription status after update
                  await checkSubscription();
                }} className="w-full mt-auto" variant="outline">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Personal Plan
                </Button>
              </div> */}
            </div>

            {/* Motivation Generated Confirmation */}
            {emailSent && <div className="mt-4 flex items-center justify-center gap-2 text-success bg-success-light/20 py-3 px-4 rounded-lg">
                <span className="text-sm font-medium">Fresh motivation generated! Check the popup for instant inspiration.</span>
              </div>}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Upgrade Prompt for Free Users */}
              {!subscription.subscribed && <UpgradePrompt compact />}

              {/* Subscription Status */}
              <div className="bg-card border rounded-lg p-4">
                <h4 className="font-medium mb-3">Your Plan:</h4>
                <div className="text-sm space-y-2">
                  {subscription.subscribed ? <>
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-premium" />
                        <span className="font-medium">Premium Member</span>
                      </div>
                      <div className="text-muted-foreground">
                        • Up to 3 goals ({goals.length}/3 used)
                      </div>
                      <div className="text-muted-foreground">
                        • Up to 3 daily nudges
                      </div>
                      <div className="text-muted-foreground">
                        • Priority email delivery
                      </div>
                    </> : <>
                      <div className="text-muted-foreground">Free User</div>
                      <div className="text-muted-foreground">
                        • 1 goal ({goals.length}/1 used)
                      </div>
                      <div className="text-muted-foreground">
                        • 1 daily nudge
                      </div>
                      <div className="pt-2">
                        <Button onClick={() => navigate('/upgrade')} size="sm" className="w-full text-base">
                          Upgrade for More
                        </Button>
                      </div>
                    </>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};