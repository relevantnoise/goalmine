import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, BookOpen, Headphones, GraduationCap, ExternalLink, Lightbulb, TrendingUp, AlertTriangle, Sparkles, X, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FullAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  frameworkData: any;
  insights: any[];
}

interface ParsedInsight {
  type: string;
  title: string;
  analysis: string;
  resources: Array<{
    type: 'book' | 'course' | 'podcast' | 'practice' | 'action';
    title: string;
    author?: string;
    platform?: string;
    description?: string;
  }>;
}

export const FullAnalysisModal = ({ isOpen, onClose, frameworkData, insights }: FullAnalysisModalProps) => {
  console.log('[FullAnalysisModal] 🚨 Component rendered with insights:', insights);
  console.log('[FullAnalysisModal] 🔍 Sample insight content:', insights?.[0]?.description || insights?.[0]?.content);
  console.log('[FullAnalysisModal] 🔍 Insights length:', insights?.length);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [parsedInsights, setParsedInsights] = useState<ParsedInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Parse the AI insights to extract resources
  useEffect(() => {
    if (insights && insights.length > 0) {
      const parsed = insights.map(insight => {
        // Split content into analysis and resources
        const content = insight.description || insight.content || '';
        const parts = content.split('IMMEDIATE RESOURCES:');
        const analysis = parts[0]?.trim() || '';
        const resourcesText = parts[1]?.trim() || '';

        // Parse resources from bullet points
        const resources: any[] = [];
        if (resourcesText) {
          const resourceLines = resourcesText.split('•').filter(line => line.trim());
          resourceLines.forEach(line => {
            const cleanLine = line.trim();
            if (cleanLine.toLowerCase().includes('book:')) {
              const bookMatch = cleanLine.match(/book:\s*'([^']+)'\s*by\s*([^•]+)/i) || 
                              cleanLine.match(/book:\s*([^•]+)/i);
              if (bookMatch) {
                resources.push({
                  type: 'book',
                  title: bookMatch[1]?.trim(),
                  author: bookMatch[2]?.trim()
                });
              }
            } else if (cleanLine.toLowerCase().includes('course:')) {
              const courseMatch = cleanLine.match(/course:\s*([^•]+)/i);
              if (courseMatch) {
                resources.push({
                  type: 'course',
                  title: courseMatch[1]?.trim()
                });
              }
            } else if (cleanLine.toLowerCase().includes('podcast:')) {
              const podcastMatch = cleanLine.match(/podcast:\s*([^•]+)/i);
              if (podcastMatch) {
                resources.push({
                  type: 'podcast',
                  title: podcastMatch[1]?.trim()
                });
              }
            } else if (cleanLine.toLowerCase().includes('practice:')) {
              const practiceMatch = cleanLine.match(/practice:\s*([^•]+)/i);
              if (practiceMatch) {
                resources.push({
                  type: 'practice',
                  title: practiceMatch[1]?.trim()
                });
              }
            } else if (cleanLine.toLowerCase().includes('action:')) {
              const actionMatch = cleanLine.match(/action:\s*([^•]+)/i);
              if (actionMatch) {
                resources.push({
                  type: 'action',
                  title: actionMatch[1]?.trim()
                });
              }
            } else if (cleanLine && !cleanLine.toLowerCase().includes('immediate resources')) {
              // Generic resource if it doesn't match specific patterns
              resources.push({
                type: 'action',
                title: cleanLine
              });
            }
          });
        }

        return {
          type: insight.insight_type || insight.type,
          title: insight.title,
          analysis,
          resources
        };
      });

      setParsedInsights(parsed);
    }
  }, [insights]);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'book': return BookOpen;
      case 'course': return GraduationCap;
      case 'podcast': return Headphones;
      case 'practice': return TrendingUp;
      case 'action': return Lightbulb;
      default: return ExternalLink;
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'book': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'course': return 'bg-green-50 border-green-200 text-green-800';
      case 'podcast': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'practice': return 'bg-pink-50 border-pink-200 text-pink-800';
      case 'action': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-primary text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Brain className="w-8 h-8" />
                Enterprise Strategic Intelligence Report
              </CardTitle>
              <p className="text-blue-100 mt-2">
                Comprehensive AI analysis of your 6 Pillars Framework™ and Business Happiness Formula™ assessments. This full intelligence report is only available to Professional Plan and Strategic Advisor Plan users.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {/* Executive Summary */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              Executive Summary
            </h3>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Based on our enterprise-grade analysis</strong> of your 6 Pillars Framework™ and Business Happiness Formula™ assessments, 
                our AI has identified {parsedInsights.length} critical strategic focus areas that will deliver maximum transformation to your life architecture.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>What makes this analysis different:</strong> Our proprietary algorithms don't just identify gaps—they read between the lines 
                to diagnose cascade effects, burnout patterns, and hidden sacrificial cycles that traditional tools miss.
              </p>
              <div className="bg-white border-l-4 border-green-500 p-4 rounded">
                <p className="text-green-800 font-medium">
                  ✨ <strong>Premium Intelligence:</strong> Each insight includes research-backed recommendations with specific books, courses, 
                  and podcasts curated for your unique assessment results. Please consider these suggestions when developing your goals.
                </p>
              </div>
            </div>
          </div>

          {/* Strategic Insights */}
          <div className="space-y-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-600" />
              Strategic Intelligence Analysis
            </h3>

            {parsedInsights.map((insight, index) => (
              <Card key={index} className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-800 mb-2">{insight.title}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {insight.type?.replace('_', ' ').toUpperCase() || 'STRATEGIC INSIGHT'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Analysis */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Strategic Analysis:</h4>
                    <p className="text-gray-700 leading-relaxed">{insight.analysis}</p>
                  </div>

                  {/* Resources */}
                  {insight.resources.length > 0 ? (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                      <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        🎯 Expert-Curated Resources
                      </h4>
                      <p className="text-green-700 text-sm mb-4">
                        Hand-selected by our AI based on your specific assessment patterns. These aren't generic recommendations—they're precisely matched to your unique situation.
                      </p>
                      <div className="grid gap-4">
                        {insight.resources.map((resource, resourceIndex) => {
                          const IconComponent = getResourceIcon(resource.type);
                          return (
                            <div
                              key={resourceIndex}
                              className={`border-2 rounded-lg p-4 ${getResourceColor(resource.type)} hover:shadow-md transition-shadow`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  <IconComponent className="w-6 h-6 mt-0.5" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-bold text-base">{resource.title}</div>
                                  {resource.author && (
                                    <div className="text-sm font-medium opacity-90 mt-1">by {resource.author}</div>
                                  )}
                                  {resource.platform && (
                                    <div className="text-sm opacity-80 mt-1">Platform: {resource.platform}</div>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary" className="text-xs font-medium capitalize">
                                      {resource.type}
                                    </Badge>
                                    <span className="text-xs text-green-600 font-medium">✨ AI-Matched</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 p-3 bg-white rounded border border-green-300">
                        <p className="text-xs text-green-700">
                          💡 <strong>Pro Tip:</strong> Start with the first resource listed—our AI ranked these based on maximum impact for your specific gaps.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                      <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        🎯 Premium Insight Analysis
                      </h4>
                      <p className="text-blue-700 text-sm mb-4">
                        This insight contains sophisticated analysis specifically tailored to your assessment data. 
                        Our AI has identified patterns and provided strategic guidance based on your unique pillar gaps and work happiness scores.
                      </p>
                      <div className="bg-white border border-blue-300 rounded-lg p-4">
                        <p className="text-xs text-blue-700">
                          💡 <strong>Enhanced Analysis:</strong> Our enterprise-grade AI diagnostics go beyond surface-level advice to identify 
                          cascade effects, burnout patterns, and strategic optimization opportunities specific to your situation.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading State - Analysis Being Generated */}
          {parsedInsights.length === 0 && (
            <div className="mt-8 p-8 bg-gradient-to-r from-blue-50 via-purple-50 to-emerald-50 border-2 border-blue-300 rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                <h4 className="font-bold text-blue-900 text-xl">🧠 Generating Your Premium Analysis</h4>
              </div>
              <div className="space-y-4 mb-6">
                <p className="text-blue-800 font-medium">
                  ✨ <strong>Enterprise AI Processing:</strong> Our advanced algorithms are analyzing your 6 Pillars Framework™ and Business Happiness Formula™ data...
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-800 mb-2">🔍 Pattern Recognition</h5>
                    <p className="text-sm text-blue-700">Identifying cascade effects, burnout signals, and hidden sacrificial patterns</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-purple-200">
                    <h5 className="font-semibold text-purple-800 mb-2">📚 Resource Curation</h5>
                    <p className="text-sm text-purple-700">Selecting specific books, courses, and podcasts matched to your gaps</p>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium text-sm">
                    ⏱️ <strong>Premium Processing:</strong> This comprehensive analysis typically takes 30-60 seconds and includes personalized resources worth $200+ in consultation value.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => window.location.reload()}
                >
                  Refresh Analysis
                </Button>
              </div>
            </div>
          )}

          {/* Call to Action - Only show if we have insights */}
          {parsedInsights.length > 0 && (
            <div className="mt-8 p-8 bg-gradient-to-r from-emerald-50 via-green-50 to-blue-50 border-2 border-emerald-300 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900 text-xl">🎯 Your Strategic Action Plan</h4>
                  <p className="text-emerald-700 text-sm">Premium analysis complete—time to transform</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-emerald-200">
                  <h5 className="font-semibold text-emerald-800 mb-2">✅ What You Now Have:</h5>
                  <ul className="text-sm text-emerald-700 space-y-1">
                    <li>• {parsedInsights.length} AI-diagnosed critical areas</li>
                    <li>• {parsedInsights.reduce((sum, insight) => sum + insight.resources.length, 0)} expert-curated resources</li>
                    <li>• Cascade effect analysis</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <h5 className="font-semibold text-blue-800 mb-2">🚀 Next Steps:</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Start with your #1 priority insight</li>
                    <li>• Get the first recommended resource</li>
                    <li>• Create targeted goals in GoalMine</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button onClick={onClose} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium">
                  <Target className="w-4 h-4 mr-2" />
                  Close Analysis & Create Strategic Goals
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};