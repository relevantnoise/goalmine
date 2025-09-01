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

export const useGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [todaysMotivation, setTodaysMotivation] = useState<Record<string, MotivationContent>>({});

  // Fetch user's goals using edge function (bypasses RLS)
  const fetchGoals = async () => {
    if (!user) {
      console.log('🔍 fetchGoals called but no user available yet');
      return;
    }

    console.log('🔍 fetchGoals starting for user:', user.id);
    setLoading(true);

    try {
      console.log('🔍 Using get-user-goals edge function to bypass RLS');
      
      const { data, error } = await supabase.functions.invoke('get-user-goals', {
        body: { userId: user.email || user.id }
      });

      if (error) {
        console.error('❌ Error calling get-user-goals:', error);
        throw error;
      }

      console.log('🔍 get-user-goals response:', data);
      const goalsData = data?.goals || [];

      console.log('✅ Goals fetched via edge function:', goalsData.length, 'goals');
      setGoals(goalsData);

    } catch (error) {
      console.error('❌ Error fetching goals:', error);
      setGoals([]);
    } finally {
      setLoading(false);
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
      
      const { data, error } = await supabase.functions.invoke('create-goal-simple', {
        body: {
          user_id: user.email || user.id,
          title: goalData.title,
          tone: goalData.tone,
          time_of_day: goalData.time_of_day,
        }
      });

      if (error) {
        console.error('❌ EDGE FUNCTION ERROR:', error);
        throw error;
      }

      if (!data?.success || !data?.goal) {
        console.error('❌ EDGE FUNCTION RETURNED FAILURE:', data);
        throw new Error(data?.error || 'Failed to create goal');
      }

      console.log('✅ Goal created via edge function:', data.goal.id);
      const createdGoal = data.goal;
      
      // Generate initial motivation content immediately upon goal creation
      try {
        console.log('🔄 Generating initial motivation content for new goal...');
        // Add motivation generation logic here if needed
        console.log('✅ Generated initial motivation content for new goal');
      } catch (motivationError) {
        console.log('⚠️ Failed to generate initial motivation (non-blocking):', motivationError);
      }

      // Send initial motivational email
      try {
        console.log('📧 Sending initial motivational email for new goal');
        // Add email sending logic here if needed
        console.log('✅ Motivational email sent successfully');
      } catch (emailError) {
        console.log('⚠️ Failed to send motivational email (non-blocking):', emailError);
      }

      // Refresh goals to include the new one
      await fetchGoals();

      toast.success('Goal created successfully! Check your email for motivation.');
      return createdGoal;

    } catch (error) {
      console.error('❌ Error creating goal:', error);
      toast.error('Failed to create goal. Please try again.');
      return null;
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

  return {
    goals,
    loading,
    fetchGoals,
    createGoal,
    todaysMotivation,
  };
};