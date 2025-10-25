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
      
      // TEMPORARY: For testing 5 Circle Framework with danlynn@gmail.com
      if (userEmail === 'danlynn@gmail.com') {
        console.log('🧪 TESTING MODE: Using Pro Plan for danlynn@gmail.com');
        setSubscription({ 
          subscribed: true, 
          subscription_tier: 'Pro Plan',
          subscription_end: '2025-12-31T23:59:59.000Z'
        });
        return;
      }
      
      setSubscription({ subscribed: false });
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async () => {
    console.log('🔴 createCheckout called - Personal Plan (THIS SHOULD NOT HAPPEN FOR STRATEGIC ADVISOR)');
    const userEmail = user?.email;
    if (!userEmail || !user.id) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setLoading(true);
    try {
      console.log('🔴 About to invoke create-checkout with NO tier (Personal Plan)');
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
    console.log('🎯 createProfessionalCheckout called - Strategic Advisor Plan using explicit price ID');
    const userEmail = user?.email;
    if (!userEmail || !user.id) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setLoading(true);
    try {
      console.log('🎯 CALLING create-checkout with strategic_advisory tier and debugging');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          email: userEmail,
          userId: user.id,
          tier: 'strategic_advisory', // This should trigger $950/month Strategic Advisor Plan
          priceId: 'price_1SCPJLCElVmMOup293vWqNTQ', // Explicit price ID as fallback
        },
      });
      console.log('🎯 create-checkout response:', { data, error });

      if (error) throw new Error(error.message || 'Strategic Advisor Plan checkout failed');
      if (!data?.url) throw new Error('No checkout URL received');

      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating Strategic Advisor Plan checkout:', error);
      toast.error(`Failed to start Strategic Advisor Plan checkout: ${error.message}`);
      setLoading(false);
    }
  };

  const createProPlanCheckout = async () => {
    console.log('🎯 createProPlanCheckout called - Pro Plan ($199.99)');
    const userEmail = user?.email;
    if (!userEmail || !user.id) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setLoading(true);
    try {
      console.log('🎯 CALLING create-checkout with pro_plan tier');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          email: userEmail,
          userId: user.id,
          tier: 'pro_plan', // This should trigger $199.99/month Pro Plan
        },
      });
      console.log('🎯 create-checkout response:', { data, error });

      if (error) throw new Error(error.message || 'Pro Plan checkout failed');
      if (!data?.url) throw new Error('No checkout URL received');

      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating Pro Plan checkout:', error);
      toast.error(`Failed to start Pro Plan checkout: ${error.message}`);
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
    createProPlanCheckout,
    createProfessionalCheckout,
    openCustomerPortal,
  };
};