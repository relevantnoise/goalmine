import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_date?: string;
  tone: 'drill_sergeant' | 'kind_encouraging' | 'teammate' | 'wise_mentor';
  time_of_day: string;
  streak_count: number;
  is_active: boolean;
  last_motivation_date?: string;
  last_checkin_date?: string;
  created_at: string;
  updated_at: string;
}

export interface MotivationContent {
  message: string;
  microPlan: string | string[];
  challenge: string;
  tone: string;
}

// Phase 1: Data Layer Helper Functions
export interface GoalPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canCheckIn: boolean;
  canShare: boolean;
  canReceiveEmails: boolean;
  canGenerateNudge: boolean;
}

export type GoalStatus = 'active' | 'goal-expired' | 'trial-expired';

export interface Profile {
  id: string;
  email: string;
  trial_expires_at?: string;
  created_at: string;
}

// Helper function to check if a goal has expired based on target_date
export function isGoalExpired(goal: Goal): boolean {
  if (!goal.target_date) return false;
  const targetDate = new Date(goal.target_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Compare dates only, ignore time
  return targetDate < today;
}

// Helper function to check if user's free trial has expired
export function isTrialExpired(profile: Profile | null): boolean {
  if (!profile || !profile.trial_expires_at) return false;
  return new Date(profile.trial_expires_at) < new Date();
}

// Helper function to determine goal status (most restrictive wins)
export function getGoalStatus(goal: Goal, profile: Profile | null, isSubscribed: boolean): GoalStatus {
  // Trial expired and not subscribed = most restrictive
  if (isTrialExpired(profile) && !isSubscribed) {
    return 'trial-expired';
  }
  
  // Goal expired = moderately restrictive
  if (isGoalExpired(goal)) {
    return 'goal-expired';
  }
  
  // Normal operation
  return 'active';
}

// Helper function to get what user can do with a goal
export function getGoalPermissions(goal: Goal, profile: Profile | null, isSubscribed: boolean): GoalPermissions {
  const status = getGoalStatus(goal, profile, isSubscribed);
  
  switch (status) {
    case 'trial-expired':
      // Trial expired: completely read-only
      return {
        canEdit: false,
        canDelete: false,
        canCheckIn: false,
        canShare: false,
        canReceiveEmails: false,
        canGenerateNudge: false,
      };
      
    case 'goal-expired':
      // Goal expired: only edit/delete allowed
      return {
        canEdit: true,
        canDelete: true,
        canCheckIn: false,
        canShare: false,
        canReceiveEmails: false,
        canGenerateNudge: false,
      };
      
    case 'active':
    default:
      // Full functionality
      return {
        canEdit: true,
        canDelete: true,
        canCheckIn: true,
        canShare: true,
        canReceiveEmails: true,
        canGenerateNudge: true,
      };
  }
}

// Phase 3: Enhanced Goal with Status and Permissions
export interface GoalWithStatus extends Goal {
  status: GoalStatus;
  permissions: GoalPermissions;
}

export const useGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [todaysMotivation, setTodaysMotivation] = useState<Record<string, MotivationContent>>({});
  
  // Phase 3: Add profile and subscription state
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [goalsWithStatus, setGoalsWithStatus] = useState<GoalWithStatus[]>([]);

  // Phase 3: Fetch user profile for trial status
  const fetchUserProfile = async () => {
    if (!user) return null;
    
    const userId = user.email || user.id;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  // Phase 3: Check subscription status
  const checkSubscriptionStatus = async () => {
    if (!user) return false;
    
    const userId = user.email || user.id;
    try {
      const { data } = await supabase.functions.invoke('check-subscription', {
        body: { userId, email: user.email }
      });
      
      return data?.subscribed || false;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  };

  // Phase 3: Enhance goals with status and permissions
  const enhanceGoalsWithStatus = (goals: Goal[], profile: Profile | null, isSubscribed: boolean): GoalWithStatus[] => {
    return goals.map(goal => ({
      ...goal,
      status: getGoalStatus(goal, profile, isSubscribed),
      permissions: getGoalPermissions(goal, profile, isSubscribed)
    }));
  };

  // Fetch user's goals using edge function to bypass RLS
  const fetchGoals = async () => {
    if (!user) {
      console.log('🔍 fetchGoals called but no user available yet');
      return;
    }

    console.log('🔍 fetchGoals starting for user:', user.id);
    setLoading(true);

    try {
      console.log('🔍 Using edge function to fetch goals (bypasses RLS)');
      
      // Make sure we're using the same user_id format as when creating goals
      const userId = user.email || user.id;
      console.log('🔍 DEBUG: user.email =', user.email);
      console.log('🔍 DEBUG: user.id =', user.id);
      console.log('🔍 Fetching goals for user_id:', userId);
      
      // Phase 3: Fetch goals, profile, and subscription in parallel
      const [goalsResponse, profile, subscribed] = await Promise.all([
        supabase.functions.invoke('fetch-user-goals', {
          body: { user_id: userId }
        }),
        fetchUserProfile(),
        checkSubscriptionStatus()
      ]);

      if (goalsResponse.error || !goalsResponse.data?.success) {
        console.error('❌ Error fetching goals:', goalsResponse.error || goalsResponse.data?.error);
        throw new Error(goalsResponse.data?.error || goalsResponse.error?.message || 'Failed to fetch goals');
      }

      const fetchedGoals = goalsResponse.data.goals;
      console.log('✅ Goals fetched via edge function:', fetchedGoals.length, 'goals');
      
      // Phase 3: Store profile and subscription status
      setUserProfile(profile);
      setIsSubscribed(subscribed);
      
      // Phase 3: Enhance goals with status and permissions
      const enhancedGoals = enhanceGoalsWithStatus(fetchedGoals, profile, subscribed);
      setGoalsWithStatus(enhancedGoals);
      
      // Keep original goals array for backward compatibility
      setGoals(fetchedGoals);

    } catch (error) {
      console.error('❌ Error fetching goals:', error);
      setGoals([]);
      setGoalsWithStatus([]);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced goal creation with tone selection
  const createGoal = async (goalData: {
    title: string;
    description?: string;
    target_date?: Date;
    tone?: 'drill_sergeant' | 'kind_encouraging' | 'teammate' | 'wise_mentor';
    time_of_day?: string;
  }) => {
    console.log('🚀 ULTRA-SIMPLE: Creating goal for user:', user?.email);
    if (!user) {
      toast.error('Please sign in to create a goal');
      return null;
    }

    try {
      setLoading(true);

      // Use email as primary user_id to match profile system
      const userId = user.email || user.id;
      console.log('🔍 Creating goal for user_id:', userId);
      
      // Minimal goal data with defaults  
      const newGoal = {
        user_id: userId,
        title: goalData.title,
        description: goalData.description || null,
        target_date: goalData.target_date ? goalData.target_date.toISOString().split('T')[0] : null,
        tone: goalData.tone || 'kind_encouraging',
        time_of_day: '07:00', // Default early morning time for daily motivation
        streak_count: 0,
        is_active: true
      };

      console.log('📝 Inserting minimal goal:', newGoal);

      // Use the edge function with subscription limits
      const { data, error } = await supabase.functions.invoke('create-goal', {
        body: newGoal
      });

      console.log('🔍 CREATE-GOAL RESPONSE:', { data, error });

      if (error || !data?.success) {
        console.log('❌ Goal creation blocked by backend:', data?.error || error?.message);
        throw new Error(data?.error || error?.message || 'Failed to create goal');
      }

      console.log('✅ Goal created:', data.goal.id);

      // Add to state immediately
      setGoals(prev => [...prev, data.goal]);

      // Generate initial motivational content using LLM
      try {
        console.log('🤖 Generating initial LLM motivation for new goal:', data.goal.id);
        console.log('🤖 Goal details:', { title: data.goal.title, tone: data.goal.tone });
        const initialMotivation = await generateGoalMotivation(data.goal.id);
        if (initialMotivation) {
          console.log('✅ Initial motivation generated successfully:', initialMotivation);
          // Cache it for immediate display
          setTodaysMotivation(prev => ({
            ...prev,
            [data.goal.id]: initialMotivation
          }));
        } else {
          console.log('⚠️ generateGoalMotivation returned null, trying fallback');
          await createBasicMotivationContent(data.goal);
        }
      } catch (error) {
        console.error('⚠️ Could not generate initial motivation, using fallback:', error);
        // Create fallback content instead of failing goal creation
        await createBasicMotivationContent(data.goal);
      }

      return data.goal;

    } catch (error) {
      console.error('❌ Simple goal creation failed:', error);
      
      // Show the exact error from backend (includes limit messages)
      const errorMessage = error.message || 'Could not create goal';
      
      // Check if it's a limit error and show it prominently
      if (errorMessage.includes('maximum') || errorMessage.includes('limit')) {
        toast.error(errorMessage, {
          duration: 5000, // Show for 5 seconds
          important: true
        });
      } else {
        toast.error(`Could not create goal: ${errorMessage}`);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Check in to a goal (update streak)
  const checkIn = async (goalId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-in', {
        body: { goalId, userId: user.email || user.id }
      });

      if (error) {
        // Handle specific check-in errors
        if (error.message?.includes('already checked in')) {
          toast.error("You've already checked in today! Come back tomorrow after 3 AM EST.");
        } else {
          toast.error(`Check-in failed: ${error.message}`);
        }
        return;
      }

      // Show success message with streak info
      const message = data.message || 'Checked in! Streak updated.';
      toast.success(message);
      
      // Optimistic update - update the goal state immediately
      if (data.goal) {
        console.log('🎯 Check-in successful, updating goal state:', {
          goalId,
          oldLastCheckin: goals.find(g => g.id === goalId)?.last_checkin_date,
          newLastCheckin: data.goal.last_checkin_date,
          newStreakCount: data.goal.streak_count,
          fullGoalData: data.goal
        });
        
        // Force update ONLY the specific goal that was checked in
        setGoals(prev => {
          const updated = prev.map(goal => 
            goal.id === goalId 
              ? { ...data.goal } // Replace with complete backend data
              : goal // Leave other goals unchanged
          );
          console.log('🎯 Goals after update:', updated.map(g => ({
            id: g.id, 
            title: g.title, 
            last_checkin_date: g.last_checkin_date, 
            streak_count: g.streak_count
          })));
          return updated;
        });
      } else {
        // Fallback to refetch if no goal data returned
        console.log('🎯 No goal data returned, fetching goals');
        await fetchGoals();
      }
    } catch (error) {
      console.error('❌ Error checking in:', error);
      
      // Handle function invocation errors vs response errors
      if (error?.message?.includes('already checked in')) {
        toast.error("You've already checked in today! Come back tomorrow after 3 AM EST.");
      } else {
        toast.error('Failed to check in. Please try again.');
      }
    }
  };

  // Delete a goal
  const deleteGoal = async (goalId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('delete-goal', {
        body: { goalId, userId: user.email || user.id }
      });

      if (error) throw error;
      
      // Optimistic update - remove from state immediately
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      
      // Wait for backend to fully process deletion before showing success
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Refresh goals to ensure consistency with backend
      await fetchGoals();
      
      // Show success toast after backend sync completes
      toast.success('🗑️ Goal deleted! Time to dream up something new.');
      
    } catch (error) {
      console.error('❌ Error deleting goal:', error);
      toast.error('Failed to delete goal. Please try again.');
      // Revert optimistic update on error
      await fetchGoals();
    }
  };

  // Reset goal streak
  const resetStreak = async (goalId: string) => {
    if (!user) return;

    try {
      console.log('🎯 useGoals: Reset streak called for goal:', goalId);
      const { data, error } = await supabase.functions.invoke('reset-streak', {
        body: { goal_id: goalId, user_id: user.email || user.id }
      });

      if (error) throw error;
      
      // Optimistic update - set streak to 0
      setGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, streak_count: 0 }
          : goal
      ));
      console.log('🎯 useGoals: Reset streak completed successfully');
    } catch (error) {
      console.error('🎯 useGoals: Reset streak failed:', error);
      throw error; // Let Dashboard handle the error
    }
  };

  // Update a goal
  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('update-goal', {
        body: { goalId, userId: user.email || user.id, updates }
      });

      if (error) throw error;
      
      // Optimistic update
      setGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, ...updates, updated_at: new Date().toISOString() }
          : goal
      ));
      toast.success('Goal updated successfully.');
    } catch (error) {
      console.error('❌ Error updating goal:', error);
      toast.error('Failed to update goal. Please try again.');
      // Revert optimistic update on error
      await fetchGoals();
    }
  };

  // Generate goal-specific motivation content using LLM
  const generateGoalMotivation = async (goalId: string): Promise<MotivationContent | null> => {
    if (!user) return null;

    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) {
        toast.error('Goal not found');
        return null;
      }

      console.log('🤖 Generating LLM motivation for goal:', goal.title);

      const { data, error } = await supabase.functions.invoke('generate-daily-motivation', {
        body: {
          goalId: goal.id,
          goalTitle: goal.title,
          goalDescription: goal.description,
          tone: goal.tone,
          streakCount: goal.streak_count,
          userId: user.email || user.id,
          targetDate: goal.target_date,
          isNudge: false,
          isGeneralNudge: false
        }
      });

      if (error) {
        console.error('❌ LLM generation error:', error);
        toast.error('Failed to generate motivation content');
        return null;
      }

      console.log('✅ LLM motivation generated:', data);

      return {
        message: data.message,
        microPlan: Array.isArray(data.microPlan) ? data.microPlan : [data.microPlan],
        challenge: data.challenge,
        tone: goal.tone
      };
    } catch (error) {
      console.error('❌ Error generating goal motivation:', error);
      toast.error('Failed to generate motivation content');
      return null;
    }
  };

  // Generate general motivational nudge (not goal-specific)
  const generateGeneralNudge = async (): Promise<MotivationContent | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-motivation', {
        body: { 
          userId: user.email || user.id,
          isGeneralNudge: true
        }
      });

      if (error) throw error;

      return {
        message: data.message,
        microPlan: Array.isArray(data.microPlan) ? data.microPlan : [data.microPlan],
        challenge: data.challenge || '',
        tone: 'encouraging'
      };
    } catch (error) {
      console.error('❌ Error generating general nudge:', error);
      return null;
    }
  };

  // Generate motivation for all goals (for dashboard)
  const generateMotivationForGoals = async () => {
    if (!user || goals.length === 0) return;

    try {
      // This would typically be called by a daily cron job
      // For now, just fetch existing motivation from database
      console.log('📝 generateMotivationForGoals called - should be handled by daily cron');
    } catch (error) {
      console.error('❌ Error generating motivation for goals:', error);
    }
  };

  // Create basic motivation content (no LLM, just template-based)
  const createBasicMotivationContent = async (goal: Goal) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Simple template-based content based on tone
      const motivationTemplates = {
        'drill_sergeant': {
          message: `Listen up! You just created "${goal.title}" and now it's time to EXECUTE. No excuses, no delays - success demands action TODAY.`,
          microPlan: [
            'Set a specific time block for working on this goal today',
            'Eliminate one distraction that might derail your progress',  
            'Write down exactly what you will accomplish in the next 24 hours'
          ],
          challenge: 'Right now, do ONE thing - however small - that moves you toward this goal. No exceptions!'
        },
        'kind_encouraging': {
          message: `What a wonderful step you've taken by creating "${goal.title}"! I believe in you completely, and I know you have everything it takes to make this dream a reality.`,
          microPlan: [
            'Take a moment to visualize how achieving this goal will feel',
            'Write down one reason why this goal is important to you',
            'Plan a small, gentle first step you can take today'
          ],
          challenge: 'Give yourself a pat on the back for starting this journey - you deserve recognition for taking action!'
        },
        'teammate': {
          message: `Hey teammate! We just set up "${goal.title}" together and I'm pumped to be on this journey with you. We've got this - let's tackle it step by step!`,
          microPlan: [
            'Let\'s break this goal into smaller, manageable chunks',
            'We should identify what resources or support you might need',
            'Together, let\'s plan the very next action we can take'
          ],
          challenge: 'Team challenge: Find someone you can share this goal with - accountability partners make everything easier!'
        },
        'wise_mentor': {
          message: `By creating "${goal.title}", you've demonstrated wisdom in setting clear intentions. Remember, every master was once a beginner - trust the process and be patient with your progress.`,
          microPlan: [
            'Reflect on why this goal aligns with your deeper values',
            'Consider what you might learn about yourself through this journey',
            'Identify the first principle or skill you need to develop'
          ],
          challenge: 'Take 2 minutes to journal about what success in this goal would mean for your future self.'
        }
      };

      const template = motivationTemplates[goal.tone] || motivationTemplates['kind_encouraging'];
      
      // Save to database
      const { data, error } = await supabase
        .from('motivation_history')
        .insert([{
          goal_id: goal.id,
          user_id: goal.user_id,
          date: today,
          message: template.message,
          micro_plan: template.microPlan,
          challenge: template.challenge,
          tone: goal.tone,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('⚠️ Could not save motivation content:', error);
        // Don't fail the goal creation if motivation save fails
        return;
      }

      // Cache it in state for immediate use
      setTodaysMotivation(prev => ({
        ...prev,
        [goal.id]: {
          message: template.message,
          microPlan: template.microPlan,
          challenge: template.challenge,
          tone: goal.tone
        }
      }));

      console.log('✅ Basic motivation content created for goal:', goal.title);
      
    } catch (error) {
      console.error('⚠️ Error creating basic motivation content:', error);
      // Don't fail goal creation if this fails
    }
  };

  // Auto-fetch goals when user changes
  useEffect(() => {
    if (user) {
      fetchGoals();
    } else {
      setGoals([]);
    }
  }, [user]);

  // DEBUG: Function to investigate database issues
  const debugGoals = async () => {
    if (!user) return;

    try {
      console.log('🔍 DEBUG: Starting database investigation...');
      const { data, error } = await supabase.functions.invoke('debug-goals', {
        body: { user_id: user.email || user.id }
      });

      if (error) {
        console.error('❌ Debug function error:', error);
        return;
      }

      console.log('🔍 DEBUG RESULTS:', data.debug);
      toast.success(`Debug complete - check console. Found ${data.debug.total_goals_in_db} total goals, ${data.debug.user_specific_goals} for you.`);
      
      return data.debug;
    } catch (error) {
      console.error('❌ Debug error:', error);
      toast.error('Debug failed - check console');
    }
  };

  // Update subscription status (for testing)
  const updateSubscription = async (planName: string = 'Personal Plan', status: string = 'active') => {
    if (!user) return;
    
    try {
      console.log('🔄 Updating subscription status...');
      const { data, error } = await supabase.functions.invoke('update-subscription', {
        body: { 
          userId: user.email || user.id,
          planName,
          status
        }
      });

      if (error) {
        console.error('❌ Subscription update error:', error);
        toast.error('Subscription update failed - check console');
        return;
      }

      console.log('✅ Subscription updated:', data);
      toast.success(`Subscription updated to ${planName} (${status})`);
      
      return data;
    } catch (error) {
      console.error('❌ Subscription update error:', error);
      toast.error('Subscription update failed - check console');
    }
  };

  // Clean all data from database
  const cleanDatabase = async () => {
    try {
      console.log('🧹 Cleaning database...');
      const { data, error } = await supabase.functions.invoke('cleanup-all-data');

      if (error) {
        console.error('❌ Cleanup error:', error);
        toast.error('Cleanup failed - check console');
        return;
      }

      console.log('✅ Database cleaned:', data);
      toast.success('Database cleaned successfully!');
      
      // Clear local state
      setGoals([]);
      setTodaysMotivation({});
      
      return data;
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      toast.error('Cleanup failed - check console');
    }
  };

  return {
    goals,
    loading,
    fetchGoals,
    createGoal,
    checkIn,
    deleteGoal,
    resetStreak,
    updateGoal,
    generateGeneralNudge,
    generateGoalMotivation,
    generateMotivationForGoals,
    todaysMotivation,
    debugGoals,
    cleanDatabase,
    updateSubscription,
    // Phase 3: New exports for status and permissions
    goalsWithStatus,
    userProfile,
    isSubscribed,
    isTrialExpired: isTrialExpired(userProfile),
    getGoalStatus: (goal: Goal) => getGoalStatus(goal, userProfile, isSubscribed),
    getGoalPermissions: (goal: Goal) => getGoalPermissions(goal, userProfile, isSubscribed),
  };
};