import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { CalendarCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { saveWeeklyCheckin, getWeekEndingDate } from "@/api/frameworkApi";

interface WeeklyCheckinProps {
  onClose: () => void;
  onSuccess?: () => void; // Callback to refresh framework data
}

export const WeeklyCheckin = ({ onClose, onSuccess }: WeeklyCheckinProps) => {
  const { user } = useAuth();
  const [scores, setScores] = useState({
    Work: [7],
    Sleep: [5], 
    "Friends & Family": [6],
    "Health & Fitness": [5],
    "Personal Development": [4],
    Spiritual: [6]
  });
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScoreChange = (element: string, value: number[]) => {
    setScores(prev => ({
      ...prev,
      [element]: value
    }));
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to submit a check-in");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const checkinData = {
        user_id: user.id, // Use profile ID (Firebase UID) - hybrid system handles both email/UID
        week_ending: getWeekEndingDate(), // Use helper function for proper week ending
        element_scores: Object.fromEntries(
          Object.entries(scores).map(([key, value]) => [key, value[0]])
        ),
        notes: notes.trim() || null,
        overall_satisfaction: Math.round(
          Object.values(scores).reduce((sum, score) => sum + score[0], 0) / 6
        )
      };

      console.log('📊 Submitting weekly check-in:', checkinData);

      await saveWeeklyCheckin(checkinData);

      console.log('✅ Check-in submitted successfully');
      toast.success("Pillar assessment complete! Your life optimization is improving! 🎯");
      
      // Trigger framework data refresh
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
      
    } catch (error: any) {
      console.error('Check-in error:', error);
      toast.error(error.message || "Failed to submit check-in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageScore = Math.round(
    Object.values(scores).reduce((sum, score) => sum + score[0], 0) / 6
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-primary" />
            How Did You Do This Week?
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Rate each pillar of your life from 1-10 based on this week's experience
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Element Sliders */}
          {Object.entries(scores).map(([element, score]) => (
            <div key={element} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-medium">{element}</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">{score[0]}</span>
                  <span className="text-sm text-muted-foreground">/10</span>
                </div>
              </div>
              
              <Slider
                value={score}
                onValueChange={(value) => handleScoreChange(element, value)}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Needs Work</span>
                <span>Excellent</span>
              </div>
            </div>
          ))}

          {/* Overall Satisfaction */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Overall Week Rating:</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-success">{averageScore}</span>
                <span className="text-sm text-muted-foreground">/10</span>
              </div>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-success transition-all duration-300"
                style={{ width: `${(averageScore / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div className="space-y-2">
            <label className="font-medium">Notes (Optional)</label>
            <Textarea
              placeholder="Any highlights, challenges, or insights from this week?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Weekly Check-in
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};