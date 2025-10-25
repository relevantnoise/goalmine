import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Users, Briefcase, BookOpen, Activity, Target, Lightbulb, Clock, ChevronRight, ChevronLeft } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const circleIcons = {
  'Spiritual': Heart,
  'Friends & Family': Users, 
  'Work': Briefcase,
  'Personal Development': BookOpen,
  'Health & Fitness': Activity
};

const circleColors = {
  'Spiritual': 'bg-purple-100 text-purple-800 border-purple-200',
  'Friends & Family': 'bg-blue-100 text-blue-800 border-blue-200',
  'Work': 'bg-green-100 text-green-800 border-green-200', 
  'Personal Development': 'bg-orange-100 text-orange-800 border-orange-200',
  'Health & Fitness': 'bg-red-100 text-red-800 border-red-200'
};

const toneOptions = [
  { id: 'drill_sergeant', title: 'Drill Sergeant', description: 'Direct, no-nonsense motivation' },
  { id: 'kind_encouraging', title: 'Kind & Encouraging', description: 'Gentle, supportive approach' },
  { id: 'teammate', title: 'Teammate', description: 'Collaborative energy' },
  { id: 'wise_mentor', title: 'Wise Mentor', description: 'Thoughtful guidance' }
];

interface CircleData {
  name: string;
  definition: string;
  hoursPerWeek: number;
  currentChallenges: string;
  specificGoal: string;
}

interface GoalSuggestion {
  title: string;
  description: string;
  reasoning: string;
  timeCommitment: string;
}

interface FiveCircleGoalWorkshopProps {
  onComplete: (goals: any[]) => void;
  onBack: () => void;
}

