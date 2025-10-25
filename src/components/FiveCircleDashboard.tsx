import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Users, Briefcase, BookOpen, Activity, Plus, Target, TrendingUp, Calendar, Clock } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";
import { useAuth } from "@/hooks/useAuth";
import { useNudgeLimit } from "@/hooks/useNudgeLimit";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { GoalCard } from "./GoalCard";
import { SimpleGoalForm } from "./SimpleGoalForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const circleIcons = {
  'Spiritual': Heart,
  'Friends & Family': Users, 
  'Work': Briefcase,
  'Personal Development': BookOpen,
  'Health & Fitness': Activity
};

const circleColors = {
  'Spiritual': 'bg-purple-50 border-purple-200',
  'Friends & Family': 'bg-blue-50 border-blue-200',
  'Work': 'bg-green-50 border-green-200', 
  'Personal Development': 'bg-orange-50 border-orange-200',
  'Health & Fitness': 'bg-red-50 border-red-200'
};

const circleBadgeColors = {
  'Spiritual': 'bg-purple-100 text-purple-800 border-purple-200',
  'Friends & Family': 'bg-blue-100 text-blue-800 border-blue-200',
  'Work': 'bg-green-100 text-green-800 border-green-200', 
  'Personal Development': 'bg-orange-100 text-orange-800 border-orange-200',
  'Health & Fitness': 'bg-red-100 text-red-800 border-red-200'
};

interface CircleStats {
  name: string;
  hoursAllocated: number;
  goalsCount: number;
  activeStreaks: number;
  totalCheckIns: number;
}

interface FiveCircleDashboardProps {
  onNudgeMe?: () => Promise<any>;
  onStartOver?: () => void;
  onLogoClick?: () => void;
}

