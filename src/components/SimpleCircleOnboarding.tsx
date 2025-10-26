import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, ArrowRight, Heart, Users, Briefcase, BookOpen, Activity, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface SimpleCircleOnboardingProps {
  onComplete: () => void;
  onBack: () => void;
}

interface TimeContext {
  work_hours_per_week: number;
  sleep_hours_per_night: number;
  commute_hours_per_week: number;
  available_hours_per_week: number;
}

interface CircleAllocation {
  circle_name: string;
  importance_level: number;
  current_hours_per_week: number;
  ideal_hours_per_week: number;
}

interface WorkHappiness {
  impact_current: number;
  impact_desired: number;
  fun_current: number;
  fun_desired: number;
  money_current: number;
  money_desired: number;
  remote_current: number;
  remote_desired: number;
}

const circles = [
  {
    name: 'Spiritual',
    icon: Heart,
    color: 'text-purple-600',
    description: 'Inner purpose, values, meaning, meditation, prayer'
  },
  {
    name: 'Friends & Family',
    icon: Users,
    color: 'text-blue-600',
    description: 'Relationships, social connections, quality time'
  },
  {
    name: 'Work',
    icon: Briefcase,
    color: 'text-green-600',
    description: 'Career, professional development, income'
  },
  {
    name: 'Personal Development',
    icon: BookOpen,
    color: 'text-orange-600',
    description: 'Learning, growth, skills, education'
  },
  {
    name: 'Health & Fitness',
    icon: Activity,
    color: 'text-red-600',
    description: 'Physical health, exercise, nutrition, energy'
  }
];

