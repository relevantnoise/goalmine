import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Lightbulb, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AIGoalGuidanceProps {
  frameworkData: {
    elements: Array<{
      name: string;
      current: number;
      desired: number;
      gap: number;
    }>;
  };
  onClose: () => void;
}

export const AIGoalGuidance = ({ frameworkData, onClose }: AIGoalGuidanceProps) => {
  const [guidance, setGuidance] = useState<{
    analysis: string;
    goalSuggestions: string[];
    priorityReason: string;
    researchInsights: string;
    redFlags?: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const biggestGap = frameworkData.elements.reduce((max, element) => 
    element.gap > max.gap ? element : max
  );

  const generateGuidance = async () => {
    setIsGenerating(true);
    
    try {
      // Create detailed assessment summary for AI
      const assessmentSummary = frameworkData.elements.map(el => 
        `${el.name}: Current ${el.current}/10, Desired ${el.desired}/10, Gap: -${el.gap}`
      ).join('\n');

      // Detect concerning patterns
      const concerningPatterns = frameworkData.elements.filter(el => {
        // Flag unrealistic or unhealthy targets
        if (el.name === 'Sleep' && el.desired < 6) return true;
        if (el.name === 'Work' && el.desired > 9 && el.current < 5) return true;
        if (el.gap > 7) return true; // Unrealistic expectations
        return false;
      });

      const aiPrompt = `You are Dan Lynn's strategic life advisor and framework expert. Analyze this 6 Pillars assessment and provide intelligent, research-backed guidance.

ASSESSMENT DATA:
${assessmentSummary}

BIGGEST OPPORTUNITY: ${biggestGap.name} (Gap: -${biggestGap.gap})

CONCERNING PATTERNS: ${concerningPatterns.length > 0 ? concerningPatterns.map(p => `${p.name}: wants ${p.desired}/10 but currently ${p.current}/10`).join(', ') : 'None detected'}

PROVIDE:
1. KEY INSIGHT: One powerful observation about their biggest opportunity (2-3 sentences)
2. GOAL SUGGESTIONS: Three specific, actionable goals for ${biggestGap.name} (be specific, not generic)
3. PRIORITY REASON: Why ${biggestGap.name} should be their focus (mention connections to other elements)
4. RESEARCH INSIGHTS: Evidence-based guidance (studies show, research indicates, etc.)
5. RED FLAGS: If any targets seem unrealistic/unhealthy, gently challenge them with research

Be encouraging but realistic. Reference actual research when possible. Keep total response under 300 words.

Format as JSON:
{
  "analysis": "Your key insight...",
  "goalSuggestions": ["Goal 1", "Goal 2", "Goal 3"],
  "priorityReason": "Why this element first...",
  "researchInsights": "Studies show...",
  "redFlags": "Gentle challenge if needed..."
}`;

      console.log('🧠 Generating AI guidance with prompt:', aiPrompt);

      const { data, error } = await supabase.functions.invoke('generate-goal-suggestions', {
        body: { 
          prompt: aiPrompt,
          assessment: assessmentSummary,
          priority_element: biggestGap.name
        }
      });

      if (error) {
        console.error('❌ AI guidance error:', error);
        throw error;
      }

      console.log('✅ AI guidance generated:', data);
      
      // Parse the AI response
      let parsedGuidance;
      try {
        parsedGuidance = typeof data.suggestions === 'string' 
          ? JSON.parse(data.suggestions) 
          : data.suggestions;
      } catch (parseError) {
        // Fallback if JSON parsing fails
        parsedGuidance = {
          analysis: `Your biggest opportunity is ${biggestGap.name} with a ${biggestGap.gap}-point gap. This element significantly impacts your overall life satisfaction.`,
          goalSuggestions: [
            `Improve ${biggestGap.name} consistency`,
            `Create a ${biggestGap.name} optimization plan`,
            `Track ${biggestGap.name} progress daily`
          ],
          priorityReason: `Focusing on ${biggestGap.name} first will create positive ripple effects across other life pillars.`,
          researchInsights: `Research shows that ${biggestGap.name.toLowerCase()} directly correlates with overall wellbeing and life satisfaction.`
        };
      }

      setGuidance(parsedGuidance);
      
    } catch (error) {
      console.error('AI guidance error:', error);
      toast.error("Failed to generate guidance. Please try again.");
      
      // Fallback guidance
      setGuidance({
        analysis: `Your ${biggestGap.name} element shows the largest gap (-${biggestGap.gap} points). This represents a significant opportunity for improvement.`,
        goalSuggestions: [
          `Create a structured ${biggestGap.name} improvement plan`,
          `Establish daily ${biggestGap.name} habits`,
          `Track ${biggestGap.name} progress weekly`
        ],
        priorityReason: `Improving ${biggestGap.name} will have positive effects on your other life pillars.`,
        researchInsights: `Studies consistently show that ${biggestGap.name.toLowerCase()} is foundational to overall life satisfaction.`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateGuidance();
  }, []);

  if (isGenerating) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analyzing Your Framework...</h3>
            <p className="text-muted-foreground">AI is generating personalized insights and goal suggestions</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!guidance) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Your Personalized Life Architecture Analysis
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-powered insights based on your 6 Pillars assessment
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Key Analysis */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-primary mb-2">Key Insight</h3>
                <p className="text-foreground leading-relaxed">{guidance.analysis}</p>
              </div>
            </div>
          </div>

          {/* Red Flags Warning */}
          {guidance.redFlags && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-orange-800 mb-2">Important Consideration</h3>
                  <p className="text-orange-700 leading-relaxed">{guidance.redFlags}</p>
                </div>
              </div>
            </div>
          )}

          {/* Goal Suggestions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-success" />
              <h3 className="font-semibold">Suggested Goals for {biggestGap.name}</h3>
              <Badge variant="secondary">Priority Focus</Badge>
            </div>
            
            <div className="space-y-3">
              {guidance.goalSuggestions.map((suggestion, index) => (
                <div key={index} className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-success">{index + 1}</span>
                    </div>
                    <p className="text-foreground font-medium">{suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Reasoning */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Why Start Here?</h3>
            <p className="text-blue-700 leading-relaxed">{guidance.priorityReason}</p>
          </div>

          {/* Research Insights */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Research Backing</h3>
                <p className="text-muted-foreground leading-relaxed">{guidance.researchInsights}</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t">
            <div className="flex gap-3">
              <Button onClick={onClose} className="flex-1">
                Got It! Take Me to Dashboard
              </Button>
              <Button variant="outline" onClick={generateGuidance} disabled={isGenerating}>
                Generate New Analysis
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Use this guidance to create your first goal on the dashboard
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};