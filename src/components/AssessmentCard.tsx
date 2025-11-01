import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Settings, Calendar, Brain, TrendingUp, CheckCircle, ArrowRight, Edit, Loader2, RotateCcw, Briefcase } from "lucide-react";
import { WeeklyCheckin } from "./WeeklyCheckin";
import { AIGoalGuidance } from "./AIGoalGuidance";
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
  onWeeklyCheckin?: () => void;
}

export const AssessmentCard = ({ 
  onTakeAssessment, 
  onCreateGoals, 
  onEditFramework, 
  onWeeklyCheckin 
}: AssessmentCardProps) => {
  const { user } = useAuth();
  const { frameworkData, hasFramework, assessmentState, loading, error, refetch } = useFramework();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const [showCheckin, setShowCheckin] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showFrameworkInfo, setShowFrameworkInfo] = useState(false);

  // Debug modal states
  console.log('[AssessmentCard] Modal states:', {
    showGuidance,
    showEditModal,
    showTrends,
    showInsights,
    showFrameworkInfo
  });

  // Use the intelligent state from the hook
  const currentState = assessmentState;

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
        setAiInsights([]); // Clear insights
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

  // State for real-time AI insights
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Load existing AI insights from database or generate new ones if needed
  useEffect(() => {
    const loadOrGenerateAIInsights = async () => {
      if (currentState === 'completed' && 
          aiInsights.length === 0 && 
          !isGeneratingAI &&
          user?.email) {
        
        console.log('[AssessmentCard] Loading existing AI insights from database...');
        setIsGeneratingAI(true);
        
        try {
          // First, try to fetch existing insights from database
          const { data: fetchData, error: fetchError } = await supabase.functions.invoke('fetch-ai-insights', {
            body: { 
              userEmail: user.email
            }
          });

          if (fetchError) {
            console.error('[AssessmentCard] Error fetching insights:', fetchError);
          } else if (fetchData?.success && fetchData.hasInsights && fetchData.insights?.length > 0) {
            console.log('[AssessmentCard] Found existing insights in database:', fetchData.insights);
            setAiInsights(fetchData.insights);
            setIsGeneratingAI(false);
            return; // Use existing insights, no need to regenerate
          }

          // No existing insights found, generate new ones
          console.log('[AssessmentCard] No existing insights found, generating new ones...');
          
          const { data: generateData, error: generateError } = await supabase.functions.invoke('generate-ai-direct-return', {
            body: { 
              userEmail: user.email
            }
          });

          if (generateError) {
            console.error('[AssessmentCard] AI generation error:', generateError);
            toast({
              title: "AI Analysis Issue",
              description: "We're working on generating your insights. Please refresh in a moment.",
              variant: "destructive"
            });
          } else if (generateData?.success && generateData.insights) {
            console.log('[AssessmentCard] AI insights generated and stored successfully:', generateData.insights);
            setAiInsights(generateData.insights);
            toast({
              title: "AI Analysis Complete!",
              description: `Generated ${generateData.insights.length} personalized insights for your framework.`,
            });
          }
        } catch (err) {
          console.error('[AssessmentCard] Error loading/generating insights:', err);
          toast({
            title: "AI Analysis Error",
            description: "Unable to load insights. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsGeneratingAI(false);
        }
      }
    };

    loadOrGenerateAIInsights();
  }, [currentState, aiInsights.length, isGeneratingAI, user?.email]);


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
                <Button variant="outline" onClick={() => {
                  console.log('[AssessmentCard] Edit Assessment clicked - using original beautiful interface!');
                  onEditFramework();
                }} className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Assessment
                </Button>
                <Button variant="outline" onClick={() => setShowFrameworkInfo(true)} className="flex-1">
                  Learn More About Framework
                </Button>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={startFreshAssessment} className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start Fresh Assessment
                </Button>
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

            {/* COMPREHENSIVE: Assessment Analysis - Full Data Showcase */}
            <div className="space-y-6 mb-6">
              {/* Top Opportunities Grid */}
              <div className="grid gap-4">
                <h4 className="text-xl font-bold flex items-center gap-3">
                  🎯 Top Opportunities from Your Assessment
                </h4>
                
                {/* Top 3 Pillar Gaps */}
                <div className="grid md:grid-cols-3 gap-4">
                  {elements.sort((a, b) => b.gap - a.gap).slice(0, 3).map((pillar, index) => (
                    <div key={pillar.name} className={`border-2 rounded-xl p-4 ${
                      index === 0 ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200' :
                      index === 1 ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' :
                      'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-bold text-gray-800">{pillar.name}</h5>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          index === 0 ? 'bg-red-100 text-red-700' :
                          index === 1 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          #{index + 1}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-gray-800">{pillar.current}</span>
                        <ArrowRight className="w-5 h-5 text-gray-500" />
                        <span className="text-2xl font-bold text-gray-800">{pillar.desired}</span>
                      </div>
                      
                      <div className="text-center">
                        <span className="text-sm font-bold text-red-600">Gap: -{pillar.gap} points</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Happiness Analysis */}
              {frameworkData?.workHappiness && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <Briefcase className="w-6 h-6" />
                    Business Happiness Formula™ Analysis
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { key: 'impact', label: 'Impact', current: frameworkData.workHappiness.impactCurrent, desired: frameworkData.workHappiness.impactDesired },
                      { key: 'fun', label: 'Enjoyment', current: frameworkData.workHappiness.funCurrent, desired: frameworkData.workHappiness.funDesired },
                      { key: 'money', label: 'Financial Reward', current: frameworkData.workHappiness.moneyCurrent, desired: frameworkData.workHappiness.moneyDesired },
                      { key: 'remote', label: 'Flexibility', current: frameworkData.workHappiness.remoteCurrent, desired: frameworkData.workHappiness.remoteDesired }
                    ].map((factor) => {
                      const gap = factor.desired - factor.current;
                      return (
                        <div key={factor.key} className="bg-white/70 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-blue-800">{factor.label}</span>
                            <span className={`text-sm font-bold ${gap > 2 ? 'text-red-600' : gap > 1 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {gap > 0 ? `-${gap}` : '✓'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span>{factor.current}</span>
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                            <span>{factor.desired}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Formula Impact:</strong> {
                        [frameworkData.workHappiness.impactCurrent, frameworkData.workHappiness.funCurrent, 
                         frameworkData.workHappiness.moneyCurrent, frameworkData.workHappiness.remoteCurrent]
                        .filter(val => val <= 4).length > 0 
                        ? "⚠️ Low scores in any factor significantly reduce overall work satisfaction"
                        : "✅ Solid foundation across all happiness factors"
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Health & Balance Red Flags */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-6">
                <h4 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                  ⚠️ Health & Balance Analysis
                </h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {(() => {
                    const redFlags = [];
                    const sleepPillar = elements.find(e => e.name === 'Sleep');
                    const healthPillar = elements.find(e => e.name === 'Health & Fitness');
                    const familyPillar = elements.find(e => e.name === 'Friends & Family');
                    const workPillar = elements.find(e => e.name === 'Work');
                    const spiritualPillar = elements.find(e => e.name === 'Spiritual');
                    
                    if (sleepPillar && sleepPillar.current < 7) {
                      redFlags.push({ icon: '😴', text: `Sleep at ${sleepPillar.current}/10 - Research shows <7 hours affects decision-making and health` });
                    }
                    if (healthPillar && healthPillar.current < 5) {
                      redFlags.push({ icon: '💪', text: `Health & Fitness at ${healthPillar.current}/10 - Low physical activity impacts energy and longevity` });
                    }
                    if (familyPillar && workPillar && Math.abs(familyPillar.current - workPillar.current) > 3) {
                      redFlags.push({ icon: '⚖️', text: `Work-Life imbalance detected - ${Math.abs(familyPillar.current - workPillar.current)} point gap between work and relationships` });
                    }
                    if (spiritualPillar && spiritualPillar.current < 3) {
                      redFlags.push({ icon: '🕯️', text: `Spiritual at ${spiritualPillar.current}/10 - Low purpose/meaning scores correlate with decreased life satisfaction` });
                    }
                    
                    return redFlags.length > 0 ? redFlags.map((flag, i) => (
                      <div key={i} className="bg-white/70 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700">
                          <span className="text-lg mr-2">{flag.icon}</span>
                          {flag.text}
                        </p>
                      </div>
                    )) : (
                      <div className="col-span-2 bg-green-100 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-700">
                          ✅ No major health or balance red flags detected in your assessment
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

              {/* AI Insights - Expanded Cards */}
              {aiInsights.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xl font-bold flex items-center gap-3">
                    <Brain className="w-6 h-6 text-blue-600" />
                    AI Analysis & Strategic Recommendations
                  </h4>
                  
                  <div className="grid gap-4">
                    {aiInsights.slice(0, 3).map((insight, index) => (
                      <div key={insight.id || index} className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-blue-600">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <h5 className="text-lg font-bold text-gray-800 mb-3">{insight.title}</h5>
                            <p className="text-gray-600 leading-relaxed">{insight.description || insight.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="space-y-3">
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => {
                  if (subscription.subscribed && (subscription.subscription_tier === "Professional Plan" || subscription.subscription_tier === "Pro Plan" || subscription.subscription_tier === "Strategic Advisor Plan")) {
                    console.log('[AssessmentCard] See Full Analysis clicked!');
                    console.log('[AssessmentCard] Current elements:', elements);
                    setShowGuidance(true);
                  } else {
                    toast({
                      title: "Professional Plan Required",
                      description: "Upgrade to Professional Plan to access the full AI analysis report.",
                      variant: "destructive"
                    });
                  }
                }} className="flex-1">
                  <Brain className="w-4 h-4 mr-2" />
                  See Full Analysis
                  {!(subscription.subscribed && (subscription.subscription_tier === "Professional Plan" || subscription.subscription_tier === "Pro Plan" || subscription.subscription_tier === "Strategic Advisor Plan")) && (
                    <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge>
                  )}
                </Button>
                <Button variant="outline" onClick={() => {
                  console.log('[AssessmentCard] Edit Assessment clicked - using original beautiful interface!');
                  onEditFramework();
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Assessment
                </Button>
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

        {/* Edit Framework Modal */}
        {showEditModal && frameworkData && (
          <EditFrameworkModal
            isOpen={showEditModal}
            onClose={() => {
              console.log('[AssessmentCard] Closing EditFrameworkModal');
              setShowEditModal(false);
            }}
            frameworkData={frameworkData}
            onUpdate={() => {
              console.log('[AssessmentCard] EditFrameworkModal onUpdate called');
              refetch(); // Refresh framework data
              setShowEditModal(false);
              toast({
                title: "Assessment Updated!",
                description: "Your framework has been updated. New AI insights will be generated automatically.",
              });
            }}
          />
        )}

        {/* AI Insights Display */}
        {showInsights && (
          <AIInsightsDisplay
            isOpen={showInsights}
            onClose={() => setShowInsights(false)}
            insights={aiInsights}
            frameworkData={frameworkData}
          />
        )}

        {showTrends && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Progress Trends</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowTrends(false)}>
                    ✕
                  </Button>
                </div>
                <GapTrends frameworkData={{ elements }} />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // State 4: Ongoing Management (Framework active with goals)
  return (
    <>
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Your Life Architecture</h3>
              <p className="text-sm text-muted-foreground">6 Pillars Framework™ actively managing</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowEditModal(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Compact Pillars Progress */}
        <div className="space-y-2 mb-4">
          {elements.map((pillar) => (
            <div key={pillar.name} className="flex items-center gap-3">
              <div className="w-20 text-xs font-medium text-right">
                {pillar.name}:
              </div>
              <div className="flex-1 relative">
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(pillar.current / 10) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground w-12">
                {pillar.current}/10
              </div>
              {pillar.gap > 3 && (
                <span className="text-xs text-amber-600">↗️ +1</span>
              )}
            </div>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Last check-in</p>
              <p className="text-sm font-medium">
                {frameworkData?.framework.lastCheckinDate 
                  ? new Date(frameworkData.framework.lastCheckinDate).toLocaleDateString()
                  : 'No check-ins yet'
                }
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Goals</p>
              <p className="text-sm font-medium text-green-600">
                {frameworkData?.activeGoals?.length || 0} goals
              </p>
            </div>
          </div>
          
          {frameworkData?.stateInfo && (
            <div className="mt-2 pt-2 border-t border-muted">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>✅ {frameworkData.framework.totalCheckins} check-ins</span>
                {aiInsights.length > 0 && (
                  <span>🧠 {aiInsights.length} insights</span>
                )}
                {frameworkData.activeGoals?.length > 0 && (
                  <span>🎯 {frameworkData.activeGoals.length} goals</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button onClick={() => setShowCheckin(true)} className="w-full">
            <Calendar className="w-4 h-4 mr-2" />
            Weekly Check-in Due
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowInsights(true)} className="flex-1">
              <Brain className="w-4 h-4 mr-2" />
              Insights
              {aiInsights.length > 0 && (
                <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {aiInsights.length}
                </span>
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowTrends(true)} className="flex-1">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trends
            </Button>
          </div>
        </div>

        {/* Modals */}
        {showCheckin && (
          <WeeklyCheckin 
            onClose={() => setShowCheckin(false)}
            onSuccess={() => {
              refetch(); // Refresh framework data after successful check-in
            }}
          />
        )}

        {showGuidance && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">AI Goal Guidance</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowGuidance(false)}>
                    ✕
                  </Button>
                </div>
                <AIGoalGuidance 
                  frameworkData={{ elements: elements || [] }}
                  onClose={() => setShowGuidance(false)}
                />
              </div>
            </div>
          </div>
        )}

        {showTrends && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Progress Trends</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowTrends(false)}>
                    ✕
                  </Button>
                </div>
                <GapTrends frameworkData={{ elements }} />
              </div>
            </div>
          </div>
        )}

        {/* Edit Framework Modal */}
        {showEditModal && frameworkData && (
          <>
            {console.log('[AssessmentCard] Rendering EditFrameworkModal!')}
            <EditFrameworkModal
              isOpen={showEditModal}
              onClose={() => {
                console.log('[AssessmentCard] Closing EditFrameworkModal');
                setShowEditModal(false);
              }}
              frameworkData={frameworkData}
              onUpdate={() => {
                console.log('[AssessmentCard] EditFrameworkModal onUpdate called');
                refetch(); // Refresh framework data
                setShowEditModal(false);
                toast({
                  title: "Assessment Updated!",
                  description: "Your framework has been updated. New AI insights will be generated automatically.",
                });
              }}
            />
          </>
        )}

        {/* AI Insights Display */}
        {showInsights && (
          <AIInsightsDisplay
            isOpen={showInsights}
            onClose={() => setShowInsights(false)}
            insights={aiInsights}
            frameworkData={frameworkData}
          />
        )}

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
};