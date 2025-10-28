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
    <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardContent className="p-6">
        {/* Header - No "Goal" label */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎯</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg text-gray-900">
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
              <p className="text-sm text-gray-600 mt-1">
                Your personalized life management system is now configured with 6 elements and business happiness metrics.
              </p>
            </div>
          </div>
          
          {/* Edit button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onEditFramework}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Edit
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={onViewFramework}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Your 6 Elements Framework
          </Button>
          
          {/* Weekly Check-in Button */}
          {onCircleCheckin && checkinStatus.needsCheckin && (
            <Button 
              onClick={handleWeeklyCheckin}
              disabled={isCheckingIn}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isCheckingIn ? 'Checking In...' : 'Check In This Week'}
            </Button>
          )}
        </div>

        {/* Framework Details */}
        <div className="mt-4 pt-4 border-t border-purple-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-purple-600 font-medium">🎯 Target:</span>
              <span className="text-gray-600">{framework.target_date || 'Ongoing'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Wise Mentor Style
              </Badge>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            ✉️ You'll receive your daily wake-up call
          </div>
          <div className="text-sm text-gray-500">
            🗓️ Weekly check-ins help maintain life balance
          </div>
        </div>
      </CardContent>
    </Card>
  );
};