import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Target, Zap, Flame } from "lucide-react";
import { Goal, MotivationContent } from "@/hooks/useGoals";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { useGoals } from "@/hooks/useGoals";
export default function GoalDetail() {
  const {
    goalId
  } = useParams<{
    goalId: string;
  }>();
  
  console.log('🎯 GoalDetail component mounted!', { goalId });
  console.log('🔗 Current URL:', window.location.href);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { checkIn, goals, loading: goalsLoading, todaysMotivation, generateGoalMotivation, fetchGoals } = useGoals();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [motivation, setMotivation] = useState<MotivationContent | null>(null);
  const [loadingMotivation, setLoadingMotivation] = useState(false);
  const formatToneName = (tone: string) => {
    switch (tone) {
      case 'drill_sergeant':
        return 'Drill Sergeant';
      case 'kind_encouraging':
        return 'Kind & Encouraging';
      case 'teammate':
        return 'Teammate';
      case 'wise_mentor':
        return 'Wise Mentor';
      default:
        return tone;
    }
  };
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    // Parse time string (HH:MM:SS format) and format to 12-hour format
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  const getEncouragementMessage = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('paint')) return "Keep painting! You're making great progress towards your goal.";
    if (lowerTitle.includes('write') || lowerTitle.includes('book')) return "Keep writing! Every word gets you closer to your goal.";
    if (lowerTitle.includes('run') || lowerTitle.includes('marathon')) return "Keep training! You're building the strength to achieve your goal.";
    if (lowerTitle.includes('learn') || lowerTitle.includes('study')) return "Keep learning! Knowledge is building towards your success.";
    if (lowerTitle.includes('save') || lowerTitle.includes('money')) return "Keep saving! You're building financial progress towards your goal.";
    if (lowerTitle.includes('build') || lowerTitle.includes('create')) return "Keep building! You're creating something amazing.";
    return "Keep going! You're making great progress towards your goal.";
  };

  // Check if user has already checked in today - MUST match backend logic exactly
  const hasCheckedInToday = useMemo(() => {
    if (!goal?.last_checkin_date) return false;
    
    // Calculate current "streak day" in Eastern Time (3 AM reset) - SAME as backend
    const now = new Date();
    
    // Get current time in Eastern Time using proper timezone (handles EST/EDT automatically)
    const easternTimeStr = now.toLocaleString("en-US", { timeZone: "America/New_York" });
    const easternTime = new Date(easternTimeStr);
    
    // Subtract 3 hours so day changes at 3 AM Eastern - SAME as backend
    const streakDay = new Date(easternTime.getTime() - (3 * 60 * 60 * 1000));
    const currentStreakDate = streakDay.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Calculate last check-in streak date - SAME as backend
    const lastCheckin = new Date(goal.last_checkin_date);
    const lastCheckinEasternStr = lastCheckin.toLocaleString("en-US", { timeZone: "America/New_York" });
    const lastCheckinEastern = new Date(lastCheckinEasternStr);
    const lastStreakDay = new Date(lastCheckinEastern.getTime() - (3 * 60 * 60 * 1000));
    const lastCheckinStreakDate = lastStreakDay.toISOString().split('T')[0];
    
    return currentStreakDate === lastCheckinStreakDate;
  }, [goal?.last_checkin_date]);
  // Load motivation from existing data only - never generate in real-time
  const loadMotivation = async (goalData: Goal) => {
    try {
      // First check if we already have motivation loaded in state
      if (todaysMotivation[goalData.id]) {
        console.log('✅ Using existing motivation from useGoals hook for', goalData.title);
        setMotivation(todaysMotivation[goalData.id]);
        return;
      }

      // Use edge function to get motivation (bypasses RLS, production-ready)
      console.log('🔍 Fetching motivation via edge function for', goalData.title);
      console.log('🔍 Goal ID:', goalData.id);
      console.log('🔍 User ID:', user.email || user.id);
      
      try {
        const { data, error } = await supabase.functions.invoke('get-daily-motivation', {
          body: { 
            goalId: goalData.id,
            userId: user.email || user.id
          }
        });

        if (error) {
          console.error('❌ Error fetching motivation via edge function:', error);
          setMotivation(null);
          return;
        }

        console.log('🔍 Edge function response:', data);

        if (data && data.success && data.motivation) {
          console.log('✅ Found existing motivation for', goalData.title);
          const motivationContent: MotivationContent = {
            message: data.motivation.message,
            microPlan: Array.isArray(data.motivation.micro_plan) 
              ? data.motivation.micro_plan 
              : typeof data.motivation.micro_plan === 'string' 
                ? [data.motivation.micro_plan]
                : [],
            challenge: data.motivation.challenge || '',
            tone: data.motivation.tone || goalData.tone
          };
          setMotivation(motivationContent);
        } else {
          console.log('⚠️ No motivation content found for today - generating it now');
          // Auto-generate content for goals that don't have any
          try {
            console.log('🤖 Auto-generating missing motivation content');
            // Refresh goals first to get current streak count
            await fetchGoals();
            const newMotivation = await generateGoalMotivation(goalData.id);
            if (newMotivation) {
              setMotivation(newMotivation);
            } else {
              setMotivation(null);
            }
          } catch (error) {
            console.error('❌ Auto-generation failed:', error);
            setMotivation(null);
          }
        }
      } catch (error) {
        console.error('❌ Edge function error:', error);
        setMotivation(null);
      }
    } catch (error) {
      console.error('❌ Error loading motivation:', error);
      setMotivation(null);
    } finally {
      setLoadingMotivation(false);
    }
  };

  useEffect(() => {
    if (!goalId || !goals.length || !user) return;
    
    console.log('🔍 Looking for goal in loaded goals:', goalId);
    const goalData = goals.find((g: Goal) => g.id === goalId);
    
    if (goalData) {
      console.log('✅ Goal found:', goalData.title);
      setGoal(goalData as Goal);
      setLoading(false);
      
      // Check if motivation is already loaded in todaysMotivation from useGoals
      if (todaysMotivation[goalData.id]) {
        console.log('✅ Using pre-loaded motivation from useGoals hook for', goalData.title);
        setMotivation(todaysMotivation[goalData.id]);
        setLoadingMotivation(false);
      } else {
        console.log('⚠️ No pre-loaded motivation found, will load separately for', goalData.title);
        // Only call loadMotivation if we don't already have the content
        setLoadingMotivation(true);
        loadMotivation(goalData);
      }
    }
  }, [goalId, goals, user]);

  // Update motivation when todaysMotivation changes (handles async loading from useGoals)
  useEffect(() => {
    if (goal && todaysMotivation[goal.id] && !motivation) {
      console.log('🔄 Updating motivation from todaysMotivation for', goal.title);
      setMotivation(todaysMotivation[goal.id]);
      setLoadingMotivation(false);
    }
  }, [todaysMotivation, goal, motivation]);

  if (loading || authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your goal...</p>
        </div>
      </div>;
  }
  if (!goal) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Goal Not Found</h1>
          <p className="text-muted-foreground mb-4">This goal doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <Header onLogoClick={() => navigate('/?force-dashboard=true')} />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/?force-dashboard=true')} className="mb-4 -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center mb-6">
            <h1 className="font-bold mb-4 text-4xl text-blue-500">Today's Motivational Plan For:</h1>
          </div>
          
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-3">
              <Target className="w-8 h-8 text-primary" />
              {goal.title}
            </h1>
            {goal.description && <p className="text-lg text-muted-foreground mb-4">{goal.description}</p>}
            
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              {goal.target_date && <span className="flex items-center gap-1">
                  🎯 Target: {formatDate(goal.target_date)}
                </span>}
              {goal.time_of_day && <span className="flex items-center gap-1">
                  📧 Email: {formatTime(goal.time_of_day)}
                </span>}
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-success" />
                <span className="font-medium">{goal.streak_count} day streak</span>
              </div>
              <Badge variant="secondary">
                {formatToneName(goal.tone)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Motivation Content - Email Format */}
        {goal && motivation ? <div className="space-y-6">
            {/* Today's Progress Header */}
            <Card className="bg-muted/50">
              <CardHeader>
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Day {goal.streak_count} Progress</h2>
                  <p className="text-lg text-muted-foreground">
                    <span className="font-semibold">Goal:</span> {goal.title}
                  </p>
                </div>
              </CardHeader>
            </Card>

            {/* Today's Motivation */}
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary text-lg">
                  ✨ Today's Motivation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {motivation.message.split('\n').map((paragraph, i) => <p key={i} className="text-foreground leading-relaxed mb-3 last:mb-0">
                      {paragraph}
                    </p>)}
                </div>
              </CardContent>
            </Card>

            {/* Today's Micro-Plan */}
            {(() => {
              const microPlan = motivation.microPlan;
              const microPlanArray = Array.isArray(microPlan) ? microPlan : (typeof microPlan === 'string' ? microPlan.split('\n').filter(step => step.trim()) : []);
              
              return microPlanArray && microPlanArray.length > 0 ? (
                <Card className="bg-success/5 border-success/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-success">
                      🎯 Today's Micro-Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {microPlanArray.map((step, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-success text-success-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                            {index + 1}
                          </div>
                          <p className="text-foreground">{step.replace(/^•\s*/, '').trim()}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                    🎯 Today's Micro-Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No micro-plan available yet.</p>
                </CardContent>
              </Card>
              );
            })()}

            {/* Today's Challenge */}
            {motivation.challenge && <Card className="bg-warning/5 border-warning/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-500">
                    💪 Today's Challenge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground mb-2">{motivation.challenge}</p>
                  <p className="text-sm text-muted-foreground">
                    ⏱️ Takes 2 minutes or less
                  </p>
                </CardContent>
              </Card>}

            {/* Streak Status and Check-in */}
            <Card className="bg-warning/10 border-warning/30 border-2">
              <CardContent className="text-center py-8">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  🔥 Your {goal.streak_count || 0}-Day Streak is {hasCheckedInToday ? 'Active!' : 'Waiting!'}
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  {hasCheckedInToday 
                    ? "Great job! You've already checked in today. Keep the momentum going!"
                    : "Don't break your momentum! Check in today to keep your streak alive and growing."
                  }
                </p>
                {!hasCheckedInToday ? (
                  <Button 
                    onClick={async () => {
                      await checkIn(goal.id);
                      // Refresh goal data after check-in
                      const { data: updatedGoalData } = await supabase
                        .from('goals')
                        .select('*')
                        .eq('id', goal.id)
                        .eq('user_id', user.id)
                        .single();
                      if (updatedGoalData) {
                        setGoal(updatedGoalData as Goal);
                      }
                    }}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-lg py-3 px-8"
                  >
                    ✅ CHECK IN NOW - Update Your Streak!
                  </Button>
                ) : (
                  <div className="text-success font-medium text-lg">
                    ✅ Checked in for today!
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-4">
                  Missing today breaks your streak! Don't let your progress reset to zero.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  🕒 Your ability to Check In again will reset daily at 3 AM EST
                </p>
              </CardContent>
            </Card>

            {/* Encouragement Footer */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="text-center py-6">
                <p className="text-muted-foreground">
                  {getEncouragementMessage(goal.title)} 🚀
                </p>
              </CardContent>
            </Card>
          </div> : <Card>
            <CardContent className="text-center py-12">
              {loadingMotivation ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold mb-2">Loading Your Motivation...</h3>
                  <p className="text-muted-foreground mb-4">Retrieving your personalized daily motivation content...</p>
                </>
              ) : (
                <>
                  <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Motivation Content Available</h3>
                  <p className="text-muted-foreground mb-4">Unable to load your daily motivation content. This may be a temporary issue.</p>
                  <div className="space-y-2">
                    <Button onClick={() => window.location.reload()}>
                      Refresh Page
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/')}>
                      Go to Dashboard
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>}
      </div>
    </div>;
}