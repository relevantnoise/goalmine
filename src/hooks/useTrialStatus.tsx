import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';

interface TrialStatus {
  isTrialExpired: boolean;
  trialExpiresAt: string | null;
  daysRemaining: number;
  hasActiveSubscription: boolean;
}

export const useTrialStatus = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    isTrialExpired: false,
    trialExpiresAt: null,
    daysRemaining: 30,
    hasActiveSubscription: false,
  });
  const [loading, setLoading] = useState(false);

  const checkTrialStatus = async () => {
    if (!user?.id) {
      setTrialStatus({
        isTrialExpired: false,
        trialExpiresAt: null,
        daysRemaining: 30,
        hasActiveSubscription: false,
      });
      return;
    }

    setLoading(true);
    try {
      // First check if user has active subscription
      const hasActiveSubscription = subscription.subscribed;
      
      if (hasActiveSubscription) {
        setTrialStatus({
          isTrialExpired: false,
          trialExpiresAt: null,
          daysRemaining: 0,
          hasActiveSubscription: true,
        });
        return;
      }

      // Get user profile to check trial expiration
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('trial_expires_at')
        .eq('id', user.id);
      
      const profile = profileData && profileData.length > 0 ? profileData[0] : null;

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      if (!profile?.trial_expires_at) {
        // No trial expiration set, consider trial active
        setTrialStatus({
          isTrialExpired: false,
          trialExpiresAt: null,
          daysRemaining: 30,
          hasActiveSubscription: false,
        });
        return;
      }

      const trialExpiresAt = new Date(profile.trial_expires_at);
      const now = new Date();
      const isTrialExpired = trialExpiresAt < now;
      const msRemaining = trialExpiresAt.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

      setTrialStatus({
        isTrialExpired,
        trialExpiresAt: profile.trial_expires_at,
        daysRemaining,
        hasActiveSubscription: false,
      });
    } catch (error) {
      console.error('Error checking trial status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkTrialStatus();
    }
  }, [user, subscription.subscribed]);

  return {
    trialStatus,
    loading,
    checkTrialStatus,
  };
};