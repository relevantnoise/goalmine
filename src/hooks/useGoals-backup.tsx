import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  tone: 'drill_sergeant' | 'kind_encouraging' | 'teammate' | 'wise_mentor';
  time_of_day: string;
  streak_count: number;
  is_active: boolean;
  last_motivation_date: string | null;
  last_checkin_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface MotivationContent {
  message: string;
  microPlan: string[];
  challenge: string;
  tone: string;
}


export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaysMotivation, setTodaysMotivation] = useState<Record<string, MotivationContent>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's goals
  const fetchGoals = async () => {
    if (!user) {
      // Don't set loading to false when user is not yet available
      // This prevents "No Active Goals" flash during auth loading
      console.log('🔍 fetchGoals called but no user available yet');
      return;
    }

    console.log('🔍 fetchGoals starting for user:', user.id);
    console.log('🔍 User object details:', { id: user.id, email: user.email, uid: user.uid });
    setLoading(true); // Ensure loading is true when starting fetch

    try {
      console.log('🔍 Fetching goals for user:', user.id);
      
      // Simple direct database query - check email first for consistency
      let goalsData = null;
      let error = null;
      
      // First try with email (since we now create goals with email as user_id)
      if (user.email) {
        console.log('🔍 Trying with email:', user.email);
        console.log('🔍 Query: SELECT * FROM goals WHERE user_id =', user.email, 'AND is_active = true');
        const { data: goals1, error: error1 } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.email)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
          
        console.log('🔍 Email query result:', { data: goals1, error: error1 });
        if (!error1 && goals1 && goals1.length > 0) {
          goalsData = goals1;
          console.log('✅ Found goals with email');
        } else {
          // Fallback: try with Firebase UID for legacy data
          console.log('🔍 Fallback: trying with Firebase UID:', user.id);
          console.log('🔍 UID Query: SELECT * FROM goals WHERE user_id =', user.id, 'AND is_active = true');
          const { data: goals2, error: error2 } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
            
          console.log('🔍 UID query result:', { data: goals2, error: error2 });
          if (!error2 && goals2 && goals2.length > 0) {
            goalsData = goals2;
            console.log('✅ Found goals with Firebase UID');
          } else {
            error = error1 || error2;
            goalsData = [];
          }
        }
      } else {
        // No email, use Firebase UID only
        console.log('🔍 No email, using Firebase UID:', user.id);
        const { data: goals1, error: error1 } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
          
        goalsData = goals1 || [];
        error = error1;
      }

      if (error) {
        console.error('❌ Goals query error:', error);
        throw error;
      }
      
      console.log('✅ Goals fetched directly:', goalsData?.length || 0, 'goals');
      console.log('🔍 Goals data:', goalsData);
      
      // Set the actual goals from database (no more test goals)
      const goals = (goalsData || []) as Goal[];
      setGoals(goals);
      console.log('✅ Goals loaded:', goals.length);
      
      if (goals.length > 0) {
        // Fetch today's motivation for all goals
        console.log('🔄 Fetching today\'s motivation...');
        await fetchTodaysMotivation(goals);
        console.log('✅ Today\'s motivation loaded');
      }
    } catch (error) {
      console.error('❌ Error fetching goals:', error);
      toast({
        title: "Error",
        description: "Failed to load your goals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch today's motivation for all goals from the database  
  const fetchTodaysMotivation = async (goalsData: Goal[]) => {
    if (!user || !goalsData.length) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const motivationMap: Record<string, MotivationContent> = {};

      // Fetch all motivation in batch for better performance
      console.log(`🔍 Batch fetching motivation for ${goalsData.length} goals for date: ${today}`);
      const goalIds = goalsData.map(g => g.id);
      
      const { data: motivationData, error } = await supabase
        .from('motivation_history')
        .select('*')
        .in('goal_id', goalIds)
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error batch fetching motivation:', error);
        return;
      }

      // Group motivation by goal_id
      const motivationByGoal: Record<string, any> = {};
      motivationData?.forEach(motivation => {
        if (!motivationByGoal[motivation.goal_id]) {
          motivationByGoal[motivation.goal_id] = motivation;
        }
      });

      // Process each goal - only load existing motivation, never generate
      for (const goal of goalsData) {
        const existingMotivation = motivationByGoal[goal.id];
        
        if (existingMotivation) {
          motivationMap[goal.id] = {
            message: existingMotivation.message,
            microPlan: Array.isArray(existingMotivation.micro_plan) ? existingMotivation.micro_plan as string[] : [],
            challenge: existingMotivation.challenge || '',
            tone: existingMotivation.tone
          };
          console.log(`✅ Found pre-generated motivation for goal: ${goal.title}`);
        } else {
          console.log(`⚠️ No pre-generated motivation found for goal ${goal.title} today. Should have been created by cron job or at goal creation.`);
          // Do NOT generate motivation here - it should be pre-generated by scheduled jobs
        }
      }

      setTodaysMotivation(motivationMap);
      console.log('✅ Batch loaded today\'s motivation for goals:', Object.keys(motivationMap));
    } catch (error) {
      console.error('❌ Error fetching today\'s motivation:', error);
    }
  };

  // Create a new goal
  const createGoal = async (goalData: {
    title: string;
    description?: string;
    target_date?: Date;
    tone: 'drill_sergeant' | 'kind_encouraging' | 'teammate' | 'wise_mentor';
    time_of_day: string;
  }, subscription?: { subscribed: boolean }) => {
    console.log('🔍 createGoal called with user:', user?.id, 'goalData:', goalData);
    if (!user) {
      console.error('❌ No user found when trying to create goal');
      return null;
    }

    try {
      console.log('🔄 Creating goal via edge function (bypasses RLS)');
      console.log('🔄 User ID from auth:', user.id);
      console.log('🔄 User email from auth:', user.email);
      
      // Use email as user_id for consistency
      const userId = user.email || user.id;
      console.log('🔄 Using user_id for goal creation:', userId);
      
      const { data, error } = await supabase.functions.invoke('create-goal-simple', {
        body: {
          user_id: userId,
          title: goalData.title,
          tone: goalData.tone,
          time_of_day: goalData.time_of_day,
        }
      });

      if (error) {
        console.error('❌ EDGE FUNCTION ERROR:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('🔍 Edge function response:', data);

      if (!data?.success) {
        console.error('❌ EDGE FUNCTION RETURNED FAILURE:', data);
        console.error('❌ Failure details:', JSON.stringify(data, null, 2));
        throw new Error(data?.error || 'Failed to create goal');
      }

      if (!data?.goal) {
        console.error('❌ NO GOAL RETURNED FROM EDGE FUNCTION:', data);
        throw new Error('Edge function succeeded but returned no goal');
      }

      console.log('✅ Goal created via edge function:', data.goal.id);
      const createdGoal = data.goal;
      
      // Generate initial motivation content immediately upon goal creation
      try {
        console.log('🔄 Generating initial motivation content for new goal...');
        
        const motivationContent = await generateMotivationForGoal(createdGoal as Goal, false);
        if (motivationContent) {
          console.log('✅ Generated initial motivation content for new goal');
          
          // Update local todaysMotivation state so it's immediately available
          setTodaysMotivation(prev => ({
            ...prev,
            [createdGoal.id]: motivationContent
          }));
          
          // Send initial email with the generated content
          console.log('📧 Sending initial motivational email for new goal');
          const emailResponse = await supabase.functions.invoke('send-motivation-email', {
            body: {
              email: user.email,
              name: user.email?.split('@')[0] || 'Goal Achiever',
              goal: createdGoal.title,
              message: motivationContent.message,
              microPlan: motivationContent.microPlan,
              challenge: motivationContent.challenge,
              streak: 1,
              redirectUrl: window.location.origin,
              isNudge: false
            }
          });
          
          if (emailResponse.error) {
            console.error('❌ Error sending motivational email:', emailResponse.error);
            console.error('❌ Full email response:', emailResponse);
          } else {
            console.log('✅ Motivational email sent successfully:', emailResponse);
          }
        } else {
          console.error('❌ Failed to generate initial motivation content');
        }
        
      } catch (motivationError) {
        console.error('❌ Failed to generate/send initial motivation:', motivationError);
        // Don't throw error for motivation failure - goal creation succeeded
        toast({
          title: "Motivation Issue",
          description: "Goal created successfully, but there was an issue generating the initial motivation content.",
          variant: "default",
        });
      }
      
      // Show success message
      toast({
        title: "🎯 Goal Created!",
        description: `"${createdGoal.title}" has been created successfully! Check your email for motivation.`,
        variant: "default",
      });
      
      // Refresh goals list
      await fetchGoals();
      return createdGoal;
    } catch (error) {
      console.error('❌ Error creating goal:', error);
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Delete a goal
  const deleteGoal = async (goalId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('goals')
        .update({ is_active: false })
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Immediately update local state to remove the deleted goal for instant UI feedback
      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
      
      toast({
        title: "Goal Removed",
        description: "Your goal has been successfully removed.",
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error",
        description: "Failed to remove goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Generate motivation for all goals
  const generateMotivationForGoals = async (isNudge?: boolean): Promise<Record<string, MotivationContent>> => {
    const motivationMap: Record<string, MotivationContent> = {};
    
    for (const goal of goals) {
      const motivation = await generateMotivationForGoal(goal, isNudge);
      if (motivation) {
        motivationMap[goal.id] = motivation;
      }
    }
    
    setTodaysMotivation(motivationMap);
    return motivationMap;
  };

  // Generate a general motivational nudge (not goal-specific)
  const generateGeneralNudge = async (): Promise<MotivationContent | null> => {
    if (!user) return null;

    try {
      // Generate a general motivational message
      const response = await supabase.functions.invoke('generate-daily-motivation', {
        body: {
          goalId: null,
          goalTitle: "Your Journey",
          goalDescription: "General motivation boost",
          tone: "encouraging",
          streakCount: 0,
          userId: user.id,
          isNudge: true,
          isGeneralNudge: true,
          targetDate: null
        }
      });

      if (response.error) {
        console.error('Error generating general nudge:', response.error);
        // Fallback to a simple motivational message
        return {
          message: "Every small step counts! You've got this - keep moving forward on your journey.",
          microPlan: [
            "Take a moment to appreciate your progress",
            "Choose one small action you can do right now", 
            "Remember why you started this journey"
          ],
          challenge: "Right now, take 30 seconds to visualize your future self achieving your dreams.",
          tone: "encouraging"
        };
      }

      return response.data;
    } catch (error) {
      console.error('Error generating general nudge:', error);
      return {
        message: "Every small step counts! You've got this - keep moving forward on your journey.",
        microPlan: [
          "Take a moment to appreciate your progress",
          "Choose one small action you can do right now", 
          "Remember why you started this journey"
        ],
        challenge: "Right now, take 30 seconds to visualize your future self achieving your dreams.",
        tone: "encouraging"
      };
    }
  };

  // Generate motivation for a single goal
  const generateMotivationForGoal = async (goal: Goal, isNudge?: boolean): Promise<MotivationContent | null> => {
    if (!user) return null;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we already have motivation for today (only for non-nudge requests)
      if (!isNudge) {
        const { data: existingMotivation, error: fetchError } = await supabase
          .from('motivation_history')
          .select('*')
          .eq('goal_id', goal.id)
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          console.error('Error checking existing motivation:', fetchError);
        }

        // If we have today's motivation and this isn't a nudge, return it
        if (existingMotivation) {
          return {
            message: existingMotivation.message,
            microPlan: Array.isArray(existingMotivation.micro_plan) ? existingMotivation.micro_plan as string[] : [],
            challenge: existingMotivation.challenge || '',
            tone: existingMotivation.tone
          };
        }
      }

      // Generate fresh AI-powered daily content
      const response = await supabase.functions.invoke('generate-daily-motivation', {
        body: {
          goalId: goal.id,
          goalTitle: goal.title,
          goalDescription: goal.description,
          tone: goal.tone,
          streakCount: goal.streak_count || 0,
          userId: user.id,
          isNudge: isNudge || false,
          targetDate: goal.target_date
        }
      });

      if (response.error) {
        console.error('Error generating AI motivation:', response.error);
        // Fallback to a simple personalized message if AI fails
        const newMotivation = {
          message: `Today is another step forward on your journey toward "${goal.title}". Keep building momentum!`,
          microPlan: [
            "Take one small action toward your goal today",
            "Document your progress, however small", 
            "Reflect on how far you've already come"
          ],
          challenge: "Right now, take 30 seconds to visualize yourself achieving this goal.",
          tone: goal.tone
        };
        
        // Note: Fallback motivation is not saved to database since edge function handles saving

        return newMotivation;
      }

      const newMotivation = response.data;

      // Note: Motivation is now saved by the edge function, not frontend

      return newMotivation;
    } catch (error) {
      console.error('Error generating motivation for goal:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const resetStreak = async (goalId: string) => {
    if (!user) return;

    try {
      console.log('🔄 Resetting streak for goal:', goalId, 'user:', user.id);
      
      // Check if this is a test goal (temporary hack for danlynn@gmail.com testing)
      if (goalId.startsWith('test-goal-')) {
        console.log('🧪 TEMPORARY: Resetting test goal streak locally only');
        setGoals(prevGoals => 
          prevGoals.map(goal => 
            goal.id === goalId 
              ? { ...goal, streak_count: 0, updated_at: new Date().toISOString() }
              : goal
          )
        );
        return;
      }
      
      // Optimistically update local state first for immediate UI feedback
      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === goalId 
            ? { ...goal, streak_count: 0, updated_at: new Date().toISOString() }
            : goal
        )
      );
      
      console.log('🔄 Using reset-streak edge function to bypass RLS issues');
      
      // Use edge function to reset streak (bypasses RLS and auth issues)
      const { data, error } = await supabase.functions.invoke('reset-streak', {
        body: {
          goal_id: goalId,
          user_id: user.id
        }
      });

      console.log('🔄 Reset streak result:', { data, error });

      if (error) {
        console.error('❌ Edge function error:', error);
        // Revert optimistic update on error
        await fetchGoals();
        throw error;
      }

      if (!data?.success) {
        console.error('❌ Edge function returned failure:', data);
        await fetchGoals();
        throw new Error(data?.error || 'Failed to reset streak');
      }
      
      console.log('✅ Streak reset successful via edge function');
    } catch (error) {
      console.error('❌ Error resetting streak:', error);
      throw error;
    }
  };

  // Update an existing goal
  const updateGoal = async (goalId: string, goalData: {
    title?: string;
    description?: string;
    target_date?: Date | null;
    tone?: 'drill_sergeant' | 'kind_encouraging' | 'teammate' | 'wise_mentor';
    time_of_day?: string;
  }) => {
    if (!user) return null;

    try {
      const updateData: any = { updated_at: new Date().toISOString() };
      
      if (goalData.title !== undefined) updateData.title = goalData.title;
      if (goalData.description !== undefined) updateData.description = goalData.description;
      if (goalData.target_date !== undefined) {
        updateData.target_date = goalData.target_date?.toISOString().split('T')[0] || null;
      }
      if (goalData.tone !== undefined) updateData.tone = goalData.tone;
      if (goalData.time_of_day !== undefined) updateData.time_of_day = goalData.time_of_day;

      const { data, error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', goalId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh goals list
      await fetchGoals();
      
      toast({
        title: "Goal Updated",
        description: "Your goal has been successfully updated.",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: "Error",
        description: "Failed to update goal. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Check in for daily progress
  const checkIn = async (goalId: string) => {
    if (!user) return;
    
    try {
      console.log('🎯 Starting check-in for goal:', goalId);
      console.log('🎯 User ID:', user.id);
      
      // Use the original database function for check-ins
      const { data, error } = await supabase.rpc('handle_goal_checkin', {
        goal_id_param: goalId,
        user_id_param: user.id
      });

      console.log('🎯 RPC Response - data:', data, 'error:', error);

      if (error) {
        console.error('🎯 RPC Error:', error);
        throw error;
      }

      const result = data as any;
      console.log('🎯 Check-in result:', result);
      
      if (result?.error) {
        toast({
          title: result.error === "Already checked in today" ? "Already checked in today!" : "Error",
          description: result.error === "Already checked in today" 
            ? "Come back tomorrow to continue your streak! 🔥" 
            : result.error,
          variant: result.error === "Already checked in today" ? "default" : "destructive",
        });
        return;
      }

      // Immediately update the goal's last_checkin_date and streak_count in local state for instant UI feedback
      // Use Eastern Time with 3 AM reset logic (same as frontend)
      const easternTime = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
      if (easternTime.getHours() < 3) {
        easternTime.setDate(easternTime.getDate() - 1);
      }
      const today = easternTime.toISOString().split('T')[0];
      
      setGoals(prevGoals => {
        return prevGoals.map(goal => 
          goal.id === goalId 
            ? { 
                ...goal, 
                last_checkin_date: today, 
                streak_count: result?.streak_count !== undefined ? result.streak_count : goal.streak_count + 1,
                // Force re-render by updating timestamp
                updated_at: new Date().toISOString()
              }
            : goal
        );
      });

      console.log('🎯 Updated local state immediately');

      // No toast messages - just update the state
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "Error",
        description: "Failed to check in. Please try again.",
        variant: "destructive",
      });
    }
  };


  return {
    goals,
    loading,
    todaysMotivation,
    fetchGoals,
    createGoal,
    deleteGoal,
    updateGoal,
    resetStreak,
    checkIn,
    generateMotivationForGoals,
    generateMotivationForGoal,
    generateGeneralNudge
  };
};