export const FiveCircleDashboard = ({ onNudgeMe, onStartOver, onLogoClick }: FiveCircleDashboardProps = {}) => {
  const { user } = useAuth();
  const { goals, loading, nudgeGoal } = useGoals();
  const { nudgeStatus, useNudge } = useNudgeLimit();
  const { subscription } = useSubscription();
  const [circleStats, setCircleStats] = useState<CircleStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showGoalCreator, setShowGoalCreator] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<string>('');

  useEffect(() => {
    if (user?.email) {
      fetchCircleStats();
    }
  }, [user, goals]);

  const fetchCircleStats = async () => {
    if (!user?.email) return;
    
    try {
      setLoadingStats(true);
      // First get the user's Firebase UID from their profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (profileError || !profile) {
        console.error('Error getting user profile:', profileError);
        throw new Error('User profile not found');
      }
      
      const { data, error } = await supabase
        .from('circle_frameworks')
        .select(`
          *,
          circle_profiles (*)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data?.circle_profiles) {
        const stats = data.circle_profiles.map((profile: any) => {
          const circleGoals = goals.filter(goal => goal.circle_type === profile.circle_name);
          return {
            name: profile.circle_name,
            hoursAllocated: profile.weekly_hours_allocated,
            goalsCount: circleGoals.length,
            activeStreaks: circleGoals.filter(goal => goal.current_streak > 0).length,
            totalCheckIns: circleGoals.reduce((sum, goal) => sum + (goal.total_checkins || 0), 0)
          };
        });
        setCircleStats(stats);
      }
    } catch (error) {
      console.error('Error fetching circle stats:', error);
      // Fallback to basic circle stats
      setCircleStats([
        { name: 'Spiritual', hoursAllocated: 3, goalsCount: 0, activeStreaks: 0, totalCheckIns: 0 },
        { name: 'Friends & Family', hoursAllocated: 8, goalsCount: 0, activeStreaks: 0, totalCheckIns: 0 },
        { name: 'Work', hoursAllocated: 40, goalsCount: 0, activeStreaks: 0, totalCheckIns: 0 },
        { name: 'Personal Development', hoursAllocated: 5, goalsCount: 0, activeStreaks: 0, totalCheckIns: 0 },
        { name: 'Health & Fitness', hoursAllocated: 6, goalsCount: 0, activeStreaks: 0, totalCheckIns: 0 }
      ]);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleAddGoal = (circleName: string) => {
    setSelectedCircle(circleName);
    setShowGoalCreator(true);
  };

  const handleGoalCreated = () => {
    setShowGoalCreator(false);
    setSelectedCircle('');
    // Goals will be refreshed automatically by useGoals
  };

  const getCircleGoals = (circleName: string) => {
    return goals.filter(goal => goal.circle_type === circleName);
  };

  const getOverallProgress = () => {
    if (goals.length === 0) return 0;
    const activeGoals = goals.filter(goal => goal.current_streak > 0).length;
    return (activeGoals / goals.length) * 100;
  };

  const getTotalWeeklyHours = () => {
    return circleStats.reduce((sum, circle) => sum + circle.hoursAllocated, 0);
  };

  const getMaxGoals = () => {
    if (!subscription.subscribed) return 1; // Free users
    if (subscription.subscription_tier === 'Personal Plan') return 3;
    if (subscription.subscription_tier === 'Pro Plan') return 5;
    if (subscription.subscription_tier === 'Strategic Advisor Plan') return 5;
    return 1; // Default fallback
  };

  const canCreateMoreGoals = () => {
    const maxGoals = getMaxGoals();
    return goals.length < maxGoals;
  };

  const getRemainingGoals = () => {
    const maxGoals = getMaxGoals();
    return Math.max(0, maxGoals - goals.length);
  };

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your 5 Circle Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">5 Circle Framework™ Dashboard</h1>
              <p className="text-muted-foreground">Managing life complexity through systematic circle integration</p>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {subscription.subscribed ? subscription.subscription_tier : 'Free Trial'} - 
                  {getRemainingGoals()} of {getMaxGoals()} goals remaining
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{getTotalWeeklyHours()}h</div>
              <div className="text-sm text-muted-foreground">Total Weekly Hours</div>
            </div>
          </div>

          {/* Overall Progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Overall Circle Progress</h3>
                <span className="text-sm text-muted-foreground">{Math.round(getOverallProgress())}%</span>
              </div>
              <Progress value={getOverallProgress()} className="mb-4" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{goals.length}</div>
                  <div className="text-sm text-muted-foreground">Total Goals</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{goals.filter(g => g.current_streak > 0).length}</div>
                  <div className="text-sm text-muted-foreground">Active Streaks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{goals.reduce((sum, g) => sum + (g.total_checkins || 0), 0)}</div>
                  <div className="text-sm text-muted-foreground">Total Check-ins</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Circle Grid */}
        <div className="grid gap-6">
          {circleStats.map((circle) => {
            const CircleIcon = circleIcons[circle.name as keyof typeof circleIcons];
            const circleGoals = getCircleGoals(circle.name);
            const circleProgress = circleGoals.length > 0 
              ? (circleGoals.filter(g => g.current_streak > 0).length / circleGoals.length) * 100 
              : 0;

            return (
              <Card key={circle.name} className={`${circleColors[circle.name as keyof typeof circleColors]}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <CircleIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{circle.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{circle.hoursAllocated} hours/week allocated</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={circleBadgeColors[circle.name as keyof typeof circleBadgeColors]}>
                        {circle.goalsCount} goal{circle.goalsCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Circle Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Circle Progress</span>
                      <span className="text-sm text-muted-foreground">{Math.round(circleProgress)}%</span>
                    </div>
                    <Progress value={circleProgress} className="mb-2" />
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="font-semibold">{circle.activeStreaks}</div>
                        <div className="text-muted-foreground">Active</div>
                      </div>
                      <div>
                        <div className="font-semibold">{circle.totalCheckIns}</div>
                        <div className="text-muted-foreground">Check-ins</div>
                      </div>
                      <div>
                        <div className="font-semibold">{circle.hoursAllocated}h</div>
                        <div className="text-muted-foreground">Allocated</div>
                      </div>
                    </div>
                  </div>

                  {/* Goals in this Circle */}
                  {circleGoals.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {circleGoals.map((goal) => (
                        <div key={goal.id} className="bg-white rounded-lg p-3 border">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{goal.title}</h4>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  {goal.current_streak} day streak
                                </span>
                                {goal.target_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(goal.target_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {goal.current_streak > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  🔥 {goal.current_streak}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No goals in this circle yet</p>
                    </div>
                  )}

                  {/* Add Goal Button or Upgrade Prompt */}
                  {canCreateMoreGoals() ? (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => handleAddGoal(circle.name)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Goal to {circle.name}
                    </Button>
                  ) : (
                    <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        Goal limit reached ({getMaxGoals()} max)
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                        onClick={() => window.location.href = '/upgrade'}
                      >
                        Upgrade for More Goals
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={onNudgeMe}
                disabled={nudgeStatus.atLimit}
              >
                <TrendingUp className="w-4 h-4" />
                {nudgeStatus.atLimit ? 'Daily Limit Reached' : 'Get Universal Nudge'}
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={onLogoClick}
              >
                <Calendar className="w-4 h-4" />
                Back to Landing
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={onStartOver}
              >
                <Plus className="w-4 h-4" />
                Add New Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goal Creator Dialog */}
      <Dialog open={showGoalCreator} onOpenChange={setShowGoalCreator}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <SimpleGoalForm 
            defaultCircle={selectedCircle}
            onComplete={handleGoalCreated}
            onCancel={() => setShowGoalCreator(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};