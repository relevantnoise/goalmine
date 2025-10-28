import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface GapTrendsProps {
  frameworkData: {
    elements: Array<{
      name: string;
      current: number;
      desired: number;
      gap: number;
    }>;
  };
}

export const GapTrends = ({ frameworkData }: GapTrendsProps) => {
  // Mock trend data - in real implementation, this would come from weekly_checkins
  const mockTrends = {
    'Work': { previousWeek: 7, trend: 'up' },
    'Sleep': { previousWeek: 2, trend: 'up' },
    'Friends & Family': { previousWeek: 6, trend: 'stable' },
    'Health & Fitness': { previousWeek: 4, trend: 'down' },
    'Personal Development': { previousWeek: 4, trend: 'stable' },
    'Spiritual': { previousWeek: 7, trend: 'stable' }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-red-600" />;
      default: return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getTrendText = (element: any, trend: string) => {
    if (trend === 'stable') return 'No change';
    const change = element.current - mockTrends[element.name as keyof typeof mockTrends]?.previousWeek || 0;
    return trend === 'up' ? `+${change} this week` : `${change} this week`;
  };

  // Sort by gap size for better visualization
  const sortedElements = [...frameworkData.elements].sort((a, b) => b.gap - a.gap);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Weekly Progress</CardTitle>
        <p className="text-sm text-muted-foreground">
          Track your pillar strengthening over time
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {sortedElements.map((element) => {
          const trend = mockTrends[element.name as keyof typeof mockTrends];
          return (
            <div key={element.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium min-w-[120px]">
                  {element.name}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold">{element.current}</span>
                  <span className="text-xs text-muted-foreground">/10</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {getTrendIcon(trend?.trend || 'stable')}
                  <span className={`text-xs ${getTrendColor(trend?.trend || 'stable')}`}>
                    {getTrendText(element, trend?.trend || 'stable')}
                  </span>
                </div>
                <Badge 
                  variant={element.gap > 4 ? "destructive" : element.gap > 2 ? "secondary" : "default"} 
                  className="text-xs"
                >
                  Gap: -{element.gap}
                </Badge>
              </div>
            </div>
          );
        })}
        
        {/* Summary */}
        <div className="pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Strengthen your weakest pillars first for maximum life impact
          </div>
        </div>
      </CardContent>
    </Card>
  );
};