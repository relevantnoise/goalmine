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
    <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 shadow-lg ring-1 ring-purple-200/50 relative overflow-hidden">
      {/* Decorative elements for visual distinction */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-bl-full"></div>
      
      <CardContent className="p-6 relative z-10">
        {/* Header - Framework Indicator */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center border border-purple-200 shadow-sm">
              <div className="text-2xl">🎯</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 font-semibold text-xs">
                  LIFE FRAMEWORK
                </Badge>
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-xl text-gray-900">
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
              <p className="text-sm text-gray-700 mt-1 font-medium">
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
        <div className="flex gap-3 mb-4">
          <Button 
            onClick={onViewFramework}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-md"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Your 6 Elements Framework
          </Button>
          
          {/* Weekly Check-in Button */}
          {onCircleCheckin && checkinStatus.needsCheckin && (
            <Button 
              onClick={handleWeeklyCheckin}
              disabled={isCheckingIn}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-md"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isCheckingIn ? 'Checking In...' : 'Check In This Week'}
            </Button>
          )}
        </div>

        {/* Framework Details */}
        <div className="bg-white/50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center justify-between text-sm mb-3">
            <div className="flex items-center gap-2">
              <span className="text-purple-700 font-semibold">🎯 Target:</span>
              <span className="text-gray-700 font-medium">{framework.target_date || 'Ongoing'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border-purple-200 font-semibold">
                Wise Mentor Style
              </Badge>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-gray-700 font-medium">
              ✉️ You'll receive your daily wake-up call
            </div>
            <div className="text-sm text-gray-600">
              🗓️ Weekly check-ins help maintain life balance
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};