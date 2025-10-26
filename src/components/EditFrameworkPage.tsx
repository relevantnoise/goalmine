import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, ArrowRight, Heart, Users, Briefcase, BookOpen, Activity, Clock, Save, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface EditFrameworkPageProps {
  onComplete: () => void;
  onCancel: () => void;
  frameworkData?: any;
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
    color: 'text-green-600',
    description: 'Relationships, social connections, quality time'
  },
  {
    name: 'Work',
    icon: Briefcase,
    color: 'text-blue-600',
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
    description: 'Physical wellbeing, exercise, nutrition'
  }
];

export const EditFrameworkPage = ({ onComplete, onCancel, frameworkData }: EditFrameworkPageProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize with existing data or defaults
  const [timeContext, setTimeContext] = useState<TimeContext>({
    work_hours_per_week: 40,
    sleep_hours_per_night: 8,
    commute_hours_per_week: 5,
    available_hours_per_week: 0
  });

  const [circleAllocations, setCircleAllocations] = useState<CircleAllocation[]>(
    circles.map(circle => ({
      circle_name: circle.name,
      importance_level: 5,
      current_hours_per_week: 5,
      ideal_hours_per_week: 8
    }))
  );

  const [workHappiness, setWorkHappiness] = useState<WorkHappiness>({
    impact_current: 5, impact_desired: 8,
    fun_current: 5, fun_desired: 8,
    money_current: 5, money_desired: 8,
    remote_current: 5, remote_desired: 8
  });

  // Load existing framework data
  useEffect(() => {
    const loadFrameworkData = async () => {
      if (!user?.email) return;

      try {
        setIsLoading(true);
        
        // Load framework basic data
        const { data: frameworkData, error: frameworkError } = await supabase
          .from('user_circle_frameworks')
          .select('*')
          .eq('user_email', user.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (frameworkError) {
          console.error('Error loading framework:', frameworkError);
          return;
        }

        if (frameworkData) {
          setTimeContext({
            work_hours_per_week: frameworkData.work_hours_per_week || 40,
            sleep_hours_per_night: frameworkData.sleep_hours_per_night || 8,
            commute_hours_per_week: frameworkData.commute_hours_per_week || 5,
            available_hours_per_week: frameworkData.available_hours_per_week || 0
          });

          // Load circle allocations
          const { data: allocations, error: allocError } = await supabase
            .from('circle_time_allocations')
            .select('*')
            .eq('framework_id', frameworkData.id);

          if (!allocError && allocations) {
            setCircleAllocations(
              circles.map(circle => {
                const existing = allocations.find(a => a.circle_name === circle.name);
                return existing ? {
                  circle_name: circle.name,
                  importance_level: existing.importance_level,
                  current_hours_per_week: existing.current_hours_per_week,
                  ideal_hours_per_week: existing.ideal_hours_per_week
                } : {
                  circle_name: circle.name,
                  importance_level: 5,
                  current_hours_per_week: 5,
                  ideal_hours_per_week: 8
                };
              })
            );
          }

          // Load work happiness metrics
          const { data: happiness, error: happinessError } = await supabase
            .from('work_happiness_metrics')
            .select('*')
            .eq('framework_id', frameworkData.id)
            .maybeSingle();

          if (!happinessError && happiness) {
            setWorkHappiness({
              impact_current: happiness.impact_current,
              impact_desired: happiness.impact_desired,
              fun_current: happiness.fun_current,
              fun_desired: happiness.fun_desired,
              money_current: happiness.money_current,
              money_desired: happiness.money_desired,
              remote_current: happiness.remote_current,
              remote_desired: happiness.remote_desired
            });
          }
        }
      } catch (error) {
        console.error('Error loading framework data:', error);
        toast({
          title: "Loading Error",
          description: "Could not load your framework data. Please try again.",
          duration: 5000
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFrameworkData();
  }, [user?.email, toast]);

  // Calculate available hours
  useEffect(() => {
    const weeklyWorkHours = timeContext.work_hours_per_week;
    const weeklySleepHours = timeContext.sleep_hours_per_night * 7;
    const weeklyCommuteHours = timeContext.commute_hours_per_week;
    const totalWeeklyHours = 168; // 7 days * 24 hours
    
    const availableHours = totalWeeklyHours - weeklyWorkHours - weeklySleepHours - weeklyCommuteHours;
    
    setTimeContext(prev => ({
      ...prev,
      available_hours_per_week: Math.max(0, availableHours)
    }));
  }, [timeContext.work_hours_per_week, timeContext.sleep_hours_per_night, timeContext.commute_hours_per_week]);

  const handleSaveChanges = async () => {
    if (!user?.email) return;

    setIsSubmitting(true);
    try {
      console.log('💾 Saving framework changes...');

      const { data, error } = await supabase.functions.invoke('update-circle-framework', {
        body: {
          user_email: user.email,
          timeContext,
          circleAllocations,
          workHappiness
        }
      });

      if (error) {
        console.error('Error updating framework:', error);
        throw error;
      }

      console.log('✅ Framework updated successfully');
      
      toast({
        title: "✅ Framework Updated!",
        description: "Your 5 Circle Framework™ has been updated successfully.",
        duration: 5000
      });

      onComplete();
    } catch (error) {
      console.error('Error saving framework changes:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update your framework. Please try again.",
        duration: 8000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          onLogoClick={() => navigate('/')}
          showAuthButton={false}
        />
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your framework...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const maxSteps = 6; // Same as onboarding: time + 5 circles

  const nextStep = () => {
    if (step < maxSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateCircleAllocation = (circleName: string, field: keyof CircleAllocation, value: number) => {
    setCircleAllocations(prev => 
      prev.map(allocation => 
        allocation.circle_name === circleName 
          ? { ...allocation, [field]: value }
          : allocation
      )
    );
  };

  const renderTimeRealityStep = () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-blue-600" />
          Edit Your Time Reality
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium">Work Hours Per Week</Label>
          <div className="mt-2 space-y-2">
            <Slider
              value={[timeContext.work_hours_per_week]}
              onValueChange={(value) => setTimeContext(prev => ({ ...prev, work_hours_per_week: value[0] }))}
              max={100}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="text-center text-lg font-semibold text-primary">
              {timeContext.work_hours_per_week} hours/week
            </div>
          </div>
        </div>

        <div>
          <Label className="text-base font-medium">Sleep Hours Per Night</Label>
          <div className="mt-2 space-y-2">
            <Slider
              value={[timeContext.sleep_hours_per_night]}
              onValueChange={(value) => setTimeContext(prev => ({ ...prev, sleep_hours_per_night: value[0] }))}
              max={12}
              min={4}
              step={0.5}
              className="w-full"
            />
            <div className="text-center text-lg font-semibold text-primary">
              {timeContext.sleep_hours_per_night} hours/night
            </div>
          </div>
        </div>

        <div>
          <Label className="text-base font-medium">Commute Hours Per Week</Label>
          <div className="mt-2 space-y-2">
            <Slider
              value={[timeContext.commute_hours_per_week]}
              onValueChange={(value) => setTimeContext(prev => ({ ...prev, commute_hours_per_week: value[0] }))}
              max={100}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="text-center text-lg font-semibold text-primary">
              {timeContext.commute_hours_per_week} hours/week
            </div>
          </div>
        </div>

        <div className="bg-primary/5 p-4 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {timeContext.available_hours_per_week} hours
            </div>
            <div className="text-sm text-muted-foreground">
              Available per week for your 5 circles
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCircleStep = (circleIndex: number) => {
    const circle = circles[circleIndex];
    const allocation = circleAllocations.find(a => a.circle_name === circle.name) || circleAllocations[circleIndex];
    const IconComponent = circle.icon;

    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <IconComponent className={`w-6 h-6 ${circle.color}`} />
            Edit {circle.name} Circle
          </CardTitle>
          <p className="text-muted-foreground">{circle.description}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium">How important is this circle to you? (1-10)</Label>
            <div className="mt-2 space-y-2">
              <Slider
                value={[allocation.importance_level]}
                onValueChange={(value) => updateCircleAllocation(circle.name, 'importance_level', value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="text-center text-lg font-semibold text-primary">
                {allocation.importance_level}/10
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Hours currently spent per week</Label>
            <div className="mt-2 space-y-2">
              <Slider
                value={[allocation.current_hours_per_week]}
                onValueChange={(value) => updateCircleAllocation(circle.name, 'current_hours_per_week', value[0])}
                max={100}
                min={0}
                step={0.5}
                className="w-full"
              />
              <div className="text-center text-lg font-semibold text-primary">
                {allocation.current_hours_per_week} hours/week
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Ideal hours you'd like to spend per week</Label>
            <div className="mt-2 space-y-2">
              <Slider
                value={[allocation.ideal_hours_per_week]}
                onValueChange={(value) => updateCircleAllocation(circle.name, 'ideal_hours_per_week', value[0])}
                max={100}
                min={0}
                step={0.5}
                className="w-full"
              />
              <div className="text-center text-lg font-semibold text-primary">
                {allocation.ideal_hours_per_week} hours/week
              </div>
            </div>
          </div>

          {circle.name === 'Work' && (
            <div className="border-t pt-6 space-y-6">
              <h3 className="font-semibold text-lg">Work Happiness Formula</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium">Impact - Current Level</Label>
                  <Slider
                    value={[workHappiness.impact_current]}
                    onValueChange={(value) => setWorkHappiness(prev => ({ ...prev, impact_current: value[0] }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full mt-2"
                  />
                  <div className="text-center text-sm font-medium text-primary mt-1">
                    {workHappiness.impact_current}/10
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Impact - Desired Level</Label>
                  <Slider
                    value={[workHappiness.impact_desired]}
                    onValueChange={(value) => setWorkHappiness(prev => ({ ...prev, impact_desired: value[0] }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full mt-2"
                  />
                  <div className="text-center text-sm font-medium text-primary mt-1">
                    {workHappiness.impact_desired}/10
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Fun - Current Level</Label>
                  <Slider
                    value={[workHappiness.fun_current]}
                    onValueChange={(value) => setWorkHappiness(prev => ({ ...prev, fun_current: value[0] }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full mt-2"
                  />
                  <div className="text-center text-sm font-medium text-primary mt-1">
                    {workHappiness.fun_current}/10
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Fun - Desired Level</Label>
                  <Slider
                    value={[workHappiness.fun_desired]}
                    onValueChange={(value) => setWorkHappiness(prev => ({ ...prev, fun_desired: value[0] }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full mt-2"
                  />
                  <div className="text-center text-sm font-medium text-primary mt-1">
                    {workHappiness.fun_desired}/10
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Money - Current Level</Label>
                  <Slider
                    value={[workHappiness.money_current]}
                    onValueChange={(value) => setWorkHappiness(prev => ({ ...prev, money_current: value[0] }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full mt-2"
                  />
                  <div className="text-center text-sm font-medium text-primary mt-1">
                    {workHappiness.money_current}/10
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Money - Desired Level</Label>
                  <Slider
                    value={[workHappiness.money_desired]}
                    onValueChange={(value) => setWorkHappiness(prev => ({ ...prev, money_desired: value[0] }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full mt-2"
                  />
                  <div className="text-center text-sm font-medium text-primary mt-1">
                    {workHappiness.money_desired}/10
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Remote Work - Current</Label>
                  <Slider
                    value={[workHappiness.remote_current]}
                    onValueChange={(value) => setWorkHappiness(prev => ({ ...prev, remote_current: value[0] }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full mt-2"
                  />
                  <div className="text-center text-sm font-medium text-primary mt-1">
                    {workHappiness.remote_current}/10
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Remote Work - Desired</Label>
                  <Slider
                    value={[workHappiness.remote_desired]}
                    onValueChange={(value) => setWorkHappiness(prev => ({ ...prev, remote_desired: value[0] }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full mt-2"
                  />
                  <div className="text-center text-sm font-medium text-primary mt-1">
                    {workHappiness.remote_desired}/10
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const getCurrentStepContent = () => {
    if (step === 1) {
      return renderTimeRealityStep();
    } else {
      return renderCircleStep(step - 2);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onLogoClick={() => navigate('/')}
        showAuthButton={false}
      />
      
      <div className="container mx-auto px-6 py-8">
        {/* Progress Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Your 5 Circle Framework™</h1>
          <p className="text-muted-foreground mb-4">
            Update your time allocation and circle priorities as your life evolves
          </p>
          <div className="flex items-center justify-center gap-2 mb-6">
            {Array.from({ length: maxSteps }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i + 1 === step ? 'bg-primary' : i + 1 < step ? 'bg-primary/50' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Step {step} of {maxSteps}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex justify-center mb-8">
          {getCurrentStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between max-w-2xl mx-auto">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            {step > 1 && (
              <Button 
                variant="outline" 
                onClick={prevStep}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
            )}
          </div>

          <div>
            {step < maxSteps ? (
              <Button onClick={nextStep} className="flex items-center gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSaveChanges} 
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
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};