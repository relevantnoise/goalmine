import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';

interface NudgeStatus {
  currentCount: number;
  maxNudges: number;
  userSubscribed: boolean;
  remaining: number;
  atLimit: boolean;
}

export const useNudgeLimit = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [nudgeStatus, setNudgeStatus] = useState<NudgeStatus>({
    currentCount: 0,
    maxNudges: 1,
    userSubscribed: false,
    remaining: 1,
    atLimit: false,
  });
  const [loading, setLoading] = useState(false);

  // Fetch current nudge status
  const fetchNudgeStatus = async () => {
    if (!user?.email) {
      setNudgeStatus({
        currentCount: 0,
        maxNudges: 1,
        userSubscribed: false,
        remaining: 1,
        atLimit: false,
      });
      return;
    }

    try {
      setLoading(true);
      // TEMPORARY: Use localStorage until database UUID issue is fixed
      console.log('🔄 Using localStorage fallback for status due to UUID constraint issue');
      const fallbackStatus = getFallbackNudgeStatus();
      setNudgeStatus(fallbackStatus);
      return;

      setNudgeStatus(data as NudgeStatus);
    } catch (error) {
      console.error('Error in fetchNudgeStatus:', error);
      // Fallback to localStorage
      const fallbackStatus = getFallbackNudgeStatus();
      setNudgeStatus(fallbackStatus);
    } finally {
      setLoading(false);
    }
  };

  // Fallback to localStorage (backwards compatibility during transition)
  const getFallbackNudgeStatus = (): NudgeStatus => {
    const today = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem('lastNudgeDate');
    const storedCount = parseInt(localStorage.getItem('dailyNudgeCount') || '0');
    const todayNudgeCount = storedDate === today ? storedCount : 0;
    const maxNudges = subscription.subscribed ? 3 : 1;

    return {
      currentCount: todayNudgeCount,
      maxNudges,
      userSubscribed: subscription.subscribed,
      remaining: Math.max(0, maxNudges - todayNudgeCount),
      atLimit: todayNudgeCount >= maxNudges,
    };
  };

  // Attempt to use a nudge (increment counter)
  const useNudge = async (): Promise<{ success: boolean; error?: string; data?: NudgeStatus }> => {
    if (!user?.email) {
      return { success: false, error: 'No user authenticated' };
    }

    try {
      setLoading(true);
      // TEMPORARY: Use localStorage until database UUID issue is fixed
      console.log('🔄 Using localStorage fallback for nudge tracking due to UUID constraint issue');
      return handleFallbackNudge();

      const result = data as { success: boolean; error?: string; current_count: number; max_nudges: number; user_subscribed: boolean; remaining: number };
      
      if (result.success) {
        // Update local status
        setNudgeStatus({
          currentCount: result.current_count,
          maxNudges: result.max_nudges,
          userSubscribed: result.user_subscribed,
          remaining: result.remaining,
          atLimit: result.current_count >= result.max_nudges,
        });
        
        return { success: true, data: nudgeStatus };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error in useNudge:', error);
      return handleFallbackNudge();
    } finally {
      setLoading(false);
    }
  };

  // Fallback nudge handling using localStorage
  const handleFallbackNudge = (): { success: boolean; error?: string } => {
    const today = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem('lastNudgeDate');
    const storedCount = parseInt(localStorage.getItem('dailyNudgeCount') || '0');
    const todayNudgeCount = storedDate === today ? storedCount : 0;
    const maxNudges = subscription.subscribed ? 3 : 1;

    if (todayNudgeCount >= maxNudges) {
      return { 
        success: false, 
        error: subscription.subscribed 
          ? 'You\'ve reached your daily nudge limit of 3.'
          : 'You get 1 free nudge per day, but you can upgrade to get up to 3 nudges daily!'
      };
    }

    // Update localStorage
    localStorage.setItem('lastNudgeDate', today);
    localStorage.setItem('dailyNudgeCount', (todayNudgeCount + 1).toString());

    // Update local state
    const newStatus = {
      currentCount: todayNudgeCount + 1,
      maxNudges,
      userSubscribed: subscription.subscribed,
      remaining: maxNudges - (todayNudgeCount + 1),
      atLimit: (todayNudgeCount + 1) >= maxNudges,
    };
    setNudgeStatus(newStatus);

    return { success: true };
  };

  // Refresh status when user or subscription changes
  useEffect(() => {
    if (user) {
      fetchNudgeStatus();
    }
  }, [user, subscription.subscribed]);

  return {
    nudgeStatus,
    loading,
    useNudge,
    fetchNudgeStatus,
  };
};