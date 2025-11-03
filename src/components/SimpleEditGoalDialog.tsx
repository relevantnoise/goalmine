import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Heart, Users, BookOpen, Activity, Briefcase, Moon } from "lucide-react";
import { Goal } from "@/hooks/useGoals";

interface GoalUpdates {
  title: string;
  description?: string;
  target_date?: string;
  tone: 'drill_sergeant' | 'kind_encouraging' | 'teammate' | 'wise_mentor';
  pillar_type?: string;
}

interface SimpleEditGoalDialogProps {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (goalId: string, updates: GoalUpdates) => Promise<void>;
}

export const SimpleEditGoalDialog = ({ goal, open, onOpenChange, onSave }: SimpleEditGoalDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description || '');
  const [targetDate, setTargetDate] = useState(goal.target_date || '');
  const [tone, setTone] = useState<'drill_sergeant' | 'kind_encouraging' | 'teammate' | 'wise_mentor'>(goal.tone);
  const [pillarType, setPillarType] = useState(goal.pillar_type || '');

  const toneOptions = [
    {
      id: 'drill_sergeant' as const,
      title: 'Drill Sergeant',
      description: 'Direct, no-nonsense motivation',
      icon: Target,
      example: '"Listen up! No excuses - time to execute!"'
    },
    {
      id: 'kind_encouraging' as const,
      title: 'Kind & Encouraging',
      description: 'Warm, supportive motivation',
      icon: Heart,
      example: '"You\'re doing amazing! Every step counts."'
    },
    {
      id: 'teammate' as const,
      title: 'Teammate',
      description: 'Collaborative, buddy motivation',
      icon: Users,
      example: '"We\'ve got this! Let\'s tackle it together."'
    },
    {
      id: 'wise_mentor' as const,
      title: 'Wise Mentor',
      description: 'Thoughtful, insightful guidance',
      icon: BookOpen,
      example: '"Consider this: every master was once a beginner."'
    }
  ];

const circleOptions = [
  {
    value: 'Work',
    label: 'Work',
    icon: Briefcase,
    description: 'Career, job(s)',
    color: 'text-green-600'
  },
  {
    value: 'Sleep',
    label: 'Sleep',
    icon: Moon,
    description: 'Rest, recovery, sleep optimization',
    color: 'text-indigo-600'
  },
  {
    value: 'Family & Friends',
    label: 'Family & Friends', 
    icon: Users,
    description: 'Relationships, social connections, quality time',
    color: 'text-blue-600'
  },
  {
    value: 'Health & Fitness',
    label: 'Health & Fitness',
    icon: Activity,
    description: 'Physical health, exercise, nutrition, energy',
    color: 'text-red-600'
  },
  {
    value: 'Personal Development',
    label: 'Personal Development',
    icon: BookOpen, 
    description: 'Learning, growth, skills, education',
    color: 'text-orange-600'
  },
  {
    value: 'Spiritual',
    label: 'Spiritual',
    icon: Heart,
    description: 'Inner purpose, values, meaning, meditation, prayer, faith',
    color: 'text-purple-600'
  }
];

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const updates: GoalUpdates = {
        title: title.trim(),
        description: description.trim() || undefined,
        target_date: targetDate || undefined,
        tone,
        pillar_type: pillarType || undefined
      };
      await onSave(goal.id, updates);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setTitle(goal.title);
    setDescription(goal.description || '');
    setTargetDate(goal.target_date || '');
    setTone(goal.tone);
    setPillarType(goal.pillar_type || '');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Goal Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to achieve?"
              disabled={isLoading}
            />
          </div>

          {/* Goal Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Goal Details (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us more about your goal... (optional)"
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Pillar Selection */}
          <div className="space-y-2">
            <Label>Which of the 6 Pillars of Life is this goal associated with?</Label>
            <Select value={pillarType} onValueChange={setPillarType} disabled={isLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select which of the 6 Pillars of Life your goal targets..." />
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
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label htmlFor="target-date">Target Date (Optional)</Label>
            <Input
              id="target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              disabled={isLoading}
              className="w-full"
              min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Tomorrow's date
            />
          </div>

          {/* Coaching Style */}
          <div className="space-y-3">
            <Label>Coaching Style</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {toneOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = tone === option.id;
                
                return (
                  <div
                    key={option.id}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                      }
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={() => !isLoading && setTone(option.id)}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <h3 className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {option.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {option.description}
                        </p>
                        <p className="text-xs italic text-muted-foreground mt-2">
                          {option.example}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !title.trim()}
            >
              {isLoading ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};