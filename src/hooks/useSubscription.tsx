import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string | null;
  subscription_end?: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({ subscribed: false });
  const [loading, setLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const checkSubscription = async (forceRefresh: boolean = false) => {
    const userEmail = user?.email;
    if (!userEmail || !user.id) {
      setSubscription({ subscribed: false });
      return;
    }

    setLoading(true);
    try {
      // Use edge function to check subscription (bypasses RLS)
      console.log('🔄 Checking subscription via edge function for:', userEmail);
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        body: {
          email: userEmail,
          userId: user.id,
        },
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }
      
      console.log('✅ Edge function returned:', data);
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      
      // TEST: Commented out for production
      // TEMPORARY: For known users, provide a fallback subscription check
      // if (userEmail === 'danlynn@gmail.com' || userEmail === 'dandlynn@yahoo.com') {
      //   console.log('✅ TEMPORARY: Using fallback subscription status for known user');
      //   setSubscription({ 
      //     subscribed: true, 
      //     subscription_tier: 'Personal Plan',
      //     subscription_end: '2025-12-31T23:59:59.000Z'
      //   });
      // }
      setSubscription({ subscribed: false });
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async () => {
    const userEmail = user?.email;
    if (!userEmail || !user.id) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          email: userEmail,
          userId: user.id,
        },
      });

      if (error) throw new Error(error.message || 'Checkout failed');
      if (!data?.url) throw new Error('No checkout URL received');

      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error(`Failed to start checkout: ${error.message}`);
      setLoading(false);
    }
  };

  const createProfessionalCheckout = async () => {
    const userEmail = user?.email;
    console.log('🎯 Strategic Advisory checkout attempt:', { userEmail, userId: user?.id, user });
    
    if (!userEmail || !user.id) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setLoading(true);
    try {
      console.log('🎯 Calling create-professional-checkout function...');
      const { data, error } = await supabase.functions.invoke('create-professional-checkout', {
        body: {
          email: userEmail,
          userId: user.id,
        },
      });

      console.log('🎯 Response:', { data, error });

      if (error) throw new Error(error.message || 'Strategic Advisory checkout failed');
      if (!data?.url) throw new Error('No checkout URL received');

      console.log('🎯 Redirecting to:', data.url);
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating professional checkout:', error);
      toast.error(`Failed to start Strategic Advisory checkout: ${error.message}`);
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    const userEmail = user?.email;
    if (!userEmail || !user.id) {
      toast.error('Please sign in to manage subscription');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {
          email: userEmail,
          userId: user.id,
        },
      });

      if (error) throw error;
      window.location.href = data.url;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !hasChecked) {
      console.log('🔄 Checking subscription for user:', user.email);
      setHasChecked(true);
      checkSubscription();
    } else if (!user) {
      setHasChecked(false);
      setSubscription({ subscribed: false });
    }
  }, [user]);

  return {
    subscription,
    loading,
    checkSubscription,
    createCheckout,
    createProfessionalCheckout,
    openCustomerPortal,
  };
};