export const FiveCircleGoalWorkshop = ({ onComplete, onBack }: FiveCircleGoalWorkshopProps) => {
  const { user } = useAuth();
  const { createGoal } = useGoals();
  const [loading, setLoading] = useState(true);
  const [circleData, setCircleData] = useState<CircleData[]>([]);
  const [currentCircleIndex, setCurrentCircleIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalSuggestion | null>(null);
  const [customGoal, setCustomGoal] = useState({ title: '', description: '' });
  const [targetDate, setTargetDate] = useState('');
  const [selectedTone, setSelectedTone] = useState<string>('kind_encouraging');
  const [createdGoals, setCreatedGoals] = useState<any[]>([]);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);

  useEffect(() => {
    fetchCircleData();
  }, [user]);

  const getMaxGoals = () => {
    if (!subscription.subscribed) return 1; // Free users
    if (subscription.subscription_tier === 'Personal Plan') return 3;
    if (subscription.subscription_tier === 'Pro Plan') return 5;
    if (subscription.subscription_tier === 'Strategic Advisor Plan') return 5;
    return 1; // Default fallback
  };

  const canCreateMoreGoals = () => {
    const maxGoals = getMaxGoals();
    return goals.length < maxGoals;
  };

  const getRemainingGoals = () => {
    const maxGoals = getMaxGoals();
    return Math.max(0, maxGoals - goals.length);
  };

  const fetchCircleData = async () => {
    if (!user?.email) return;
    
    try {
      const { data, error } = await supabase
        .from('circle_frameworks')
        .select(`
          *,
          circle_profiles (*)
        `)
        .eq('user_email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data?.circle_profiles) {
        const circles = data.circle_profiles.map((profile: any) => ({
          name: profile.circle_name,
          definition: profile.personal_definition,
          hoursPerWeek: profile.weekly_hours_allocated,
          currentChallenges: profile.current_challenges,
          specificGoal: profile.specific_goal || ''
        }));
        setCircleData(circles);
      }
    } catch (error) {
      console.error('Error fetching circle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateGoalSuggestions = async (circle: CircleData) => {
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-goal-suggestions', {
        body: {
          circleName: circle.name,
          personalDefinition: circle.definition,
          hoursPerWeek: circle.hoursPerWeek,
          currentChallenges: circle.currentChallenges,
          specificGoal: circle.specificGoal
        }
      });

      if (error) throw error;
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback suggestions based on circle type
      setSuggestions(getFallbackSuggestions(circle.name));
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getFallbackSuggestions = (circleName: string): GoalSuggestion[] => {
    const fallbacks = {
      'Spiritual': [
        {
          title: 'Daily Meditation Practice',
          description: 'Establish a consistent 10-minute daily meditation routine',
          reasoning: 'Creates mindful awareness and inner peace',
          timeCommitment: '10 minutes daily'
        }
      ],
      'Friends & Family': [
        {
          title: 'Quality Time with Loved Ones',
          description: 'Schedule regular one-on-one time with family members',
          reasoning: 'Strengthens relationships through intentional connection',
          timeCommitment: '2 hours weekly'
        }
      ],
      'Work': [
        {
          title: 'Professional Skill Development',
          description: 'Master a new skill relevant to your career growth',
          reasoning: 'Enhances value and opens advancement opportunities',
          timeCommitment: '5 hours weekly'
        }
      ],
      'Personal Development': [
        {
          title: 'Learning New Knowledge',
          description: 'Read or study something that expands your perspective',
          reasoning: 'Continuous growth leads to personal fulfillment',
          timeCommitment: '3 hours weekly'
        }
      ],
      'Health & Fitness': [
        {
          title: 'Regular Exercise Routine',
          description: 'Establish a sustainable fitness routine you enjoy',
          reasoning: 'Physical health supports all other life areas',
          timeCommitment: '4 hours weekly'
        }
      ]
    };
    
    return fallbacks[circleName as keyof typeof fallbacks] || [];
  };

  const handleCircleStart = (circle: CircleData) => {
    generateGoalSuggestions(circle);
  };

  const handleCreateGoal = async () => {
    // Check if user can create more goals
    if (!canCreateMoreGoals()) {
      const maxGoals = getMaxGoals();
      const tierName = subscription.subscribed ? subscription.subscription_tier : 'Free Trial';
      alert(`Goal limit reached! ${tierName} allows ${maxGoals} goal${maxGoals !== 1 ? 's' : ''}. Upgrade to create more goals across all your circles.`);
      return;
    }

    const circle = circleData[currentCircleIndex];
    const goalData = selectedGoal ? {
      title: selectedGoal.title,
      description: selectedGoal.description
    } : customGoal;

    if (!goalData.title.trim()) return;

    setIsCreatingGoal(true);
    try {
      const result = await createGoal({
        title: goalData.title.trim(),
        description: goalData.description.trim() || undefined,
        target_date: targetDate ? new Date(targetDate) : undefined,
        tone: selectedTone as any,
        circle_type: circle.name,
        weekly_commitment_hours: circle.hoursPerWeek,
        circle_interview_data: {
          personalDefinition: circle.definition,
          currentChallenges: circle.currentChallenges,
          specificGoal: circle.specificGoal
        }
      });

      if (result) {
        const newGoal = { ...result, circleName: circle.name };
        setCreatedGoals(prev => [...prev, newGoal]);
        
        // Reset for next circle
        setSelectedGoal(null);
        setCustomGoal({ title: '', description: '' });
        setTargetDate('');
        setSuggestions([]);

        // Move to next circle or complete
        if (currentCircleIndex < circleData.length - 1) {
          setCurrentCircleIndex(prev => prev + 1);
        } else {
          onComplete([...createdGoals, newGoal]);
        }
      }
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setIsCreatingGoal(false);
    }
  };

  const skipCircle = () => {
    if (currentCircleIndex < circleData.length - 1) {
      setCurrentCircleIndex(prev => prev + 1);
      setSelectedGoal(null);
      setCustomGoal({ title: '', description: '' });
      setSuggestions([]);
    } else {
      onComplete(createdGoals);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your 5 Circle Framework data...</p>
        </div>
      </div>
    );
  }

  if (circleData.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Framework Data Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please complete the 5 Circle Framework interview first.
            </p>
            <Button onClick={onBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentCircle = circleData[currentCircleIndex];
  const CircleIcon = circleIcons[currentCircle.name as keyof typeof circleIcons];
  const progress = ((currentCircleIndex + 1) / circleData.length) * 100;

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Goal Creation Workshop</h1>
          <p className="text-muted-foreground mb-2">
            Create meaningful goals for each circle using your personalized framework
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 max-w-md mx-auto">
            <p className="text-sm text-blue-800">
              <strong>Your Plan:</strong> {subscription.subscribed ? subscription.subscription_tier : 'Free Trial'} - 
              {canCreateMoreGoals() ? ` ${getRemainingGoals()} goal${getRemainingGoals() !== 1 ? 's' : ''} remaining` : ' Goal limit reached'}
            </p>
            {!canCreateMoreGoals() && (
              <p className="text-xs text-blue-600 mt-1">
                Upgrade to create goals across all your circles!
              </p>
            )}
          </div>
          <Progress value={progress} className="w-full max-w-md mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">
            Circle {currentCircleIndex + 1} of {circleData.length}
          </p>
        </div>

        {/* Current Circle Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${circleColors[currentCircle.name as keyof typeof circleColors]}`}>
                <CircleIcon className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl">{currentCircle.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {currentCircle.hoursPerWeek} hours/week allocated
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Your Definition:</Label>
                <p className="text-sm text-muted-foreground">{currentCircle.definition}</p>
              </div>
              {currentCircle.currentChallenges && (
                <div>
                  <Label className="text-sm font-medium">Current Challenges:</Label>
                  <p className="text-sm text-muted-foreground">{currentCircle.currentChallenges}</p>
                </div>
              )}
              {currentCircle.specificGoal && (
                <div>
                  <Label className="text-sm font-medium">Specific Goal Mentioned:</Label>
                  <p className="text-sm text-muted-foreground">{currentCircle.specificGoal}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {suggestions.length === 0 ? (
          /* Generate Suggestions */
          <Card>
            <CardContent className="py-8 text-center">
              <Lightbulb className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Create a Goal?</h3>
              <p className="text-muted-foreground mb-6">
                Let our AI analyze your {currentCircle.name} circle and suggest personalized goals
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => handleCircleStart(currentCircle)} disabled={loadingSuggestions}>
                  {loadingSuggestions ? 'Generating Ideas...' : 'Get Goal Suggestions'}
                </Button>
                <Button variant="outline" onClick={skipCircle}>
                  Skip This Circle
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Goal Creation Interface */
          <div className="space-y-6">
            {/* AI Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  AI-Generated Goal Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div 
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedGoal === suggestion ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedGoal(suggestion)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{suggestion.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {suggestion.timeCommitment}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <strong>Why this works:</strong> {suggestion.reasoning}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Goal Option */}
            <Card>
              <CardHeader>
                <CardTitle>Or Create Your Own Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="custom-title">Goal Title</Label>
                    <Input
                      id="custom-title"
                      value={customGoal.title}
                      onChange={(e) => setCustomGoal(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter your custom goal..."
                      disabled={!!selectedGoal}
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-description">Description (Optional)</Label>
                    <Textarea
                      id="custom-description"
                      value={customGoal.description}
                      onChange={(e) => setCustomGoal(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your goal in more detail..."
                      disabled={!!selectedGoal}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Goal Configuration */}
            {(selectedGoal || customGoal.title.trim()) && (
              <Card>
                <CardHeader>
                  <CardTitle>Goal Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="target-date">Target Date (Optional)</Label>
                      <Input
                        id="target-date"
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Motivation Tone</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {toneOptions.map((tone) => (
                          <div
                            key={tone.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedTone === tone.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedTone(tone.id)}
                          >
                            <h4 className="font-medium text-sm">{tone.title}</h4>
                            <p className="text-xs text-muted-foreground">{tone.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-between">
              <Button variant="outline" onClick={onBack}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={skipCircle}>
                  Skip Circle
                </Button>
                <Button 
                  onClick={handleCreateGoal}
                  disabled={(!selectedGoal && !customGoal.title.trim()) || isCreatingGoal}
                >
                  {isCreatingGoal ? 'Creating...' : (
                    currentCircleIndex < circleData.length - 1 ? 'Create & Continue' : 'Create & Finish'
                  )}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Summary */}
        {createdGoals.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Goals Created So Far</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {createdGoals.map((goal, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded">
                    <Badge variant="secondary">{goal.circleName}</Badge>
                    <span className="font-medium">{goal.title}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};