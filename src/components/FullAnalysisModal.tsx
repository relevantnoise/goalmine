import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, BookOpen, Headphones, GraduationCap, ExternalLink, Lightbulb, TrendingUp, AlertTriangle, Sparkles, X } from "lucide-react";
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
    type: 'book' | 'course' | 'podcast' | 'app' | 'practice' | 'action';
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
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Brain className="w-8 h-8" />
                Enterprise Strategic Intelligence Report
              </CardTitle>
              <p className="text-blue-100 mt-2">
                Comprehensive AI analysis of your 6 Pillars Framework™ and Business Happiness Formula™ assessments
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
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              Executive Summary
            </h3>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-700 leading-relaxed">
                Based on our enterprise-grade analysis of your dual assessment data, we've identified {parsedInsights.length} strategic focus areas 
                that will deliver maximum impact on your life architecture. Our proprietary algorithms have analyzed your pillar gaps, 
                work happiness factors, and optimization patterns to provide research-backed recommendations with specific actionable resources.
              </p>
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
                  {insight.resources.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Immediate Action Resources:
                      </h4>
                      <div className="grid gap-3">
                        {insight.resources.map((resource, resourceIndex) => {
                          const IconComponent = getResourceIcon(resource.type);
                          return (
                            <div
                              key={resourceIndex}
                              className={`border rounded-lg p-4 ${getResourceColor(resource.type)}`}
                            >
                              <div className="flex items-start gap-3">
                                <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <div className="font-medium">{resource.title}</div>
                                  {resource.author && (
                                    <div className="text-sm opacity-80">by {resource.author}</div>
                                  )}
                                  {resource.platform && (
                                    <div className="text-sm opacity-80">Platform: {resource.platform}</div>
                                  )}
                                  <Badge variant="secondary" className="text-xs mt-1 capitalize">
                                    {resource.type}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading State - Analysis Being Generated */}
          {parsedInsights.length === 0 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <h4 className="font-bold text-blue-800">Generating Your Enhanced Analysis</h4>
              </div>
              <p className="text-blue-700 mb-4">
                Our AI is analyzing your assessment data and generating comprehensive insights with specific books, courses, podcasts, and actionable resources tailored to your unique framework profile.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => window.location.reload()}
                >
                  Refresh to Check Status
                </Button>
              </div>
            </div>
          )}

          {/* Call to Action - Only show if we have insights */}
          {parsedInsights.length > 0 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
              <h4 className="font-bold text-green-800 mb-2">Ready to Take Action?</h4>
              <p className="text-green-700 mb-4">
                Your strategic intelligence report is complete. Use these insights and resources to create targeted goals 
                that will transform your life architecture systematically.
              </p>
              <div className="flex gap-3">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Create Strategic Goals
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close Analysis
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};