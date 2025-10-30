import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  X, 
  CheckCircle,
  AlertTriangle,
  Star,
  Clock
} from "lucide-react";

interface AIInsight {
  id: string;
  insight_type: string;
  title: string;
  content: string;
  priority: number;
  is_read: boolean;
  created_at: string;
  expires_at?: string;
  metadata?: any;
}

interface AIInsightsDisplayProps {
  isOpen: boolean;
  onClose: () => void;
  insights: AIInsight[];
  frameworkData?: any;
}

const insightIcons = {
  gap_analysis: AlertTriangle,
  goal_suggestion: Target,
  celebration: Star,
  trend_alert: TrendingUp
};

const priorityColors = {
  1: 'bg-green-100 text-green-800 border-green-200',
  2: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
  3: 'bg-red-100 text-red-800 border-red-200'
};

const priorityLabels = {
  1: 'Low Priority',
  2: 'Medium Priority',
  3: 'High Priority'
};

export const AIInsightsDisplay = ({ 
  isOpen, 
  onClose, 
  insights, 
  frameworkData 
}: AIInsightsDisplayProps) => {
  
  const sortedInsights = insights?.sort((a, b) => {
    // Sort by priority (high to low), then by creation date (newest first)
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return expiryDate <= threeDaysFromNow;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Your AI Insights & Recommendations
          </DialogTitle>
          <DialogDescription>
            Personalized analysis based on your 6 Pillars Framework™ assessment
          </DialogDescription>
        </DialogHeader>

        {sortedInsights.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Insights Yet</h3>
            <p className="text-muted-foreground">
              Generate AI insights from your framework assessment to see personalized recommendations here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedInsights.map((insight) => {
              const Icon = insightIcons[insight.insight_type as keyof typeof insightIcons] || Brain;
              const priorityClass = priorityColors[insight.priority as keyof typeof priorityColors];
              const priorityLabel = priorityLabels[insight.priority as keyof typeof priorityLabels];
              const isExpiring = isExpiringSoon(insight.expires_at);
              
              return (
                <Card key={insight.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${priorityClass}`}>
                              {priorityLabel}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(insight.created_at)}
                            </span>
                            {isExpiring && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Expires Soon
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {!insight.is_read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm leading-relaxed mb-4">
                      {insight.content}
                    </p>
                    
                    {insight.metadata && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground space-y-1">
                          {insight.metadata.element_name && (
                            <div>Focus Area: <span className="font-medium">{insight.metadata.element_name}</span></div>
                          )}
                          {insight.metadata.gap_value && (
                            <div>Gap Size: <span className="font-medium">{insight.metadata.gap_value} points</span></div>
                          )}
                          {insight.metadata.suggested_goals && (
                            <div>
                              Suggested Goals: 
                              <ul className="mt-1 space-y-1 ml-2">
                                {insight.metadata.suggested_goals.map((goal: string, index: number) => (
                                  <li key={index} className="text-xs">• {goal}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {sortedInsights.length > 0 && (
              <span>{sortedInsights.length} insight{sortedInsights.length !== 1 ? 's' : ''} available</span>
            )}
          </div>
          
          <Button onClick={onClose}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};