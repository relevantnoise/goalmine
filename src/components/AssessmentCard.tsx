import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Settings, Brain, TrendingUp, CheckCircle, ArrowRight, Edit, Loader2, RotateCcw, Briefcase } from "lucide-react";
import { AIGoalGuidance } from "./AIGoalGuidance";
import { FullAnalysisModal } from "./FullAnalysisModal";
import { GapTrends } from "./GapTrends";
import { EditFrameworkModal } from "./EditFrameworkModal";
import { AIInsightsDisplay } from "./AIInsightsDisplay";
import { FrameworkInfoModal } from "./FrameworkInfoModal";
import { useFramework } from "@/hooks/useFramework";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

type AssessmentState = 'initial' | 'completed' | 'insights' | 'ongoing';

interface AssessmentCardProps {
  onTakeAssessment: () => void;
  onCreateGoals: () => void;
  onEditFramework: () => void;
}

// Frontend analysis generation (no API dependencies)
function generateLocalAnalysis(frameworkData: any) {
  console.log('[LocalAnalysis] Generating insights from framework data:', frameworkData);
  
  const elements = frameworkData?.elements || [];
  
  // Deep analysis of user's specific data
  const biggestGap = elements.reduce((max: any, element: any) => 
    Math.abs(element.gap || 0) > Math.abs(max.gap || 0) ? element : max, 
    elements[0] || { name: 'Health & Fitness', gap: -10 }
  );
  
  const strongestPillar = elements.reduce((max: any, element: any) => 
    (element.current || 0) > (max.current || 0) ? element : max,
    elements[0] || { name: 'Work', current: 40 }
  );
  
  const mostImportant = elements.reduce((max: any, element: any) => 
    (element.importance || 0) > (max.importance || 0) ? element : max,
    elements[0] || { name: 'Health & Fitness', importance: 10 }
  );
  
  // Calculate insights from their specific numbers
  const weeklyUnallocated = 168 - elements.reduce((sum: number, el: any) => sum + (el.current || 0), 0); // Total hours in a week
  const overcommitted = elements.reduce((sum: number, el: any) => sum + (el.desired || 0), 0) > 168;
  
  // Find patterns in their data
  const underinvestedPillars = elements.filter((el: any) => (el.gap || 0) < -5);
  const overinvestedPillars = elements.filter((el: any) => (el.gap || 0) > 5);
  const balancedPillars = elements.filter((el: any) => Math.abs(el.gap || 0) <= 2);
  
  // Deep situational analysis - read between the lines
  const workElement = elements.find((el: any) => el.name === 'Work') || {};
  const workOverload = (workElement.current || 0) > 50; // Working more than 50 hours
  const wantsWorkReduction = (workElement.gap || 0) > 0; // Wants to work less
  const burnoutSignals = workOverload && wantsWorkReduction;
  
  const sleepElement = elements.find((el: any) => el.name === 'Sleep') || {};
  const sleepDeprived = (sleepElement.current || 0) < 49; // Less than 7 hours/night
  
  const healthElement = elements.find((el: any) => el.name === 'Health & Fitness') || {};
  const neglectingHealth = (healthElement.current || 0) < 5;
  
  const personalDevElement = elements.find((el: any) => el.name === 'Personal Development') || {};
  const stagnating = (personalDevElement.current || 0) < 3;
  
  const relationshipElement = elements.find((el: any) => el.name === 'Family & Friends') || {};
  const relationshipSuffering = (relationshipElement.current || 0) < 10;
  
  // Life situation insights
  let lifeSituation = "";
  if (burnoutSignals) {
    lifeSituation = "You're in a classic burnout pattern - working too much and wanting to work less. ";
  }
  if (sleepDeprived && workOverload) {
    lifeSituation += "You're sacrificing sleep to handle work demands, which is making everything harder. ";
  }
  if (neglectingHealth && workOverload) {
    lifeSituation += "Your health is taking a backseat to work - a dangerous long-term strategy. ";
  }
  if (stagnating) {
    lifeSituation += "You're stuck in survival mode with no time for growth or learning. ";
  }
  if (relationshipSuffering && workOverload) {
    lifeSituation += "Your relationships are paying the price for work demands. ";
  }
  
  // Work happiness analysis if available
  const workHappiness = frameworkData?.workHappiness;
  let workInsights = "";
  if (workHappiness) {
    const impactGap = (workHappiness.impact?.desired || 0) - (workHappiness.impact?.current || 0);
    const funGap = (workHappiness.enjoyment?.desired || 0) - (workHappiness.enjoyment?.current || 0);
    const moneyGap = (workHappiness.income?.desired || 0) - (workHappiness.income?.current || 0);
    const flexGap = (workHappiness.remote?.desired || 0) - (workHappiness.remote?.current || 0);
    
    const biggestWorkGap = Math.max(impactGap, funGap, moneyGap, flexGap);
    let workFocus = "";
    if (biggestWorkGap === impactGap) workFocus = "meaningful impact";
    else if (biggestWorkGap === funGap) workFocus = "enjoyment and fulfillment";
    else if (biggestWorkGap === moneyGap) workFocus = "financial growth";
    else workFocus = "flexibility and autonomy";
    
    workInsights = ` Your work happiness assessment reveals you're most hungry for ${workFocus}. This suggests your ${biggestGap.name} gap might be connected to work dissatisfaction - when work isn't fulfilling, we often neglect other life areas.`;
  }
  
  return [
    {
      type: "priority_focus",
      title: `Your ${biggestGap.name} Wake-Up Call`,
      content: `Here's what your assessment actually reveals: You're currently spending ${biggestGap.current || 0} hours per week on ${biggestGap.name}, but you want ${biggestGap.desired || 0} hours. That's a ${Math.abs(biggestGap.gap || 0)}-hour weekly gap - basically ${Math.round((Math.abs(biggestGap.gap || 0) * 52) / 8)} full work days per year you're missing from something you rated as important.${workInsights}

Think about it: you're allocating ${totalCurrentHours} total hours across your pillars, leaving ${weeklyUnallocated} hours unaccounted for each week. ${overcommitted ? "Here's the problem - you want to spend " + totalDesiredHours + " hours total, which is more than the 168 hours in a week. You're setting yourself up for failure." : "You have room to grow without sacrificing other areas."}

The real insight? ${biggestGap.name} isn't just a nice-to-have for you - you rated its importance as ${biggestGap.importance || 0}/10. Yet your time allocation doesn't match that priority. This disconnect between what you value and how you spend time is likely creating daily frustration and long-term regret.

What's probably happening: ${biggestGap.name === 'Sleep' ? 'You\'re sacrificing sleep for other things, which is actually making you less effective in those areas.' : biggestGap.name === 'Health & Fitness' ? 'You\'re probably telling yourself you\'ll focus on health "when things calm down" - but they never do.' : biggestGap.name === 'Personal Development' ? 'You\'re stuck in reactive mode, always busy but never growing.' : biggestGap.name === 'Family & Friends' ? 'Your relationships are suffering while you focus on everything else, creating guilt and disconnection.' : biggestGap.name === 'Spiritual' ? 'You\'re running on empty, lacking the deeper meaning that fuels everything else.' : 'You\'re probably overwhelmed and not seeing the results you want from all your effort.'}

IMMEDIATE RESOURCES: • Book: 'Atomic Habits' by James Clear • Course: 'Building Better Habits' online course`
    },
    {
      type: "leverage_strength", 
      title: `What Your Life Pattern Reveals`,
      content: `Let's be honest about what's happening: ${lifeSituation}${strongestPillar.name === 'Work' && workOverload ? `You're spending ${strongestPillar.current} hours on work - that's not a strength, that's a problem. Working ${strongestPillar.current} hours a week while wanting to work only ${strongestPillar.desired || strongestPillar.current - 10} hours tells me you're trapped in an unsustainable cycle.` : `You're investing ${strongestPillar.current || 0} hours weekly in ${strongestPillar.name}.`}

${burnoutSignals ? `The data shows classic burnout: you're working ${workElement.current} hours but want to work ${workElement.desired}. Meanwhile, ` : ''}${sleepDeprived ? `you're only getting ${Math.round((sleepElement.current || 49) / 7)} hours of sleep per night, ` : ''}${neglectingHealth ? `spending only ${healthElement.current || 0} hours on health, ` : ''}${stagnating ? `and just ${personalDevElement.current || 0} hours on personal development. ` : ''}${relationshipSuffering ? `Your relationships are getting ${relationshipElement.current || 0} hours per week. ` : ''}

This isn't about time management - it's about life management. ${workOverload ? 'Your work is consuming everything else. ' : ''}${sleepDeprived && workOverload ? 'You\'re borrowing from sleep to handle work, which is making you less effective at work, creating a vicious cycle. ' : ''}${neglectingHealth && workOverload ? 'You\'re trading long-term health for short-term work demands. ' : ''}

The real insight: ${burnoutSignals ? 'You can\'t optimize your way out of this - you need boundaries. The problem isn\'t efficiency, it\'s saying no.' : strongestPillar.gap && strongestPillar.gap > 0 ? `You're overdoing ${strongestPillar.name} by ${strongestPillar.gap} hours. Those hours could transform your ${biggestGap.name}.` : `What makes ${strongestPillar.name} work consistently? You need to apply that same discipline to ${biggestGap.name}.`}

IMMEDIATE RESOURCES: ${burnoutSignals ? '• Book: "Boundaries" by Henry Cloud • Practice: Say no to one work request this week • Action: Block calendar time for non-work activities' : '• Practice: Identify what makes your strongest area work • Action: Apply those same systems to your biggest gap'} • Tool: Time-tracking to see where hours actually go`
    },
    {
      type: "strategic_sequence",
      title: "The Real Problem & Solution", 
      content: `Here's what your assessment is really telling me: ${burnoutSignals ? `You're not struggling with time management - you're struggling with boundaries. Working ${workElement.current} hours while wanting ${workElement.desired} hours isn't a scheduling problem, it's a "saying no" problem.` : `You have a clear priority mismatch. You rated ${mostImportant.name} as most important (${mostImportant.importance}/10) but ${biggestGap.name} has the biggest gap.`}

The cascade effect: ${workOverload && sleepDeprived ? `Work overflow → sleep sacrifice → reduced energy → poor performance → more work hours needed → repeat. ` : ''}${workOverload && neglectingHealth ? `Long work hours → no time for health → lower energy/focus → need more work hours to get same results → repeat. ` : ''}${workOverload && relationshipSuffering ? `Work demands → neglected relationships → guilt and stress → reduced work effectiveness → more hours needed → repeat. ` : ''}

${burnoutSignals ? `The solution isn't optimization - it's intervention. You need to break the cycle by setting hard boundaries on work hours first. Everything else will improve from there.` : `The solution: Start with ${biggestGap.name}, but strategically. ${strongestPillar.gap && strongestPillar.gap > 3 ? `You're overdoing ${strongestPillar.name} by ${strongestPillar.gap} hours - redirect those to ${biggestGap.name}.` : `Find the ${Math.abs(biggestGap.gap)} hours by tracking your ${weeklyUnallocated} unaccounted hours this week.`}`}

30-day intervention plan: ${burnoutSignals ? `Week 1: Set hard work boundaries (leave at X time, no weekend work). Week 2: Protect sleep hours. Week 3: Add ${biggestGap.name} back in. Week 4: Evaluate what's actually sustainable.` : `Week 1: Track all time to find the real problem areas. Week 2: Implement ${biggestGap.name} improvements. Week 3: Fine-tune the schedule. Week 4: Expand to the next pillar.`}

${workInsights ? 'Work happiness insight: ' + workInsights.trim() + ` ${burnoutSignals ? 'Ironically, working less might make work more fulfilling.' : 'Improving ' + biggestGap.name + ' will likely improve work satisfaction too.'}` : ''}

Success metric: ${burnoutSignals ? `Work only ${workElement.desired || workElement.current - 10} hours per week AND consistently hit ${biggestGap.desired || 0} hours for ${biggestGap.name}.` : `Consistently hit ${biggestGap.desired || 0} weekly hours in ${biggestGap.name} without sacrificing other areas.`}

IMMEDIATE RESOURCES: ${burnoutSignals ? '• Book: "Boundaries" by Henry Cloud • Course: "Work-Life Balance Mastery" online course' : '• Book: "The Power of Habit" by Charles Duhigg • Podcast: "The Tim Ferriss Show" for optimization strategies'}`
    }
  ];
}

export const AssessmentCard = ({ 
  onTakeAssessment, 
  onCreateGoals, 
  onEditFramework
}: AssessmentCardProps) => {
  const { user } = useAuth();
  const { frameworkData, hasFramework, assessmentState, loading, error, refetch } = useFramework();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const [showGuidance, setShowGuidance] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showFrameworkInfo, setShowFrameworkInfo] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [localAnalysis, setLocalAnalysis] = useState<any[]>([]);
  const modalStateRef = useRef(false);
  
  // Debug: Track state changes
  useEffect(() => {
    console.log('[AssessmentCard] 🔄 showFullAnalysis changed to:', showFullAnalysis);
    modalStateRef.current = showFullAnalysis;
  }, [showFullAnalysis]);
  
  // Persist modal state across re-renders
  const actualModalState = modalStateRef.current || showFullAnalysis;
  console.log('[AssessmentCard] 🔍 Modal state check - modalStateRef.current:', modalStateRef.current, 'showFullAnalysis:', showFullAnalysis, 'actualModalState:', actualModalState);

  // Debug modal states
  console.log('[AssessmentCard] Modal states:', {
    showGuidance,
    showEditModal,
    showTrends,
    showInsights,
    showFrameworkInfo,
    showFullAnalysis
  });

  // Use the intelligent state from the hook
  const currentState = assessmentState;
  console.log('[AssessmentCard] 🚨 EARLY DEBUG - currentState:', currentState);

  // Use real framework data or fallback
  const elements = frameworkData?.elements || [];
  const insights = frameworkData?.insights;
  
  // Debug: Log the actual data being received
  console.log('[AssessmentCard] frameworkData:', frameworkData);
  console.log('[AssessmentCard] elements:', elements);
  console.log('[AssessmentCard] elements.length:', elements?.length);
  console.log('[AssessmentCard] AI insights:', frameworkData?.aiInsights?.length || 0);
  console.log('[AssessmentCard] insights:', frameworkData?.insights);
  console.log('[AssessmentCard] workHappiness:', frameworkData?.workHappiness);
  console.log('[AssessmentCard] hasFramework:', hasFramework);
  console.log('[AssessmentCard] assessmentState:', assessmentState);
  console.log('[AssessmentCard] currentState:', currentState);
  console.log('[AssessmentCard] 🎯 USER IS IN STATE:', currentState);
  
  // Reset framework data function - opens edit modal for making changes
  const resetFrameworkData = async () => {
    try {
      console.log('[RESET] Opening edit modal for assessment changes...');
      setShowEditModal(true);
      toast({
        title: "Edit Your Assessment", 
        description: "You can now modify your 6 Pillars ratings and work happiness settings.",
      });
    } catch (err) {
      console.error('[RESET] Error:', err);
      toast({
        title: "Error Opening Editor", 
        description: "Please try again",
        variant: "destructive"
      });
    }
  };
  
  // Start fresh assessment function - completely clears framework data
  const startFreshAssessment = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('[START-FRESH] Clearing all framework data...');
      
      const { data, error } = await supabase.functions.invoke('reset-framework-data', {
        body: { 
          userEmail: user.email
        }
      });

      if (error) {
        console.error('[START-FRESH] Error:', error);
        toast({
          title: "Reset Failed",
          description: "Could not clear framework data. Please try again.",
          variant: "destructive"
        });
      } else if (data?.success) {
        console.log('[START-FRESH] Framework cleared successfully');
        refetch(); // Refresh to show initial state
        toast({
          title: "Assessment Reset!",
          description: "Your framework data has been cleared. You can now take a fresh assessment.",
        });
        
        // Trigger the assessment flow
        onTakeAssessment();
      }
    } catch (err) {
      console.error('[START-FRESH] Error:', err);
      toast({
        title: "Reset Error",
        description: "An error occurred while resetting. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const biggestGap = elements.length > 0 
    ? elements.reduce((max, element) => element.gap > max.gap ? element : max)
    : { name: 'Sleep', gap: 6 }; // Fallback

  // Use AI insights from framework data (for Full Analysis only)
  const aiInsights = frameworkData?.aiInsights || [];
  
  // AI insights are now loaded directly from frameworkData
  console.log('[AssessmentCard] AI insights from framework:', aiInsights.length);


  const handleCreateGoals = () => {
    // Note: State will be updated automatically when goals are created
    // and useFramework detects them
    onCreateGoals();
  };

  // Show loading state
  if (loading) {
    return (
      <>
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading your framework...</p>
          </div>
        </CardContent>
      </Card>

      {/* Framework Info Modal */}
      {showFrameworkInfo && (
        <FrameworkInfoModal
          isOpen={showFrameworkInfo}
          onClose={() => setShowFrameworkInfo(false)}
        />
      )}
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
      <Card className="border-2 border-destructive/20 bg-destructive/5">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-sm text-destructive mb-4">Error loading framework: {error}</p>
            <Button onClick={refetch} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Framework Info Modal */}
      {showFrameworkInfo && (
        <FrameworkInfoModal
          isOpen={showFrameworkInfo}
          onClose={() => setShowFrameworkInfo(false)}
        />
      )}
      </>
    );
  }


  // State 1: Initial Assessment Card (New Users)
  if (currentState === 'initial') {
    return (
      <>
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">6 Pillars of Life Framework™ + Business Happiness Formula™</h3>
              <p className="text-sm text-muted-foreground">GoalMine.ai's proven frameworks that show you exactly where to focus for the biggest results</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
              <span className="font-medium">Complete Framework & Formula Assessment</span>
            </div>
            <div className="flex items-center gap-3 opacity-50">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-sm font-bold">2</div>
              <span>Get AI-Powered Insights</span>
            </div>
            <div className="flex items-center gap-3 opacity-50">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-sm font-bold">3</div>
              <span>Build Your Action Plan</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={onTakeAssessment} className="w-full" size="lg">
              <Target className="w-4 h-4 mr-2" />
              Take Assessment
            </Button>
            <Button variant="outline" onClick={() => setShowFrameworkInfo(true)} className="w-full">
              Learn More About Our Framework and Formula
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Framework Info Modal */}
      {showFrameworkInfo && (
        <FrameworkInfoModal
          isOpen={showFrameworkInfo}
          onClose={() => setShowFrameworkInfo(false)}
        />
      )}
      </>
    );
  }

  // State 2: Post-Assessment Summary (Assessment completed)
  if (currentState === 'completed') {
    return (
      <>
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
          <CardContent className="p-8">
            {/* Celebration Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-800 mb-2">🎉 Assessment Complete!</h3>
              <p className="text-green-700">Your 6 Pillars + Business Happiness analysis is ready</p>
            </div>

            {/* 6 Pillars Assessment Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-6 mb-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-6 h-6 text-blue-600" />
                <h4 className="text-lg font-semibold text-blue-800">6 Pillars of Life Framework™ Assessment</h4>
              </div>
              {elements.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {elements.slice(0, 6).map((pillar: any) => (
                      <div key={pillar.name} className="flex justify-between items-center bg-white rounded p-2 border border-blue-100">
                        <span className="font-medium text-blue-900">{pillar.name}:</span>
                        <span className="text-blue-700">{pillar.current || 0}h → {pillar.desired || 0}h</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-blue-700 mt-3">
                    <strong>Focus:</strong> Time management to reduce stress and increase life happiness
                  </p>
                </div>
              ) : (
                <p className="text-sm text-blue-600">Loading pillar assessment data...</p>
              )}
            </div>

            {/* Business Happiness Formula Summary */}
            <div className="bg-gradient-to-br from-green-50 to-yellow-50 rounded-lg p-6 mb-4 border border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-6 h-6 text-green-600" />
                <h4 className="text-lg font-semibold text-green-800">Business Happiness Formula™</h4>
              </div>
              {frameworkData?.workHappiness ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between items-center bg-white rounded p-2 border border-green-100">
                      <span className="font-medium text-green-900">Impact:</span>
                      <span className="text-green-700">{frameworkData.workHappiness.impactCurrent}/10 → {frameworkData.workHappiness.impactDesired}/10</span>
                    </div>
                    <div className="flex justify-between items-center bg-white rounded p-2 border border-green-100">
                      <span className="font-medium text-green-900">Fun:</span>
                      <span className="text-green-700">{frameworkData.workHappiness.funCurrent}/10 → {frameworkData.workHappiness.funDesired}/10</span>
                    </div>
                    <div className="flex justify-between items-center bg-white rounded p-2 border border-green-100">
                      <span className="font-medium text-green-900">Money:</span>
                      <span className="text-green-700">{frameworkData.workHappiness.moneyCurrent}/10 → {frameworkData.workHappiness.moneyDesired}/10</span>
                    </div>
                    <div className="flex justify-between items-center bg-white rounded p-2 border border-green-100">
                      <span className="font-medium text-green-900">Flexibility:</span>
                      <span className="text-green-700">{frameworkData.workHappiness.remoteCurrent}/10 → {frameworkData.workHappiness.remoteDesired}/10</span>
                    </div>
                  </div>
                  <p className="text-sm text-green-700 mt-3">
                    <strong>Focus:</strong> The 4 key factors for work satisfaction and professional happiness
                  </p>
                </div>
              ) : (
                <p className="text-sm text-green-600">Loading work happiness assessment data...</p>
              )}
            </div>

            {/* Combined AI Strategic Analysis */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 mb-6 border border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-6 h-6 text-purple-600" />
                <h4 className="text-lg font-semibold text-purple-800">Enterprise Strategic Intelligence</h4>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Advanced Analytics</span>
              </div>
              {aiInsights.length > 0 ? (
                <div className="space-y-4">
                  {aiInsights.slice(0, 3).map((insight: any, index: number) => (
                    <div key={insight.id || index} className="bg-white rounded-lg p-4 border border-purple-100">
                      <h5 className="font-medium text-purple-900 mb-2">{insight.title}</h5>
                      <p className="text-sm text-purple-700">{insight.description || insight.content}</p>
                    </div>
                  ))}
                  {aiInsights.length > 3 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowInsights(true)}
                      className="w-full mt-3 border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      View All {aiInsights.length} Strategic Insights
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-600" />
                    <p className="text-lg text-purple-700 font-medium">Enterprise Strategic Intelligence Engine</p>
                    <p className="text-sm text-purple-600 mt-2">Analyzing your data to identify highest-impact opportunities...</p>
                    <p className="text-xs text-purple-500 mt-1">Enterprise-grade analysis • 30-60 seconds</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    console.log('[AssessmentCard] Edit Assessment clicked - using original beautiful interface!');
                    onEditFramework();
                  }} 
                  className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-200"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Update My Assessment
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setShowFrameworkInfo(true)} 
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200"
                >
                  Learn More About Framework
                </Button>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  onClick={startFreshAssessment} 
                  className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start Fresh Assessment
                </Button>
              </div>
              
              {/* Life reflection prompt */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-sm text-muted-foreground text-center">
                  Life changes. If your priorities have shifted, tap 'Update My Assessment' to keep your pillars aligned with your current situation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Framework Info Modal */}
        {showFrameworkInfo && (
          <FrameworkInfoModal
            isOpen={showFrameworkInfo}
            onClose={() => setShowFrameworkInfo(false)}
          />
        )}
      </>
    );
  }

  // State 3: AI Insights & Goal Guidance (Insights generated)
  if (currentState === 'insights') {
    return (
      <>
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Your Personalized Strategy</h3>
                <p className="text-sm text-muted-foreground">AI-powered insights & recommendations</p>
              </div>
            </div>

            {/* Strategic Intelligence Summary */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Brain className="w-6 h-6 text-blue-600" />
                  <h4 className="text-lg font-bold text-blue-800">Strategic Intelligence</h4>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">AI Analysis</span>
                </div>
                
                {(() => {
                  // Deep strategic analysis of assessment data - handle ties
                  const biggestGapSize = elements.length > 0 
                    ? Math.max(...elements.map(el => Math.abs(el.gap || 0)))
                    : 0;
                  const biggestGaps = elements.filter(el => Math.abs(el.gap || 0) === biggestGapSize && biggestGapSize > 0);
                  const biggestGap = biggestGaps.length > 0 ? biggestGaps[0] : null;
                  
                  const workElement = elements.find(el => el.name === 'Work') || {};
                  const sleepElement = elements.find(el => el.name === 'Sleep') || {};
                  const healthElement = elements.find(el => el.name === 'Health & Fitness') || {};
                  const relationshipElement = elements.find(el => el.name === 'Family & Friends') || {};
                  const personalDevElement = elements.find(el => el.name === 'Personal Development') || {};
                  
                  // Calculate total time allocation
                  const totalCurrentHours = elements.reduce((sum, el) => sum + (el.current || 0), 0);
                  const totalDesiredHours = elements.reduce((sum, el) => sum + (el.desired || 0), 0);
                  
                  // Identify life patterns and stress drivers
                  const workOverload = (workElement.current || 0) > 50;
                  const sleepDeprived = (sleepElement.current || 0) < 49; // Less than 7 hours/night
                  const neglectingHealth = (healthElement.current || 0) < 5;
                  const relationshipSuffering = (relationshipElement.current || 0) < 10;
                  const stagnating = (personalDevElement.current || 0) < 3;
                  const burnoutPattern = workOverload && (sleepDeprived || neglectingHealth);
                  
                  // ENHANCED WORK HAPPINESS ANALYSIS
                  const workHappiness = frameworkData?.workHappiness;
                  let workInsights = { focus: null, pattern: null, satisfaction: 0, severity: 'normal', message: '' };
                  if (workHappiness) {
                    const gaps = {
                      impact: (workHappiness.impactDesired || 0) - (workHappiness.impactCurrent || 0),
                      enjoyment: (workHappiness.funDesired || 0) - (workHappiness.funCurrent || 0),
                      income: (workHappiness.moneyDesired || 0) - (workHappiness.moneyCurrent || 0),
                      flexibility: (workHappiness.remoteDesired || 0) - (workHappiness.remoteCurrent || 0)
                    };
                    const maxGap = Math.max(...Object.values(gaps));
                    const tiedFactors = Object.keys(gaps).filter(key => gaps[key] === maxGap);
                    workInsights.focus = tiedFactors[0]; // Keep single focus for backward compatibility
                    workInsights.allFocusAreas = tiedFactors;
                    workInsights.satisfaction = (workHappiness.impactCurrent + workHappiness.funCurrent + workHappiness.moneyCurrent + workHappiness.remoteCurrent) / 4;
                    
                    // ENHANCED PATTERN DETECTION WITH CRISIS IDENTIFICATION
                    const current = {
                      impact: workHappiness.impactCurrent || 0,
                      enjoyment: workHappiness.funCurrent || 0,
                      income: workHappiness.moneyCurrent || 0,
                      flexibility: workHappiness.remoteCurrent || 0
                    };
                    const desired = {
                      impact: workHappiness.impactDesired || 0,
                      enjoyment: workHappiness.funDesired || 0,
                      income: workHappiness.moneyDesired || 0,
                      flexibility: workHappiness.remoteDesired || 0
                    };
                    
                    // OPPORTUNITY DETECTION (Individual factor analysis)
                    if (current.impact <= 2 && desired.impact >= 8) {
                      workInsights.pattern = 'impact_opportunity';
                      workInsights.severity = 'high';
                      workInsights.message = 'Major growth opportunity: Transform your work impact potential';
                    } else if (current.enjoyment <= 2 && desired.enjoyment >= 8) {
                      workInsights.pattern = 'enjoyment_opportunity';
                      workInsights.severity = 'high';
                      workInsights.message = 'Significant opportunity: Redesign work for greater fulfillment';
                    } else if (current.income <= 2 && desired.income >= 8) {
                      workInsights.pattern = 'income_opportunity';
                      workInsights.severity = 'high';
                      workInsights.message = 'Income optimization opportunity: Bridge the gap to your goals';
                    } else if (current.flexibility <= 2 && desired.flexibility >= 8) {
                      workInsights.pattern = 'flexibility_opportunity';
                      workInsights.severity = 'high';
                      workInsights.message = 'Flexibility upgrade opportunity: Design your ideal work setup';
                    }
                    // COMPREHENSIVE TRANSFORMATION OPPORTUNITY
                    else if (Object.values(current).filter(val => val <= 3).length >= 3) {
                      workInsights.pattern = 'comprehensive_opportunity';
                      workInsights.severity = 'high';
                      workInsights.message = 'Major transformation opportunity: Redesign work across all factors';
                    }
                    // SIGNIFICANT IMPROVEMENT POTENTIAL
                    else if (workInsights.satisfaction < 4) {
                      workInsights.pattern = 'improvement_potential';
                      workInsights.severity = 'medium';
                      workInsights.message = 'Work optimization opportunity: Multiple areas ready for improvement';
                    }
                    // MODERATE DISSATISFACTION  
                    else if (workInsights.satisfaction < 6) {
                      workInsights.pattern = 'unsatisfied';
                      workInsights.severity = 'medium';
                      workInsights.message = 'Moderate dissatisfaction across multiple work areas';
                    }
                    // SINGLE MAJOR GAP
                    else if (maxGap >= 6) {
                      workInsights.pattern = 'major_gap';
                      workInsights.severity = 'medium';
                      workInsights.message = `Major gap in ${workInsights.focus} despite good foundation`;
                    }
                    // MINOR OPTIMIZATION
                    else if (maxGap > 3) {
                      workInsights.pattern = 'gap_focused';
                      workInsights.severity = 'low';
                      workInsights.message = 'Strong foundation, one key improvement area';
                    }
                    // GENERALLY SATISFIED
                    else {
                      workInsights.pattern = 'satisfied';
                      workInsights.severity = 'low';
                      workInsights.message = 'Strong work satisfaction across all factors';
                    }
                  }
                  
                  // ENHANCED STRATEGIC LIFE PATTERN ANALYSIS
                  let lifePattern = '';
                  let stressDriver = '';
                  let goalGuidance = '';
                  let patternSeverity = 'normal';
                  
                  // EXTREME EDGE CASES FIRST
                  const totalDesiredHoursLocal = elements.reduce((sum, el) => sum + (el.desired || 0), 0);
                  const totalCurrentHoursLocal = elements.reduce((sum, el) => sum + (el.current || 0), 0);
                  const allCurrentZero = elements.every(el => (el.current || 0) === 0);
                  const perfectBalance = elements.every(el => Math.abs(el.gap || 0) < 3);
                  
                  // Career Launch (unemployed wanting work)
                  if (workElement.current === 0 && workElement.desired > 40) {
                    lifePattern = 'Career Launch Opportunity';
                    stressDriver = `Ready to build meaningful work life: 0h → ${workElement.desired}h career focus`;
                    goalGuidance = 'Career Building Goals';
                    patternSeverity = 'high';
                  }
                  // Complete Assessment Restart (all zeros - incomplete assessment)
                  else if (allCurrentZero && totalDesiredHoursLocal > 40) {
                    lifePattern = 'Fresh Life Design';
                    stressDriver = 'Clean slate opportunity to design ideal life optimization';
                    goalGuidance = 'Foundation Building Goals';
                    patternSeverity = 'medium';
                  }
                  // Perfect Balance (rare but possible)
                  else if (perfectBalance && totalCurrentHours > 100) {
                    lifePattern = 'Optimization & Growth';
                    stressDriver = 'Strong foundation ready for next-level challenges';
                    goalGuidance = 'Excellence & Expansion Goals';
                    patternSeverity = 'low';
                  }
                  // Unrealistic Expectations (>200h desired)
                  else if (totalDesiredHoursLocal > 200) {
                    lifePattern = 'Expectation Calibration Opportunity';
                    stressDriver = `${totalDesiredHoursLocal}h weekly desired (vs 168h available) - goals need prioritization`;
                    goalGuidance = 'Reality-Based Planning Goals';
                    patternSeverity = 'medium';
                  }
                  
                  // HIGH-IMPACT TRANSFORMATION OPPORTUNITIES (only if no edge cases above)
                  else if (workInsights.severity === 'high' && burnoutPattern) {
                    lifePattern = 'Key Opportunities';
                    stressDriver = `Major transformation potential: work satisfaction + ${workElement.current}h schedule affecting health/sleep`;
                    goalGuidance = 'Work-Life Balance Goals';
                    patternSeverity = 'high';
                  } else if (workInsights.severity === 'high') {
                    lifePattern = 'Professional Breakthrough Opportunity';
                    stressDriver = workInsights.message;
                    goalGuidance = 'Career Development Goals';
                    patternSeverity = 'high';
                  } else if (burnoutPattern && sleepDeprived && neglectingHealth) {
                    lifePattern = 'Foundation Optimization Opportunity';
                    stressDriver = `Redesign opportunity: ${workElement.current}h schedule + sleep + health for sustainable success`;
                    goalGuidance = 'Health & Sleep Goals';
                    patternSeverity = 'high';
                  }
                  // BALANCE OPTIMIZATION OPPORTUNITIES
                  else if (burnoutPattern) {
                    lifePattern = 'Work-Life Integration Opportunity';
                    stressDriver = `Optimization chance: ${workElement.current}h schedule while strengthening ${sleepDeprived ? 'sleep' : 'health'}`;
                    goalGuidance = 'Balance & Wellness Goals';
                    patternSeverity = 'medium';
                  } else if (workInsights.severity === 'high' && stagnating) {
                    lifePattern = 'Growth Acceleration Opportunity';
                    stressDriver = 'Prime time for breakthrough: work satisfaction + growth momentum combination';
                    goalGuidance = 'Growth & Development Goals';
                    patternSeverity = 'medium';
                  } else if (workOverload && relationshipSuffering && stagnating) {
                    lifePattern = 'Holistic Success Opportunity';
                    stressDriver = `Rebalance potential: ${workElement.current}h work + relationships + personal growth`;
                    goalGuidance = 'Life Integration Goals';
                    patternSeverity = 'medium';
                  }
                  // OPTIMIZATION OPPORTUNITIES
                  else if (workOverload && relationshipSuffering) {
                    lifePattern = 'Success Enhancement Opportunity';
                    stressDriver = `Integration opportunity: ${workElement.current}h work commitment + relationship quality`;
                    goalGuidance = 'Work-Life Integration Goals';
                    patternSeverity = 'medium';
                  } else if (stagnating && workInsights.pattern === 'unsatisfied') {
                    lifePattern = 'Growth Momentum Building';
                    stressDriver = 'Perfect timing: work optimization + growth acceleration combination';
                    goalGuidance = 'Growth & Development Goals';
                    patternSeverity = 'medium';
                  } else if (biggestGap && Math.abs(biggestGap.gap) > 15) {
                    lifePattern = 'Values Alignment Opportunity';
                    stressDriver = `${Math.abs(biggestGap.gap)}h weekly optimization potential in ${biggestGap.name} - your highest priority`;
                    goalGuidance = 'Strategic Rebalancing Goals';
                    patternSeverity = 'medium';
                  } else if (sleepDeprived && (workInsights.severity === 'medium' || workOverload)) {
                    lifePattern = 'Energy Optimization Opportunity';
                    stressDriver = 'Sleep enhancement could dramatically improve work satisfaction and life energy';
                    goalGuidance = 'Foundation-First Goals';
                    patternSeverity = 'medium';
                  }
                  // LOW SEVERITY PATTERNS
                  else if (biggestGap && Math.abs(biggestGap.gap) > 8) {
                    lifePattern = 'Priority Adjustment Needed';
                    stressDriver = `${Math.abs(biggestGap.gap)}h weekly gap in ${biggestGap.name}`;
                    goalGuidance = 'Targeted Improvement Goals';
                    patternSeverity = 'low';
                  } else if (workInsights.pattern === 'gap_focused') {
                    lifePattern = 'Fine-Tuning Opportunity';
                    stressDriver = `Strong life foundation with optimization potential in ${workInsights.focus}`;
                    goalGuidance = 'Enhancement Goals';
                    patternSeverity = 'low';
                  } else {
                    lifePattern = 'Healthy Life Architecture';
                    stressDriver = 'Well-balanced life with minor optimization opportunities';
                    goalGuidance = 'Growth & Excellence Goals';
                    patternSeverity = 'low';
                  }
                  
                  return (
                    <div className="space-y-4">
                      {/* Life Pattern Diagnosis - Enhanced with Severity Detection */}
                      <div className={`rounded-lg p-4 border ${
                        patternSeverity === 'high' ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300' :
                        patternSeverity === 'medium' ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300' :
                        'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className={`font-semibold ${
                            patternSeverity === 'high' ? 'text-orange-900' :
                            patternSeverity === 'medium' ? 'text-yellow-900' :
                            'text-green-900'
                          }`}>
                            Overall Assessment Summary
                          </h5>
                          <div className="flex items-center gap-2">
                            {patternSeverity === 'high' && (
                              <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full font-medium">
                                TRANSFORMATION
                              </span>
                            )}
                            {patternSeverity === 'medium' && (
                              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-medium">
                                OPTIMIZATION
                              </span>
                            )}
                            {patternSeverity === 'low' && (
                              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium">
                                STRATEGIC
                              </span>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm font-medium ${
                          patternSeverity === 'high' ? 'text-orange-800' :
                          patternSeverity === 'medium' ? 'text-yellow-800' :
                          'text-green-800'
                        }`}>
                          {lifePattern}
                        </p>
                        <p className={`text-xs mt-1 ${
                          patternSeverity === 'high' ? 'text-orange-600' :
                          patternSeverity === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {stressDriver}
                        </p>
                      </div>
                      
                      {/* Primary Stress Driver */}
                      {biggestGap && (
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-blue-900">
                              {biggestGaps.length > 1 ? 'Largest Time Investment Gaps' : 'Largest Time Investment Gap'}
                            </h5>
                            <span className="text-sm font-medium text-blue-600">{Math.abs(biggestGap.gap || 0)}h/week</span>
                          </div>
                          <p className="text-sm text-blue-800 font-medium">
                            {biggestGaps.length > 1 
                              ? biggestGaps.map(gap => gap.name).join(', ')
                              : biggestGap.name
                            }
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            {biggestGaps.length > 1 
                              ? `${biggestGaps.length} pillars tied at ${Math.abs(biggestGap.gap || 0)}h weekly gap`
                              : `Importance: ${biggestGap.importance || 0}/10 • Reality: ${biggestGap.current || 0}h • Goal: ${biggestGap.desired || 0}h`
                            }
                          </p>
                        </div>
                      )}
                      
                      {/* Work Satisfaction Analysis - Enhanced with Crisis Detection */}
                      {workInsights.focus && (
                        <div className={`rounded-lg p-4 border ${
                          workInsights.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                          workInsights.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-white border-purple-100'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className={`font-semibold ${
                              workInsights.severity === 'high' ? 'text-orange-900' :
                              workInsights.severity === 'medium' ? 'text-yellow-900' :
                              'text-purple-900'
                            }`}>
                              {workInsights.allFocusAreas && workInsights.allFocusAreas.length > 1 
                                ? 'Largest Business Happiness Gaps' 
                                : 'Largest Business Happiness Gap'
                              }
                            </h5>
                            <div className="flex items-center gap-2">
                              {workInsights.severity === 'high' && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                                  HIGH IMPACT
                                </span>
                              )}
                              {workInsights.severity === 'medium' && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                                  OPTIMIZATION
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                workInsights.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                workInsights.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {(() => {
                                  if (!workInsights.focus || !frameworkData?.workHappiness) return workInsights.satisfaction.toFixed(1);
                                  const wh = frameworkData.workHappiness;
                                  
                                  // Handle tied factors - show range or shared score
                                  if (workInsights.allFocusAreas && workInsights.allFocusAreas.length > 1) {
                                    const scores = workInsights.allFocusAreas.map(area => {
                                      return area === 'impact' ? wh.impactCurrent :
                                             area === 'enjoyment' ? wh.funCurrent :
                                             area === 'income' ? wh.moneyCurrent :
                                             area === 'flexibility' ? wh.remoteCurrent : 0;
                                    });
                                    const uniqueScores = [...new Set(scores)];
                                    return uniqueScores.length === 1 
                                      ? `${uniqueScores[0].toFixed(1)}` 
                                      : `${Math.min(...scores).toFixed(1)}-${Math.max(...scores).toFixed(1)}`;
                                  }
                                  
                                  // Single factor
                                  const currentScore = 
                                    workInsights.focus === 'impact' ? wh.impactCurrent :
                                    workInsights.focus === 'enjoyment' ? wh.funCurrent :
                                    workInsights.focus === 'income' ? wh.moneyCurrent :
                                    workInsights.focus === 'flexibility' ? wh.remoteCurrent : 0;
                                  return (currentScore || 0).toFixed(1);
                                })()}/10
                              </span>
                            </div>
                          </div>
                          <p className={`text-sm font-medium capitalize ${
                            workInsights.severity === 'high' ? 'text-orange-800' :
                            workInsights.severity === 'medium' ? 'text-yellow-800' :
                            'text-purple-800'
                          }`}>
                            {workInsights.allFocusAreas && workInsights.allFocusAreas.length > 1 
                              ? workInsights.allFocusAreas.join(', ')
                              : workInsights.focus
                            }
                          </p>
                          <p className={`text-xs mt-1 ${
                            workInsights.severity === 'high' ? 'text-orange-600' :
                            workInsights.severity === 'medium' ? 'text-yellow-600' :
                            'text-purple-600'
                          }`}>
                            {workInsights.message || (
                              workInsights.pattern === 'unsatisfied' ? 'Low satisfaction across multiple areas' : 
                              workInsights.pattern === 'gap_focused' ? 'Strong foundation, one key improvement area' :
                              'Primary opportunity for work fulfillment'
                            )}
                          </p>
                        </div>
                      )}
                      
                      {/* Goal Strategy Guidance */}
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-green-900">Goal Strategy</h5>
                          <Target className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-sm text-green-800 font-medium">{goalGuidance}</p>
                        <p className="text-xs text-green-600 mt-1">
                          {(() => {
                            // Validation guards for data integrity
                            if (totalDesiredHoursLocal > 200) {
                              return `Extreme overcommitment: ${totalDesiredHoursLocal}h desired (168h max possible) - prioritization needed`;
                            }
                            if (totalCurrentHoursLocal > 168) {
                              return `Assessment error: ${totalCurrentHoursLocal}h current exceeds 168h weekly - review entries`;
                            }
                            if (totalCurrentHoursLocal < 50 && totalDesiredHoursLocal < 50) {
                              return `Assessment incomplete: Only ${totalCurrentHoursLocal}h accounted for - complete remaining areas`;
                            }
                            
                            // Normal cases
                            return totalDesiredHoursLocal > 168 ? 
                              `Overcommitted by ${totalDesiredHoursLocal - 168}h - goals need trade-offs` :
                              `${Math.max(0, 168 - totalCurrentHoursLocal)}h unaccounted weekly - track where time actually goes`;
                          })()}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  onClick={async () => {
                    if (subscription.subscribed && (subscription.subscription_tier === "Professional Plan" || subscription.subscription_tier === "Pro Plan" || subscription.subscription_tier === "Strategic Advisor Plan")) {
                      console.log('[AssessmentCard] ✅ Access granted - opening Full Analysis modal');
                      setShowFullAnalysis(true);
                      modalStateRef.current = true;
                      
                      // Generate analysis completely in memory (no API, no database calls)
                      console.log('[AssessmentCard] Generating analysis in memory...');
                      const enhancedInsights = generateLocalAnalysis(frameworkData);
                      setLocalAnalysis(enhancedInsights);
                      console.log('[AssessmentCard] Analysis generated successfully:', enhancedInsights);
                      console.log('[AssessmentCard] Modal state - showFullAnalysis:', true, 'insights count:', enhancedInsights.length);
                    } else {
                      console.log('[AssessmentCard] ❌ Access denied - showing upgrade prompt');
                      toast({
                        title: "Professional Plan Required",
                        description: "Upgrade to Professional Plan to access the comprehensive AI analysis report with specific resources and actionable recommendations.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-200"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  See Full AI Analysis
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    console.log('[AssessmentCard] Edit Assessment clicked - using original beautiful interface!');
                    onEditFramework();
                  }}
                  className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-200"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Update My Assessment
                </Button>
              </div>
              
              {/* Upgrade message under the AI Analysis button */}
              <div className="flex gap-4 mt-2">
                <div className="flex-1">
                  {!(subscription.subscribed && (subscription.subscription_tier === "Professional Plan" || subscription.subscription_tier === "Pro Plan" || subscription.subscription_tier === "Strategic Advisor Plan")) && (
                    <p className="text-xs text-purple-600 text-center">
                      Requires Professional Plan - Upgrade Now!
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  {/* Empty space under Update button */}
                </div>
              </div>
              
            </div>
            
            {/* Life reflection prompt */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-sm text-muted-foreground text-center">
                Life changes. If your priorities have shifted, tap 'Update My Assessment' to keep your pillars aligned with your current situation.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Full Analysis Modal */}
        {showFullAnalysis && (
          <FullAnalysisModal
            isOpen={showFullAnalysis}
            onClose={() => {
              setShowFullAnalysis(false);
              modalStateRef.current = false;
            }}
            frameworkData={frameworkData}
            insights={localAnalysis.length > 0 ? localAnalysis : aiInsights}
          />
        )}

        {/* Framework Info Modal */}
        {showFrameworkInfo && (
          <FrameworkInfoModal
            isOpen={showFrameworkInfo}
            onClose={() => setShowFrameworkInfo(false)}
          />
        )}
      </>
    );
  }

  // Other states would go here...
  // All completed states would be implemented above
}
