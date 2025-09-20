import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Users, Heart, Target, BookOpen, CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useGoals } from "@/hooks/useGoals";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
interface OnboardingFormProps {
  onComplete: (goalId?: string) => void;
  onBack: () => void;
}
interface FormData {
  title: string;
  description: string;
  targetDate: Date | undefined;
  tone: 'drill_sergeant' | 'kind_encouraging' | 'teammate' | 'wise_mentor';
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}
const toneOptions = [{
  id: 'drill_sergeant',
  title: 'Drill Sergeant',
  description: 'Direct, no-nonsense, push-you-to-excel motivation',
  icon: Target
}, {
  id: 'kind_encouraging',
  title: 'Kind & Encouraging',
  description: 'Gentle, supportive, celebrate-every-step approach',
  icon: Heart
}, {
  id: 'teammate',
  title: 'Teammate',
  description: 'Collaborative, we\'re-in-this-together energy',
  icon: Users
}, {
  id: 'wise_mentor',
  title: 'Wise Mentor',
  description: 'Thoughtful guidance with life lessons and perspective',
  icon: BookOpen
}];
export const OnboardingForm = ({
  onComplete,
  onBack
}: OnboardingFormProps) => {
  // Add emergency reset - if user clicks logo or presses escape
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.location.href = '/?reset=true';
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    createGoal
  } = useGoals();
  const {
    subscription
  } = useSubscription();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    targetDate: undefined,
    tone: 'kind_encouraging',
    timeOfDay: 'morning'
  });

  // Simple time options per specifications.md
  const timeOptions = [
    { 
      value: 'morning' as const, 
      label: 'Morning', 
      description: 'Start your day with motivation (8-11 AM)',
      icon: '🌅'
    },
    { 
      value: 'afternoon' as const, 
      label: 'Afternoon', 
      description: 'Midday motivation boost (12-5 PM)',
      icon: '☀️'
    },
    { 
      value: 'evening' as const, 
      label: 'Evening', 
      description: 'End your day motivated (6-9 PM)',
      icon: '🌙'
    }
  ];
  const handleNext = () => {
    if (step < 5) {
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
    console.log('🚀 BUTTON CLICKED - handleSubmit called!');
    console.log('🔍 Form data:', formData);
    console.log('🔍 Current user:', user?.id);
    
    if (!user) {
      console.error('❌ No user found during goal creation');
      toast({
        title: "🔒 Authentication Required",
        description: "Please sign in to create a goal.",
        duration: 8000
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const goalData = {
        title: formData.title,
        description: formData.description,
        target_date: formData.targetDate,
        tone: formData.tone,
        time_of_day: formData.timeOfDay
      };
      
      console.log('🔍 About to call createGoal with:', goalData);
      console.log('🔍 User info:', { id: user.id, email: user.email });
      const result = await createGoal(goalData, subscription);
      
      if (result) {
        console.log('✅ Goal created successfully, calling onComplete with goal ID:', result.id);
        onComplete(result.id);
      } else {
        console.error('❌ createGoal returned null/false');
        toast({
          title: "⚠️ Oops!",
          description: "Failed to create goal. Please try again.",
          duration: 8000
        });
      }
    } catch (error) {
      console.error('❌ Error creating goal:', error);
      toast({
        title: "⚠️ Oops!",
        description: error instanceof Error ? error.message : "Failed to create goal. Please try again.",
        duration: 8000
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.title.trim().length > 0;
      case 2:
        return true;
      // description is optional
      case 3:
        return formData.targetDate !== undefined;
      case 4:
        return true;
      // tone is always selected by default
      case 5:
        return formData.timeOfDay !== '';
      default:
        return false;
    }
  };
  return <div className="min-h-screen bg-background">
      <Header onLogoClick={onBack} />
      <div className="flex items-center justify-center px-6 pt-8">
      <Card className="w-full max-w-2xl border border-border shadow-xl">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-border'}`} />)}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-card-foreground">
            {step === 1 && "What's your goal?"}
            {step === 2 && "Add more details - Very Important!"}
            {step === 3 && "When do you want to achieve it by?"}
            {step === 4 && "How should we motivate you?"}
            {step === 5 && "What time each day?"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && <div className="space-y-4">
              <Label htmlFor="title" className="text-base font-medium">
                Goal title
              </Label>
              <Input id="title" placeholder="e.g., Run a marathon, Learn Spanish, Start a business" value={formData.title} onChange={e => setFormData({
              ...formData,
              title: e.target.value
            })} className="text-base md:text-base" />
              <p className="text-sm text-muted-foreground">
                Keep it clear and specific. This will be the main focus of your daily motivation.
              </p>
            </div>}

          {step === 2 && <div className="space-y-4">
              <Label htmlFor="description" className="text-base font-medium">
                Additional details
              </Label>
              <Textarea id="description" placeholder="Add more context, your why, specific milestones, or anything that will help personalize your motivation..." value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} className="min-h-[120px] text-base md:text-base" />
              <p className="text-sm text-muted-foreground">
                This step is crucial for creating high-quality, personalized motivation. The more context you provide, the better we can tailor your daily content to help you succeed.
              </p>
            </div>}

          {step === 3 && <div className="space-y-4">
              <Label htmlFor="targetDate" className="text-base font-medium">
                Target date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.targetDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.targetDate ? format(formData.targetDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={formData.targetDate} onSelect={date => setFormData({
                  ...formData,
                  targetDate: date
                })} disabled={date => date < new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <p className="text-sm text-muted-foreground">Choose your target date to reach your goal. This helps us create more focused daily motivation.</p>
            </div>}

          {step === 4 && <div className="space-y-4">
              <p className="text-muted-foreground text-center mb-6">
                Choose the coaching style that resonates with you
              </p>
              <div className="grid gap-4">
                {toneOptions.map(option => {
                const IconComponent = option.icon;
                return <button key={option.id} onClick={() => setFormData({
                  ...formData,
                  tone: option.id as any
                })} className={`p-4 rounded-xl border-2 transition-all text-left ${formData.tone === option.id ? 'border-primary bg-primary-light' : 'border-border hover:border-primary/50'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${formData.tone === option.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{option.title}</h3>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                    </button>;
              })}
              </div>
            </div>}

          {step === 5 && <div className="space-y-6">
              <div className="text-center space-y-6">
                <Label className="text-base font-medium">
                  When should we send your daily motivation?
                </Label>
                
                <div className="grid gap-4">
                  {timeOptions.map(option => (
                    <button 
                      key={option.value} 
                      onClick={() => setFormData({...formData, timeOfDay: option.value})} 
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.timeOfDay === option.value 
                          ? 'border-primary bg-primary-light' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          formData.timeOfDay === option.value 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <span className="text-lg">{option.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{option.label}</h3>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">
                  You can change this later in your settings if needed.
                </p>
              </div>
            </div>}

          <div className="flex gap-4 pt-6">
            <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isSubmitting}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 1 ? 'Back' : 'Previous'}
            </Button>
            <Button onClick={() => {
              console.log('🔴 BUTTON CLICKED! Step:', step, 'Can proceed:', canProceed(), 'Is submitting:', isSubmitting);
              handleNext();
            }} disabled={!canProceed() || isSubmitting} className="flex-1 bg-primary hover:bg-primary-hover">
              {isSubmitting ? <>
                  <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                  Dream Big...
                </> : <>
                  {step === 5 ? 'Create Goal' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>}
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>;
};