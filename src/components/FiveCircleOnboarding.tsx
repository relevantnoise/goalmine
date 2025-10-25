import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, ArrowRight, Target, Heart, Briefcase, BookOpen, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

interface FiveCircleOnboardingProps {
  onComplete: () => void;
  onBack: () => void;
}

interface LifeContext {
  life_stage: 'early_career' | 'mid_career_family' | 'leadership_scaling' | 'transition_change';
  primary_challenge: string;
  primary_90_day_priority: string;
  work_hours_per_week: number;
  sleep_hours_per_night: number;
  commute_hours_per_week: number;
  total_available_hours_per_week: number;
}

interface CircleData {
  circle_name: 'spiritual' | 'friends_family' | 'work' | 'personal_development' | 'health_fitness';
  personal_definition: string;
  importance_level: number;
  current_satisfaction: number;
  current_time_per_week: number;
  ideal_time_per_week: number;
  success_definition_90_days: string;
}

const circleConfigs = [
  {
    name: 'spiritual' as const,
    title: 'Spiritual',
    icon: Heart,
    color: 'text-purple-600',
    description: 'Your spiritual life, meaning, and inner peace'
  },
  {
    name: 'friends_family' as const,
    title: 'Friends & Family',
    icon: Target,
    color: 'text-blue-600',
    description: 'Relationships and connections with people you care about'
  },
  {
    name: 'work' as const,
    title: 'Work',
    icon: Briefcase,
    color: 'text-green-600',
    description: 'Your career, professional growth, and work performance'
  },
  {
    name: 'personal_development' as const,
    title: 'Personal Development',
    icon: BookOpen,
    color: 'text-orange-600',
    description: 'Learning, skills, and personal growth'
  },
  {
    name: 'health_fitness' as const,
    title: 'Health & Fitness',
    icon: Activity,
    color: 'text-red-600',
    description: 'Physical health, fitness, and energy'
  }
];

