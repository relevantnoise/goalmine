import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useCircleFramework } from './useCircleFramework';
import { supabase } from '@/integrations/supabase/client';

export const useWeeklyStreak = () => {
  const { user } = useAuth();
  const { framework, hasFramework } = useCircleFramework();
  const [weeklyStreak, setWeeklyStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // Get Monday of current week
  const getCurrentWeekMonday = () => {
    const now = new Date();
    const monday = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    monday.setDate(diff);
    return monday.toISOString().split('T')[0];
  };

  const calculateWeeklyStreak = async () => {
    if (!user?.email || !hasFramework || !framework) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log('📊 Calculating weekly streak for framework:', framework.id);

      // Get all check-ins for this framework, ordered by week_date descending
      const { data: checkins, error } = await supabase
        .from('circle_checkins')
        .select('week_date')
        .eq('framework_id', framework.id)
        .order('week_date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching circle check-ins:', error);
        throw error;
      }

      if (!checkins || checkins.length === 0) {
        console.log('📊 No check-ins found, streak = 0');
        setWeeklyStreak(0);
        return;
      }

      // Get unique weeks (since there might be multiple check-ins per week for different circles)
      const uniqueWeeks = [...new Set(checkins.map(c => c.week_date))].sort().reverse();
      
      console.log('📊 Unique check-in weeks:', uniqueWeeks);

      if (uniqueWeeks.length === 0) {
        setWeeklyStreak(0);
        return;
      }

      // Calculate consecutive weekly streak
      let streak = 0;
      const currentWeek = getCurrentWeekMonday();
      
      // Start from the current week and count backwards
      let weekToCheck = new Date(currentWeek);
      
      for (let i = 0; i < uniqueWeeks.length + 1; i++) {
        const weekString = weekToCheck.toISOString().split('T')[0];
        
        if (uniqueWeeks.includes(weekString)) {
          streak++;
          console.log(`📊 Week ${weekString} found, streak = ${streak}`);
        } else {
          // If we're checking the current week and it's not found, that's okay (they haven't checked in yet)
          // But if it's a past week and not found, break the streak
          if (weekString < currentWeek) {
            console.log(`📊 Missing week ${weekString}, breaking streak at ${streak}`);
            break;
          }
        }
        
        // Move to previous week
        weekToCheck.setDate(weekToCheck.getDate() - 7);
      }

      console.log('📊 Final weekly streak:', streak);
      setWeeklyStreak(streak);

    } catch (error) {
      console.error('❌ Error calculating weekly streak:', error);
      setWeeklyStreak(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateWeeklyStreak();
  }, [user?.email, hasFramework, framework?.id]);

  const refreshWeeklyStreak = () => {
    calculateWeeklyStreak();
  };

  return {
    weeklyStreak,
    loading,
    refreshWeeklyStreak
  };
};