import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, Brain } from "lucide-react";

interface FrameworkInsightsProps {
  frameworkData: {
    elements: Array<{
      name: string;
      current: number;
      desired: number;
      gap: number;
    }>;
  };
  onCreateGoal: (element: string) => void;
  onGetGuidance: () => void;
}

export const FrameworkInsights = ({ frameworkData, onCreateGoal, onGetGuidance }: FrameworkInsightsProps) => {
  // Smart Analysis Logic
  const biggestGap = frameworkData.elements.reduce((max, element) => 
    element.gap > max.gap ? element : max
  );

  const smallestGap = frameworkData.elements.reduce((min, element) => 
    element.gap < min.gap ? element : min
  );

  const averageGap = Math.round(
    frameworkData.elements.reduce((sum, element) => sum + element.gap, 0) / frameworkData.elements.length
  );

  const highPerformers = frameworkData.elements.filter(el => el.current >= 8);
  const strugglingAreas = frameworkData.elements.filter(el => el.current <= 4);
  const moderateAreas = frameworkData.elements.filter(el => el.current > 4 && el.current < 8);

  // Connection Intelligence - Sleep affects everything
  const sleepPillar = frameworkData.elements.find(el => el.name === 'Sleep');
  const sleepImpactsEverything = sleepPillar && sleepPillar.current < 6;

  // Work-Life Balance Analysis
  const workPillar = frameworkData.elements.find(el => el.name === 'Work');
  const familyPillar = frameworkData.elements.find(el => el.name === 'Friends & Family');
  const workLifeImbalance = workPillar && familyPillar && 
    Math.abs(workPillar.current - familyPillar.current) > 3;

  // Health Foundation Analysis
  const healthPillar = frameworkData.elements.find(el => el.name === 'Health & Fitness');
  const developmentPillar = frameworkData.elements.find(el => el.name === 'Personal Development');
  const foundationIssues = healthPillar && healthPillar.current < 5;

  const insights = [];

  // Priority Insight - Always show biggest gap
  insights.push({
    type: 'priority',
    icon: Target,
    title: `${biggestGap.name} is Your Weakest Pillar`,
    description: `With a gap of ${biggestGap.gap} points (${biggestGap.current}→${biggestGap.desired}), strengthening this pillar offers your highest potential for life improvement.`,
    action: `Strengthen ${biggestGap.name}`,
    element: biggestGap.name,
    priority: 'high'
  });

  // Sleep Intelligence
  if (sleepImpactsEverything) {
    insights.push({
      type: 'connection',
      icon: AlertTriangle,
      title: 'Sleep is Affecting Everything',
      description: `Your Sleep pillar at ${sleepPillar.current}/10 likely impacts your Work performance, Health energy, and overall life satisfaction.`,
      action: 'Improve Sleep First',
      element: 'Sleep',
      priority: 'critical'
    });
  }

  // Work-Life Balance Insight
  if (workLifeImbalance) {
    insights.push({
      type: 'balance',
      icon: TrendingDown,
      title: 'Work-Life Balance Alert',
      description: `Your Work (${workPillar.current}/10) and Family (${familyPillar.current}/10) pillars are ${Math.abs(workPillar.current - familyPillar.current)} points apart. Balanced pillars create sustainable success.`,
      action: 'Balance Work & Family',
      element: workPillar.current > familyPillar.current ? 'Friends & Family' : 'Work',
      priority: 'medium'
    });
  }

  // Foundation Health Insight
  if (foundationIssues) {
    insights.push({
      type: 'foundation',
      icon: TrendingUp,
      title: 'Strengthen Your Foundation',
      description: `Health & Fitness (${healthPillar.current}/10) is your foundational pillar. A strong foundation supports all other life pillars.`,
      action: 'Strengthen Foundation',
      element: 'Health & Fitness',
      priority: 'medium'
    });
  }

  // Strengths Insight - Show what's working
  if (highPerformers.length > 0) {
    const topElement = highPerformers[0];
    insights.push({
      type: 'strength',
      icon: TrendingUp,
      title: `${topElement.name} is Your Strongest Pillar`,
      description: `At ${topElement.current}/10, your ${topElement.name} pillar is performing well. Use this strong pillar to support improvements in other areas.`,
      action: 'Leverage This Strength',
      element: topElement.name,
      priority: 'low'
    });
  }

  // Overall Progress Insight
  if (averageGap <= 2) {
    insights.push({
      type: 'progress',
      icon: Lightbulb,
      title: 'You\'re Close to Balance',
      description: `Your average gap is only ${averageGap} points. Small improvements across all pillars will create significant life satisfaction.`,
      action: 'Fine-tune Everything',
      element: '',
      priority: 'low'
    });
  } else if (averageGap >= 5) {
    insights.push({
      type: 'transformation',
      icon: Brain,
      title: 'Major Transformation Opportunity',
      description: `Your average gap of ${averageGap} points indicates significant potential for life transformation. Focus on strengthening one pillar at a time.`,
      action: 'Start Strategic Transformation',
      element: '',
      priority: 'high'
    });
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'low': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-muted border-border text-foreground';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      case 'high': return <Badge className="text-xs bg-orange-500">High Priority</Badge>;
      case 'medium': return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case 'low': return <Badge variant="outline" className="text-xs">Strength</Badge>;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Smart Insights
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI-powered analysis of your life architecture
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {insights.slice(0, 3).map((insight, index) => {
          const IconComponent = insight.icon;
          return (
            <div key={index} className={`rounded-lg p-4 border ${getPriorityColor(insight.priority)}`}>
              <div className="flex items-start gap-3">
                <IconComponent className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    {getPriorityBadge(insight.priority)}
                  </div>
                  <p className="text-sm mb-3 leading-relaxed">{insight.description}</p>
                  
                  <div className="flex gap-2">
                    {insight.element && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onCreateGoal(insight.element)}
                        className="text-xs h-7"
                      >
                        Create {insight.element} Goal
                      </Button>
                    )}
                    {insight.priority === 'critical' || insight.priority === 'high' ? (
                      <Button 
                        size="sm" 
                        onClick={onGetGuidance}
                        className="text-xs h-7"
                      >
                        Get AI Guidance
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Overall Summary */}
        <div className="pt-3 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Average Gap:</span>
              <span className="font-medium">{averageGap} points</span>
            </div>
            <div className="flex justify-between">
              <span>Strong Pillars:</span>
              <span className="font-medium">{highPerformers.length} pillars</span>
            </div>
            <div className="flex justify-between">
              <span>Pillars to Strengthen:</span>
              <span className="font-medium">{strugglingAreas.length + moderateAreas.length} pillars</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};