export const FiveCircleOnboarding = ({ onComplete, onBack }: FiveCircleOnboardingProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [lifeContext, setLifeContext] = useState<LifeContext>({
    life_stage: 'early_career',
    primary_challenge: '',
    primary_90_day_priority: '',
    work_hours_per_week: 40,
    sleep_hours_per_night: 8,
    commute_hours_per_week: 5,
    total_available_hours_per_week: 0
  });

  const [circleData, setCircleData] = useState<Record<string, CircleData>>({});

  // Calculate available hours
  useEffect(() => {
    const workHours = lifeContext.work_hours_per_week;
    const sleepHours = lifeContext.sleep_hours_per_night * 7;
    const commuteHours = lifeContext.commute_hours_per_week;
    const totalWeekHours = 168; // 7 days * 24 hours
    
    const available = totalWeekHours - workHours - sleepHours - commuteHours;
    setLifeContext(prev => ({ ...prev, total_available_hours_per_week: available }));
  }, [lifeContext.work_hours_per_week, lifeContext.sleep_hours_per_night, lifeContext.commute_hours_per_week]);

  const handleNext = () => {
    if (step < 8) { // 3 life context steps + 5 circle steps
      setStep(step + 1);
    } else {
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

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue.",
        duration: 8000
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-five-circle-framework', {
        body: {
          user_id: user.email, // Using email for consistency with existing system
          lifeContext,
          circleData
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create framework');
      }
      
      console.log('5 Circle Framework created:', data);
      
      toast({
        title: "🎯 5 Circle Framework Created!",
        description: `Your personalized life management system is ready. Created ${data.analysis.circles_created} circles.`,
        duration: 8000
      });
      
      onComplete();
    } catch (error) {
      console.error('Error saving 5 Circle framework:', error);
      toast({
        title: "Oops!",
        description: error instanceof Error ? error.message : "Failed to save your framework. Please try again.",
        duration: 8000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCircleData = (circleName: string, updates: Partial<CircleData>) => {
    setCircleData(prev => ({
      ...prev,
      [circleName]: { ...prev[circleName], ...updates }
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return lifeContext.primary_challenge.trim().length > 0;
      case 2:
        return lifeContext.primary_90_day_priority.trim().length > 0;
      case 3:
        return true; // Time calculations are automatic
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        const currentCircle = circleConfigs[step - 4];
        const data = circleData[currentCircle.name];
        return data?.personal_definition?.trim().length > 0 && 
               data?.success_definition_90_days?.trim().length > 0;
      default:
        return false;
    }
  };

  const renderLifeContextStep = () => {
    if (step === 1) {
      return (
        <div className="space-y-4">
          <Label htmlFor="life-stage" className="text-base font-medium">
            What's your current life stage?
          </Label>
          <div className="grid gap-3">
            {[
              { value: 'early_career', label: 'Early Career', desc: 'Building career foundation, learning & growing' },
              { value: 'mid_career_family', label: 'Mid-Career/Family Building', desc: 'Advancing career while managing family responsibilities' },
              { value: 'leadership_scaling', label: 'Leadership/Scaling', desc: 'Leading teams, making strategic decisions' },
              { value: 'transition_change', label: 'Transition/Change', desc: 'Career change, major life transition' }
            ].map((stage) => (
              <button
                key={stage.value}
                onClick={() => setLifeContext(prev => ({ ...prev, life_stage: stage.value as any }))}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  lifeContext.life_stage === stage.value 
                    ? 'border-primary bg-primary-light' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-semibold">{stage.label}</div>
                <div className="text-sm text-muted-foreground">{stage.desc}</div>
              </button>
            ))}
          </div>
          
          <div className="space-y-2 mt-6">
            <Label htmlFor="challenge" className="text-base font-medium">
              What's your biggest challenge right now?
            </Label>
            <Textarea
              id="challenge"
              placeholder="e.g., Balancing work demands with family time, feeling overwhelmed by competing priorities..."
              value={lifeContext.primary_challenge}
              onChange={(e) => setLifeContext(prev => ({ ...prev, primary_challenge: e.target.value }))}
              className="min-h-[100px]"
            />
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <Label htmlFor="priority" className="text-base font-medium">
            What's your #1 priority for the next 90 days?
          </Label>
          <Textarea
            id="priority"
            placeholder="The one thing that would make the biggest difference in your life..."
            value={lifeContext.primary_90_day_priority}
            onChange={(e) => setLifeContext(prev => ({ ...prev, primary_90_day_priority: e.target.value }))}
            className="min-h-[120px]"
          />
          <p className="text-sm text-muted-foreground">
            This helps us understand what matters most to you right now.
          </p>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Time Reality Check</h3>
            <p className="text-muted-foreground">Let's understand your time constraints</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Work hours per week</Label>
              <Slider
                value={[lifeContext.work_hours_per_week]}
                onValueChange={([value]) => setLifeContext(prev => ({ ...prev, work_hours_per_week: value }))}
                max={80}
                min={20}
                step={5}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">{lifeContext.work_hours_per_week} hours</div>
            </div>

            <div>
              <Label className="text-base font-medium">Sleep hours per night</Label>
              <Slider
                value={[lifeContext.sleep_hours_per_night]}
                onValueChange={([value]) => setLifeContext(prev => ({ ...prev, sleep_hours_per_night: value }))}
                max={10}
                min={6}
                step={0.5}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">{lifeContext.sleep_hours_per_night} hours</div>
            </div>

            <div>
              <Label className="text-base font-medium">Commute hours per week</Label>
              <Slider
                value={[lifeContext.commute_hours_per_week]}
                onValueChange={([value]) => setLifeContext(prev => ({ ...prev, commute_hours_per_week: value }))}
                max={20}
                min={0}
                step={1}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">{lifeContext.commute_hours_per_week} hours</div>
            </div>
          </div>

          <div className="bg-primary-light p-4 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{lifeContext.total_available_hours_per_week}</div>
              <div className="text-sm text-muted-foreground">hours available per week for your 5 circles</div>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderCircleStep = () => {
    const currentCircleIndex = step - 4;
    const currentCircle = circleConfigs[currentCircleIndex];
    const data = circleData[currentCircle.name] || {};

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full bg-primary-light`}>
              <currentCircle.icon className={`w-8 h-8 ${currentCircle.color}`} />
            </div>
          </div>
          <h3 className="text-xl font-bold">{currentCircle.title}</h3>
          <p className="text-muted-foreground">{currentCircle.description}</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">What does "{currentCircle.title}" mean to you personally?</Label>
            <Textarea
              placeholder={`Describe what ${currentCircle.title.toLowerCase()} means in your life...`}
              value={data.personal_definition || ''}
              onChange={(e) => updateCircleData(currentCircle.name, { personal_definition: e.target.value })}
              className="mt-2 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-medium">Current satisfaction (1-10)</Label>
              <Slider
                value={[data.current_satisfaction || 5]}
                onValueChange={([value]) => updateCircleData(currentCircle.name, { current_satisfaction: value })}
                max={10}
                min={1}
                step={1}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">{data.current_satisfaction || 5}/10</div>
            </div>

            <div>
              <Label className="text-base font-medium">Importance level (1-5)</Label>
              <Slider
                value={[data.importance_level || 3]}
                onValueChange={([value]) => updateCircleData(currentCircle.name, { importance_level: value })}
                max={5}
                min={1}
                step={1}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">{data.importance_level || 3}/5</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-medium">Current weekly time (hours)</Label>
              <Slider
                value={[data.current_time_per_week || 0]}
                onValueChange={([value]) => updateCircleData(currentCircle.name, { current_time_per_week: value })}
                max={50}
                min={0}
                step={1}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">{data.current_time_per_week || 0} hours</div>
            </div>

            <div>
              <Label className="text-base font-medium">Ideal weekly time (hours)</Label>
              <Slider
                value={[data.ideal_time_per_week || 5]}
                onValueChange={([value]) => updateCircleData(currentCircle.name, { ideal_time_per_week: value })}
                max={50}
                min={0}
                step={1}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">{data.ideal_time_per_week || 5} hours</div>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">What would success look like in 90 days?</Label>
            <Textarea
              placeholder={`Describe what ${currentCircle.title.toLowerCase()} success would look like...`}
              value={data.success_definition_90_days || ''}
              onChange={(e) => updateCircleData(currentCircle.name, { success_definition_90_days: e.target.value })}
              className="mt-2 min-h-[80px]"
            />
          </div>
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
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className={`w-3 h-3 rounded-full transition-colors ${
                    i <= step ? 'bg-primary' : 'bg-border'
                  }`} />
                ))}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-card-foreground">
              {step <= 3 && "Let's understand your life context"}
              {step === 4 && "Spiritual Circle"}
              {step === 5 && "Friends & Family Circle"}
              {step === 6 && "Work Circle"}
              {step === 7 && "Personal Development Circle"}
              {step === 8 && "Health & Fitness Circle"}
            </CardTitle>
            {step <= 3 && (
              <p className="text-muted-foreground">
                We'll break down your complex life into manageable circles
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {step <= 3 ? renderLifeContextStep() : renderCircleStep()}

            <div className="flex gap-4 pt-6">
              <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isSubmitting}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {step === 1 ? 'Back' : 'Previous'}
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!canProceed() || isSubmitting} 
                className="flex-1 bg-primary hover:bg-primary-hover"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                    Setting up...
                  </>
                ) : (
                  <>
                    {step === 8 ? 'Create Framework' : 'Next'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};