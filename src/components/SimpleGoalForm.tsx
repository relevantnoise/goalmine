import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Heart, Users, BookOpen, Activity, Briefcase } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";

const toneOptions = [
  {
    id: 'drill_sergeant' as const,
    title: 'Drill Sergeant',
    description: 'Direct, no-nonsense, push-you-to-excel motivation',
    icon: Target,
    example: '"Listen up! No excuses - time to execute!"'
  },
  {
    id: 'kind_encouraging' as const, 
    title: 'Kind & Encouraging',
    description: 'Gentle, supportive, celebrate-every-step approach',
    icon: Heart,
    example: '"You\'re doing amazing! Every small step counts."'
  },
  {
    id: 'teammate' as const,
    title: 'Teammate',
    description: 'Collaborative, we\'re-in-this-together energy', 
    icon: Users,
    example: '"We\'ve got this! Let\'s tackle it together."'
  },
  {
    id: 'wise_mentor' as const,
    title: 'Wise Mentor', 
    description: 'Thoughtful guidance with life lessons and perspective',
    icon: BookOpen,
    example: '"Every master was once a beginner. Trust the process."'
  }
];

const circleOptions = [
  {
    value: 'Spiritual',
    label: 'Spiritual',
    icon: Heart,
    description: 'Inner purpose, values, meaning, meditation, prayer',
    color: 'text-purple-600'
  },
  {
    value: 'Friends & Family',
    label: 'Friends & Family', 
    icon: Users,
    description: 'Relationships, social connections, quality time',
    color: 'text-blue-600'
  },
  {
    value: 'Work',
    label: 'Work',
    icon: Briefcase,
    description: 'Career, professional development, income',
    color: 'text-green-600'
  },
  {
    value: 'Personal Development',
    label: 'Personal Development',
    icon: BookOpen, 
    description: 'Learning, growth, skills, education',
    color: 'text-orange-600'
  },
  {
    value: 'Health & Fitness',
    label: 'Health & Fitness',
    icon: Activity,
    description: 'Physical health, exercise, nutrition, energy',
    color: 'text-red-600'
  }
];

interface SimpleGoalFormProps {
  onComplete: (goalId?: string) => void;
  onCancel: () => void;
  defaultCircle?: string;
}

export const SimpleGoalForm = ({ onComplete, onCancel, defaultCircle }: SimpleGoalFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedTone, setSelectedTone] = useState<'drill_sergeant' | 'kind_encouraging' | 'teammate' | 'wise_mentor'>('kind_encouraging');
  const [selectedCircle, setSelectedCircle] = useState<string>(defaultCircle || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createGoal } = useGoals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedCircle) return;

    setIsSubmitting(true);
    console.log('🎯 Enhanced form: Creating goal with:', { title, tone: selectedTone, description, circle: selectedCircle });

    try {
      const result = await createGoal({ 
        title: title.trim(),
        description: description.trim() || undefined,
        target_date: targetDate ? new Date(targetDate) : undefined,
        tone: selectedTone,
        circle_type: selectedCircle
      });
      if (result) {
        console.log('✅ Goal created with tone and target date, calling onComplete');
        onComplete(result.id);
      }
    } catch (error) {
      console.error('❌ Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Your Goal</CardTitle>
          <p className="text-muted-foreground">Set your goal, assign it to one of the 6 Elements of Life, and get personalized daily motivation</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Goal Title */}
            <div>
              <Label htmlFor="title" className="text-base font-medium">
                1. What's your goal?
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Exercise daily, Learn Spanish, Write a book..."
                className="text-base md:text-base"
                maxLength={100}
                required
              />
            </div>

            {/* Step 2: Goal Details (Now Required for Better AI) */}
            <div>
              <Label htmlFor="description" className="text-base font-medium">
                2. Tell us more about your goal (recommended)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why is this goal important to you? What specific challenges do you face? Any relevant background or context..."
                className="text-base resize-none"
                rows={4}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground mt-1">
                <strong>The more details you provide, the better your AI coach can help you succeed.</strong> This creates personalized strategies, motivation, and daily guidance.
              </p>
            </div>

            {/* Step 3: Target Date */}
            <div>
              <Label htmlFor="targetDate" className="text-base font-medium">
                3. When do you want to achieve this? (optional but recommended)
              </Label>
              <input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md text-base"
                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Tomorrow's date
              />
              <p className="text-xs text-muted-foreground mt-1">
                Setting a deadline helps create urgency and better motivation
              </p>
            </div>

            {/* Step 4: Circle Assignment */}
            <div>
              <Label className="text-base font-medium mb-3 block">
                4. Which of the 6 Elements of Life is this goal associated with?
              </Label>
              <Select value={selectedCircle} onValueChange={setSelectedCircle}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an element..." />
                </SelectTrigger>
                <SelectContent>
                  {circleOptions.map((circle) => {
                    const IconComponent = circle.icon;
                    return (
                      <SelectItem key={circle.value} value={circle.value}>
                        <div className="flex items-center gap-3">
                          <IconComponent className={`w-4 h-4 ${circle.color}`} />
                          <div>
                            <div className="font-medium">{circle.label}</div>
                            <div className="text-xs text-muted-foreground">{circle.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                This helps organize your goals and creates better motivation
              </p>
            </div>

            {/* Step 5: Coaching Style Selection */}
            <div>
              <Label className="text-base font-medium mb-3 block">
                5. Choose your AI coaching style
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {toneOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <div
                      key={option.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                        selectedTone === option.id ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setSelectedTone(option.id)}
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent className={`w-5 h-5 mt-0.5 ${
                          selectedTone === option.id ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <div>
                          <h3 className={`font-semibold text-sm ${
                            selectedTone === option.id ? 'text-primary' : 'text-foreground'
                          }`}>
                            {option.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mb-1">
                            {option.description}
                          </p>
                          <p className="text-xs italic text-muted-foreground">
                            {option.example}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!title.trim() || !selectedCircle || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Goal 🎯'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};