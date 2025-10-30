import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Settings, Calendar, Brain, TrendingUp, Loader2 } from "lucide-react";
import { WeeklyCheckin } from "./WeeklyCheckin";
import { AIGoalGuidance } from "./AIGoalGuidance";
import { GapTrends } from "./GapTrends";
import { useFramework } from "@/hooks/useFramework";
import { supabase } from "@/integrations/supabase/client";

interface FrameworkOverviewProps {
  onEditFramework: () => void;
  onWeeklyCheckin?: () => void;
}

export const FrameworkOverview = ({ onEditFramework, onWeeklyCheckin }: FrameworkOverviewProps) => {
  const [showCheckin, setShowCheckin] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  
  const { frameworkData, loading, error, hasFramework } = useFramework();
  
  const debugData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('debug-framework-data');
      console.log('[DEBUG] Raw response:', data, error);
      alert('Check console for debug data');
    } catch (err) {
      console.error('[DEBUG] Error:', err);
    }
  };
  
  // Show loading state while fetching data
  if (loading) {
    return (
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading your framework...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state or no framework message
  if (!hasFramework || !frameworkData) {
    return (
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Complete Your 6 Pillars Assessment</h3>
            <p className="text-muted-foreground mb-4">
              Get started with your personalized life architecture framework
            </p>
            <Button onClick={debugData} variant="outline">
              🐛 Debug Data
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const elements = frameworkData.elements;
  const biggestGap = elements.reduce((max, element) => 
    element.gap > max.gap ? element : max
  );

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Your 6 Pillars of Life™ Framework</h3>
              <p className="text-sm text-muted-foreground">Balanced life architecture platform</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onEditFramework}>
            <Settings className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Pillars Progress */}
        <div className="space-y-3 mb-6">
          {elements.map((pillar, index) => (
            <div key={pillar.name} className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-right">
                {pillar.name}:
              </div>
              <div className="flex-1 relative">
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(pillar.current / 10) * 100}%` }}
                  />
                </div>
                <div className="absolute right-0 top-0 h-2 w-1 bg-primary/30" 
                     style={{ right: `${100 - (pillar.desired / 10) * 100}%` }} />
              </div>
              <div className="text-sm text-muted-foreground w-16">
                {pillar.current}/10
              </div>
              <Badge variant={pillar.gap > 4 ? "destructive" : pillar.gap > 2 ? "secondary" : "default"} className="text-xs">
                Gap: -{pillar.gap}
              </Badge>
            </div>
          ))}
        </div>

        {/* Insight */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-sm mb-1">💡 Smart Architecture Insight</h4>
          <p className="text-sm text-muted-foreground">
            Your <strong>{biggestGap.name}</strong> pillar shows the greatest potential for improvement ({biggestGap.current}→{biggestGap.desired}). 
            Strengthening this foundational pillar will create positive ripple effects across your entire life architecture.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Button onClick={() => setShowCheckin(true)} className="flex-1">
              <Calendar className="w-4 h-4 mr-2" />
              Weekly Check-in Due
            </Button>
            <Button variant="outline" onClick={() => setShowGuidance(true)}>
              <Brain className="w-4 h-4 mr-2" />
              Get AI Guidance
            </Button>
          </div>
          <Button variant="ghost" onClick={() => setShowTrends(true)} className="w-full text-sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            View Progress Trends
          </Button>
        </div>

        {/* Weekly Check-in Modal */}
        {showCheckin && (
          <WeeklyCheckin onClose={() => setShowCheckin(false)} />
        )}

        {/* AI Goal Guidance Modal */}
        {showGuidance && (
          <AIGoalGuidance 
            frameworkData={{ elements }}
            onClose={() => setShowGuidance(false)} 
          />
        )}

        {/* Gap Trends Modal */}
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
      </CardContent>
    </Card>
  );
};