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
      
      // Check for 6 Pillars framework in new tables
      const { data: frameworkData, error } = await supabase
        .from('user_frameworks')
        .select('*')
        .eq('user_id', user.email)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching framework:', error);
        throw error;
      }

      if (frameworkData) {
        console.log('✅ Found existing 6 Pillars framework:', frameworkData.id);
        setFramework(frameworkData);
        setHasFramework(true);
        setFullData({ framework: frameworkData, allocations: [], workHappiness: null });
      } else {
        console.log('📝 No 6 Pillars framework found - user needs onboarding');
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