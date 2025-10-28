import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Eye, Flame, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useCircleCheckin } from "@/hooks/useCircleCheckin";
import { useWeeklyStreak } from "@/hooks/useWeeklyStreak";

interface FrameworkCardProps {
  framework: any; // The goal object that represents the framework
  onViewFramework: () => void;
  onEditFramework: () => void;
  onCircleCheckin?: () => void;
}

export const FrameworkCard = ({ framework, onViewFramework, onEditFramework, onCircleCheckin }: FrameworkCardProps) => {
  const { checkinStatus } = useCircleCheckin();
  const { weeklyStreak, refreshWeeklyStreak } = useWeeklyStreak();
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Debug logging for check-in button
  console.log('🔍 FrameworkCard debug:', {
    onCircleCheckin: !!onCircleCheckin,
    checkinStatus,
    needsCheckin: checkinStatus.needsCheckin
  });

  const handleWeeklyCheckin = async () => {
    if (!onCircleCheckin) return;
    
    setIsCheckingIn(true);
    try {
      await onCircleCheckin();
      // Refresh the weekly streak after successful check-in
      refreshWeeklyStreak();
    } finally {
      setIsCheckingIn(false);
    }
  };
  return (
    <Card className="border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm relative overflow-hidden">
      {/* Subtle top accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-hover"></div>
      
      <CardContent className="p-6 relative">
        {/* Header - Framework Indicator */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm">
              <div className="text-2xl">🎯</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-xl text-foreground">
                  6 Elements of Life™ Framework Complete
                </h3>
                {/* Weekly Streak Info */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium text-gray-700">{weeklyStreak} week streak</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Your personalized life management system is now configured with 6 elements and business happiness metrics.
              </p>
            </div>
          </div>
          
          {/* Edit button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditFramework}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4" />
            Edit
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <Button 
            onClick={onViewFramework}
            className="flex-1 bg-primary hover:bg-primary-hover text-white font-medium shadow-sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Your 6 Elements Framework
          </Button>
          
          {/* Weekly Check-in Button */}
          {onCircleCheckin && (
            <Button 
              onClick={handleWeeklyCheckin}
              disabled={isCheckingIn}
              className="bg-primary hover:bg-primary-hover text-white font-medium shadow-sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isCheckingIn ? 'Checking In...' : 'Check In This Week'}
            </Button>
          )}
        </div>

        {/* Framework Details */}
        <div className="bg-muted/30 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between text-sm mb-3">
            <div className="flex items-center gap-2">
              <span className="text-foreground font-medium">📅 Established:</span>
              <span className="text-muted-foreground">
                {framework.created_at 
                  ? new Date(framework.created_at).toLocaleDateString()
                  : new Date().toLocaleDateString()
                }
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-foreground font-medium">
              ⚖️ Balanced approach to Work • Sleep • Family • Health • Growth • Spirit
            </div>
            <div className="text-sm text-muted-foreground">
              🗓️ Weekly reflection keeps all life elements in harmony
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};