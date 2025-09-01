import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Target, Zap, Trash2, Flame, RotateCcw, Edit, CheckCircle, Share2 } from "lucide-react";
// import { Brain } from "lucide-react"; // TEST: Commented out for production
import { Goal, MotivationContent } from "@/hooks/useGoals";
import { useNavigate } from "react-router-dom";
import { SimpleEditGoalDialog } from "./SimpleEditGoalDialog";
import { useShare } from "@/hooks/useShare";
interface GoalCardProps {
  goal: Goal;
  motivation: MotivationContent | null;
  onDelete: (goalId: string) => void;
  onResetStreak: (goalId: string) => void;
  onUpdate: (goalId: string, updates: any) => Promise<void>;
  onCheckIn: (goalId: string) => void;
  // onGenerateMotivation?: (goalId: string) => Promise<MotivationContent | null>; // TEST: Commented out for production
}
export const GoalCard = ({
  goal,
  motivation,
  onDelete,
  onResetStreak,
  onUpdate,
  onCheckIn
  // onGenerateMotivation // TEST: Commented out for production
}: GoalCardProps) => {
  const navigate = useNavigate();
  const { shareGoal, isSharing } = useShare();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetStreakDialog, setShowResetStreakDialog] = useState(false);
  // const [isGeneratingMotivation, setIsGeneratingMotivation] = useState(false); // TEST: Commented out for production

  // TEST: Commented out for production
  // const handleGenerateMotivation = async (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   if (!onGenerateMotivation) return;
  //   
  //   setIsGeneratingMotivation(true);
  //   try {
  //     const motivation = await onGenerateMotivation(goal.id);
  //     if (motivation) {
  //       // Show the motivation in a toast
  //       console.log('🤖 Generated motivation:', motivation);
  //     }
  //   } catch (error) {
  //     console.error('Error generating motivation:', error);
  //   } finally {
  //     setIsGeneratingMotivation(false);
  //   }
  // };

  const formatToneName = (tone: string) => {
    switch (tone) {
      case 'drill_sergeant':
        return 'Drill Sergeant';
      case 'kind_encouraging':
        return 'Kind & Encouraging';
      case 'teammate':
        return 'Teammate';
      case 'wise_mentor':
        return 'Wise Mentor';
      default:
        return tone;
    }
  };
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    // Parse time string (HH:MM:SS format) and format to 12-hour format
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Check if user has already checked in today - MUST match backend logic exactly
  const hasCheckedInToday = useMemo(() => {
    if (!goal.last_checkin_date) return false;
    
    // Calculate current "streak day" in Eastern Time (3 AM reset) - SAME as backend
    const now = new Date();
    
    // Get current time in Eastern Time using proper timezone (handles EST/EDT automatically)
    const easternTimeStr = now.toLocaleString("en-US", { timeZone: "America/New_York" });
    const easternTime = new Date(easternTimeStr);
    
    // Subtract 3 hours so day changes at 3 AM Eastern - SAME as backend
    const streakDay = new Date(easternTime.getTime() - (3 * 60 * 60 * 1000));
    const currentStreakDate = streakDay.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Calculate last check-in streak date - SAME as backend
    const lastCheckin = new Date(goal.last_checkin_date);
    const lastCheckinEasternStr = lastCheckin.toLocaleString("en-US", { timeZone: "America/New_York" });
    const lastCheckinEastern = new Date(lastCheckinEasternStr);
    const lastStreakDay = new Date(lastCheckinEastern.getTime() - (3 * 60 * 60 * 1000));
    const lastCheckinStreakDate = lastStreakDay.toISOString().split('T')[0];
    
    const result = currentStreakDate === lastCheckinStreakDate;
    
    console.log(`🎯 hasCheckedInToday for ${goal.title}:`, {
      now: now.toISOString(),
      easternTime: easternTime.toISOString(),
      easternHour: easternTime.getHours(),
      currentStreakDate,
      lastCheckinStreakDate,
      result,
      goalId: goal.id,
      goalUpdatedAt: goal.updated_at,
      streakCount: goal.streak_count,
      frontendCalculation: 'Matches backend logic exactly'
    });
    return result;
  }, [goal.last_checkin_date, goal.id, goal.title, goal.updated_at, goal.streak_count]);
  return <Card className="border border-border shadow-sm">
      <div>
      <CardHeader>
        {/* Goal Header */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Goal</h3>
            </div>
            <div className="flex items-center gap-2">
              {/* Streak Info */}
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-success" />
                <span className="text-sm font-medium">{goal.streak_count} day streak</span>
                {goal.streak_count > 0 && <Button variant="default" size="sm" onClick={e => {
                  e.stopPropagation();
                  console.log('🔥 GoalCard: Opening reset streak dialog for goal:', goal.id, goal.title, 'streak:', goal.streak_count);
                  setShowResetStreakDialog(true);
                }} className="h-6 px-2 text-xs bg-primary hover:bg-primary/90 ml-1" title="Reset streak to zero">
                  Reset Streak
                </Button>}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-1 ml-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={e => {
                    e.stopPropagation();
                    shareGoal(goal.title, goal.description, goal.streak_count);
                  }} 
                  className="text-muted-foreground hover:text-primary" 
                  title="Share goal"
                  disabled={isSharing}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={e => {
                e.stopPropagation();
                setShowEditDialog(true);
              }} className="text-muted-foreground hover:text-primary" title="Edit goal">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={e => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }} className="text-muted-foreground hover:text-destructive" title="Delete goal">
                  <Trash2 className="w-4 h-4" />
                </Button>
                {/* TEST: Commented out for production
                {onGenerateMotivation && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleGenerateMotivation}
                    disabled={isGeneratingMotivation}
                    className="text-muted-foreground hover:text-primary" 
                    title="Generate LLM motivation content"
                  >
                    <Brain className={`w-4 h-4 ${isGeneratingMotivation ? 'animate-pulse' : ''}`} />
                  </Button>
                )}
                */}
              </div>
            </div>
          </div>
          
          {/* Goal Title and Description */}
          <CardTitle className="text-lg mb-1">
            {goal.title}
          </CardTitle>
          {goal.description && <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>}
          
          {/* View Details Button */}
          <Button 
            variant="default" 
            size="sm" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/goal/${goal.id}`);
            }}
            className="mb-2 bg-primary hover:bg-primary/90"
          >
            <Target className="w-4 h-4 mr-2" />
            View Today's Motivational Plan
          </Button>
          
          {/* Goal Settings */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {goal.target_date && <span>🎯 Target: {formatDate(goal.target_date)}</span>}
            {goal.time_of_day && <span>📧 Email: {formatTime(goal.time_of_day)}</span>}
            <Badge variant="secondary" className="text-xs">
              {formatToneName(goal.tone)} Tone
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      {motivation && <CardContent className="space-y-4">
          {/* Daily Message */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Today's Message</h4>
            <div className="prose prose-sm max-w-none">
              {motivation.message.split('\n').map((paragraph, i) => <p key={i} className="text-foreground text-sm leading-relaxed mb-2 last:mb-0">
                  {paragraph}
                </p>)}
            </div>
          </div>

          {/* Micro Plan */}
          {(() => {
            const microPlan = motivation.microPlan;
            const microPlanArray = Array.isArray(microPlan) ? microPlan : (typeof microPlan === 'string' ? microPlan.split('\n').filter(step => step.trim()) : []);
            
            return microPlanArray && microPlanArray.length > 0 ? (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Micro-Plan
                </h4>
                <div className="space-y-2">
                  {microPlanArray.map((step, index) => <div key={index} className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-sm text-foreground">{step.replace(/^•\s*/, '').trim()}</p>
                    </div>)}
                </div>
              </div>
            ) : null;
          })()}

          {/* Mini Challenge */}
          {motivation.challenge && <div className="bg-warning-light/20 p-3 rounded-lg border border-warning/20">
              <h4 className="font-semibold text-sm mb-1 flex items-center gap-2 text-warning-foreground">
                <Zap className="w-4 h-4" />
                Mini-Challenge
              </h4>
              <p className="text-sm text-foreground">{motivation.challenge}</p>
              <p className="text-xs text-muted-foreground mt-1">
                ⏱️ Takes 2 minutes or less
              </p>
            </div>}
        </CardContent>}

      {/* Check-in Button - Always show regardless of motivation */}
      <CardContent className={`pt-${motivation ? '0' : '4'}`}>
        <div className="pt-2">
          {hasCheckedInToday ? <div className="flex items-center gap-2 text-success text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Checked in today! 🔥</span>
            </div> : <Button variant="default" size="sm" onClick={e => {
          e.stopPropagation();
          onCheckIn(goal.id);
        }} className="w-full">
              <CheckCircle className="w-4 h-4 mr-2" />
              Check In Today
            </Button>}
          
          {/* Daily reset info */}
          <p className="text-xs text-muted-foreground mt-2 text-center">🕒 Your ability to Check In again will reset daily at 3 AM EST</p>
        </div>
      </CardContent>
      </div> {/* Close clickable div */}

      <SimpleEditGoalDialog goal={goal} open={showEditDialog} onOpenChange={setShowEditDialog} onSave={onUpdate} />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{goal.title}"? This action cannot be undone and you'll lose all your progress including your {goal.streak_count} day streak.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
            onDelete(goal.id);
            setShowDeleteDialog(false);
          }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Goal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResetStreakDialog} onOpenChange={setShowResetStreakDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Streak</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset your {goal.streak_count} day streak for "{goal.title}" back to zero? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
            console.log('🔥 GoalCard: Reset streak dialog confirmed for goal:', goal.id);
            onResetStreak(goal.id);
            setShowResetStreakDialog(false);
          }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset Streak
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>;
};