import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Target, Zap, Flame, Brain, Sparkles, Heart } from "lucide-react";
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
  const { goals, loading: goalsLoading, todaysMotivation, generateGoalMotivation, fetchGoals } = useGoals();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [motivation, setMotivation] = useState<MotivationContent | null>(null);
  const [loadingMotivation, setLoadingMotivation] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
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
    // Parse as local date to avoid timezone shift (YYYY-MM-DD should stay as-is)
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, month - 1, day); // month is 0-indexed
    return localDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  // Loading phase animation effect
  useEffect(() => {
    if (loadingMotivation) {
      setLoadingPhase(0);
      const interval = setInterval(() => {
        setLoadingPhase(prev => (prev + 1) % 4);
      }, 2000); // Change phase every 2 seconds
      return () => clearInterval(interval);
    }
  }, [loadingMotivation]);

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
      } else if (!hasAttemptedLoad) {
        console.log('⚠️ No pre-loaded motivation found, will load separately for', goalData.title);
        // Only call loadMotivation if we haven't attempted it yet
        setLoadingMotivation(true);
        setHasAttemptedLoad(true);
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
      <Header onLogoClick={() => navigate('/dashboard')} />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4 -ml-4">
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

            {/* Streak Display Only */}
            <Card className="bg-success/10 border-success/30 border-2">
              <CardContent className="text-center py-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  🔥 {goal.streak_count || 0}-Day Streak
                </h3>
                <p className="text-muted-foreground">
                  Check in on your dashboard to maintain your streak
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
                <div className="py-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 border-4 border-primary/20 rounded-full"></div>
                    </div>
                    <div className="relative flex items-center justify-center">
                      {loadingPhase === 0 && <Brain className="w-16 h-16 text-primary animate-pulse" />}
                      {loadingPhase === 1 && <Sparkles className="w-16 h-16 text-success animate-bounce" />}
                      {loadingPhase === 2 && <Heart className="w-16 h-16 text-warning animate-pulse" />}
                      {loadingPhase === 3 && <Target className="w-16 h-16 text-primary animate-bounce" />}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 border-2 border-primary animate-spin rounded-full border-t-transparent"></div>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-4">
                    {loadingPhase === 0 && (
                      <>
                        <h3 className="text-2xl font-bold text-primary">🧠 AI Coach Analyzing Your Progress</h3>
                        <p className="text-lg text-muted-foreground">Reviewing your {goal?.streak_count || 0}-day streak and goal details...</p>
                      </>
                    )}
                    {loadingPhase === 1 && (
                      <>
                        <h3 className="text-2xl font-bold text-success">✨ Crafting Your Personalized Plan</h3>
                        <p className="text-lg text-muted-foreground">Creating {formatToneName(goal?.tone || 'kind_encouraging')} coaching content just for you...</p>
                      </>
                    )}
                    {loadingPhase === 2 && (
                      <>
                        <h3 className="text-2xl font-bold text-warning">💫 Adding Motivational Magic</h3>
                        <p className="text-lg text-muted-foreground">Generating micro-plans and challenges to fuel your success...</p>
                      </>
                    )}
                    {loadingPhase === 3 && (
                      <>
                        <h3 className="text-2xl font-bold text-primary">🎯 Almost Ready! Finalizing Your Experience</h3>
                        <p className="text-lg text-muted-foreground">Putting the finishing touches on your daily motivation...</p>
                      </>
                    )}
                    
                    <div className="mt-6 bg-gradient-to-r from-primary/10 via-success/10 to-warning/10 rounded-lg p-4">
                      <p className="text-sm font-medium text-foreground">
                        💡 <strong>Pro Tip:</strong> Your AI coach is considering your unique goals, current streak, and preferred coaching style to create content that will truly resonate with you!
                      </p>
                    </div>
                  </div>
                </div>
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
          
          {/* Wisdom Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground italic">
              Happiness isn't found in achieving the goal—it lives in the pursuit itself. Embrace every step forward.
            </p>
          </div>
      </div>
    </div>;
}