export const SimpleCircleOnboarding = ({ onComplete, onBack }: SimpleCircleOnboardingProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [timeContext, setTimeContext] = useState<TimeContext>({
    work_hours_per_week: 40,
    sleep_hours_per_night: 8,
    commute_hours_per_week: 5,
    available_hours_per_week: 0
  });

  const [circleAllocations, setCircleAllocations] = useState<Record<string, CircleAllocation>>({});
  const [workHappiness, setWorkHappiness] = useState<WorkHappiness>({
    impact_current: 5,
    impact_desired: 8,
    fun_current: 5,
    fun_desired: 8,
    money_current: 5,
    money_desired: 8,
    remote_current: 5,
    remote_desired: 8
  });

  // Calculate available hours
  useEffect(() => {
    const workHours = timeContext.work_hours_per_week;
    const sleepHours = timeContext.sleep_hours_per_night * 7;
    const commuteHours = timeContext.commute_hours_per_week;
    const totalWeekHours = 168; // 7 days * 24 hours
    
    const available = totalWeekHours - workHours - sleepHours - commuteHours;
    setTimeContext(prev => ({ ...prev, available_hours_per_week: available }));
  }, [timeContext.work_hours_per_week, timeContext.sleep_hours_per_night, timeContext.commute_hours_per_week]);

  const handleNext = () => {
    console.log('🔘 handleNext called - step:', step);
    if (step < 6) {
      console.log('➡️ Moving to next step');
      setStep(step + 1);
    } else {
      console.log('🎯 Calling handleSubmit for final step');
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const updateCircleAllocation = (circleName: string, updates: Partial<CircleAllocation>) => {
    console.log('🔄 Updating circle allocation:', circleName, updates);
    const newAllocations = {
      ...circleAllocations,
      [circleName]: {
        circle_name: circleName,
        importance_level: 5,
        current_hours_per_week: 0,
        ideal_hours_per_week: 0,
        ...circleAllocations[circleName],
        ...updates
      }
    };
    console.log('📊 New allocations:', newAllocations);
    setCircleAllocations(newAllocations);
  };

  // Calculate remaining hours for ideal allocation (with useMemo for reactivity)
  const getRemainingHours = useMemo(() => {
    const totalIdealHours = Object.values(circleAllocations).reduce(
      (sum, allocation) => sum + (allocation.ideal_hours_per_week || 0), 
      0
    );
    const remaining = timeContext.available_hours_per_week - totalIdealHours;
    console.log('💡 Calculating remaining hours:', {
      availableHours: timeContext.available_hours_per_week,
      totalIdealHours,
      remaining,
      circleAllocations
    });
    return Math.max(0, remaining);
  }, [circleAllocations, timeContext.available_hours_per_week]);

  // Calculate allocated hours for the current circle being edited
  const getAllocatedHoursExceptCurrent = (currentCircleName: string) => {
    return Object.values(circleAllocations)
      .filter(allocation => allocation.circle_name !== currentCircleName)
      .reduce((sum, allocation) => sum + (allocation.ideal_hours_per_week || 0), 0);
  };

  // Get max hours allowed for current circle
  const getMaxHoursForCircle = (circleName: string) => {
    const allocatedByOthers = getAllocatedHoursExceptCurrent(circleName);
    return Math.max(0, timeContext.available_hours_per_week - allocatedByOthers);
  };

  const handleSubmit = async () => {
    if (!user?.email) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue.",
        duration: 8000
      });
      return;
    }

    // Ensure all circles have data before submitting
    const completeCircleAllocations = {};
    circles.forEach(circle => {
      completeCircleAllocations[circle.name] = {
        circle_name: circle.name,
        importance_level: circleAllocations[circle.name]?.importance_level || 5,
        current_hours_per_week: circleAllocations[circle.name]?.current_hours_per_week || 0,
        ideal_hours_per_week: circleAllocations[circle.name]?.ideal_hours_per_week || 0
      };
    });

    console.log('🚀 Starting framework submission for:', user.email);
    console.log('📊 Time context:', timeContext);
    console.log('🎯 Complete circle allocations:', completeCircleAllocations);
    console.log('😊 Work happiness:', workHappiness);

    setIsSubmitting(true);
    
    try {
      // Save the simplified circle framework
      const { data: frameworkData, error: frameworkError } = await supabase.functions.invoke('create-simple-circle-framework', {
        body: {
          user_email: user.email,
          timeContext,
          circleAllocations: completeCircleAllocations,
          workHappiness
        }
      });

      console.log('📡 Function response:', { frameworkData, frameworkError });

      if (frameworkError) throw frameworkError;

      console.log('✅ Framework created successfully!');

      toast({
        title: "🎯 Circle Framework Created!",
        description: "Your time management framework is ready. Now let's create some goals!",
        duration: 5000
      });

      onComplete();
    } catch (error) {
      console.error('❌ Error saving circle framework:', error);
      console.error('❌ Full error details:', error);
      toast({
        title: "Oops!",
        description: error instanceof Error ? error.message : "Failed to save your framework. Please try again.",
        duration: 8000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTimeContextStep = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Time Reality Check</h3>
          <p className="text-muted-foreground">Let's understand your weekly time constraints</p>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">Work hours per week</Label>
            <Slider
              value={[timeContext.work_hours_per_week]}
              onValueChange={([value]) => setTimeContext(prev => ({ ...prev, work_hours_per_week: value }))}
              max={100}
              min={0}
              step={5}
              className="mt-2"
            />
            <div className="text-sm text-muted-foreground mt-1">{timeContext.work_hours_per_week} hours</div>
          </div>

          <div>
            <Label className="text-base font-medium">Sleep hours per night</Label>
            <Slider
              value={[timeContext.sleep_hours_per_night]}
              onValueChange={([value]) => setTimeContext(prev => ({ ...prev, sleep_hours_per_night: value }))}
              max={10}
              min={6}
              step={0.5}
              className="mt-2"
            />
            <div className="text-sm text-muted-foreground mt-1">{timeContext.sleep_hours_per_night} hours</div>
          </div>

          <div>
            <Label className="text-base font-medium">Commute hours per week</Label>
            <Slider
              value={[timeContext.commute_hours_per_week]}
              onValueChange={([value]) => setTimeContext(prev => ({ ...prev, commute_hours_per_week: value }))}
              max={20}
              min={0}
              step={1}
              className="mt-2"
            />
            <div className="text-sm text-muted-foreground mt-1">{timeContext.commute_hours_per_week} hours</div>
          </div>
        </div>

        {/* AVAILABLE HOURS DISPLAY - MATCHING STEPS 2-6 FORMAT */}
        <div style={{ 
          backgroundColor: '#dbeafe', 
          border: '3px solid #3b82f6', 
          padding: '16px', 
          borderRadius: '8px',
          margin: '16px 0'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: '#1d4ed8',
              marginBottom: '8px'
            }}>
              ⏱️ {timeContext.available_hours_per_week || 0} hours available
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#1e40af',
              fontWeight: '500'
            }}>
              Total hours per week for your 5 circles
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#3730a3',
              marginTop: '4px'
            }}>
              Work: {timeContext.work_hours_per_week || 0} | Sleep: {(timeContext.sleep_hours_per_night || 0) * 7} | Commute: {timeContext.commute_hours_per_week || 0}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCircleStep = () => {
    const currentCircleIndex = step - 2; // Steps 2-6 are circles
    const currentCircle = circles[currentCircleIndex];
    const data = circleAllocations[currentCircle.name] || {};

    const isWorkCircle = currentCircle.name === 'Work';

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <currentCircle.icon className={`w-8 h-8 ${currentCircle.color}`} />
            </div>
          </div>
          <h3 className="text-xl font-bold">{currentCircle.name}</h3>
          <p className="text-muted-foreground">{currentCircle.description}</p>
        </div>

        {/* REMAINING HOURS DISPLAY - FORCED VISIBLE */}
        <div style={{ 
          backgroundColor: '#dbeafe', 
          border: '3px solid #3b82f6', 
          padding: '16px', 
          borderRadius: '8px',
          margin: '16px 0'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: '#1d4ed8',
              marginBottom: '8px'
            }}>
              ⏱️ {getRemainingHours || 0} hours remaining
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#1e40af',
              fontWeight: '500'
            }}>
              Available for ideal allocation across all circles
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#3730a3',
              marginTop: '4px'
            }}>
              Total Available: {timeContext.available_hours_per_week || 0} | 
              Already Allocated: {(timeContext.available_hours_per_week || 0) - (getRemainingHours || 0)}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">How important is this circle to you? (1-10)</Label>
            <Slider
              value={[data.importance_level || 5]}
              onValueChange={([value]) => updateCircleAllocation(currentCircle.name, { importance_level: value })}
              max={10}
              min={1}
              step={1}
              className="mt-2"
            />
            <div className="text-sm text-muted-foreground mt-1">{data.importance_level || 5}/10</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-medium">Current weekly hours</Label>
              <Slider
                value={[data.current_hours_per_week || 0]}
                onValueChange={([value]) => updateCircleAllocation(currentCircle.name, { current_hours_per_week: value })}
                max={100}
                min={0}
                step={currentCircle.name === 'Spiritual' ? 0.5 : 1}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">{data.current_hours_per_week || 0} hours</div>
            </div>

            <div>
              <Label className="text-base font-medium">Ideal weekly hours</Label>
              <Slider
                value={[data.ideal_hours_per_week || 0]}
                onValueChange={([value]) => updateCircleAllocation(currentCircle.name, { ideal_hours_per_week: value })}
                max={getMaxHoursForCircle(currentCircle.name)}
                min={0}
                step={currentCircle.name === 'Spiritual' ? 0.5 : 1}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">
                {data.ideal_hours_per_week || 0} hours
                {getMaxHoursForCircle(currentCircle.name) === 0 && (
                  <span className="text-red-500 block">No hours remaining</span>
                )}
              </div>
            </div>
          </div>

          {isWorkCircle && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold mb-2">Business Happiness Assessment</h4>
              <p className="text-sm text-muted-foreground mb-4">
                This proven happiness formula was developed over 10 years of coaching entrepreneurs. 
                Rate your current satisfaction and desired goals across these four key dimensions of work fulfillment.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Current Level of Impact (1-10)</Label>
                    <Slider
                      value={[workHappiness.impact_current]}
                      onValueChange={([value]) => setWorkHappiness(prev => ({ ...prev, impact_current: value }))}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{workHappiness.impact_current}/10</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Desired Level of Impact (1-10)</Label>
                    <Slider
                      value={[workHappiness.impact_desired]}
                      onValueChange={([value]) => setWorkHappiness(prev => ({ ...prev, impact_desired: value }))}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{workHappiness.impact_desired}/10</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Current Level of Fun (1-10)</Label>
                    <Slider
                      value={[workHappiness.fun_current]}
                      onValueChange={([value]) => setWorkHappiness(prev => ({ ...prev, fun_current: value }))}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{workHappiness.fun_current}/10</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Desired Level of Fun (1-10)</Label>
                    <Slider
                      value={[workHappiness.fun_desired]}
                      onValueChange={([value]) => setWorkHappiness(prev => ({ ...prev, fun_desired: value }))}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{workHappiness.fun_desired}/10</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Current Satisfaction with Income (1-10)</Label>
                    <Slider
                      value={[workHappiness.money_current]}
                      onValueChange={([value]) => setWorkHappiness(prev => ({ ...prev, money_current: value }))}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{workHappiness.money_current}/10</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Desired Satisfaction with Income (1-10)</Label>
                    <Slider
                      value={[workHappiness.money_desired]}
                      onValueChange={([value]) => setWorkHappiness(prev => ({ ...prev, money_desired: value }))}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{workHappiness.money_desired}/10</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Current Ability to Work from Anywhere (1-10)</Label>
                    <Slider
                      value={[workHappiness.remote_current]}
                      onValueChange={([value]) => setWorkHappiness(prev => ({ ...prev, remote_current: value }))}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{workHappiness.remote_current}/10</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Desired Ability to Work from Anywhere (1-10)</Label>
                    <Slider
                      value={[workHappiness.remote_desired]}
                      onValueChange={([value]) => setWorkHappiness(prev => ({ ...prev, remote_desired: value }))}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{workHappiness.remote_desired}/10</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onLogoClick={onBack} />
      <div className="flex items-center justify-center px-6 pt-8">
        <Card className="w-full max-w-2xl border border-border shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className={`w-3 h-3 rounded-full transition-colors ${
                    i <= step ? 'bg-primary' : 'bg-border'
                  }`} />
                ))}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-card-foreground">
              {step === 1 && "Time Management Setup"}
              {step === 2 && "Spiritual Circle"}
              {step === 3 && "Friends & Family Circle"}
              {step === 4 && "Work Circle"}
              {step === 5 && "Personal Development Circle"}
              {step === 6 && "Health & Fitness Circle"}
            </CardTitle>
            <p className="text-muted-foreground">
              {step === 1 ? "Let's understand your weekly time allocation" : `Step ${step} of 6 - Quick circle setup`}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 ? renderTimeContextStep() : renderCircleStep()}

            <div className="flex gap-4 pt-6">
              <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isSubmitting}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {step === 1 ? 'Back' : 'Previous'}
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={isSubmitting || (step === 6 && getRemainingHours < 0)} 
                className="flex-1 bg-primary hover:bg-primary-hover"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                    Creating Framework...
                  </>
                ) : (
                  <>
                    {step === 6 ? 'Create Framework' : 'Next'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
            
            {step === 6 && getRemainingHours < 0 && (
              <div className="text-center text-red-600 text-sm mt-2">
                ⚠️ You've allocated {Math.abs(getRemainingHours)} more hours than available. Please adjust your ideal hours.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};