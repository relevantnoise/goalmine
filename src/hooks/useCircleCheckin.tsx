import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useCircleFramework } from './useCircleFramework';
import { supabase } from '@/integrations/supabase/client';

interface CircleCheckinStatus {
  needsCheckin: boolean;
  currentWeek: string;
  lastCheckinWeek: string | null;
  weeksSinceLastCheckin: number;
}

export const useCircleCheckin = () => {
  const { user } = useAuth();
  const { framework, hasFramework } = useCircleFramework();
  const [checkinStatus, setCheckinStatus] = useState<CircleCheckinStatus>({
    needsCheckin: false,
    currentWeek: '',
    lastCheckinWeek: null,
    weeksSinceLastCheckin: 0
  });
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

  const checkCircleCheckinStatus = async () => {
    if (!user?.email || !hasFramework || !framework) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const currentWeek = getCurrentWeekMonday();
      
      console.log('🔍 Checking circle check-in status for week:', currentWeek);

      // Check if user has already checked in this week
      const { data: thisWeekCheckin, error } = await supabase
        .from('circle_checkins')
        .select('week_date')
        .eq('framework_id', framework.id)
        .eq('week_date', currentWeek)
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error checking circle check-in status:', error);
        throw error;
      }

      // Get the most recent check-in to calculate weeks since last check-in
      const { data: lastCheckin, error: lastCheckinError } = await supabase
        .from('circle_checkins')
        .select('week_date')
        .eq('framework_id', framework.id)
        .order('week_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastCheckinError && lastCheckinError.code !== 'PGRST116') {
        console.error('❌ Error fetching last check-in:', lastCheckinError);
        throw lastCheckinError;
      }

      const lastCheckinWeek = lastCheckin?.week_date || null;
      let weeksSinceLastCheckin = 0;

      if (lastCheckinWeek) {
        const lastDate = new Date(lastCheckinWeek);
        const currentDate = new Date(currentWeek);
        const diffTime = currentDate.getTime() - lastDate.getTime();
        weeksSinceLastCheckin = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      }

      const needsCheckin = !thisWeekCheckin; // Need check-in if no record for this week

      setCheckinStatus({
        needsCheckin,
        currentWeek,
        lastCheckinWeek,
        weeksSinceLastCheckin
      });

      console.log('📊 Circle check-in status:', {
        needsCheckin,
        currentWeek,
        lastCheckinWeek,
        weeksSinceLastCheckin
      });

    } catch (error) {
      console.error('❌ Error checking circle check-in status:', error);
      setCheckinStatus({
        needsCheckin: false,
        currentWeek: getCurrentWeekMonday(),
        lastCheckinWeek: null,
        weeksSinceLastCheckin: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkCircleCheckinStatus();
  }, [user?.email, hasFramework, framework?.id]);

  const refreshCheckinStatus = () => {
    checkCircleCheckinStatus();
  };

  return {
    checkinStatus,
    loading,
    refreshCheckinStatus
  };
};