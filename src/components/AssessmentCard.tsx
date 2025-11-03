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
  const totalCurrentHours = elements.reduce((sum: number, el: any) => sum + (el.current || 0), 0);
  const totalDesiredHours = elements.reduce((sum: number, el: any) => sum + (el.desired || 0), 0);
  const weeklyUnallocated = 168 - totalCurrentHours; // Total hours in a week
  const overcommitted = totalDesiredHours > 168;
  
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
              <p className="text-sm text-muted-foreground">GoalMine.ai's proprietary frameworks to transform life's complexities into strategic clarity</p>
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
                    <p className="text-sm text-purple-600 mt-2">Analyzing your data against comprehensive optimization patterns...</p>
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
                  Review My Assessment
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
                  Life changes. If your priorities have shifted, tap 'Review My Assessment' to keep your pillars aligned with your current situation.
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
                  // Deep strategic analysis of assessment data
                  const biggestGap = elements.length > 0 
                    ? elements.reduce((max, element) => Math.abs(element.gap || 0) > Math.abs(max.gap || 0) ? element : max)
                    : null;
                  
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
                  
                  // Work happiness analysis
                  const workHappiness = frameworkData?.workHappiness;
                  let workInsights = { focus: null, pattern: null, satisfaction: 0 };
                  if (workHappiness) {
                    const gaps = {
                      impact: (workHappiness.impactDesired || 0) - (workHappiness.impactCurrent || 0),
                      enjoyment: (workHappiness.funDesired || 0) - (workHappiness.funCurrent || 0),
                      income: (workHappiness.moneyDesired || 0) - (workHappiness.moneyCurrent || 0),
                      flexibility: (workHappiness.remoteDesired || 0) - (workHappiness.remoteCurrent || 0)
                    };
                    const maxGap = Math.max(...Object.values(gaps));
                    workInsights.focus = Object.keys(gaps).find(key => gaps[key] === maxGap);
                    workInsights.satisfaction = (workHappiness.impactCurrent + workHappiness.funCurrent + workHappiness.moneyCurrent + workHappiness.remoteCurrent) / 4;
                    
                    // Identify work dissatisfaction pattern
                    if (workInsights.satisfaction < 6) {
                      workInsights.pattern = 'unsatisfied';
                    } else if (maxGap > 3) {
                      workInsights.pattern = 'gap_focused';
                    }
                  }
                  
                  // Strategic life pattern analysis
                  let lifePattern = '';
                  let stressDriver = '';
                  let goalGuidance = '';
                  
                  if (burnoutPattern) {
                    lifePattern = 'Classic Burnout Pattern';
                    stressDriver = `Working ${workElement.current}h weekly while sacrificing ${sleepDeprived ? 'sleep' : 'health'}`;
                    goalGuidance = 'Boundaries & Recovery Goals';
                  } else if (workOverload && relationshipSuffering) {
                    lifePattern = 'Success at a Cost';
                    stressDriver = `High work commitment (${workElement.current}h) limiting relationship time`;
                    goalGuidance = 'Work-Life Integration Goals';
                  } else if (stagnating && workInsights.pattern === 'unsatisfied') {
                    lifePattern = 'Survival Mode';
                    stressDriver = 'No growth time + work dissatisfaction creating stagnation';
                    goalGuidance = 'Growth & Transition Goals';
                  } else if (biggestGap && Math.abs(biggestGap.gap) > 10) {
                    lifePattern = 'Major Life Misalignment';
                    stressDriver = `${Math.abs(biggestGap.gap)}h weekly gap in what you value most`;
                    goalGuidance = 'Strategic Rebalancing Goals';
                  } else {
                    lifePattern = 'Optimization Opportunity';
                    stressDriver = 'Minor adjustments needed for better life satisfaction';
                    goalGuidance = 'Fine-Tuning Goals';
                  }
                  
                  return (
                    <div className="space-y-4">
                      {/* Life Pattern Diagnosis */}
                      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-red-900">Life Pattern Analysis</h5>
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Strategic</span>
                        </div>
                        <p className="text-sm text-red-800 font-medium">{lifePattern}</p>
                        <p className="text-xs text-red-600 mt-1">{stressDriver}</p>
                      </div>
                      
                      {/* Primary Stress Driver */}
                      {biggestGap && (
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-blue-900">Priority Investment Gap</h5>
                            <span className="text-sm font-medium text-blue-600">{Math.abs(biggestGap.gap || 0)}h/week</span>
                          </div>
                          <p className="text-sm text-blue-800 font-medium">{biggestGap.name}</p>
                          <p className="text-xs text-blue-600 mt-1">
                            Importance: {biggestGap.importance || 0}/10 • Reality: {biggestGap.current || 0}h • Goal: {biggestGap.desired || 0}h
                          </p>
                        </div>
                      )}
                      
                      {/* Work Satisfaction Analysis */}
                      {workInsights.focus && (
                        <div className="bg-white rounded-lg p-4 border border-purple-100">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-purple-900">Work Happiness Driver</h5>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              {workInsights.satisfaction.toFixed(1)}/10
                            </span>
                          </div>
                          <p className="text-sm text-purple-800 font-medium capitalize">{workInsights.focus}</p>
                          <p className="text-xs text-purple-600 mt-1">
                            {workInsights.pattern === 'unsatisfied' ? 'Low satisfaction across multiple areas' : 
                             workInsights.pattern === 'gap_focused' ? 'Strong foundation, one key improvement area' :
                             'Primary opportunity for work fulfillment'}
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
                          {totalDesiredHours > 168 ? 
                            `Overcommitted by ${totalDesiredHours - 168}h - goals need trade-offs` :
                            `${168 - totalCurrentHours}h unaccounted weekly - track where time actually goes`
                          }
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
                  See Full Analysis
                  {!(subscription.subscribed && (subscription.subscription_tier === "Professional Plan" || subscription.subscription_tier === "Pro Plan" || subscription.subscription_tier === "Strategic Advisor Plan")) && (
                    <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge>
                  )}
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
                  Review My Assessment
                </Button>
              </div>
              
            </div>
            
            {/* Life reflection prompt */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-sm text-muted-foreground text-center">
                Life changes. If your priorities have shifted, tap 'Review My Assessment' to keep your pillars aligned with your current situation.
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
