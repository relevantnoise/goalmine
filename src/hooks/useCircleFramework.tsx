import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface CircleFramework {
  id: string;
  user_email: string;
  work_hours_per_week: number;
  sleep_hours_per_night: number;
  commute_hours_per_week: number;
  available_hours_per_week: number;
  created_at: string;
}

export interface CircleAllocation {
  id?: string;
  framework_id: string;
  circle_name: string;
  importance_level: number;
  current_hours_per_week: number;
  ideal_hours_per_week: number;
  created_at?: string;
  updated_at?: string;
}

export interface WorkHappinessMetrics {
  id?: string;
  framework_id: string;
  impact_current: number;
  impact_desired: number;
  fun_current: number;
  fun_desired: number;
  money_current: number;
  money_desired: number;
  remote_current: number;
  remote_desired: number;
  created_at?: string;
  updated_at?: string;
}

export interface FullFrameworkData {
  framework: CircleFramework;
  allocations: CircleAllocation[];
  workHappiness: WorkHappinessMetrics | null;
}

export const useCircleFramework = () => {
  const { user } = useAuth();
  const [framework, setFramework] = useState<CircleFramework | null>(null);
  const [hasFramework, setHasFramework] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [fullData, setFullData] = useState<FullFrameworkData | null>(null);

  const fetchFramework = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Fetching circle framework via edge function for:', user.email);
      
      // Use edge function instead of direct database query (SAME AS GOALS)
      const { data, error } = await supabase.functions.invoke('fetch-circle-framework', {
        body: { user_id: user.email }
      });

      if (error) {
        console.error('❌ Error fetching framework via function:', error);
        throw error;
      }

      if (data?.success && data?.hasFramework) {
        console.log('✅ Found existing framework via edge function:', data.framework.id);
        setFramework(data.framework);
        setHasFramework(true);
        
        // Set full data directly from edge function response
        setFullData({
          framework: data.framework,
          allocations: data.allocations || [],
          workHappiness: data.workHappiness || null
        });
      } else {
        console.log('📝 No framework found - user needs onboarding');
        setFramework(null);
        setHasFramework(false);
        setFullData(null);
      }
    } catch (error) {
      console.error('❌ Framework fetch error:', error);
      setFramework(null);
      setHasFramework(false);
      setFullData(null);
    } finally {
      setLoading(false);
    }
  };

  // Note: fetchFullFrameworkData is no longer needed since edge function returns everything

  useEffect(() => {
    fetchFramework();
  }, [user?.email]);

  const refetchFramework = () => {
    setLoading(true);
    fetchFramework();
  };

  return {
    framework,
    hasFramework,
    loading,
    refetchFramework,
    fullData
  };
};