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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [workHappiness, setWorkHappiness] = useState<any>(null);
  const [showWorkDetail, setShowWorkDetail] = useState(false);
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
      
      // Use edge function instead of direct database query (same pattern as goals)
      const { data, error } = await supabase.functions.invoke('fetch-six-elements-framework', {
        body: { userEmail: user.email }
      });

      if (error) throw error;

      if (data?.success && data?.hasFramework && data?.data?.elementsData) {
        // Convert elements data to stats format
        const stats = Object.entries(data.data.elementsData).map(([elementName, element]: [string, any]) => {
          const circleGoals = goals.filter(goal => goal.circle_type === elementName);
          return {
            name: elementName,
            hoursAllocated: element.ideal_hours_per_week,
            goalsCount: circleGoals.length,
            activeStreaks: circleGoals.filter(goal => (goal as any).current_streak > 0).length,
            totalCheckIns: circleGoals.reduce((sum, goal) => sum + ((goal as any).total_checkins || 0), 0)
          };
        });
        setCircleStats(stats);
        
        // Capture work happiness data
        if (data.data.workHappinessData) {
          setWorkHappiness(data.data.workHappinessData);
        }
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
    const activeGoals = goals.filter(goal => (goal as any).current_streak > 0).length;
    return (activeGoals / goals.length) * 100;
  };

  const getTotalWeeklyHours = () => {
    return circleStats.reduce((sum, circle) => sum + circle.hoursAllocated, 0);
  };

  const getWorkHappinessScore = () => {
    if (!workHappiness) return null;
    const { impact_current, fun_current, money_current, remote_current } = workHappiness;
    return ((impact_current + fun_current + money_current + remote_current) / 4).toFixed(1);
  };

  const getWorkHappinessInsights = () => {
    if (!workHappiness) return [];
    const { 
      impact_current, impact_desired,
      fun_current, fun_desired,
      money_current, money_desired,
      remote_current, remote_desired 
    } = workHappiness;
    
    const metrics = [
      { name: 'Impact', current: impact_current, desired: impact_desired, label: 'Meaningful work' },
      { name: 'Enjoyment', current: fun_current, desired: fun_desired, label: 'Work satisfaction' },
      { name: 'Income', current: money_current, desired: money_desired, label: 'Compensation' },
      { name: 'Remote', current: remote_current, desired: remote_desired, label: 'Location flexibility' }
    ];
    
    return metrics.map(metric => ({
      ...metric,
      gap: metric.desired - metric.current,
      percentage: (metric.current / 10) * 100,
      status: metric.current >= metric.desired ? 'optimal' : 
              metric.current >= metric.desired - 2 ? 'approaching' : 'needs-attention'
    }));
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
                  <div className="text-2xl font-bold">{goals.filter(g => (g as any).current_streak > 0).length}</div>
                  <div className="text-sm text-muted-foreground">Active Streaks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{goals.reduce((sum, g) => sum + ((g as any).total_checkins || 0), 0)}</div>
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
              ? (circleGoals.filter(g => (g as any).current_streak > 0).length / circleGoals.length) * 100 
              : 0;

            return (
              <Card 
                key={circle.name} 
                className={`${circleColors[circle.name as keyof typeof circleColors]} ${
                  circle.name === 'Work' ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
                }`}
                onClick={circle.name === 'Work' ? () => setShowWorkDetail(true) : undefined}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <CircleIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          {circle.name}
                          {circle.name === 'Work' && workHappiness && (
                            <Badge variant="secondary" className="text-xs">
                              Happiness: {getWorkHappinessScore()}/10
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {circle.hoursAllocated} hours/week allocated
                          {circle.name === 'Work' && workHappiness && (
                            <span className="ml-2 text-blue-600">• Click for business metrics</span>
                          )}
                        </p>
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
                                  {(goal as any).current_streak} day streak
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
                              {(goal as any).current_streak > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  🔥 {(goal as any).current_streak}
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

      {/* Work Performance Dashboard Modal */}
      <Dialog open={showWorkDetail} onOpenChange={setShowWorkDetail}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-green-600" />
              </div>
              Work Performance Dashboard
            </DialogTitle>
          </DialogHeader>
          
          {workHappiness && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
              {/* Left Column - Time Allocation & Goals */}
              <div className="space-y-6">
                <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-800">Time Allocation & Goals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Weekly Hours Allocated</span>
                        <span className="text-2xl font-bold text-green-600">
                          {circleStats.find(c => c.name === 'Work')?.hoursAllocated || 40}h
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Active Goals</span>
                        <span className="text-xl font-semibold">
                          {circleStats.find(c => c.name === 'Work')?.goalsCount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Active Streaks</span>
                        <span className="text-xl font-semibold">
                          🔥 {circleStats.find(c => c.name === 'Work')?.activeStreaks || 0}
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="text-sm text-muted-foreground mb-2">Recent Activity</div>
                        <div className="text-sm">
                          Last check-in: {goals.filter(g => g.circle_type === 'Work').length > 0 ? '1 day ago' : 'No goals yet'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Work Goals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Work Goals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getCircleGoals('Work').length > 0 ? (
                        getCircleGoals('Work').map((goal) => (
                          <div key={goal.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="font-medium">{goal.title}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <Target className="w-3 h-3" />
                              {(goal as any).current_streak} day streak
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          No work goals yet. Create one to start tracking!
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Business Happiness Metrics */}
              <div className="space-y-6">
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                      Business Happiness Assessment
                      <Badge variant="secondary" className="text-sm">
                        Score: {getWorkHappinessScore()}/10
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {getWorkHappinessInsights().map((metric) => (
                        <div key={metric.name} className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {metric.name}
                                {metric.status === 'optimal' && (
                                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                    Optimal
                                  </Badge>
                                )}
                                {metric.status === 'needs-attention' && (
                                  <Badge variant="destructive" className="text-xs">
                                    Needs Attention
                                  </Badge>
                                )}
                                {metric.status === 'approaching' && (
                                  <Badge variant="secondary" className="text-xs">
                                    Approaching Target
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{metric.label}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">{metric.current}/10</div>
                              <div className="text-xs text-muted-foreground">Target: {metric.desired}</div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                metric.status === 'optimal' ? 'bg-green-500' :
                                metric.status === 'approaching' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${metric.percentage}%` }}
                            />
                          </div>
                          {metric.gap > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {metric.gap} point{metric.gap !== 1 ? 's' : ''} to reach target
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Professional Insights */}
                <Card className="border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-purple-800">Professional Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getWorkHappinessInsights().filter(m => m.status === 'needs-attention').length > 0 ? (
                        <>
                          <div className="text-sm font-medium text-red-700">Areas for Improvement:</div>
                          {getWorkHappinessInsights()
                            .filter(m => m.status === 'needs-attention')
                            .map(metric => (
                              <div key={metric.name} className="text-sm text-red-600">
                                • <strong>{metric.name}</strong>: {metric.gap} points below target
                              </div>
                            ))}
                        </>
                      ) : (
                        <div className="text-sm text-green-700">
                          🎉 <strong>Excellent work satisfaction!</strong> All metrics are at or near your targets.
                        </div>
                      )}
                      <div className="pt-3 border-t text-xs text-muted-foreground">
                        Based on Dan Lynn's 10-year business happiness formula
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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