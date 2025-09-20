import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Users, Heart, Target, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Goal } from "@/hooks/useGoals";

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

interface EditGoalDialogProps {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (goalId: string, updates: {
    title?: string;
    description?: string;
    target_date?: Date | null;
    tone?: 'drill_sergeant' | 'kind_encouraging' | 'teammate' | 'wise_mentor';
    time_of_day?: string;
  }) => Promise<void>;
}

export const EditGoalDialog = ({ goal, open, onOpenChange, onSave }: EditGoalDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: goal.title,
    description: goal.description || '',
    targetDate: goal.target_date ? new Date(goal.target_date) : null as Date | null,
    tone: goal.tone,
    timeOfDay: goal.time_of_day
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(goal.id, {
        title: formData.title,
        description: formData.description || null,
        target_date: formData.targetDate,
        tone: formData.tone,
        time_of_day: formData.timeOfDay
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
        </DialogHeader>

        <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Goal Title</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Run a marathon, Learn Spanish, Start a business"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (Optional)</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add more context, your why, specific milestones..."
              className="min-h-[100px]"
            />
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label>Target Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.targetDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.targetDate ? format(formData.targetDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.targetDate || undefined}
                  onSelect={(date) => setFormData({ ...formData, targetDate: date || null })}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({ ...formData, targetDate: null })}
              >
                Clear Date
              </Button>
            </div>
          </div>

          {/* Tone */}
          <div className="space-y-3">
            <Label>Coaching Style</Label>
            <div className="grid gap-3">
              {toneOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, tone: option.id as any })}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      formData.tone === option.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        formData.tone === option.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">{option.title}</h4>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="edit-time">Daily Motivation Time (EST)</Label>
            <Input
              id="edit-time"
              type="time"
              value={formData.timeOfDay}
              onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !formData.title.trim()}>
            {isLoading ? "Dream Big..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};