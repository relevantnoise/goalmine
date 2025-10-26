import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Heart, Users, Briefcase, BookOpen, Activity, Calendar, TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCircleFramework, CircleAllocation } from "@/hooks/useCircleFramework";

interface WeeklyCircleCheckinProps {
  onComplete: () => void;
  onSkip?: () => void;
}

interface CircleCheckinData {
  circle_name: string;
  ideal_hours: number;
  actual_hours: number;
  percentage: number;
  status: 'balanced' | 'under' | 'over';
}

const circles = [
  {
    name: 'Spiritual',
    icon: Heart,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Prayer, meditation, values, purpose'
  },
  {
    name: 'Friends & Family',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Relationships, social time, family'
  },
  {
    name: 'Work',
    icon: Briefcase,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Career, professional development'
  },
  {
    name: 'Personal Development',
    icon: BookOpen,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: 'Learning, growth, education'
  },
  {
    name: 'Health & Fitness',
    icon: Activity,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    description: 'Exercise, nutrition, wellbeing'
  }
];

export const WeeklyCircleCheckin = ({ onComplete, onSkip }: WeeklyCircleCheckinProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fullData } = useCircleFramework();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [circleData, setCircleData] = useState<CircleCheckinData[]>([]);
  const [currentWeek, setCurrentWeek] = useState<string>('');

  // Get current week date (Monday of this week)
  useEffect(() => {
    const now = new Date();
    const monday = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    monday.setDate(diff);
    setCurrentWeek(monday.toISOString().split('T')[0]);
  }, []);

  // Initialize circle data from framework
  useEffect(() => {
    if (fullData?.allocations) {
      const initialData = circles.map(circle => {
        const allocation = fullData.allocations.find(a => a.circle_name === circle.name);
        const idealHours = allocation?.ideal_hours_per_week || 5;
        
        return {
          circle_name: circle.name,
          ideal_hours: idealHours,
          actual_hours: idealHours, // Start with ideal as default
          percentage: 100,
          status: 'balanced' as const
        };
      });
      setCircleData(initialData);
    }
  }, [fullData]);

  const updateCircleHours = (circleName: string, hours: number) => {
    setCircleData(prev => prev.map(circle => {
      if (circle.circle_name === circleName) {
        const percentage = circle.ideal_hours > 0 ? Math.round((hours / circle.ideal_hours) * 100) : 100;
        let status: 'balanced' | 'under' | 'over' = 'balanced';
        
        if (percentage < 70) status = 'under';
        else if (percentage > 130) status = 'over';
        else if (percentage < 90 || percentage > 110) status = percentage < 90 ? 'under' : 'over';
        
        return {
          ...circle,
          actual_hours: hours,
          percentage,
          status
        };
      }
      return circle;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'balanced': return 'text-green-600';
      case 'under': return 'text-red-600';
      case 'over': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'balanced': return CheckCircle;
      case 'under': return TrendingDown;
      case 'over': return TrendingUp;
      default: return CheckCircle;
    }
  };

  const getStatusText = (percentage: number, status: string) => {
    if (status === 'balanced') return `${percentage}% - Balanced`;
    if (status === 'under') return `${percentage}% - Under ideal`;
    return `${percentage}% - Over ideal`;
  };

  const handleSubmit = async () => {
    if (!user?.email || !fullData?.framework) return;

    setIsSubmitting(true);
    try {
      console.log('💾 Saving weekly circle check-in...');

      const { data, error } = await supabase.functions.invoke('save-circle-checkin', {
        body: {
          user_email: user.email,
          framework_id: fullData.framework.id,
          week_date: currentWeek,
          circle_data: circleData
        }
      });

      if (error) {
        console.error('Error saving circle check-in:', error);
        throw error;
      }

      console.log('✅ Circle check-in saved successfully');
      
      toast({
        title: "✅ Circle Check-in Complete!",
        description: "Your weekly circle balance has been recorded. Keep up the great work!",
        duration: 5000
      });

      onComplete();
    } catch (error) {
      console.error('Error saving circle check-in:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save your circle check-in. Please try again.",
        duration: 8000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalIdealHours = circleData.reduce((sum, circle) => sum + circle.ideal_hours, 0);
  const totalActualHours = circleData.reduce((sum, circle) => sum + circle.actual_hours, 0);
  const overallBalance = totalIdealHours > 0 ? Math.round((totalActualHours / totalIdealHours) * 100) : 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-3 text-2xl">
            <Calendar className="w-7 h-7 text-blue-600" />
            Weekly Circle Check-in
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            How did you balance your 5 circles this week? Move the sliders to show actual hours spent.
          </p>
          <div className="text-sm text-muted-foreground">
            Week of {new Date(currentWeek).toLocaleDateString()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Overall Balance Summary */}
          <div className="bg-primary/5 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {overallBalance}%
            </div>
            <div className="text-sm text-muted-foreground">
              Overall balance ({totalActualHours} of {totalIdealHours} ideal hours)
            </div>
          </div>

          {/* Individual Circle Check-ins */}
          <div className="grid gap-6">
            {circleData.map((circle, index) => {
              const circleInfo = circles[index];
              const IconComponent = circleInfo.icon;
              const StatusIcon = getStatusIcon(circle.status);
              
              return (
                <Card key={circle.circle_name} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${circleInfo.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className={`w-6 h-6 ${circleInfo.color}`} />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{circle.circle_name}</h3>
                          <p className="text-sm text-muted-foreground">{circleInfo.description}</p>
                        </div>
                        <div className="text-right">
                          <div className={`flex items-center gap-1 text-sm font-medium ${getStatusColor(circle.status)}`}>
                            <StatusIcon className="w-4 h-4" />
                            {getStatusText(circle.percentage, circle.status)}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">
                          Hours spent this week (Ideal: {circle.ideal_hours} hrs)
                        </Label>
                        <div className="mt-2 space-y-2">
                          <Slider
                            value={[circle.actual_hours]}
                            onValueChange={(value) => updateCircleHours(circle.circle_name, value[0])}
                            max={Math.max(100, circle.ideal_hours * 2)}
                            min={0}
                            step={0.5}
                            className="w-full"
                          />
                          <div className="text-center text-lg font-semibold text-primary">
                            {circle.actual_hours} hours
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            {onSkip && (
              <Button variant="outline" onClick={onSkip}>
                Skip This Week
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Complete Check-in
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};