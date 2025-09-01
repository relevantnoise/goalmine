import { useState } from "react";
import { Calendar, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Goal } from "@/hooks/useGoals";

interface PlannedBreakDialogProps {
  goal: Goal;
  onSuccess: () => void;
}

export const PlannedBreakDialog = ({ goal, onSuccess }: PlannedBreakDialogProps) => {
  const [open, setOpen] = useState(false);
  const [breakDays, setBreakDays] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (breakDays < 1 || breakDays > 14) {
      toast({
        title: "Invalid Break Duration",
        description: "Break duration must be between 1 and 14 days.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + breakDays - 1);
      
      const { error } = await supabase
        .from('goals')
        .update({
          is_on_planned_break: true,
          planned_break_until: endDate.toISOString().split('T')[0]
        })
        .eq('id', goal.id);

      if (error) throw error;

      toast({
        title: "✈️ Break Scheduled!",
        description: `Your streak is paused for ${breakDays} day${breakDays > 1 ? 's' : ''} until ${endDate.toLocaleDateString()}.`,
        variant: "default",
      });

      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error scheduling break:', error);
      toast({
        title: "Error",
        description: "Failed to schedule break. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBreak = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('goals')
        .update({
          is_on_planned_break: false,
          planned_break_until: null
        })
        .eq('id', goal.id);

      if (error) throw error;

      toast({
        title: "🎯 Break Cancelled!",
        description: "Your goal is active again. Welcome back!",
        variant: "default",
      });

      onSuccess();
    } catch (error) {
      console.error('Error cancelling break:', error);
      toast({
        title: "Error",
        description: "Failed to cancel break. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // If currently on break, show cancel option
  if (goal.is_on_planned_break && goal.planned_break_until) {
    const breakEnd = new Date(goal.planned_break_until);
    const today = new Date();
    const isExpired = breakEnd < today;

    return (
      <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
        <Pause className="w-5 h-5 mx-auto mb-2 text-orange-600" />
        <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
          {isExpired 
            ? "Break period ended. Click check-in to resume!"
            : `On break until ${breakEnd.toLocaleDateString()}`
          }
        </p>
        {!isExpired && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleCancelBreak}
            disabled={loading}
            className="text-orange-600 border-orange-300"
          >
            {loading ? "Cancelling..." : "Cancel Break"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">
          <Pause className="w-3 h-3 mr-1" />
          Plan Break
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pause className="w-5 h-5" />
            Plan a Streak Break
          </DialogTitle>
          <DialogDescription>
            Pause your streak for vacation, illness, or planned time off.
            Your streak will be preserved during this time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="break-days">Number of Days</Label>
            <Input
              id="break-days"
              type="number"
              min="1"
              max="14"
              value={breakDays}
              onChange={(e) => setBreakDays(parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              Maximum 14 days per break. Your streak will be protected during this time.
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> This preserves your streak during planned time away. 
              You won't be able to check-in during the break period.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Scheduling..." : "Schedule Break"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};