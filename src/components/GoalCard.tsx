import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Target, Zap, Trash2, Flame, RotateCcw, Edit, CheckCircle, Share2 } from "lucide-react";
// import { Brain } from "lucide-react"; // TEST: Commented out for production
import { Goal, MotivationContent, GoalWithStatus, GoalStatus, GoalPermissions } from "@/hooks/useGoals";
import { useNavigate } from "react-router-dom";
import { SimpleEditGoalDialog } from "./SimpleEditGoalDialog";
import { useShare } from "@/hooks/useShare";

// Pillar badge colors
const pillarColors = {
  'Spiritual': 'bg-purple-100 text-purple-800 border-purple-200',
  'Family & Friends': 'bg-blue-100 text-blue-800 border-blue-200',
  'Work': 'bg-green-100 text-green-800 border-green-200',
  'Personal Development': 'bg-orange-100 text-orange-800 border-orange-200',
  'Health & Fitness': 'bg-red-100 text-red-800 border-red-200'
};

// Phase 4: Enhanced GoalCard props with status and permissions
interface GoalCardProps {
  goal: Goal;
  motivation: MotivationContent | null;
  onDelete: (goalId: string) => void;
  onResetStreak: (goalId: string) => void;
  onUpdate: (goalId: string, updates: any) => Promise<void>;
  onCheckIn: (goalId: string) => Promise<any>;
  // Phase 4: New props for status-aware UI
  status?: GoalStatus;
  permissions?: GoalPermissions;
  // onGenerateMotivation?: (goalId: string) => Promise<MotivationContent | null>; // TEST: Commented out for production
}
export const GoalCard = ({
  goal,
  motivation,
  onDelete,
  onResetStreak,
  onUpdate,
  onCheckIn,
  // Phase 4: Destructure new status and permissions props
  status = 'active',
  permissions = {
    canEdit: true,
    canDelete: true,
    canCheckIn: true,
    canShare: true,
    canReceiveEmails: true,
    canGenerateNudge: true,
  }
  // onGenerateMotivation // TEST: Commented out for production
}: GoalCardProps) => {
  const navigate = useNavigate();
  const { shareGoal, isSharing } = useShare();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetStreakDialog, setShowResetStreakDialog] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
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
    // Parse as local date to avoid timezone shift (YYYY-MM-DD should stay as-is)
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, month - 1, day); // month is 0-indexed
    return localDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  const formatTimeOfDay = (timeString: string | null) => {
    if (!timeString) return null;
    // Handle both old format (HH:MM:SS) and new format (morning/afternoon/evening)
    if (timeString.includes(':')) {
      // Old format - just show "Daily Email"
      return "Daily Email";
    }
    // New format - show the time of day
    switch(timeString.toLowerCase()) {
      case 'morning':
        return 'Morning Email';
      case 'afternoon':
        return 'Afternoon Email';
      case 'evening':
        return 'Evening Email';
      default:
        return 'Daily Email';
    }
  };

  // Check if user has already checked in today - MUST match backend logic exactly
  const hasCheckedInToday = useMemo(() => {
    if (!goal.last_checkin_date) return false;
    
    // SIMPLIFIED: Backend stores UTC date, so just use UTC date directly
    // Since backend stored '2025-11-03' when it's still Nov 2nd evening EST,
    // the backend is probably just using the UTC date without timezone adjustment
    const now = new Date();
    const currentStreakDate = now.toISOString().split('T')[0];
    
    // For last check-in, if it's a date string (YYYY-MM-DD), use it directly
    // If it's a full timestamp, convert it the same way as current time  
    let lastCheckinStreakDate;
    if (goal.last_checkin_date.includes('T')) {
      // Full timestamp - convert to UTC date same as current time
      const lastCheckin = new Date(goal.last_checkin_date);
      lastCheckinStreakDate = lastCheckin.toISOString().split('T')[0];
    } else {
      // Already a date string (YYYY-MM-DD)
      lastCheckinStreakDate = goal.last_checkin_date;
    }
    
    const result = currentStreakDate === lastCheckinStreakDate;
    
    console.log(`🎯 hasCheckedInToday for ${goal.title}:`, {
      now: now.toISOString(),
      currentStreakDate,
      lastCheckinStreakDate,
      result,
      goalId: goal.id,
      rawLastCheckinDate: goal.last_checkin_date,
      goalUpdatedAt: goal.updated_at,
      streakCount: goal.streak_count,
      dateComparison: `${currentStreakDate} === ${lastCheckinStreakDate}`,
      frontendCalculation: 'Simplified to match backend - both use UTC date'
    });
    return result;
  }, [goal.last_checkin_date, goal.updated_at]);
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
              <div className="flex items-center gap-2">
                <h3 className="font-semibold mb-1">Goal</h3>
                
                {/* Pillar Badge */}
                {goal.pillar_type && (
                  <Badge variant="secondary" className={`text-xs font-medium ${pillarColors[goal.pillar_type as keyof typeof pillarColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                    {goal.pillar_type}
                  </Badge>
                )}
                
                {/* Phase 4: Status Badge */}
                {status === 'goal-expired' && (
                  <Badge variant="destructive" className="text-xs font-semibold">
                    GOAL EXPIRED
                  </Badge>
                )}
                {status === 'trial-expired' && (
                  <Badge variant="destructive" className="text-xs font-semibold bg-orange-500 hover:bg-orange-600">
                    TRIAL EXPIRED
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Streak Info */}
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-success" />
                <span className="text-sm font-medium">{goal.streak_count} day streak</span>
                {goal.streak_count > 0 && permissions.canCheckIn && <Button variant="default" size="sm" onClick={e => {
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
                  disabled={isSharing || !permissions.canShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={e => {
                e.stopPropagation();
                setShowEditDialog(true);
              }} className="text-muted-foreground hover:text-primary" title="Edit goal" disabled={!permissions.canEdit}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={e => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }} className="text-muted-foreground hover:text-destructive" title="Delete goal" disabled={!permissions.canDelete}>
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
          {goal.description && <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>}
          
          {/* Action Buttons - Side by side */}
          <div className="flex gap-2 mb-3">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!permissions.canCheckIn) return; // If can't check in, can't view motivation either
                navigate(`/goal/${goal.id}`);
              }}
              className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
              disabled={!permissions.canCheckIn}
            >
              <Target className="w-4 h-4 mr-2" />
              {!permissions.canCheckIn ? 'Motivation Unavailable' : 'View Motivation Plan'}
            </Button>
            
            {hasCheckedInToday ? (
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1 bg-success hover:bg-success/90 cursor-default"
                disabled
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Checked In! 🔥
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                onClick={async (e) => {
                  e.stopPropagation();
                  if (isCheckingIn || !permissions.canCheckIn) return;
                  
                  setIsCheckingIn(true);
                  try {
                    await onCheckIn(goal.id);
                  } finally {
                    setIsCheckingIn(false);
                  }
                }} 
                className="flex-1"
                disabled={isCheckingIn || !permissions.canCheckIn}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {!permissions.canCheckIn ? 'Check-In Disabled' : isCheckingIn ? 'Checking In...' : 'Check In Today'}
              </Button>
            )}
          </div>

          {/* Phase 4: Upgrade prompt for expired trials */}
          {status === 'trial-expired' && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-800">Trial Expired</span>
              </div>
              <p className="text-xs text-orange-700 mb-2">
                Your 30-day free trial has ended. Upgrade to continue tracking this goal.
              </p>
              <Button 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/upgrade');
                }} 
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
              >
                🎯 Upgrade to Continue
              </Button>
            </div>
          )}

          {/* Goal expired message */}
          {status === 'goal-expired' && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-800">Goal Expired</span>
              </div>
              <p className="text-xs text-gray-600">
                This goal has reached its target date. Edit to extend or delete to remove.
              </p>
            </div>
          )}
          
          {/* Goal Settings */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {goal.target_date && <span>🎯 Target: {formatDate(goal.target_date)}</span>}
            <Badge variant="secondary" className="text-xs">
              {formatToneName(goal.tone)} Style
            </Badge>
          </div>
          
          {/* Helpful info - subtle */}
          <div className="text-xs text-muted-foreground mt-2 space-y-1">
            <p>📧 You'll receive your daily wake-up email</p>
            <p>🕒 Check-ins reset daily at 3 AM EST</p>
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