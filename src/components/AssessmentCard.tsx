import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Settings, Calendar, Brain, TrendingUp, CheckCircle, ArrowRight, Edit, Loader2 } from "lucide-react";
import { WeeklyCheckin } from "./WeeklyCheckin";
import { AIGoalGuidance } from "./AIGoalGuidance";
import { GapTrends } from "./GapTrends";
import { EditFrameworkModal } from "./EditFrameworkModal";
import { AIInsightsDisplay } from "./AIInsightsDisplay";
import { FrameworkInfoModal } from "./FrameworkInfoModal";
import { useFramework } from "@/hooks/useFramework";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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
  const { toast } = useToast();
  const [showCheckin, setShowCheckin] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showFrameworkInfo, setShowFrameworkInfo] = useState(false);

  // Use the intelligent state from the hook
  const currentState = assessmentState;

  // Use real framework data or fallback
  const elements = frameworkData?.elements || [];
  const insights = frameworkData?.insights;
  
  // Debug: Log the actual data being received
  console.log('[AssessmentCard] frameworkData:', frameworkData);
  console.log('[AssessmentCard] elements:', elements);
  console.log('[AssessmentCard] insights:', frameworkData?.insights);
  console.log('[AssessmentCard] workHappiness:', frameworkData?.workHappiness);
  console.log('[AssessmentCard] hasFramework:', hasFramework);
  console.log('[AssessmentCard] assessmentState:', assessmentState);
  
  // Reset framework data function - simplified for retaking assessment
  const resetFrameworkData = async () => {
    try {
      // For production, we would call a proper reset function
      // For now, simple page reload clears cached state
      window.location.reload();
    } catch (err) {
      console.error('[RESET] Error:', err);
      toast({
        title: "Reset Failed", 
        description: "Please try again",
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

  // Auto-trigger AI insights generation when assessment is completed (real-time approach)
  useEffect(() => {
    const generateAIInsightsRealTime = async () => {
      if (currentState === 'completed' && 
          aiInsights.length === 0 && 
          !isGeneratingAI &&
          user?.email) {
        
        console.log('[AssessmentCard] Auto-triggering real-time AI insights generation...');
        setIsGeneratingAI(true);
        
        try {
          // Use the real-time generation function that worked in our tests
          const { data, error } = await supabase.functions.invoke('generate-ai-direct-return', {
            body: { 
              userEmail: user.email
            }
          });

          if (error) {
            console.error('[AssessmentCard] AI generation error:', error);
            toast({
              title: "AI Analysis Issue",
              description: "We're working on generating your insights. Please refresh in a moment.",
              variant: "destructive"
            });
          } else if (data?.success && data.insights) {
            console.log('[AssessmentCard] AI insights generated successfully:', data.insights);
            setAiInsights(data.insights);
            toast({
              title: "AI Analysis Complete!",
              description: `Generated ${data.insights.length} personalized insights for your framework.`,
            });
          }
        } catch (err) {
          console.error('[AssessmentCard] AI generation error:', err);
          toast({
            title: "AI Generation Error",
            description: "Unable to generate insights. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsGeneratingAI(false);
        }
      }
    };

    generateAIInsightsRealTime();
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
              <h3 className="text-xl font-bold">6 Pillars of Life™ + Business Happiness Formula</h3>
              <p className="text-sm text-muted-foreground">GoalMine.ai's proprietary frameworks to transform life complexity into strategic clarity</p>
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

            {/* AI Strategic Analysis - Primary Focus */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 mb-6 border border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-6 h-6 text-purple-600" />
                <h4 className="text-lg font-semibold text-purple-800">AI Strategic Analysis</h4>
              </div>
              {aiInsights.length > 0 ? (
                <div className="space-y-4">
                  {aiInsights.slice(0, 3).map((insight: any, index: number) => (
                    <div key={insight.id || index} className="bg-white rounded-lg p-4 border border-purple-100">
                      <h5 className="font-medium text-purple-900 mb-2">{insight.title}</h5>
                      <p className="text-sm text-purple-700">{insight.content || insight.description}</p>
                    </div>
                  ))}
                  {aiInsights.length > 3 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowInsights(true)}
                      className="w-full mt-3 border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      View All {aiInsights.length} AI Insights
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-600" />
                    <p className="text-lg text-purple-700 font-medium">Generating AI Analysis...</p>
                    <p className="text-sm text-purple-600 mt-2">Analyzing your 6 Pillars framework and Business Happiness data</p>
                    <p className="text-xs text-purple-500 mt-1">This typically takes 30-60 seconds</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetFrameworkData} className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Reset & Retake Assessment
                </Button>
                <Button variant="outline" onClick={() => setShowFrameworkInfo(true)} className="flex-1">
                  Learn More About Framework
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-sm mb-2 text-blue-800">🧠 AI Analysis Complete</h4>
              <p className="text-sm text-blue-700 mb-3">
                <strong>{biggestGap.name}</strong> is your biggest opportunity (gap: -{biggestGap.gap}). 
                Poor {biggestGap.name.toLowerCase()} impacts everything else. Start here for maximum life transformation.
              </p>
              
              {aiInsights.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-semibold text-sm mb-2 text-blue-800">💡 Active Insights</h4>
                  <div className="space-y-1">
                    {aiInsights.slice(0, 2).map((insight, index) => (
                      <p key={insight.id || index} className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {insight.title}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              <h4 className="font-semibold text-sm mb-2 text-blue-800">🎯 Ready for Goals</h4>
              <p className="text-sm text-blue-700">
                Based on your framework analysis, create strategic goals that align with your biggest opportunities.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-sm mb-1 text-green-800">✅ Ready to Take Action</h4>
              <p className="text-sm text-green-700">
                Based on your assessment, you're ready to create strategic goals that will transform your life architecture.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowGuidance(true)} className="flex-1">
                  <Brain className="w-4 h-4 mr-2" />
                  See Full Analysis
                </Button>
                <Button variant="outline" onClick={() => setShowEditModal(true)}>
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
          <AIGoalGuidance 
            frameworkData={{ elements }}
            onClose={() => setShowGuidance(false)} 
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

        {/* Edit Framework Modal */}
        {showEditModal && frameworkData && (
          <EditFrameworkModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            frameworkData={frameworkData}
            onUpdate={() => {
              refetch(); // Refresh framework data
              setShowEditModal(false);
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