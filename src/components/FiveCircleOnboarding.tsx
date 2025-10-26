import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VoiceTextarea } from "@/components/ui/voice-textarea";
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
  const [isInConversation, setIsInConversation] = useState(false);
  const [consultantQuestion, setConsultantQuestion] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  const [userResponse, setUserResponse] = useState('');
  const [showValidationError, setShowValidationError] = useState(false);
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

  const handleNext = async () => {
    console.log('🔵 handleNext called, current step:', step);
    
    // Check validation before proceeding
    const validation = getValidationStatus();
    if (!validation.canProceed) {
      setShowValidationError(true);
      return;
    }
    
    // Clear validation error if we're proceeding
    setShowValidationError(false);
    
    if (step < 8) { // 3 life context steps + 5 circle steps
      setStep(step + 1);
    } else {
      // Before creating framework, let AI consultant analyze if we have enough info
      console.log('🟢 Final step reached, consulting with AI before framework creation');
      await handleConsultantAnalysis();
    }
  };

  const handleConsultantAnalysis = async () => {
    setIsSubmitting(true);
    
    try {
      toast({
        title: "🤔 Analyzing Your Responses",
        description: "Let me review what you've shared and see if we have everything we need...",
        duration: 3000
      });

      const { data, error } = await supabase.functions.invoke('five-circle-consultant', {
        body: {
          currentData: { lifeContext, circleData },
          mode: 'analyze'
        }
      });

      if (error) throw error;

      if (data.analysis.canProceed) {
        console.log('✅ AI consultant says we can proceed');
        await handleSubmit();
      } else {
        console.log('💬 AI consultant wants to ask follow-up questions');
        
        // Transition to conversation mode
        setConsultantQuestion(data.analysis.nextQuestion);
        setConversationHistory([
          { role: 'consultant', content: data.analysis.nextQuestion }
        ]);
        setIsInConversation(true);
        
        toast({
          title: "💡 Let's Chat",
          description: "I'd like to understand a bit more about your situation...",
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Error with consultant analysis:', error);
      // Fallback to direct submission
      await handleSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConversationResponse = async () => {
    if (!userResponse.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Add user response to conversation history
      const newHistory = [
        ...conversationHistory,
        { role: 'user', content: userResponse }
      ];
      setConversationHistory(newHistory);
      
      // Get consultant's response
      const { data, error } = await supabase.functions.invoke('five-circle-consultant', {
        body: {
          currentData: { lifeContext, circleData },
          userResponse,
          conversationHistory: newHistory,
          mode: 'ask_followup'
        }
      });

      if (error) throw error;

      if (data.shouldContinue) {
        // Continue conversation
        const updatedHistory = [
          ...newHistory,
          { role: 'consultant', content: data.consultantResponse }
        ];
        setConversationHistory(updatedHistory);
        setConsultantQuestion(data.consultantResponse);
        setUserResponse('');
      } else {
        // Consultant is satisfied, proceed to framework creation
        toast({
          title: "✅ Perfect!",
          description: "Thanks for that insight. I have everything I need to build your framework.",
          duration: 4000
        });
        
        setIsInConversation(false);
        await handleSubmit();
      }
    } catch (error) {
      console.error('Error in conversation:', error);
      toast({
        title: "Let's Continue",
        description: "I have enough information to proceed with your framework.",
        duration: 4000
      });
      setIsInConversation(false);
      await handleSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    // Clear validation error when going back
    setShowValidationError(false);
    
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const handleSubmit = async () => {
    console.log('🟡 handleSubmit called, user:', user?.email);
    if (!user) {
      console.log('❌ No user found, showing auth required toast');
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue.",
        duration: 8000
      });
      return;
    }

    // Show immediate feedback
    toast({
      title: "🚀 Creating Your Framework",
      description: "Analyzing your responses and building your personalized 5 Circle system...",
      duration: 4000
    });

    console.log('🔄 Setting isSubmitting to true');
    setIsSubmitting(true);
    
    try {
      // Note: We skip rigid validation here because the AI consultant 
      // has already analyzed the data and determined we have enough 
      // information to proceed, or has gathered additional context
      // through the conversational interview

      console.log('🚀 Calling create-five-circle-framework with data:', { 
        user_id: user.email, 
        lifeContext, 
        circleData 
      });
      
      const { data, error } = await supabase.functions.invoke('create-five-circle-framework', {
        body: {
          user_id: user.email, // Using email for consistency with existing system
          lifeContext,
          circleData,
          conversationHistory: conversationHistory.length > 0 ? conversationHistory : null
        }
      });

      console.log('📡 Edge function response:', { data, error });

      if (error) {
        console.log('❌ Edge function error:', error);
        throw new Error(error.message || 'Failed to create framework');
      }
      
      console.log('✅ 5 Circle Framework created successfully:', data);
      
      // Show success feedback with detailed analysis
      const timeConflictMessage = data.analysis.has_time_conflict 
        ? `⚠️ Time optimization needed: You've allocated ${data.analysis.total_ideal_time} hours vs ${data.analysis.available_time} available.`
        : `✅ Time allocation looks balanced: ${data.analysis.total_ideal_time}/${data.analysis.available_time} hours allocated.`;
      
      toast({
        title: "🎯 5 Circle Framework™ Created!",
        description: `Your personalized life complexity management system is ready! ${timeConflictMessage}`,
        duration: 10000
      });
      
      // Store the analysis for the report component
      sessionStorage.setItem('frameworkAnalysis', JSON.stringify(data.analysis));
      
      console.log('🎉 Calling onComplete() to proceed to framework report');
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

  const getValidationStatus = () => {
    switch (step) {
      case 1:
        const hasChallenge = lifeContext.primary_challenge.trim().length > 0;
        return { 
          canProceed: hasChallenge, 
          missingFields: hasChallenge ? [] : ['Primary Challenge'] 
        };
      case 2:
        const hasPriority = lifeContext.primary_90_day_priority.trim().length > 0;
        return { 
          canProceed: hasPriority, 
          missingFields: hasPriority ? [] : ['90-Day Priority'] 
        };
      case 3:
        return { canProceed: true, missingFields: [] }; // Time calculations are automatic
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        const currentCircle = circleConfigs[step - 4];
        const data = circleData[currentCircle.name];
        const hasDefinition = data?.personal_definition?.trim().length > 0;
        const hasSuccess = data?.success_definition_90_days?.trim().length > 0;
        const hasTimeAllocation = data?.ideal_time_per_week > 0;
        
        const missingFields = [];
        if (!hasDefinition) missingFields.push('Personal Definition');
        if (!hasSuccess) missingFields.push('90-Day Success Definition');
        if (!hasTimeAllocation) missingFields.push('Time Allocation');
        
        const canProceedResult = missingFields.length === 0;
        
        console.log(`🔍 getValidationStatus() step ${step} (${currentCircle.name}):`, {
          hasDefinition,
          hasSuccess,
          hasTimeAllocation,
          canProceedResult,
          missingFields,
          data: data
        });
        
        return { canProceed: canProceedResult, missingFields };
      default:
        return { canProceed: false, missingFields: ['Unknown step'] };
    }
  };

  const canProceed = () => getValidationStatus().canProceed;

  const renderConversationInterface = () => {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">DL</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Dan Lynn, Management Consultant</h3>
              <p className="text-blue-700 leading-relaxed">{consultantQuestion}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="response" className="text-base font-medium">Your response: <span className="text-sm text-muted-foreground">(Voice input available)</span></Label>
          <VoiceTextarea
            id="response"
            value={userResponse}
            onChange={(value) => setUserResponse(value)}
            placeholder="Share your thoughts..."
            minHeight="min-h-[120px]"
            className="text-base"
            disabled={isSubmitting}
          />
          <p className="text-sm text-gray-600">
            Take your time to think about this. Your answer will help me create a more personalized framework for you.
          </p>
        </div>

        {conversationHistory.length > 2 && (
          <div className="border-t pt-4">
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                View conversation history ({Math.floor(conversationHistory.length / 2)} exchanges)
              </summary>
              <div className="mt-3 space-y-3 max-h-40 overflow-y-auto">
                {conversationHistory.slice(0, -1).map((msg, idx) => (
                  <div key={idx} className={`text-sm p-3 rounded ${
                    msg.role === 'consultant' 
                      ? 'bg-blue-50 text-blue-800' 
                      : 'bg-gray-50 text-gray-800'
                  }`}>
                    <span className="font-medium">
                      {msg.role === 'consultant' ? 'Dan:' : 'You:'}
                    </span> {msg.content}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    );
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
              What's your biggest challenge right now? <span className="text-sm text-muted-foreground">(Voice input available)</span>
            </Label>
            <VoiceTextarea
              id="challenge"
              placeholder="e.g., Balancing work demands with family time, feeling overwhelmed by competing priorities..."
              value={lifeContext.primary_challenge}
              onChange={(value) => setLifeContext(prev => ({ ...prev, primary_challenge: value }))}
              minHeight="min-h-[100px]"
            />
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <Label htmlFor="priority" className="text-base font-medium">
            What's your #1 priority for the next 90 days? <span className="text-sm text-muted-foreground">(Voice input available)</span>
          </Label>
          <VoiceTextarea
            id="priority"
            placeholder="The one thing that would make the biggest difference in your life..."
            value={lifeContext.primary_90_day_priority}
            onChange={(value) => setLifeContext(prev => ({ ...prev, primary_90_day_priority: value }))}
            minHeight="min-h-[120px]"
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
                max={100}
                min={0}
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
            <Label className="text-base font-medium">What does "{currentCircle.title}" mean to you personally? <span className="text-sm text-muted-foreground">(Voice input available)</span></Label>
            <VoiceTextarea
              placeholder={`Describe what ${currentCircle.title.toLowerCase()} means in your life...`}
              value={data.personal_definition || ''}
              onChange={(value) => updateCircleData(currentCircle.name, { personal_definition: value })}
              className="mt-2"
              minHeight="min-h-[80px]"
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
              <Label className="text-base font-medium">Importance level (1-10)</Label>
              <Slider
                value={[data.importance_level || 5]}
                onValueChange={([value]) => updateCircleData(currentCircle.name, { importance_level: value })}
                max={10}
                min={1}
                step={1}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">{data.importance_level || 5}/10</div>
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
                step={currentCircle.name === 'spiritual' ? 0.5 : 1}
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
                step={currentCircle.name === 'spiritual' ? 0.5 : 1}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">{data.ideal_time_per_week || 5} hours</div>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">What would success look like in 90 days? <span className="text-sm text-muted-foreground">(Voice input available)</span></Label>
            <VoiceTextarea
              placeholder={`Describe what ${currentCircle.title.toLowerCase()} success would look like...`}
              value={data.success_definition_90_days || ''}
              onChange={(value) => updateCircleData(currentCircle.name, { success_definition_90_days: value })}
              className="mt-2"
              minHeight="min-h-[80px]"
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
              {isInConversation ? "Consultant Interview" : (
                <>
                  {step <= 3 && "Let's understand your life context"}
                  {step === 4 && "Spiritual Circle"}
                  {step === 5 && "Friends & Family Circle"}
                  {step === 6 && "Work Circle"}
                  {step === 7 && "Personal Development Circle"}
                  {step === 8 && "Health & Fitness Circle"}
                </>
              )}
            </CardTitle>
            {!isInConversation && step <= 3 && (
              <p className="text-muted-foreground">
                We'll break down your complex life into manageable circles
              </p>
            )}
            {isInConversation && (
              <p className="text-muted-foreground">
                I'd like to dig a little deeper to create the most effective framework for you
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {isInConversation ? renderConversationInterface() : (step <= 3 ? renderLifeContextStep() : renderCircleStep())}

            {/* Validation feedback */}
            {!isInConversation && (() => {
              const validation = getValidationStatus();
              if (showValidationError && !validation.canProceed && validation.missingFields.length > 0) {
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">
                          Complete all fields to continue
                        </h3>
                        <div className="mt-2 text-sm text-amber-700">
                          <p>Missing: {validation.missingFields.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex gap-4 pt-6">
              {!isInConversation ? (
                <>
                  <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isSubmitting}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {step === 1 ? 'Back' : 'Previous'}
                  </Button>
                  <Button 
                    onClick={handleNext} 
                    disabled={isSubmitting} 
                    className="flex-1 bg-primary hover:bg-primary-hover"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                        {step === 8 ? 'Creating Your 5 Circle Framework™...' : 'Setting up...'}
                      </>
                    ) : (
                      <>
                        {step === 8 ? 'Create Framework' : 'Next'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsInConversation(false)} 
                    className="flex-1" 
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Form
                  </Button>
                  <Button 
                    onClick={handleConversationResponse} 
                    disabled={!userResponse.trim() || isSubmitting} 
                    className="flex-1 bg-primary hover:bg-primary-hover"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                        Thinking...
                      </>
                    ) : (
                      <>
                        Share Response
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};